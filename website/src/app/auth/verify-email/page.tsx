'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthPageShell from '@/components/auth/AuthPageShell';
import AuthCard from '@/components/auth/AuthCard';
import OtpInput from '@/components/auth/OtpInput';
import { getPendingEmail, maskEmail } from '@/lib/pendingAuth';
import { useAuth } from '@/context/AuthContext';
// TODO: confirm this matches the actual export in src/lib/supabase.ts
import { supabase } from '@/lib/supabase';

const CODE_LENGTH = 6;
const RESEND_SECONDS = 55;
const BYPASS_SECONDS = 118; // 01:58 shown in the design — see note below

function VerifyIcon() {
  return (
    <div className="w-14 h-14 rounded-2xl bg-[#0B1121] border border-[#22D3EE]/30 flex items-center justify-center">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#22D3EE" strokeWidth="2">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 7l9 6 9-6" />
      </svg>
    </div>
  );
}

export default function VerifyEmailPage() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const [email, setEmail] = useState<string | null>(null);
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const [bypassSeconds, setBypassSeconds] = useState(BYPASS_SECONDS);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    setEmail(getPendingEmail());
  }, []);

  useEffect(() => {
    if (isLoggedIn) router.push('/auth/enable-2fa');
  }, [isLoggedIn, router]);

  const complete = digits.every((d) => d !== '');

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  // "Bypass Window: 01:58" in the design — not clear from screenshots what
  // this unlocks (skip verification? extended grace period before it's
  // enforced elsewhere?). Countdown is real; nothing fires when it hits 0
  // until you clarify the intended behavior.
  useEffect(() => {
    if (bypassSeconds <= 0) return;
    const t = setTimeout(() => setBypassSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [bypassSeconds]);

  const mm = String(Math.floor(bypassSeconds / 60)).padStart(2, '0');
  const ss = String(bypassSeconds % 60).padStart(2, '0');

  const handleResend = async () => {
    if (seconds > 0 || !email) return;
    setResending(true);
    setApiError(null);
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email });
      if (error) throw error;
      setSeconds(RESEND_SECONDS);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Couldn't resend the code. Please try again.");
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async () => {
    if (!complete || !email) return;
    setLoading(true);
    setApiError(null);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: digits.join(''),
        type: 'signup',
      });
      if (error) throw error;
      // AuthContext's global listener picks up SIGNED_IN automatically; the
      // useEffect above reacts to isLoggedIn and navigates on.
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Invalid or expired code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageShell>
      <AuthCard>
        <div className="flex flex-col items-center text-center max-w-md mx-auto">
          <VerifyIcon />
          <p className="text-[11px] font-bold tracking-[0.2em] text-[#22D3EE] mt-4">IDENTITY VERIFICATION</p>
          <h1 className="text-2xl md:text-3xl font-black text-white mt-2">Verify Your Email</h1>
          <p className="text-sm text-gray-400 mt-2">
            We&apos;ve sent a 6-digit access sequence to<br />
            <span className="font-bold text-gray-200">{email ? maskEmail(email) : 'your email'}</span>
          </p>

          <div className="mt-8 w-full">
            <OtpInput value={digits} onChange={setDigits} />
          </div>

          {apiError && <p className="text-sm text-red-500 mt-4">{apiError}</p>}

          <p className="text-xs text-gray-500 mt-4">
            If your email has a confirmation link instead of a code, just click it — this page will move on automatically once it's confirmed.
          </p>

          <p className="text-sm text-gray-400 mt-6">
            Didn&apos;t receive the code?{' '}
            <button
              type="button"
              onClick={handleResend}
              disabled={seconds > 0 || resending}
              className="text-[#7135DB] font-semibold disabled:text-[#7135DB]/50"
            >
              {resending ? 'Sending...' : 'Resend'}
            </button>{' '}
            {seconds > 0 && <span>({seconds}s)</span>}
          </p>

          {bypassSeconds > 0 && (
            <p className="flex items-center gap-1.5 text-xs text-gray-500 mt-2">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 3" />
              </svg>
              Bypass Window: {mm}:{ss}
            </p>
          )}

          <div className="w-full mt-10 space-y-4">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!complete || loading}
              className={`w-full h-14 rounded-xl font-bold tracking-wide transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:cursor-not-allowed ${
                complete
                  ? 'bg-gradient-to-r from-[#22D3EE] to-[#169EFA] text-black hover:opacity-90'
                  : 'bg-[#0B1121] border border-[#22D3EE]/30 text-[#22D3EE]/50'
              }`}
            >
              {loading ? (
                <>
                  <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Please wait...
                </>
              ) : 'AUTHORIZE ACCESS'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/auth/signup')}
              className="text-sm text-gray-400 hover:text-gray-200"
            >
              Change Email
            </button>
          </div>
        </div>
      </AuthCard>
    </AuthPageShell>
  );
}

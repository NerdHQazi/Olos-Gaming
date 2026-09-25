'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthPageShell from '@/components/auth/AuthPageShell';
import AuthCard from '@/components/auth/AuthCard';

function CompassIcon() {
  return (
    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#7135DB] to-[#22D3EE] p-[1.5px]">
      <div className="w-full h-full rounded-full bg-[#0B1121] flex items-center justify-center">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="#22D3EE">
          <path d="M19 5L5 11l6.2 2.2L13.6 19 19 5z" />
        </svg>
      </div>
    </div>
  );
}
function AuthenticatorIcon() {
  return (
    <div className="w-10 h-10 rounded-lg bg-[#7135DB]/25 flex items-center justify-center">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="#7135DB">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7v1H4v-1z" />
      </svg>
    </div>
  );
}
function SmsIcon() {
  return <div className="w-10 h-10 rounded-lg bg-[#22D3EE]" />;
}

type Method = 'authenticator' | 'sms';

export default function Enable2FAPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<Method | null>(null);

  // NOTE: your backend (authController.js) has no 2FA enrollment endpoint yet —
  // nothing to call here. Records the choice locally and continues to
  // /dashboard (same destination signin uses now) so onboarding isn't
  // blocked on backend work that doesn't exist.
  const handleContinue = () => {
    if (!selected) return;
    if (typeof window !== 'undefined') {
      localStorage.setItem('olos_2fa_preference', selected);
    }
    router.push('/dashboard');
  };

  return (
    <AuthPageShell>
      <AuthCard>
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto">
          <CompassIcon />
          <p className="text-[11px] font-bold tracking-[0.2em] text-[#22D3EE] mt-3">SECURITY SETUP</p>
          <h1 className="text-2xl md:text-3xl font-black text-white mt-2">Two-Factor Authentication</h1>
          <p className="text-sm text-gray-400 mt-2 max-w-md">
            Keep your account safe with an extra layer of security. Pick how you want to verify your identity.
          </p>

          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            <button
              type="button"
              onClick={() => setSelected('authenticator')}
              className={`text-left rounded-2xl border p-5 transition-all ${
                selected === 'authenticator' ? 'border-[#7135DB] bg-[#7135DB]/10' : 'border-[#361F6B] bg-[#0B1121] hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <AuthenticatorIcon />
                <span className="text-[10px] font-bold tracking-wide px-2.5 py-1 rounded-full bg-[#0B2A3C] text-[#22D3EE] border border-[#22D3EE]/40">
                  RECOMMENDED
                </span>
              </div>
              <p className="font-bold text-white">Authenticator App</p>
              <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
                Get a login code from an app on your phone. Works even without internet — the most secure option.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setSelected('sms')}
              className={`text-left rounded-2xl border p-5 transition-all ${
                selected === 'sms' ? 'border-[#22D3EE] bg-[#22D3EE]/10' : 'border-[#361F6B] bg-[#0B1121] hover:border-white/20'
              }`}
            >
              <div className="mb-4">
                <SmsIcon />
              </div>
              <p className="font-bold text-white">SMS Verification</p>
              <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
                Get a one-time code sent to your phone number. Quick and easy to set up.
              </p>
            </button>
          </div>

          <div className="w-full mt-6 space-y-3">
            <button
              type="button"
              onClick={handleContinue}
              disabled={!selected}
              className="w-full h-12 rounded-xl font-bold tracking-wide text-sm transition-all active:scale-[0.98] disabled:cursor-not-allowed bg-[#22D3EE] text-[#0B0060] hover:opacity-90"
            >
              ENABLE PROTECTION
            </button>
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="text-xs font-bold tracking-wide text-gray-500 hover:text-gray-300"
            >
              MAYBE LATER
            </button>
          </div>
        </div>
      </AuthCard>
    </AuthPageShell>
  );
}

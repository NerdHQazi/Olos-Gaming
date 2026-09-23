'use client';
import React, { useEffect, useState } from 'react';
import AuthPageShell from '@/components/auth/AuthPageShell';
import AuthCard from '@/components/auth/AuthCard';
import AuthIcon from '@/components/auth/AuthIcon';
import { getPendingEmail, maskEmail } from '@/lib/pendingAuth';
// TODO: confirm this matches the actual export in src/lib/supabase.ts
import { supabase } from '@/lib/supabase';

export default function CheckEmailPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setEmail(getPendingEmail());
  }, []);

  const handleResend = async () => {
    if (!email) return;
    setError(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (error) throw error;
      setSent(true);
      setTimeout(() => setSent(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't resend. Please try again.");
    }
  };

  return (
    <AuthPageShell>
      <AuthCard>
        <div className="flex flex-col items-center text-center max-w-md mx-auto">
          <AuthIcon name="envelope" size={130} />

          <h1 className="text-2xl md:text-3xl font-black text-white mt-6">Check Your Email</h1>
          <p className="text-sm text-gray-400 mt-2">
            We&apos;ve sent a password reset link to<br />
            <span className="font-bold text-gray-200">{email ? maskEmail(email) : 'your email'}</span>
          </p>

          {error && <p className="text-sm text-red-500 mt-4">{error}</p>}

          <p className="text-sm text-gray-400 mt-10">
            Didn&apos;t receive the email?{' '}
            <button type="button" onClick={handleResend} className="text-[#7135DB] font-semibold">
              {sent ? 'Sent!' : 'Resend Email'}
            </button>
          </p>
        </div>
      </AuthCard>
    </AuthPageShell>
  );
}

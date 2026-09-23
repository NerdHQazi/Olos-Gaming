'use client';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthPageShell from '@/components/auth/AuthPageShell';
import AuthCard from '@/components/auth/AuthCard';
import AuthButton from '@/components/auth/AuthButton';
import AuthIcon from '@/components/auth/AuthIcon';
// TODO: confirm this matches the actual export in src/lib/supabase.ts
import { supabase } from '@/lib/supabase';

export default function ResetPasswordSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    // Clear out the recovery-scoped session so they land on signin clean
    // rather than carrying around a lingering recovery session.
    supabase.auth.signOut().catch(() => {});
  }, []);

  return (
    <AuthPageShell>
      <AuthCard>
        <div className="flex flex-col items-center text-center max-w-md mx-auto">
          <AuthIcon name="shield" size={130} />

          <h1 className="text-2xl md:text-3xl font-black text-white mt-6">Password Reset</h1>
          <p className="text-base font-bold text-green-500 mt-1">Successful!</p>
          <p className="text-sm text-gray-400 mt-2">
            Your password has been reset successfully.<br />
            You can now sign in with your new password
          </p>

          <div className="w-full mt-10">
            <AuthButton variant="teal" onClick={() => router.push('/auth/signin')}>
              Go to Sign In
            </AuthButton>
          </div>
        </div>
      </AuthCard>
    </AuthPageShell>
  );
}

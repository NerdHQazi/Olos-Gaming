'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthPageShell from '@/components/auth/AuthPageShell';
import AuthCard from '@/components/auth/AuthCard';
import AuthInput from '@/components/auth/AuthInput';
import AuthButton from '@/components/auth/AuthButton';
import PasswordChecklist, { isPasswordValid } from '@/components/auth/PasswordChecklist';
// TODO: confirm this matches the actual export in src/lib/supabase.ts
import { supabase } from '@/lib/supabase';

function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 018 0v3" />
    </svg>
  );
}
function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6a2 2 0 002.8 2.8" />
      <path d="M9.9 5.2A9.8 9.8 0 0112 5c5 0 9 4 10 7-.4 1.2-1.2 2.6-2.3 3.8M6.2 6.2C4.3 7.5 2.9 9.3 2 12c1 3 5 7 10 7 1.2 0 2.4-.2 3.5-.6" />
    </svg>
  );
}

type Status = 'checking' | 'ready' | 'invalid';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>('checking');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setStatus('ready');
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setStatus('ready');
      else setStatus((s) => (s === 'checking' ? 'invalid' : s));
    });

    const timeout = setTimeout(() => {
      setStatus((s) => (s === 'checking' ? 'invalid' : s));
    }, 2500);

    return () => {
      listener.subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const passwordValid = isPasswordValid(password);
  const canSubmit = passwordValid && confirmPassword === password;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setApiError(null);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      router.push('/auth/reset-password/success');
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Couldn't reset your password. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  if (status === 'checking') {
    return (
      <AuthPageShell>
        <AuthCard>
          <div className="flex flex-col items-center text-center py-10">
            <span className="w-8 h-8 border-[3px] border-[#22D3EE]/30 border-t-[#22D3EE] rounded-full animate-spin" />
            <p className="text-sm text-gray-400 mt-4">Checking your reset link...</p>
          </div>
        </AuthCard>
      </AuthPageShell>
    );
  }

  if (status === 'invalid') {
    return (
      <AuthPageShell>
        <AuthCard>
          <div className="flex flex-col items-center text-center max-w-md mx-auto py-10">
            <h1 className="text-2xl md:text-3xl font-black text-white">Invalid reset link</h1>
            <p className="text-sm text-gray-400 mt-3">
              This password reset link is missing or has expired. Please request a new one.
            </p>
            <div className="w-full mt-8">
              <AuthButton variant="primary" onClick={() => router.push('/auth/forgot-password')}>
                Request New Link
              </AuthButton>
            </div>
          </div>
        </AuthCard>
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell>
      <AuthCard>
        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl font-black text-white">Reset Password</h1>
            <p className="text-sm text-gray-400 mt-1">Create a new password</p>
          </div>

          <div className="space-y-5">
            <div>
              <label htmlFor="password" className="text-sm font-bold text-white block mb-2">Enter Password</label>
              <AuthInput
                id="password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Enter your Password here..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<LockIcon />}
                rightIcon={
                  <button type="button" onClick={() => setShowPassword((s) => !s)} aria-label="Toggle password visibility">
                    <EyeOffIcon />
                  </button>
                }
                autoComplete="new-password"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="text-sm font-bold text-white block mb-2">Confirm password</label>
              <AuthInput
                id="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                name="confirmPassword"
                placeholder="Repeat the password here..."
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                leftIcon={<LockIcon />}
                rightIcon={
                  <button type="button" onClick={() => setShowConfirm((s) => !s)} aria-label="Toggle password visibility">
                    <EyeOffIcon />
                  </button>
                }
                invalid={confirmPassword.length > 0 && confirmPassword !== password}
                errorMessage="Passwords do not match"
                autoComplete="new-password"
              />
            </div>

            <PasswordChecklist password={password} />

            {apiError && <p className="text-sm text-red-500">{apiError}</p>}
          </div>

          <div className="mt-8">
            <AuthButton type="submit" variant={canSubmit ? 'primary' : 'outline'} disabled={!canSubmit} loading={loading}>
              Reset Password
            </AuthButton>
          </div>
        </form>
      </AuthCard>
    </AuthPageShell>
  );
}

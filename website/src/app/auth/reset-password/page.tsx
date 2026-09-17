'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthCard from '@/components/auth/AuthCard';
import AuthInput from '@/components/auth/AuthInput';
import AuthButton from '@/components/auth/AuthButton';
import PasswordChecklist from '@/components/auth/PasswordChecklist';

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

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const passwordValid =
    password.length >= 8 && /[A-Z]/.test(password) && (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password));
  const canSubmit = passwordValid && confirmPassword === password;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    // TODO: call reset-password API
    setTimeout(() => {
      router.push('/auth/reset-password/success');
    }, 800);
  };

  return (
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
        </div>

        <div className="mt-8">
          <AuthButton type="submit" variant={canSubmit ? 'primary' : 'outline'} disabled={!canSubmit} loading={loading}>
            Reset Password
          </AuthButton>
        </div>
      </form>
    </AuthCard>
  );
}

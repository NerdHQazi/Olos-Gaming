'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthCard from '@/components/auth/AuthCard';
import AuthInput from '@/components/auth/AuthInput';
import AuthButton from '@/components/auth/AuthButton';
import PasswordChecklist from '@/components/auth/PasswordChecklist';

function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}
function MailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  );
}
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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignUpPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);

  const emailValid = email.length === 0 || EMAIL_RE.test(email);
  const passwordValid =
    password.length >= 8 && /[A-Z]/.test(password) && (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password));
  const confirmValid = confirmPassword.length === 0 || confirmPassword === password;

  const canSubmit =
    fullName.trim().length > 0 &&
    EMAIL_RE.test(email) &&
    passwordValid &&
    confirmPassword === password &&
    agreed;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!canSubmit) return;
    setLoading(true);
    // TODO: wire up to real signup API
    setTimeout(() => {
      router.push('/auth/verify-email');
    }, 900);
  };

  return (
    <AuthCard>
      <form onSubmit={handleSubmit} className="flex flex-col">
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-black text-white">Create Account</h1>
          <p className="text-sm text-gray-400 mt-1">Lets get you started</p>
        </div>

        <div className="space-y-5">
          <div>
            <label htmlFor="fullName" className="text-sm font-bold text-white block mb-2">Full Name</label>
            <AuthInput
              id="fullName"
              name="fullName"
              placeholder="Enter your full name..."
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              leftIcon={<UserIcon />}
              autoComplete="name"
            />
          </div>

          <div>
            <label htmlFor="email" className="text-sm font-bold text-white block mb-2">Full Email</label>
            <AuthInput
              id="email"
              type="email"
              name="email"
              placeholder="Enter email address here..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<MailIcon />}
              invalid={touched && !emailValid}
              errorMessage="Please enter a valid email address"
              autoComplete="email"
            />
          </div>

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
              invalid={touched && !confirmValid}
              errorMessage="Passwords do not match"
              autoComplete="new-password"
            />
          </div>

          <div className="flex items-start gap-2 text-xs text-amber-400">
            <span>⚠️</span>
            <span>The password must contain a combination of Uppercase, Number and Symbol</span>
          </div>

          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 w-5 h-5 rounded border-2 border-[#22D3EE] bg-transparent accent-[#169EFA]"
            />
            <span className="text-sm text-gray-300">
              I agree to the <Link href="/terms" className="text-[#7135DB]">Terms of Service</Link> and{' '}
              <Link href="/privacy" className="text-[#7135DB]">Privacy policy</Link>
            </span>
          </label>
        </div>

        <div className="mt-8 space-y-4">
          <AuthButton type="submit" variant={canSubmit ? 'primary' : 'outline'} disabled={!canSubmit} loading={loading}>
            Create Account
          </AuthButton>
          <p className="text-center text-sm text-gray-400">
            Don&apos;t have an account?{' '}
            <Link href="/auth/signin" className="text-[#22D3EE] font-semibold">Sign in</Link>
          </p>
        </div>
      </form>
    </AuthCard>
  );
}

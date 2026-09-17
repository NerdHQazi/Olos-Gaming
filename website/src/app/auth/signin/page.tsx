'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthCard from '@/components/auth/AuthCard';
import AuthInput from '@/components/auth/AuthInput';
import AuthButton from '@/components/auth/AuthButton';
import SocialRow from '@/components/auth/SocialRow';

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

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const filled = EMAIL_RE.test(email) && password.length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!filled) return;
    setLoading(true);
    setError(false);
    // TODO: replace with real auth call. Demo: any password under 8 chars "fails".
    setTimeout(() => {
      setLoading(false);
      if (password.length < 8) {
        setError(true);
      } else {
        router.push('/auth/loading');
      }
    }, 800);
  };

  return (
    <AuthCard>
      <form onSubmit={handleSubmit} className="flex flex-col">
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-black text-white">Welcome back</h1>
          <p className="text-sm text-gray-400 mt-1">Sign in to continue</p>
        </div>

        <div className="space-y-5">
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
              onChange={(e) => { setPassword(e.target.value); setError(false); }}
              leftIcon={<LockIcon />}
              rightIcon={
                <button type="button" onClick={() => setShowPassword((s) => !s)} aria-label="Toggle password visibility">
                  <EyeOffIcon />
                </button>
              }
              invalid={error}
              errorMessage={error ? 'Incorrect password, please enter a valid password' : undefined}
              autoComplete="current-password"
            />
          </div>

          {!error && (
            <div className="flex items-start gap-2 text-xs text-amber-400">
              <span>⚠️</span>
              <span>The password must contain a combination of Uppercase, Number and Symbol</span>
            </div>
          )}

          <div className="text-right">
            <Link href="/auth/forgot-password" className="text-sm text-[#7135DB] font-semibold">
              Forgot password?
            </Link>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          {error ? (
            <>
              <AuthButton type="submit" variant="primary" loading={loading}>Try Again</AuthButton>
              <Link href="/auth/forgot-password" className="block">
                <AuthButton variant="outline-green">Forgot password</AuthButton>
              </Link>
            </>
          ) : (
            <AuthButton type="submit" variant={filled ? 'teal' : 'outline'} disabled={!filled} loading={loading}>
              Sign In
            </AuthButton>
          )}
        </div>

        <div className="mt-8">
          <SocialRow />
        </div>

        <p className="text-center text-sm text-gray-400 mt-8">
          Don&apos;t have an account?{' '}
          <Link href="/auth/signup" className="text-[#7135DB] font-semibold">Sign Up</Link>
        </p>
      </form>
    </AuthCard>
  );
}

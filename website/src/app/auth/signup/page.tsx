'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthPageShell from '@/components/auth/AuthPageShell';
import AuthInput from '@/components/auth/AuthInput';
import { authApi } from '@/lib/authApi';
import { extractApiError } from '@/lib/api';
import { setPendingEmail } from '@/lib/pendingAuth';
import PasswordChecklist, { isPasswordValid } from '@/components/auth/PasswordChecklist';

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
  const [apiError, setApiError] = useState<string | null>(null);

  const emailValid = email.length === 0 || EMAIL_RE.test(email);
  const passwordValid = isPasswordValid(password);
  const confirmValid = confirmPassword.length === 0 || confirmPassword === password;

  const canSubmit =
    fullName.trim().length > 0 &&
    EMAIL_RE.test(email) &&
    passwordValid &&
    confirmPassword === password &&
    agreed;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    setApiError(null);
    if (!canSubmit) return;
    setLoading(true);
    try {
      // TODO: your backend's validate.js may require a real, user-chosen username.
      const username = `${email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '')}${Math.floor(1000 + Math.random() * 9000)}`;
      await authApi.signUp({ fullName: fullName.trim(), email, password, username });
      setPendingEmail(email);
      router.push('/auth/verify-email');
    } catch (err) {
      setApiError(extractApiError(err, "Couldn't create your account. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageShell>
      <div className="h-full w-full overflow-y-auto">
        <div className="min-h-full w-full max-w-[1300px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-0 items-center px-4 sm:px-8 py-6">
          {/* Left: visual panel */}
          <div className="hidden lg:flex flex-col justify-center pr-10 xl:pr-16">
            <span className="inline-flex w-fit items-center text-[#22D3EE] text-xs font-bold tracking-widest mb-3">
              SECURE PROTOCOL : INITIALIZED
              <span className="block" />
            </span>
            <div className="h-0.5 w-10 bg-[#22D3EE] mb-6" />

            {/* TODO: swap this placeholder for the real hero illustration asset */}
            <div className="w-full aspect-[16/10] rounded-2xl bg-gradient-to-br from-[#7135DB]/30 via-[#0B1121] to-[#22D3EE]/20 border border-white/10 mb-6" />

            <h2 className="text-2xl xl:text-3xl font-black text-white">Your Journey Start Here</h2>
            <p className="text-sm text-gray-400 mt-2 max-w-md">
              Create your account to compete in skill-based games, stake GVT, and earn real on-chain rewards.
            </p>
          </div>

          {/* Right: form panel */}
          <div className="flex items-center justify-center">
            <form onSubmit={handleSubmit} className="w-full max-w-md flex flex-col">
              <div className="mb-4">
                <h1 className="text-xl sm:text-2xl font-black text-white">Create Your Account</h1>
                <p className="text-sm text-gray-400 mt-1">Create your account to start playing and earning rewards.</p>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label htmlFor="fullName" className="text-xs font-bold tracking-wide text-gray-400 block mb-1.5">FULL NAME</label>
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
                  <label htmlFor="email" className="text-xs font-bold tracking-wide text-gray-400 block mb-1.5">FULL EMAIL</label>
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
                  <label htmlFor="password" className="text-xs font-bold tracking-wide text-gray-400 block mb-1.5">PASSWORD</label>
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
                  <label htmlFor="confirmPassword" className="text-xs font-bold tracking-wide text-gray-400 block mb-1.5">CONFIRM PASSWORD</label>
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

                <PasswordChecklist password={password} />

                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-0.5 w-5 h-5 rounded border-2 border-white/30 bg-transparent accent-[#7135DB]"
                  />
                  <span className="text-sm text-gray-300">
                    I agree to the <Link href="/terms" className="text-[#7135DB]">Terms of Service</Link> and{' '}
                    <Link href="/privacy" className="text-[#7135DB]">Privacy Policy</Link>
                  </span>
                </label>

                {apiError && <p className="text-sm text-red-500 text-center">{apiError}</p>}
              </div>

              <div className="mt-5 space-y-3">
                <button
                  type="submit"
                  disabled={!canSubmit || loading}
                  className="w-full h-12 rounded-xl bg-[#7135DB] hover:bg-[#5f2bb8] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold tracking-wide text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Please wait...
                    </>
                  ) : 'CREATE ACCOUNT'}
                </button>
                <p className="text-center text-sm text-gray-400">
                  Already have an account?{' '}
                  <Link href="/auth/signin" className="text-[#22D3EE] font-semibold">Sign in</Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AuthPageShell>
  );
}

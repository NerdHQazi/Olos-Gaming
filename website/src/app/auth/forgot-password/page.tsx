'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthCard from '@/components/auth/AuthCard';
import AuthInput from '@/components/auth/AuthInput';
import AuthButton from '@/components/auth/AuthButton';
import AuthIcon from '@/components/auth/AuthIcon';

function MailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  );
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);

  const valid = EMAIL_RE.test(email);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!valid) return;
    setLoading(true);
    // TODO: call send-reset-link API
    setTimeout(() => {
      router.push('/auth/forgot-password/check-email');
    }, 800);
  };

  return (
    <AuthCard>
      <form onSubmit={handleSubmit} className="flex flex-col items-center text-center max-w-md mx-auto">
        <AuthIcon name="lock" size={130} />

        <h1 className="text-2xl md:text-3xl font-black text-white mt-6">Forgot password?</h1>
        <p className="text-sm text-gray-400 mt-2">
          Enter your email address and we&apos;ll send<br />you a link to reset your password
        </p>

        <div className="w-full mt-8 text-left">
          <label htmlFor="email" className="text-sm font-bold text-white block mb-2">Full Email</label>
          <AuthInput
            id="email"
            type="email"
            name="email"
            placeholder="Enter email address here..."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<MailIcon />}
            invalid={touched && !valid}
            errorMessage="Please enter a valid email address"
            autoComplete="email"
          />
        </div>

        <div className="w-full mt-8">
          <AuthButton type="submit" variant="primary" loading={loading}>
            Send Reset Link
          </AuthButton>
        </div>

        <p className="text-sm text-gray-400 mt-6">
          Remember your password?{' '}
          <Link href="/auth/signin" className="text-[#7135DB] font-semibold">Sign in</Link>
        </p>
      </form>
    </AuthCard>
  );
}

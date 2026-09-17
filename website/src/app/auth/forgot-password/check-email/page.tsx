'use client';
import React, { useState } from 'react';
import AuthCard from '@/components/auth/AuthCard';
import AuthIcon from '@/components/auth/AuthIcon';

export default function CheckEmailPage() {
  const [sent, setSent] = useState(false);

  const handleResend = () => {
    setSent(true);
    // TODO: call resend reset-link API
    setTimeout(() => setSent(false), 2500);
  };

  return (
    <AuthCard>
      <div className="flex flex-col items-center text-center max-w-md mx-auto">
        <AuthIcon name="envelope" size={130} />

        <h1 className="text-2xl md:text-3xl font-black text-white mt-6">Check Your Email</h1>
        <p className="text-sm text-gray-400 mt-2">
          We&apos;ve sent a password reset link to<br />
          <span className="font-bold text-gray-200">mual***@gmail.com</span>
        </p>

        <p className="text-sm text-gray-400 mt-10">
          Didn&apos;t receive the email?{' '}
          <button type="button" onClick={handleResend} className="text-[#7135DB] font-semibold">
            {sent ? 'Sent!' : 'Resend Email'}
          </button>
        </p>
      </div>
    </AuthCard>
  );
}

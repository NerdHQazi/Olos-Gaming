'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthCard from '@/components/auth/AuthCard';
import AuthButton from '@/components/auth/AuthButton';
import AuthIcon from '@/components/auth/AuthIcon';
import OtpInput from '@/components/auth/OtpInput';

const CODE_LENGTH = 6;
const RESEND_SECONDS = 55;

export default function VerifyEmailPage() {
  const router = useRouter();
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const [loading, setLoading] = useState(false);

  const complete = digits.every((d) => d !== '');

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const handleResend = () => {
    if (seconds > 0) return;
    setSeconds(RESEND_SECONDS);
    // TODO: call resend-code API
  };

  const handleSubmit = () => {
    if (!complete) return;
    setLoading(true);
    // TODO: verify code with API
    setTimeout(() => {
      router.push('/auth/enable-2fa');
    }, 900);
  };

  return (
    <AuthCard>
      <div className="flex flex-col items-center text-center max-w-md mx-auto">
        <AuthIcon name="envelope" size={130} />

        <h1 className="text-2xl md:text-3xl font-black text-white mt-6">Verify Your Email</h1>
        <p className="text-sm text-gray-400 mt-2">
          We&apos;ve sent a 6-digit code to<br />
          <span className="font-bold text-gray-200">mual***@gmail.com</span>
        </p>

        <div className="mt-8 w-full">
          <OtpInput value={digits} onChange={setDigits} />
        </div>

        <p className="text-sm text-gray-400 mt-6">
          Didn&apos;t receive the code?{' '}
          <button
            type="button"
            onClick={handleResend}
            disabled={seconds > 0}
            className="text-[#7135DB] font-semibold disabled:text-[#7135DB]/50"
          >
            Resend
          </button>{' '}
          {seconds > 0 && <span>({seconds}s)</span>}
        </p>

        <div className="w-full mt-10 space-y-4">
          <AuthButton
            variant={complete ? 'primary' : 'cyan'}
            onClick={handleSubmit}
            disabled={!complete}
            loading={loading}
          >
            {complete ? 'Verify Email' : 'Enter Code'}
          </AuthButton>
          {complete ? (
            <AuthButton variant="outline" onClick={() => router.push('/auth/signup')}>
              Change Email
            </AuthButton>
          ) : (
            <button
              type="button"
              onClick={() => router.push('/auth/signup')}
              className="text-sm text-gray-400 hover:text-gray-200"
            >
              Change Email
            </button>
          )}
        </div>
      </div>
    </AuthCard>
  );
}

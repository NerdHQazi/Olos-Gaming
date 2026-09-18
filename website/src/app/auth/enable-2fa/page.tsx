'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthCard from '@/components/auth/AuthCard';
import AuthButton from '@/components/auth/AuthButton';
import AuthIcon from '@/components/auth/AuthIcon';

function ChevronRight() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

type Method = 'authenticator' | 'sms';

export default function Enable2FAPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<Method | null>(null);
  const [loading, setLoading] = useState(false);

  const handleContinue = () => {
    if (!selected) return;
    setLoading(true);
    // TODO: kick off the chosen 2FA enrollment flow
    setTimeout(() => {
      router.push('/auth/loading');
    }, 800);
  };

  return (
    <AuthCard>
      <div className="flex flex-col items-center text-center max-w-md mx-auto">
        <AuthIcon name="phone" size={130} />

        <h1 className="text-2xl md:text-3xl font-black text-white mt-6">Enable 2FA</h1>
        <p className="text-sm text-gray-400 mt-2">
          Add an extra layer of security to your account
        </p>

        <div className="w-full mt-8 space-y-4">
          <button
            type="button"
            onClick={() => setSelected('authenticator')}
            className={`w-full h-16 rounded-xl border flex items-center justify-between px-4 transition-all ${
              selected === 'authenticator' ? 'border-[#169EFA] bg-[#169EFA]/10' : 'border-[#3B82F6]/30 bg-black'
            }`}
          >
            <span className="flex items-center gap-3 text-white font-semibold">
              <span className="text-xl">🔐</span>
              Google Authentication
              <span className="text-green-500 text-sm font-semibold">Recommended</span>
            </span>
            <ChevronRight />
          </button>

          <button
            type="button"
            onClick={() => setSelected('sms')}
            className={`w-full h-16 rounded-xl border flex items-center justify-between px-4 transition-all ${
              selected === 'sms' ? 'border-[#169EFA] bg-[#169EFA]/10' : 'border-[#3B82F6]/30 bg-black'
            }`}
          >
            <span className="flex items-center gap-3 text-white font-semibold">
              <span className="text-xl">💬</span>
              SMS Verification
            </span>
            <ChevronRight />
          </button>
        </div>

        <div className="w-full mt-8 space-y-4">
          <AuthButton variant={selected ? 'primary' : 'outline'} disabled={!selected} loading={loading} onClick={handleContinue}>
            Continue
          </AuthButton>
          <button
            type="button"
            onClick={() => router.push('/auth/loading')}
            className="text-sm text-gray-400 hover:text-gray-200"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </AuthCard>
  );
}

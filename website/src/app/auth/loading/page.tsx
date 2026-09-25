'use client';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/auth/Logo';

export default function LoadingPage() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => {
      router.push('/'); // TODO: point at the real post-onboarding destination
    }, 1800);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div className="min-h-screen bg-[#050810] text-white flex flex-col items-center justify-center gap-10 p-8">
      <Logo variant="stacked" className="w-40" />

      <span
        className="w-10 h-10 border-[3px] border-[#22D3EE]/30 border-t-[#22D3EE] rounded-full animate-spin"
        aria-hidden
      />

      <div className="text-center">
        <h1 className="text-xl font-black">Signing you in...</h1>
        <p className="text-sm text-gray-400 mt-1">
          Please wait while we securely connect your account
        </p>
      </div>
    </div>
  );
}

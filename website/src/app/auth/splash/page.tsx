'use client';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/auth/Logo';

export default function SplashPage() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => {
      router.push('/auth/welcome');
    }, 1600);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div className="min-h-screen bg-[#050810] text-white flex flex-col items-center justify-center gap-6 p-8">
      <Logo variant="stacked" className="w-56 md:w-64" />
      <p className="text-center text-sm md:text-base font-semibold">
        <span className="text-gray-200">Play </span>
        <span className="text-[#7135DB]">Skills</span>
        <span className="text-gray-200"> Games.</span>
        <br />
        <span className="text-gray-200">Stake </span>
        <span className="text-[#7135DB]">tokens</span>
        <span className="text-gray-200">. </span>
        <span className="text-amber-400">Win</span>
        <span className="text-gray-200"> On Chain</span>
      </p>
    </div>
  );
}

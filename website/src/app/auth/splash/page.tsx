'use client';
import React from 'react';
import Link from 'next/link';
import AuthPageShell from '@/components/auth/AuthPageShell';
import Logo from '@/components/auth/Logo';

export default function SplashPage() {
  return (
    <AuthPageShell>
      <div className="h-full w-full flex items-center justify-center p-4">
        <div className="w-full max-w-md flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-2xl bg-[#0B1121] border border-white/10 flex items-center justify-center mb-8">
            <Logo variant="stacked" className="h-10 w-auto" />
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            PLAY. STAKE. WIN.
          </h1>
          <p className="text-sm sm:text-base text-gray-400 mt-4">
            Play Skilled-based games. Stake GVT. Win real reward On-Chain.
          </p>

          <Link href="/auth/signup" className="w-full mt-10">
            <button className="w-full h-14 rounded-xl bg-gradient-to-r from-[#22D3EE] to-[#169EFA] text-black font-bold tracking-wide transition-all active:scale-[0.98] hover:opacity-90">
              GET STARTED
            </button>
          </Link>

          <Link
            href="/auth/signin"
            className="mt-5 text-xs font-bold tracking-wide text-gray-400 hover:text-white transition-colors"
          >
            ALREADY HAVE AN ACCOUNT? <span className="text-[#22D3EE]">SIGN IN</span>
          </Link>
        </div>
      </div>
    </AuthPageShell>
  );
}

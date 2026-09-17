'use client';
import React from 'react';

export default function SocialRow({ onGoogle }: { onGoogle?: () => void }) {
  return (
    <div className="w-full space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-sm text-gray-400 whitespace-nowrap">Or continue with</span>
        <div className="flex-1 h-px bg-white/10" />
      </div>
      <div className="flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={onGoogle}
          className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all"
          aria-label="Continue with MetaMask"
        >
          <span className="text-2xl">🦊</span>
        </button>
        <button
          type="button"
          className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all"
          aria-label="Continue with WalletConnect"
        >
          <span className="text-2xl">🔵</span>
        </button>
        <button
          type="button"
          className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all"
          aria-label="Continue with Coinbase"
        >
          <span className="text-2xl">🔷</span>
        </button>
      </div>
    </div>
  );
}

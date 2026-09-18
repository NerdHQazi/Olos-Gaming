'use client';
import React from 'react';

export default function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#050B18] text-white flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-[800px] border border-white/10 rounded-[40px] bg-[#0B1121]/30 backdrop-blur-xl p-8 md:p-14">
        {children}
      </div>
    </div>
  );
}

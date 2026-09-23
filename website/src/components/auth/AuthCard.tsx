'use client';
import React from 'react';

/** The bordered content panel. Used inside <AuthPageShell> for the
 * single-column pages (verify-email, enable-2fa, forgot/reset-password). */
export default function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full h-full flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-[800px] border border-white/10 rounded-[32px] bg-[#0B1121]/30 backdrop-blur-xl p-6 sm:p-8 md:p-14">
        {children}
      </div>
    </div>
  );
}

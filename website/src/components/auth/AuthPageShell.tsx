'use client';
import React, { useEffect, useRef } from 'react';
import OnboardingHeader from './OnboardingHeader';

export default function AuthPageShell({ children }: { children: React.ReactNode }) {
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Reset BOTH the window scroll and the actual scrolling element's scrollTop.
    // Content here scrolls inside <main> (overflow-y-auto), not the window, so
    // window.scrollTo alone was never going to reliably reset the right thing.
    if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
    if (mainRef.current) mainRef.current.scrollTop = 0;
  }, []);

  return (
    <div className="h-screen w-full overflow-hidden bg-[#050810] text-white flex flex-col">
      <OnboardingHeader />
      {/* Pages are sized to fit within this on a normal ~800px+ tall viewport
          with no visible scrollbar. overflow-y-auto stays on as a safety net
          only — for a genuinely short viewport — never a hard clip, so
          content is never simply invisible. */}
      <main ref={mainRef} className="flex-1 min-h-0 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

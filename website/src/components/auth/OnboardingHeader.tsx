'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from './Logo';

/**
 * Shared header for every /auth/* page. Deliberately does NOT include the
 * step-progress indicator seen in the new screenshots (1 2 3 4 5 dots) —
 * that's on hold until you have the real step order from your team.
 *
 * Nav links: GAMES and LEADER BOARD point at your real /games and
 * /leaderboard routes. HOW IT WORKS / TOKENS / ABOUT have no confirmed
 * route yet, so they're "#" placeholders — swap in real hrefs once you
 * know where those should go (a homepage section anchor? dedicated pages?).
 */
export default function OnboardingHeader() {
  const pathname = usePathname();
  const isSignupPage = pathname?.startsWith('/auth/signup');

  return (
    <header className="shrink-0 w-full border-b border-white/5 bg-[#050810]">
      <div className="max-w-[1600px] mx-auto px-4 md:px-10 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center shrink-0">
          <Logo variant="header" className="h-7 w-auto" />
        </Link>

        <nav className="hidden lg:flex items-center gap-8 text-[13px] font-bold tracking-wide text-gray-400">
          <Link href="/games" className="hover:text-white transition-colors">GAMES</Link>
          <Link href="/leaderboard" className="hover:text-white transition-colors">LEADER BOARD</Link>
          <Link href="#" className="hover:text-white transition-colors">HOW IT WORKS</Link>
          <Link href="#" className="hover:text-white transition-colors">TOKENS</Link>
          <Link href="#" className="hover:text-white transition-colors">ABOUT</Link>
        </nav>

        {/* Reciprocal CTA: signup page invites you to sign in, every other
            auth page invites you to sign up. */}
        {isSignupPage ? (
          <Link
            href="/auth/signin"
            className="shrink-0 text-[13px] font-bold text-gray-300 hover:text-white transition-colors"
          >
            SIGN IN
          </Link>
        ) : (
          <Link
            href="/auth/signup"
            className="shrink-0 text-[13px] font-bold text-gray-300 hover:text-white transition-colors"
          >
            SIGN UP
          </Link>
        )}
      </div>
    </header>
  );
}

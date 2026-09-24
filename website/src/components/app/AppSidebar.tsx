'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

function IconHome() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></svg>;
}
function IconGame() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="10" rx="4" /><path d="M7 12h.01M11 12h.01M17 10.5v3" /></svg>;
}
function IconTrophy() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 4h8v5a4 4 0 01-8 0V4z" /><path d="M8 5H4v2a4 4 0 004 4M16 5h4v2a4 4 0 01-4 4" /><path d="M10 15h4v3h-4z" /><path d="M8 21h8" /></svg>;
}
function IconMedal() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="15" r="5" /><path d="M9 10L6 3M15 10l3-7M9 3h6" /></svg>;
}
function IconCoin() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M9 12h6M12 9v6" /></svg>;
}
function IconWallet() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="20" height="14" rx="2" /><path d="M2 10h20M16 15h2" /></svg>;
}
function IconUser() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>;
}
function IconHelp() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 015 0c0 1.5-2 2-2.5 3" /><path d="M12 17h.01" /></svg>;
}
function IconChat() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.4 8.4 0 01-8.8 8.4A8.6 8.6 0 013 12a8.4 8.4 0 018.4-8.5A8.4 8.4 0 0121 11.5z" /></svg>;
}

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: IconHome },
  { href: '/games', label: 'Game', icon: IconGame },
  { href: '/leaderboard', label: 'Leaderboard', icon: IconMedal },
  { href: '/tournaments', label: 'Tournaments', icon: IconTrophy },
  { href: '/token', label: 'Token', icon: IconCoin },
  { href: '/wallet', label: 'Wallet', icon: IconWallet },
  { href: '/profile', label: 'Profile', icon: IconUser },
  { href: '/how-it-works', label: 'How it works', icon: IconHelp },
  { href: '/support', label: 'Support', icon: IconChat },
];

export default function AppSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="h-full w-64 shrink-0 bg-[#050810] border-r border-white/5 flex flex-col">
      <div className="h-16 flex items-center gap-2 px-5 shrink-0">
        <Image src="/images/olos-logo-header.png" alt="OLOS" width={90} height={28} className="h-6 w-auto" />
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#22D3EE]/40 text-[#22D3EE]">BETA</span>
      </div>

      <nav className="flex-1 min-h-0 overflow-y-auto px-3 py-2 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname?.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                active ? 'bg-[#7135DB] text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 shrink-0">
        <div className="rounded-2xl border border-white/10 bg-[#0B1121] p-4">
          <p className="text-sm font-bold text-white">Invite &amp; Earn</p>
          <p className="text-xs text-gray-500 mt-0.5">Earn GVT rewards together</p>
          <div className="mt-3 rounded-xl overflow-hidden bg-black/40">
            <Image src="/images/invite-graphic.png" alt="" width={220} height={110} className="w-full h-auto" />
          </div>
          <button
            type="button"
            className="w-full mt-3 h-9 rounded-lg bg-[#7135DB] hover:bg-[#5f2bb8] text-white text-sm font-bold transition-colors"
          >
            GET LINK
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useWallet } from '@/context/WalletContext';
import Avatar from './Avatar';

function BellIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 8a6 6 0 0112 0c0 5 2 6 2 6H4s2-1 2-6z" /><path d="M10 20a2 2 0 004 0" /></svg>;
}
function ChevronDown() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>;
}
function MenuIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16" /></svg>;
}

function truncateAddress(addr?: string | null) {
  if (!addr) return '0x0000...0000';
  return `${addr.slice(0, 4)}...${addr.slice(-3)}`;
}

export default function AppTopbar({ title, onMenuClick }: { title: string; onMenuClick?: () => void }) {
  const { user } = useAuth();
  // NOTE: assuming useWallet() exposes `address` alongside `balance` /
  // `isLoading`, consistent with how the original dashboard used `balance`.
  // If the real shape differs, adjust the destructure below.
  const { balance, isLoading, address } = useWallet() as { balance?: number; isLoading?: boolean; address?: string };

  const displayName = user?.username || user?.email?.split('@')[0] || 'Player';

  return (
    <header className="h-16 shrink-0 border-b border-white/5 bg-[#050810] flex items-center justify-between gap-3 px-4 md:px-8">
      <div className="flex items-center gap-3 min-w-0">
        <button type="button" onClick={onMenuClick} className="lg:hidden text-gray-400 hover:text-white shrink-0" aria-label="Open menu">
          <MenuIcon />
        </button>
        <h1 className="text-lg md:text-xl font-black text-white truncate">{title}</h1>
      </div>

      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        <button type="button" className="hidden sm:flex items-center gap-1.5 h-9 px-3 rounded-full bg-[#0B1121] border border-white/10 text-xs font-bold text-gray-300 hover:border-white/20 transition-colors">
          <span className="w-4 h-4 rounded-full bg-gradient-to-br from-[#627EEA] to-[#3C5CDB]" />
          Ethereum
          <ChevronDown />
        </button>

        <div className="hidden md:flex flex-col leading-tight h-9 justify-center px-3 rounded-full bg-[#161033] border border-[#7135DB]/30">
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">GVT Balance</span>
          <span className="text-xs font-black text-[#22D3EE]">
            {isLoading ? '...' : `${(balance ?? 0).toLocaleString()}.00`}
          </span>
        </div>

        <button type="button" className="flex items-center gap-2 h-9 pl-1.5 pr-2.5 rounded-full bg-[#0B1121] border border-white/10 hover:border-white/20 transition-colors">
          <Avatar name={displayName} size={26} />
          <span className="hidden sm:inline text-xs font-bold text-gray-200">{truncateAddress(address)}</span>
          <ChevronDown />
        </button>

        <button type="button" className="w-9 h-9 rounded-full bg-[#0B1121] border border-white/10 hover:border-white/20 flex items-center justify-center text-amber-400 transition-colors" aria-label="Notifications">
          <BellIcon />
        </button>
      </div>
    </header>
  );
}

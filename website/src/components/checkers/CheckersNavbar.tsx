"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAppKit, useAppKitAccount } from "@reown/appkit/react";
import { Settings } from "lucide-react";

function shortenAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function CheckersNavbar() {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="w-full bg-[#03060d] border-b border-white/5 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: OLOS Logo */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <Image
              src="/OLOS_logo.svg"
              alt="OLOS"
              width={100}
              height={36}
              className="h-7 w-auto object-contain transition-transform group-hover:scale-105"
              priority
            />
          </Link>
        </div>

        {/* Center: Navigation Links */}
        <div className="hidden md:flex items-center gap-8">
          <Link
            href="/dashboard/games"
            className="relative text-[11px] font-black uppercase tracking-wider text-[#00f0ff] py-1"
          >
            GAMES
            <span className="absolute -bottom-1 left-0 right-0 h-[2px] bg-[#00f0ff] rounded-full shadow-[0_0_8px_#00f0ff]" />
          </Link>

          <Link
            href="/tournaments"
            className="text-[11px] font-black uppercase tracking-wider text-gray-300 hover:text-white transition-colors"
          >
            TOURNAMENTS
          </Link>

          <Link
            href="/streaming"
            className="text-[11px] font-black uppercase tracking-wider text-gray-300 hover:text-white transition-colors"
          >
            STREAMING
          </Link>

          <Link
            href="/leaderboard"
            className="text-[11px] font-black uppercase tracking-wider text-gray-300 hover:text-white transition-colors"
          >
            LEADERBOARD
          </Link>
        </div>

        {/* Right: Connect Wallet & Settings Gear */}
        <div className="flex items-center gap-3">
          {isConnected && address ? (
            <button
              onClick={() => open({ view: "Account" })}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0e172a] border border-[#00f0ff]/40 hover:border-[#00f0ff] text-xs font-bold text-white transition-all shadow-[0_0_12px_rgba(0,240,255,0.2)]"
            >
              <span className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse" />
              <span>{shortenAddress(address)}</span>
            </button>
          ) : (
            <button
              onClick={() => open()}
              className="px-5 py-2 rounded-lg bg-[#B4B6FF] hover:bg-white text-[#0e103d] text-xs font-black uppercase tracking-wider transition-all active:scale-95 shadow-md shadow-indigo-950/40"
            >
              CONNECT WALLET
            </button>
          )}

          {/* Settings gear with green status dot */}
          <div className="relative">
            <button
              type="button"
              title="Settings"
              className="w-9 h-9 rounded-lg bg-[#0a0f1d] border border-white/10 hover:border-white/25 flex items-center justify-center text-gray-300 hover:text-white transition-colors relative"
            >
              <Settings className="w-4 h-4" />
              <span className="w-2 h-2 rounded-full bg-[#00ff88] absolute -top-0.5 -right-0.5 ring-2 ring-[#03060d] shadow-[0_0_6px_#00ff88]" />
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-gray-400 hover:text-white p-1"
            aria-label="Toggle navigation"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#070c18] border-b border-white/10 px-4 py-3 space-y-2">
          <Link
            href="/dashboard/games"
            className="block text-xs font-black uppercase text-[#00f0ff] py-1"
            onClick={() => setMobileMenuOpen(false)}
          >
            GAMES
          </Link>
          <Link
            href="/tournaments"
            className="block text-xs font-black uppercase text-gray-300 hover:text-white py-1"
            onClick={() => setMobileMenuOpen(false)}
          >
            TOURNAMENTS
          </Link>
          <Link
            href="/streaming"
            className="block text-xs font-black uppercase text-gray-300 hover:text-white py-1"
            onClick={() => setMobileMenuOpen(false)}
          >
            STREAMING
          </Link>
          <Link
            href="/leaderboard"
            className="block text-xs font-black uppercase text-gray-300 hover:text-white py-1"
            onClick={() => setMobileMenuOpen(false)}
          >
            LEADERBOARD
          </Link>
        </div>
      )}
    </nav>
  );
}

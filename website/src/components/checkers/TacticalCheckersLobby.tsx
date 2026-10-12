"use client";

import React, { useState } from "react";
import Image from "next/image";
import { SettlementRecord } from "./types";

interface TacticalCheckersLobbyProps {
  onLaunchPvP: (stake: number) => void;
  onLaunchPractice: () => void;
  initialStake?: number;
}

const STAKE_OPTIONS = [10, 25, 50, 100, 250];

const SETTLEMENTS: SettlementRecord[] = [
  { competitor: "CryptoKing.eth", result: "VICTORY", payout: "+47.50 GVT", isPositive: true },
  { competitor: "Ainaf_G", result: "VICTORY", payout: "+19.00 GVT", isPositive: true },
  { competitor: "ChessGod.eth", result: "DEFEAT", payout: "-10.00 GVT", isPositive: false },
];

export default function TacticalCheckersLobby({
  onLaunchPvP,
  onLaunchPractice,
  initialStake = 25,
}: TacticalCheckersLobbyProps) {
  const [stake, setStake] = useState<number>(initialStake);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* ── HERO BANNER ────────────────────────────────────────── */}
      <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#060a14] min-h-[190px] sm:min-h-[220px] flex items-center shadow-2xl">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/tactical-checkers-bg.png"
            alt="Tactical Checkers Banner"
            fill
            className="object-cover object-right"
            priority
          />
          {/* Subtle gradient to ensure text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#060a16] via-[#060a16]/85 to-transparent" />
        </div>

        {/* Banner Content */}
        <div className="relative z-10 px-6 sm:px-10 py-8 max-w-2xl space-y-3">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight text-white drop-shadow-md">
            TACTICAL CHECKERS ON-CHAIN
          </h1>
          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed font-medium">
            Challenge global opponents or refine your sequence play against our
            fully audited, open-source rule engine. Stake GVT and capture the
            board.
          </p>
        </div>
      </div>

      {/* ── MAIN 2-COLUMN GRID ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Rules, Stake Selection, Recent Settlements (approx 7 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card 1: Checkers System Rules & Mechanics */}
          <div className="rounded-2xl border border-white/10 bg-[#0a0f1d] p-6 space-y-4 shadow-xl">
            <h2 className="text-xs font-black uppercase tracking-wider text-white">
              CHECKERS SYSTEM RULES &amp; MECHANICS
            </h2>
            <ol className="space-y-2.5 text-xs text-gray-300 font-normal leading-relaxed list-none">
              <li className="flex items-start gap-2">
                <span className="text-gray-400 font-bold shrink-0">1.</span>
                <span>Move pieces diagonally forward onto vacant dark cells of the 8×8 battlefield grid.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-400 font-bold shrink-0">2.</span>
                <span>Jump opponent pieces diagonally to capture them. Multiple consecutive jumps are mandatory if structurally available.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-400 font-bold shrink-0">3.</span>
                <span>Reach the opponent&apos;s furthest back row to promote your piece into a &quot;King,&quot; unlocking diagonal backwards movement paths.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-400 font-bold shrink-0">4.</span>
                <span>Capture all opponent pieces or block them from making valid moves to declare instant on-chain victory.</span>
              </li>
            </ol>
          </div>

          {/* Card 2: Choose Your GVT Stake */}
          <div className="rounded-2xl border border-white/10 bg-[#0a0f1d] p-6 space-y-4 shadow-xl">
            <h2 className="text-xs font-black uppercase tracking-wider text-white">
              CHOOSE YOUR GVT STAKE
            </h2>

            <div className="flex flex-wrap gap-3">
              {STAKE_OPTIONS.map((val) => {
                const isSelected = stake === val;
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setStake(val)}
                    className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
                      isSelected
                        ? "bg-[#0b1626] border border-[#00f0ff] text-[#00f0ff] shadow-[0_0_15px_rgba(0,240,255,0.3)]"
                        : "bg-[#060a16] border border-white/10 text-gray-300 hover:border-white/25 hover:text-white"
                    }`}
                  >
                    {val} GVT
                  </button>
                );
              })}
            </div>

            <p className="text-[11px] text-gray-400 leading-relaxed font-normal pt-1">
              Platform charges a minimal 5% audited pool fee on victories. Smart
              contracts guarantee instant, trustless distribution.
            </p>
          </div>

          {/* Card 3: Recent Arena Settlements */}
          <div className="rounded-2xl border border-white/10 bg-[#0a0f1d] p-6 space-y-4 shadow-xl">
            <h2 className="text-xs font-black uppercase tracking-wider text-white">
              RECENT ARENA SETTLEMENTS
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] font-black uppercase tracking-wider text-gray-500">
                    <th className="pb-3">COMPETITOR</th>
                    <th className="pb-3 text-center sm:text-left">RESULT</th>
                    <th className="pb-3 text-right">PAYOUT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-medium">
                  {SETTLEMENTS.map((rec, i) => (
                    <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 text-white font-mono text-xs">
                        {rec.competitor}
                      </td>
                      <td className="py-3 text-center sm:text-left">
                        <span
                          className={`font-black uppercase tracking-wide text-xs ${
                            rec.isPositive ? "text-[#00ff88]" : "text-[#ef4444]"
                          }`}
                        >
                          {rec.result}
                        </span>
                      </td>
                      <td
                        className={`py-3 text-right font-mono font-bold text-xs ${
                          rec.isPositive ? "text-[#00ff88]" : "text-[#ef4444]"
                        }`}
                      >
                        {rec.payout}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Launch Match & Checkers Standings (approx 4-5 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card 1: Launch Match */}
          <div className="rounded-2xl border border-white/10 bg-[#0a0f1d] p-6 space-y-4 shadow-xl">
            <h2 className="text-xs font-black uppercase tracking-wider text-white">
              LAUNCH MATCH
            </h2>

            <div className="space-y-3 pt-1">
              <button
                type="button"
                onClick={() => onLaunchPvP(stake)}
                className="w-full py-3.5 px-4 rounded-xl bg-[#00f0ff] hover:bg-[#38bdf8] text-[#050810] text-xs font-black uppercase tracking-wider transition-all duration-200 active:scale-98 shadow-lg shadow-cyan-500/25 cursor-pointer text-center"
              >
                PLAY VS PLAYER
              </button>

              <button
                type="button"
                onClick={onLaunchPractice}
                className="w-full py-3.5 px-4 rounded-xl bg-transparent hover:bg-[#00f0ff]/10 border border-[#00f0ff] text-[#00f0ff] text-xs font-black uppercase tracking-wider transition-all duration-200 active:scale-98 cursor-pointer text-center"
              >
                PLAY VS SYSTEM
              </button>
            </div>
          </div>

          {/* Card 2: Your Checkers Standings */}
          <div className="rounded-2xl border border-white/10 bg-[#0a0f1d] p-6 space-y-4 shadow-xl">
            <h2 className="text-xs font-black uppercase tracking-wider text-white">
              YOUR CHECKERS STANDINGS
            </h2>

            <div className="space-y-3 pt-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 font-bold uppercase tracking-wider text-[11px]">
                  TOTAL MATCHES
                </span>
                <span className="font-mono font-black text-white text-sm">
                  1,843
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-400 font-bold uppercase tracking-wider text-[11px]">
                  WIN RATE
                </span>
                <span className="font-mono font-black text-[#00ff88] text-sm">
                  72.3%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

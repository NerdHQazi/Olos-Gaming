"use client";

import React, { useState } from "react";
import Link from "next/link";
import BackToDashboard from "@/components/BackToDashboard";
import { Gamepad2, Trophy } from "lucide-react";

const STAKE_LEVELS = [
  { value: 10, label: "10 GVT", volatility: "Low" },
  { value: 25, label: "25 GVT", volatility: "Medium" },
  { value: 50, label: "50 GVT", volatility: "High" },
  { value: 100, label: "100 GVT", volatility: "High" },
  { value: 250, label: "250 GVT", volatility: "Extreme" },
];

export default function ChessDetailsPage() {
  const [stake, setStake] = useState<number>(25);
  const [mode, setMode] = useState<"pvp" | "pve">("pvp");

  return (
    <div className="min-h-screen bg-[#03060d] text-white px-4 md:px-8 py-6 max-w-7xl mx-auto space-y-8">
      {/* Navigation Top Bar */}
      <div className="flex items-center justify-between">
        <BackToDashboard label="Back to Games" href="/dashboard/games" />
        <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-[#20ceee]/10 text-[#20ceee] border border-[#20ceee]/30">
          ● STRATEGIC GRANDMASTER ZONE
        </span>
      </div>

      {/* Quantum Chess Arena Header Section */}
      <div className="space-y-3">
        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white uppercase">
          QUANTUM <span className="text-[#20ceee]">CHESS ARENA</span>
        </h1>
        <p className="text-gray-400 text-sm leading-relaxed max-w-2xl font-medium">
          The absolute benchmark of tactical prowess. Match stakes against global grandmasters in audited dual-stake Smart Escrow rooms. Clear paths, defend kings, conquer the board.
        </p>
      </div>

      {/* Main Grid: Tactics / Stakes on Left; Game Mode on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Tactics Rules & Stake Selection */}
        <div className="lg:col-span-8 space-y-6">
          {/* Rules Card */}
          <div className="rounded-2xl border border-white/10 bg-[#080d1c] p-6 space-y-4">
            <h3 className="text-xs font-black text-white uppercase tracking-wider">
              CHESS ARENA TACTICS & COOLDOWNS
            </h3>
            <ol className="text-xs text-gray-400 space-y-2.5 font-medium list-decimal list-inside">
              <li>Standard FIDE chess rules apply for pieces movement and capture structures.</li>
              <li>Timed Actions: Each player starts with an allocated 5-minute clock balance.</li>
              <li>If your personal clock bank reaches 00:00, you trigger an automatic time-out defeat.</li>
              <li>Handshakes and settlements are registered and committed to the audited Smart Contract instantly on checkmate or forfeit.</li>
            </ol>
          </div>

          {/* Stake Selection */}
          <div className="rounded-2xl border border-white/10 bg-[#080d1c] p-6 space-y-4">
            <h3 className="text-xs font-black text-white uppercase tracking-wider">
              SELECT YOUR STAKE LEVEL
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {STAKE_LEVELS.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setStake(s.value)}
                  className={`h-12 rounded-xl text-xs font-black transition-all border ${
                    stake === s.value
                      ? "bg-[#20ceee]/20 border-[#20ceee] text-[#20ceee] shadow-[0_0_15px_rgba(32,206,238,0.3)]"
                      : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/5 text-xs">
              <div>
                <span className="text-[10px] text-gray-500 font-bold block uppercase">MIN STAKE</span>
                <span className="font-bold text-white">{stake} GVT</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 font-bold block uppercase">VOLATILITY</span>
                <span className="font-bold text-[#20ceee]">
                  {STAKE_LEVELS.find((s) => s.value === stake)?.volatility || "Medium"}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 font-bold block uppercase">PLATFORM FEE</span>
                <span className="font-bold text-amber-400">5% Victory Fee</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Game Mode Select & Arena Stats */}
        <div className="lg:col-span-4 space-y-6">
          {/* Mode Selector */}
          <div className="rounded-2xl border border-white/10 bg-[#080d1c] p-6 space-y-4">
            <h3 className="text-xs font-black text-white uppercase tracking-wider">
              ENTER GAME MODE
            </h3>

            <div className="space-y-3">
              {/* Play vs Player */}
              <button
                type="button"
                onClick={() => setMode("pvp")}
                className={`w-full p-4 rounded-xl border flex items-center justify-between text-left transition-all ${
                  mode === "pvp"
                    ? "bg-[#20ceee] border-[#20ceee] text-black font-black shadow-[0_0_20px_rgba(32,206,238,0.4)]"
                    : "bg-white/5 border-white/10 text-white font-bold hover:bg-white/10"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Gamepad2 size={20} />
                  <span className="text-sm tracking-wide">PLAY VS PLAYER</span>
                </div>
              </button>

              {/* Play vs System */}
              <button
                type="button"
                onClick={() => setMode("pve")}
                className={`w-full p-4 rounded-xl border flex items-center justify-between text-left transition-all ${
                  mode === "pve"
                    ? "bg-[#20ceee] border-[#20ceee] text-black font-black shadow-[0_0_20px_rgba(32,206,238,0.4)]"
                    : "bg-white/5 border-white/10 text-white font-bold hover:bg-white/10"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Trophy size={20} className={mode === "pve" ? "text-black" : "text-amber-400"} />
                  <span className="text-sm tracking-wide">PLAY VS SYSTEM</span>
                </div>
              </button>
            </div>

            {/* Launch Button */}
            <Link
              href={`/dashboard/games/chess?mode=${mode}&stake=${stake}`}
              className="w-full h-12 mt-4 rounded-xl bg-[#7135DB] hover:bg-[#8449e8] text-white text-sm font-black transition-all flex items-center justify-center gap-2 uppercase tracking-wider shadow-lg"
            >
              Launch {mode === "pvp" ? "Player vs Player" : "Player vs System"} Match
            </Link>
          </div>

          {/* Arena Status Card */}
          <div className="rounded-2xl border border-white/10 bg-[#080d1c] p-6 space-y-3">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider">
              ARENA STATUS
            </h3>
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-400">TOTAL MATCHES PLAYED</span>
              <span className="font-bold text-white">54,821</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-400">CURRENT POOL FEES BURNED</span>
              <span className="font-bold text-[#20ceee]">8,940 GVT</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

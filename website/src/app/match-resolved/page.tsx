'use client';
import React from 'react';
import AppShell from '@/components/app/AppShell';
import Avatar from '@/components/app/Avatar';

const STATS = [
  { label: 'KILLS', value: '4', sub: 'Max match count' },
  { label: 'LENGTH REACHED', value: '42 Blocks', sub: 'Top 5% of Lobby' },
  { label: 'POWER-UPS USED', value: '12', sub: 'Double-boost emphasis' },
  { label: 'ACCURACY', value: '94.2%', sub: 'High precision paths' },
];

const REWARDS = [
  { label: 'Entry Stake Returned', value: '+25.00 GVT', color: 'text-[#22D3EE]' },
  { label: 'Match Winnings', value: '+25.00 GVT', color: 'text-[#22D3EE]' },
  { label: 'XP Points Earned', value: '+340 XP', color: 'text-[#22D3EE]' },
];

export default function MatchResolvedPage() {
  return (
    <AppShell title="Match Resolved">
      <div className="px-4 md:px-8 py-6 max-w-7xl mx-auto space-y-6">
        {/* Victory Banner */}
        <div className="rounded-3xl border border-white/10 bg-[#0B1121] p-8 md:p-12 text-center">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-[#22D3EE] leading-tight tracking-tight">
            VICTORY!
          </h1>
          <div className="mt-4 inline-block">
            <span className="text-[10px] md:text-xs font-bold tracking-wide px-4 py-1.5 rounded-full border border-[#22D3EE]/40 text-[#22D3EE] bg-[#22D3EE]/5">
              MATCH TRANSACTION RECONCILED · BLOCK #9842051
            </span>
          </div>
        </div>

        {/* Main Content - Two Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6">
          {/* Left Column - On-Chain Escrow Settled */}
          <div className="rounded-3xl border border-white/10 bg-[#0B1121] p-6">
            <div className="mb-1">
              <p className="text-lg font-black text-white">On-Chain Escrow Settled</p>
              <p className="text-sm text-gray-500">Snake Battle · Classical Grid Mode</p>
            </div>

            {/* Score Comparison */}
            <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Your Score</p>
                <p className="text-3xl md:text-4xl font-black text-[#22D3EE] mt-1">2,180</p>
              </div>
              <span className="text-lg font-bold text-gray-500 mx-4">VS</span>
              <div className="text-right">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Opponent Score</p>
                <p className="text-3xl md:text-4xl font-black text-red-400 mt-1">1,450</p>
              </div>
            </div>

            {/* Rewards Breakdown */}
            <div className="mt-6">
              <p className="font-bold text-white mb-3">Rewards Breakdown</p>
              <div className="space-y-3">
                {REWARDS.map((r) => (
                  <div key={r.label} className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-300">{r.label}</span>
                    <span className={`text-sm font-bold ${r.color}`}>{r.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Rank Progress */}
            <div className="mt-6 pt-4 border-t border-white/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-gray-400">Rank Progress</span>
                <span className="text-sm font-bold text-[#a78bfa]">Diamond III (82%)</span>
              </div>
              <div className="h-2.5 rounded-full bg-[#1a1040] overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-[#7135DB] to-[#a78bfa] w-[82%] transition-all duration-1000" />
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Stats Grid 2x2 */}
            <div className="grid grid-cols-2 gap-4">
              {STATS.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-white/10 bg-[#0B1121] p-5"
                >
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">{stat.label}</p>
                  <p className="text-2xl md:text-3xl font-black text-white mt-2">{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{stat.sub}</p>
                </div>
              ))}
            </div>

            {/* Lobby Rank Update */}
            <div className="rounded-3xl border border-white/10 bg-[#0B1121] p-6">
              <p className="font-black text-white mb-4">Lobby Rank Update</p>
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#22D3EE]/10 border border-[#22D3EE]/40">
                <span className="w-7 h-7 rounded-lg bg-[#22D3EE]/20 flex items-center justify-center text-xs font-black text-[#22D3EE]">
                  3
                </span>
                <Avatar name="Nafisa" size={28} />
                <span className="flex-1 text-sm font-bold text-gray-200">You (Nafisa)</span>
                <span className="text-sm font-black text-[#22D3EE]">12,500</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="h-11 px-8 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 hover:opacity-90 text-white text-sm font-bold transition-all"
          >
            Play Again
          </button>
          <button
            type="button"
            className="h-11 px-8 rounded-xl border border-white/15 hover:border-white/30 bg-[#0B1121] text-sm font-bold text-gray-200 transition-all"
          >
            Return to Hub
          </button>
          <button
            type="button"
            className="h-11 px-8 rounded-xl border border-white/15 hover:border-white/30 bg-[#0B1121] text-sm font-bold text-gray-200 transition-all"
          >
            Share Result
          </button>
        </div>
      </div>
    </AppShell>
  );
}

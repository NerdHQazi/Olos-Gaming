'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import AppShell from '@/components/app/AppShell';
import Avatar from '@/components/app/Avatar';

const LEADERBOARD = [
  { rank: 2, name: 'GreenKing', score: '11,940', isYou: false },
  { rank: 3, name: 'Nafisa (You)', score: '11,840', isYou: true },
  { rank: 4, name: 'Satoshi12', score: '11,210', isYou: false },
];

const HISTORY = [
  { opponent: 'Satoshi12', time: '10 days ago', amount: '+95 GVT', positive: true },
  { opponent: 'GreenKing', time: '2 days ago', amount: '-40 GVT', positive: false },
];

const STATS = [
  { label: 'Kills', value: '12' },
  { label: 'Max Length', value: '47' },
  { label: 'Power-ups', value: '8' },
  { label: 'Accuracy', value: '78%' },
];

export default function MatchResultsPage() {
  return (
    <AppShell title="Match Results">
      <div className="px-4 md:px-8 py-6 max-w-7xl mx-auto space-y-6">
        {/* Victory Banner */}
        <div className="rounded-3xl border border-white/10 bg-[#0B1121] overflow-hidden">
          <div className="flex flex-col md:flex-row">
            {/* Left - Victory Text */}
            <div className="flex-1 p-6 md:p-8 flex flex-col justify-center">
              <span className="inline-block w-fit text-[10px] font-bold tracking-wide px-3 py-1.5 rounded-full border border-emerald-500/40 text-emerald-400 bg-emerald-500/10 mb-4">
                VICTORIOUS MATCH
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-emerald-400 leading-tight">
                VICTORY!
              </h1>
              <p className="text-sm text-gray-400 mt-3 max-w-md leading-relaxed">
                You dominated the arena and secured the stake. Keep the streak burning!
              </p>
            </div>
            {/* Right - Snake Image */}
            <div className="w-full md:w-72 lg:w-80 shrink-0 relative">
              <div className="aspect-square md:aspect-auto md:h-full w-full rounded-2xl overflow-hidden border border-[#22D3EE]/30 m-4 md:m-0 md:rounded-none md:border-0">
                <Image
                  src="/snakeGameImage.png"
                  alt="Victory Snake"
                  width={400}
                  height={400}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Two Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Match Recap */}
            <div className="rounded-3xl border border-white/10 bg-[#0B1121] p-6">
              <p className="font-black text-white mb-4">Match Recap</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#7135DB]/20 flex items-center justify-center text-lg">
                    🐍
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Snake Battle</p>
                    <p className="text-xs text-gray-500">Duration: 4:23 mins</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-right">
                  <div>
                    <p className="text-2xl font-black text-emerald-400">2,180</p>
                    <p className="text-[10px] text-gray-500">You (Nafisa)</p>
                  </div>
                  <span className="text-sm font-bold text-gray-500">vs</span>
                  <div>
                    <p className="text-2xl font-black text-red-400">1,450</p>
                    <p className="text-[10px] text-gray-500">Opponent</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Earnings & Rewards */}
            <div className="rounded-3xl border border-white/10 bg-[#0B1121] p-6">
              <p className="font-black text-white mb-4">Earnings &amp; Rewards</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Entry Stake Returned</span>
                  <span className="text-sm font-bold text-white">+25 GVT</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Match Winnings</span>
                  <span className="text-sm font-bold text-emerald-400">+25 GVT</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">XP Earned</span>
                  <span className="text-sm font-bold text-[#22D3EE]">+340 XP</span>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-[#a78bfa]">Rank: Silver Tier IV</span>
                  <span className="text-xs text-gray-500">85% to Gold Tier</span>
                </div>
                <div className="h-2 rounded-full bg-[#1a1040] overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#7135DB] to-[#22D3EE] w-[85%] transition-all duration-1000" />
                </div>
              </div>
            </div>

            {/* Performance Statistics */}
            <div className="rounded-3xl border border-white/10 bg-[#0B1121] p-6">
              <p className="font-black text-white mb-4">Performance Statistics</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {STATS.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl border border-white/10 bg-black/30 p-4"
                  >
                    <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
                    <p className="text-2xl font-black text-white">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Leaderboard Position */}
            <div className="rounded-3xl border border-white/10 bg-[#0B1121] p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="font-black text-white">Leaderboard Position</p>
                <span className="text-[10px] font-bold text-[#22D3EE] tracking-wide">Updated</span>
              </div>
              <div className="space-y-2">
                {LEADERBOARD.map((entry) => (
                  <div
                    key={entry.rank}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${
                      entry.isYou
                        ? 'bg-[#22D3EE]/10 border border-[#22D3EE]/40'
                        : ''
                    }`}
                  >
                    <span className="text-sm font-black text-gray-500 w-4">{entry.rank}</span>
                    <Avatar name={entry.name.replace(' (You)', '')} size={28} />
                    <span className={`flex-1 text-sm font-bold truncate ${entry.isYou ? 'text-[#22D3EE]' : 'text-gray-200'}`}>
                      {entry.name}
                    </span>
                    <span className="text-sm font-black text-gray-300">{entry.score}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 py-2.5 text-center">
                <p className="text-xs font-bold text-emerald-400">You climbed 1 rank position!</p>
              </div>
            </div>

            {/* Historical Performance */}
            <div className="rounded-3xl border border-white/10 bg-[#0B1121] p-6">
              <p className="font-black text-white mb-4">Historical Performance</p>
              <div className="space-y-4">
                {HISTORY.map((h, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-gray-200">vs {h.opponent}</p>
                      <p className="text-xs text-gray-500">{h.time}</p>
                    </div>
                    <span className={`text-sm font-black ${h.positive ? 'text-emerald-400' : 'text-red-400'}`}>
                      {h.amount}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="h-11 px-8 rounded-xl bg-[#22D3EE] hover:bg-[#1ab8d1] text-black text-sm font-bold transition-all"
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
            className="h-11 px-8 rounded-xl border border-[#7135DB]/40 hover:border-[#7135DB]/60 bg-[#1a1040] text-sm font-bold text-gray-200 transition-all"
          >
            Share Result
          </button>
        </div>
      </div>
    </AppShell>
  );
}

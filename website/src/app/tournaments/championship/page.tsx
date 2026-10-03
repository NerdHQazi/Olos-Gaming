'use client';
import React, { useEffect, useState } from 'react';
import AppShell from '@/components/app/AppShell';
import Avatar from '@/components/app/Avatar';

type BracketMatch = {
  p1: string;
  p1Addr: string;
  p1Score: number | null;
  p2: string;
  p2Addr: string;
  p2Score: number | null;
  you?: 'p1' | 'p2';
};

const QUARTER_FINALS: BracketMatch[] = [
  { p1: 'GreenKing', p1Addr: '0x34a...b12', p1Score: 2, p2: 'Satoshi12', p2Addr: '0x56c...f90', p2Score: 1 },
  { p1: 'Nafisa (You)', p1Addr: '0x7G3...345', p1Score: 3, p2: 'ChainLord', p2Addr: '0x78d...e34', p2Score: 2, you: 'p1' },
  { p1: 'BlockMaster', p1Addr: '0x90e...a56', p1Score: 0, p2: 'YoloLegend', p2Addr: '0x12e...b78', p2Score: 2 },
  { p1: 'SolCaster', p1Addr: '0xdfc...410', p1Score: 1, p2: 'EtherLord', p2Addr: '0xdef...342', p2Score: 2 },
];

const SEMI_FINALS: BracketMatch[] = [
  { p1: 'GreenKing', p1Addr: '0x34a...b12', p1Score: 0, p2: 'Nafisa (You)', p2Addr: '0x7G3...345', p2Score: 0, you: 'p2' },
  { p1: 'YoloLegend', p1Addr: '0x12e...b78', p1Score: 0, p2: 'EtherLord', p2Addr: '0xdef...342', p2Score: 0 },
];

const PRIZES = [
  { place: '1st Place', emoji: '🥇', amount: '250.00 GVT', color: 'text-[#22D3EE]' },
  { place: '2nd Place', emoji: '🥈', amount: '125.00 GVT', color: 'text-[#22D3EE]' },
  { place: '3rd-4th Place', emoji: '🥉', amount: '62.50 GVT each', color: 'text-gray-300' },
];

const RULES = [
  'Matches are structured as Best-of-3 tactical rounds.',
  'Clock allocation: 5 Minutes per player.',
  'Disconnections validate active escrow forfeiture automatically.',
];

function BracketCard({ match }: { match: BracketMatch }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#0B1121] overflow-hidden text-sm">
      {(['p1', 'p2'] as const).map((key) => {
        const name = key === 'p1' ? match.p1 : match.p2;
        const addr = key === 'p1' ? match.p1Addr : match.p2Addr;
        const score = key === 'p1' ? match.p1Score : match.p2Score;
        const isYou = match.you === key;
        const isWinner =
          match.p1Score !== null &&
          match.p2Score !== null &&
          ((key === 'p1' && match.p1Score > match.p2Score) ||
            (key === 'p2' && match.p2Score > match.p1Score));

        return (
          <div
            key={key}
            className={`flex items-center gap-2.5 px-3 py-2.5 ${
              isYou
                ? 'bg-[#22D3EE]/10 border border-[#22D3EE]/40 rounded-lg m-0.5'
                : ''
            }`}
          >
            <Avatar name={name.replace(' (You)', '')} size={24} />
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold truncate ${isYou ? 'text-[#22D3EE]' : 'text-gray-200'}`}>
                {name}
              </p>
              <p className="text-[10px] text-gray-600 truncate">{addr}</p>
            </div>
            <span className={`font-black ${isWinner ? 'text-emerald-400' : 'text-gray-500'}`}>
              {score ?? 0}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function ChampionshipPage() {
  const [secondsLeft, setSecondsLeft] = useState(2 * 3600 + 14 * 60 + 50);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [secondsLeft]);

  const hh = String(Math.floor(secondsLeft / 3600)).padStart(2, '0');
  const mm = String(Math.floor((secondsLeft % 3600) / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');

  return (
    <AppShell title="OLOS Championship">
      <div className="px-4 md:px-8 py-6 max-w-7xl mx-auto space-y-6">
        {/* Header Banner */}
        <div className="rounded-3xl border border-white/10 bg-[#0B1121] p-6 md:p-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="inline-block text-[10px] font-bold tracking-wide px-3 py-1.5 rounded-full border border-amber-500/40 text-amber-400 bg-amber-500/10 mb-3">
              SERIES #47 · ACTIVE TOURNAMENT
            </span>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-white leading-tight">
              OLOS CHAMPIONSHIP SERIES
            </h1>
            <p className="text-sm text-gray-400 mt-2">Game: Quantum Chess · Round 2 of 4</p>
          </div>
          <div className="text-left md:text-right shrink-0">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Guaranteed Prize Pool</p>
            <p className="text-3xl md:text-4xl font-black text-[#22D3EE] mt-1">500.00 GVT</p>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-6">
          {/* Tournament Bracket Tree */}
          <div className="space-y-2">
            <p className="text-lg font-black text-white">Tournament Bracket Tree</p>
            <div className="rounded-3xl border border-white/10 bg-[#0B1121] p-6 overflow-x-auto">
              <div className="grid grid-cols-2 gap-x-8 gap-y-4 min-w-[480px]">
                {/* Quarter Finals Column */}
                <div>
                  <p className="text-[11px] font-bold text-gray-500 tracking-wide mb-3">QUARTER-FINALS</p>
                  <div className="space-y-4">
                    {QUARTER_FINALS.map((m, i) => (
                      <BracketCard key={i} match={m} />
                    ))}
                  </div>
                </div>

                {/* Semi Finals Column */}
                <div>
                  <p className="text-[11px] font-bold text-gray-500 tracking-wide mb-3">SEMI-FINALS</p>
                  <div className="space-y-4 mt-[3.3rem]">
                    {SEMI_FINALS.map((m, i) => (
                      <div key={i} className="mb-[5.5rem] last:mb-0">
                        <BracketCard match={m} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Your Next Match Countdown */}
            <div className="rounded-3xl border border-[#7135DB]/40 bg-gradient-to-b from-[#1a1040] to-[#0B1121] p-6">
              <div className="rounded-xl bg-black/30 border border-white/10 p-5 text-center mb-4">
                <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-2">
                  YOUR NEXT MATCH IN
                </p>
                <p className="text-4xl md:text-5xl font-black text-[#a78bfa]">
                  {hh}:{mm}:{ss}
                </p>
              </div>
              <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-[#7135DB]/10 border border-[#7135DB]/30">
                <Avatar name="GreenKing" size={36} />
                <div>
                  <p className="text-sm font-bold text-white">Opponent: GreenKing</p>
                  <p className="text-xs text-gray-500">ELO: 2,450 · Diamond I</p>
                </div>
              </div>
            </div>

            {/* Prize Distribution */}
            <div className="rounded-3xl border border-white/10 bg-[#0B1121] p-6">
              <p className="font-black text-white mb-4">Prize Distribution</p>
              <div className="space-y-3">
                {PRIZES.map((p) => (
                  <div key={p.place} className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">
                      <span className="mr-2">{p.emoji}</span>
                      {p.place}
                    </span>
                    <span className={`text-sm font-bold ${p.color}`}>{p.amount}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tournament Protocol */}
            <div className="rounded-3xl border border-white/10 bg-[#0B1121] p-6">
              <p className="font-black text-white mb-3">Tournament Protocol</p>
              <ol className="space-y-2.5 text-sm text-gray-400">
                {RULES.map((rule, i) => (
                  <li key={i}>
                    <span className="text-gray-500 mr-1.5">{i + 1}.</span> {rule}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

'use client';
import React, { useEffect, useState } from 'react';
import AppShell from '@/components/app/AppShell';
import Avatar from '@/components/app/Avatar';

// TODO: no tournaments backend exists yet — this entire page is real UI
// wired to mock data. Bracket, chat, and countdown are all static/local
// state; swap in real API calls + a live socket for chat once they exist.

type Match = { p1: string; p1Score: number | null; p2: string; p2Score: number | null; you?: 'p1' | 'p2' };

const QUARTERS: Match[] = [
  { p1: 'Satoshi12', p1Score: 3, p2: 'ChainLord', p2Score: 1 },
  { p1: 'Nafisa (You)', p1Score: 2, p2: 'BlockMaster', p2Score: 0, you: 'p1' },
  { p1: 'YoloLegend', p1Score: 2, p2: 'GreenKing', p2Score: 1 },
  { p1: 'BounceKing', p1Score: 3, p2: 'SamRunner', p2Score: 2 },
];
const SEMIS: Match[] = [
  { p1: 'Satoshi12', p1Score: null, p2: 'Nafisa (You)', p2Score: null, you: 'p2' },
  { p1: 'YoloLegend', p1Score: null, p2: 'BounceKing', p2Score: null },
];

const CHAT = [
  { name: 'GreenKing', color: '#22D3EE', text: "Nafisa's last snake turn was legendary!" },
  { name: 'Satoshi12', color: '#ffffff', text: 'Preparing my strategy for the semi-finals...' },
  { name: 'ModBot', color: '#F59E0B', text: 'Keep it friendly in chat, players!' },
];

const PRIZES = [
  { place: '1st Place', amount: '250 GVT', pct: '50% of Pool', highlight: true },
  { place: '2nd Place', amount: '125 GVT', pct: '25% of Pool', highlight: false },
  { place: '3rd - 4th Place', amount: '62.5 GVT each', pct: '12.5% of Pool', highlight: false },
];

function MatchCard({ match }: { match: Match }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#0B1121] overflow-hidden text-sm">
      {(['p1', 'p2'] as const).map((key) => {
        const name = key === 'p1' ? match.p1 : match.p2;
        const score = key === 'p1' ? match.p1Score : match.p2Score;
        const isYou = match.you === key;
        return (
          <div
            key={key}
            className={`flex items-center gap-2 px-3 py-2 ${isYou ? 'bg-[#22D3EE]/10 border border-[#22D3EE]/50 rounded-lg m-0.5' : ''}`}
          >
            <Avatar name={name} size={22} />
            <span className={`flex-1 truncate font-semibold ${isYou ? 'text-[#22D3EE]' : 'text-gray-200'}`}>{name}</span>
            <span className="font-black text-gray-400">{score ?? '-'}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function TournamentsPage() {
  const [secondsLeft, setSecondsLeft] = useState(4 * 60 + 18);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft]);

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');

  return (
    <AppShell title="Championship Series">
      <div className="px-4 md:px-8 py-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="rounded-3xl border border-white/10 bg-[#0B1121] p-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-[10px] font-bold tracking-wide px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                ROUND 2 IN PROGRESS
              </span>
              <span className="text-xs text-gray-500">Tournament ID: #47</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white mt-2">OLOS Championship Series #47</h1>
            <p className="text-sm text-gray-400 mt-1">Game: Quantum Chess • Round 2 of 4 • Knockout Phase</p>
          </div>
          <div className="text-left md:text-right shrink-0">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Prize Pool</p>
            <p className="text-2xl md:text-3xl font-black text-[#22D3EE]">500 GVT</p>
            <p className="text-xs text-gray-500">~$50.00 USD</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-6">
          {/* Tournament tree */}
          <div className="rounded-3xl border border-white/10 bg-[#0B1121] p-6 overflow-x-auto">
            <p className="font-black text-white mb-5">Tournament Tree</p>
            <div className="grid grid-cols-3 gap-6 min-w-[560px]">
              <div>
                <p className="text-[11px] font-bold text-gray-500 tracking-wide mb-3">QUARTER FINALS</p>
                <div className="space-y-4">
                  {QUARTERS.map((m, i) => <MatchCard key={i} match={m} />)}
                </div>
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-500 tracking-wide mb-3">SEMI FINALS</p>
                <div className="space-y-[4.5rem] mt-6">
                  {SEMIS.map((m, i) => <MatchCard key={i} match={m} />)}
                </div>
              </div>
              <div className="flex flex-col">
                <p className="text-[11px] font-bold text-gray-500 tracking-wide mb-3">FINALS</p>
                <div className="rounded-xl border border-white/10 bg-[#0B1121] text-sm mt-6">
                  <div className="px-3 py-2.5 text-gray-500">TBD SF1 Winner <span className="float-right">-</span></div>
                  <div className="px-3 py-2.5 text-gray-500 border-t border-white/5">TBD SF2 Winner <span className="float-right">-</span></div>
                </div>
                <div className="flex-1 flex flex-col items-center justify-end text-center pt-8">
                  <span className="text-3xl">🏆</span>
                  <p className="text-[11px] font-bold text-amber-400 tracking-wide mt-2">CHAMPIONSHIP WINNER</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-[#7135DB]/40 bg-gradient-to-b from-[#1a1040] to-[#0B1121] p-6">
              <p className="font-black text-white mb-3">Your Next Match</p>
              <div className="flex items-center gap-3">
                <Avatar name="Satoshi12" size={36} />
                <div>
                  <p className="text-sm font-bold text-white">vs Satoshi12</p>
                  <p className="text-xs text-gray-500">EVM rating: 1,840</p>
                </div>
              </div>
              <div className="rounded-xl bg-black/30 border border-white/10 mt-4 p-3 text-center">
                <p className="text-[11px] font-bold text-gray-500 tracking-wide">Match Starts In</p>
                <p className="text-2xl font-black text-amber-400 mt-1">{mm}:{ss}</p>
              </div>
              <button type="button" className="w-full h-11 mt-4 rounded-xl bg-[#22D3EE] hover:opacity-90 text-black text-sm font-bold transition-all">
                Enter Game Arena
              </button>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#0B1121] p-6">
              <p className="font-black text-white mb-3">Tournament Rules</p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>• Mode: Double Elimination</li>
                <li>• Game Timer: 10 mins max per round</li>
                <li>• Disconnection results in automatic forfeit</li>
                <li>• Stakes are escrowed on smart contract</li>
              </ul>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#0B1121] p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="font-black text-white">Spectator Chat</p>
                <span className="flex items-center gap-1.5 text-xs text-green-400 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400" /> 142 Active
                </span>
              </div>
              <div className="space-y-2 text-sm">
                {CHAT.map((c, i) => (
                  <p key={i} className="text-gray-300">
                    <span className="font-bold" style={{ color: c.color }}>{c.name}:</span>{' '}
                    {c.text}
                  </p>
                ))}
              </div>
              <input
                type="text"
                placeholder="Type message to spectators..."
                className="w-full h-10 mt-4 px-3 rounded-lg bg-black/30 border border-white/10 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#22D3EE]/50"
              />
            </div>
          </div>
        </div>

        {/* Prize distribution */}
        <div className="rounded-3xl border border-white/10 bg-[#0B1121] p-6">
          <p className="font-black text-white mb-4">Prize Distribution Breakdown</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {PRIZES.map((p) => (
              <div
                key={p.place}
                className={`rounded-2xl border p-5 text-center ${p.highlight ? 'border-amber-500/50 bg-amber-500/5' : 'border-white/10 bg-black/20'}`}
              >
                <p className="text-sm text-gray-400">{p.place}</p>
                <p className={`text-xl font-black mt-1 ${p.highlight ? 'text-amber-400' : 'text-white'}`}>{p.amount}</p>
                <p className="text-xs text-gray-500 mt-1">{p.pct}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

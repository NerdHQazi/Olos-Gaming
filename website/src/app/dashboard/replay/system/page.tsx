'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Play, Search, Filter } from 'lucide-react';

interface ReplayItem {
  id: string;
  game: string;
  matchup: string;
  winner: string;
  stake: string;
  duration: string;
}

export default function ReplaySystemPage() {
  const [search, setSearch] = useState<string>('');
  const [tab, setTab] = useState<'top' | 'my' | 'bookmarked'>('top');

  const replays: ReplayItem[] = [
    { id: '1', game: 'Snake Battle X', matchup: 'AlphaViper vs KingCobra', winner: 'AlphaViper', stake: '50 GVT', duration: '05:12' },
    { id: '2', game: 'Chess Arena', matchup: 'Grandmaster vs CheckMate88', winner: 'CheckMate88', stake: '100 GVT', duration: '12:45' },
    { id: '3', game: 'Tetris Blitz', matchup: 'Speedy vs BlockBuilder', winner: 'Speedy', stake: '25 GVT', duration: '04:10' },
    { id: '4', game: 'Bounce King', matchup: 'Yoshi7 vs BounceMaster', winner: 'Yoshi7', stake: '50 GVT', duration: '08:18' },
    { id: '5', game: 'Checkers Rush', matchup: 'KingSeeker vs SlideLord', winner: 'KingSeeker', stake: '200 GVT', duration: '08:50' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">Match Replay System</h1>
        <p className="text-slate-400 text-sm mt-1">
          Study previous top match executions and review tactical playstyles.
        </p>
      </div>

      {/* Featured Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-purple-950/40 p-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 to-purple-500/20" />
          <div className="w-16 h-10 border-2 border-pink-500/60 rounded-full flex items-center justify-center text-[10px] font-bold text-pink-400">
            GAME OVER
          </div>
        </div>

        <div className="md:col-span-2 space-y-3">
          <span className="px-2.5 py-1 rounded bg-cyan-500/10 text-cyan-400 text-[10px] font-bold tracking-wider uppercase border border-cyan-500/30">
            FEATURED REPLAY OF THE WEEK
          </span>
          <h2 className="text-xl font-bold text-white">Perfect 100-Score Snake Battle Match</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Watch SnakeGod99 navigate a narrow 5% speed zone with absolute precision against CyberKing.
          </p>
          <div className="flex items-center space-x-6 text-xs text-slate-400 pt-1">
            <span>Stake: <strong className="text-purple-400">150 GVT</strong></span>
            <span>Duration: <strong className="text-slate-200">08:46</strong></span>
          </div>
          <Link
            href="/dashboard/replay/viewport"
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs transition"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Watch Replay</span>
          </Link>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-900/40 p-3 rounded-xl border border-slate-800/80">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by player username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto text-xs">
          <select className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-300 focus:outline-none">
            <option>Game: All Games</option>
            <option>Snake Battle X</option>
            <option>Chess Arena</option>
          </select>
          <select className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-300 focus:outline-none">
            <option>Date: Last 30 Days</option>
            <option>Last 7 Days</option>
          </select>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-2 border-b border-slate-800/80 pb-3">
        {(['top', 'my', 'bookmarked'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold capitalize transition ${
              tab === t
                ? 'bg-purple-600/20 border border-purple-500/40 text-purple-300'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t === 'top' ? 'Top Replays' : t === 'my' ? 'My Replays' : 'Bookmarked'}
          </button>
        ))}
      </div>

      {/* Replays Table */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-900/30 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
            <tr>
              <th className="p-4">Game</th>
              <th className="p-4">Matchup</th>
              <th className="p-4">Winner</th>
              <th className="p-4">Stake</th>
              <th className="p-4">Duration</th>
              <th className="p-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50 text-slate-300">
            {replays.map((row) => (
              <tr key={row.id} className="hover:bg-slate-800/30 transition">
                <td className="p-4 font-semibold text-white">{row.game}</td>
                <td className="p-4 text-slate-400">{row.matchup}</td>
                <td className="p-4 text-cyan-400 font-medium">{row.winner}</td>
                <td className="p-4 text-purple-400 font-semibold">{row.stake}</td>
                <td className="p-4 text-slate-400">{row.duration}</td>
                <td className="p-4 text-right">
                  <Link
                    href="/dashboard/replay/viewport"
                    className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium text-[11px] transition inline-block"
                  >
                    Watch
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

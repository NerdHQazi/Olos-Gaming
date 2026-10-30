'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye, Layers } from 'lucide-react';

interface LibraryCard {
  id: string;
  game: string;
  opponent: string;
  outcome: 'VICTORY' | 'DEFEAT';
  stake: string;
  duration: string;
  views: number;
}

export default function ReplayLibraryPage() {
  const [filter, setFilter] = useState<string>('all');

  const cards: LibraryCard[] = [
    { id: '1', game: 'Snake Battle X', opponent: 'VS AlphaViper', outcome: 'VICTORY', stake: '50 GVT', duration: '05:12', views: 142 },
    { id: '2', game: 'Chess Arena', opponent: 'VS Grandmaster', outcome: 'DEFEAT', stake: '100 GVT', duration: '12:45', views: 389 },
    { id: '3', game: 'Tetris Blitz', opponent: 'VS BlockRunner', outcome: 'VICTORY', stake: '25 GVT', duration: '04:10', views: 56 },
    { id: '4', game: 'Bounce King', opponent: 'VS Yoshi7', outcome: 'VICTORY', stake: '50 GVT', duration: '08:18', views: 94 },
    { id: '5', game: 'Checkers Rush', opponent: 'VS SlideLord', outcome: 'VICTORY', stake: '200 GVT', duration: '08:50', views: 512 },
    { id: '6', game: 'Snake Battle X', opponent: 'VS KingCobra', outcome: 'DEFEAT', stake: '50 GVT', duration: '05:01', views: 73 },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">My Personal Replay Library</h1>
        <p className="text-slate-400 text-sm mt-1">
          Study your saved match runs, review scores, or free up vault space.
        </p>
      </div>

      {/* Vault Storage Status */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-800">
        <div className="flex space-x-2 text-xs">
          {[
            { id: 'all', label: 'All Replays', count: 32 },
            { id: 'snake', label: 'Snake Battle', count: 18 },
            { id: 'chess', label: 'Chess Arena', count: 9 },
            { id: 'tetris', label: 'Tetris Blitz', count: 5 },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                filter === tab.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-white'
              }`}
            >
              {tab.label} <span className="opacity-60 ml-1">({tab.count})</span>
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-4 text-xs">
          <span className="text-slate-400">
            VAULT SPACE: <strong className="text-white">1.2 GB / 5.0 GB used</strong>
          </span>
          <button className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 transition flex items-center space-x-1">
            <Layers className="w-3.5 h-3.5" />
            <span>Bulk Actions</span>
          </button>
        </div>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => (
          <div key={card.id} className="bg-slate-900/30 rounded-2xl border border-slate-800/80 overflow-hidden space-y-4 hover:border-slate-700 transition">
            <div className="relative aspect-video bg-slate-950 border-b border-slate-800 flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 to-purple-500/10" />
              <span className="text-slate-600 font-mono text-xs">{card.game} PREVIEW</span>
            </div>

            <div className="px-5 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-base font-bold text-white">{card.game}</h3>
                  <p className="text-xs text-slate-400">{card.opponent}</p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    card.outcome === 'VICTORY'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                  }`}
                >
                  {card.outcome}
                </span>
              </div>

              <div className="flex justify-between items-center text-xs text-slate-400 border-t border-slate-800/60 pt-3">
                <span>{card.stake} · {card.duration}</span>
                <span className="flex items-center space-x-1">
                  <Eye className="w-3.5 h-3.5" />
                  <span>{card.views} views</span>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pb-5 pt-1">
                <Link
                  href="/dashboard/replay/editor"
                  className="py-2 text-center rounded-lg bg-purple-600/20 border border-purple-500/40 text-purple-300 font-bold text-xs hover:bg-purple-600/30 transition"
                >
                  Analyze
                </Link>
                <Link
                  href="/dashboard/replay/viewport"
                  className="py-2 text-center rounded-lg bg-cyan-400 text-slate-950 font-bold text-xs hover:bg-cyan-300 transition"
                >
                  Watch
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Play, Pause, Share2, Download, Maximize2 } from 'lucide-react';

export default function ReplayViewportPage() {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speed, setSpeed] = useState<string>('1.0x');

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">Match Replay Viewport</h1>
        <p className="text-slate-400 text-sm mt-1">
          Study full-execution, check stats triggers, and download native match clips.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Canvas Viewport */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative aspect-video rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden flex flex-col justify-between p-6">
            <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-30"></div>
            
            <div className="relative z-10 flex justify-between items-center text-xs">
              <div className="flex items-center space-x-2 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
                <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                <span className="text-white font-bold">SnakeGod99</span>
                <span className="text-cyan-400">100 pts</span>
              </div>
              <span className="text-slate-500 font-mono text-[10px]">1080P - 60 FPS</span>
              <div className="flex items-center space-x-2 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
                <span className="text-pink-400">84 pts</span>
                <span className="text-white font-bold">CyberKing</span>
                <span className="w-2 h-2 rounded-full bg-pink-400"></span>
              </div>
            </div>

            {/* Neon Visualizer Graphic */}
            <div className="relative z-10 flex items-center justify-center my-auto">
              <div className="w-full h-32 flex items-center justify-center">
                <div className="w-3/4 h-20 border-2 border-cyan-400 rounded-full shadow-[0_0_20px_rgba(34,211,238,0.3)] animate-pulse flex items-center justify-center text-pink-400 font-mono text-xs tracking-widest">
                  SYSTEM OVERRIDE INITIATED!
                </div>
              </div>
            </div>

            <div className="relative z-10 flex justify-between text-slate-400 font-mono text-[11px]">
              <span>SCORE: BLUE 1200 / 1500</span>
              <span>TIME REMAINING: 01:34</span>
            </div>
          </div>

          {/* Player Timeline Controls */}
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>04:15</span>
              <div className="relative flex-grow mx-4 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="absolute top-0 left-0 bottom-0 w-1/2 bg-gradient-to-r from-cyan-500 to-purple-500"></div>
              </div>
              <span>08:45</span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="px-3 py-1.5 rounded-lg bg-cyan-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5"
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isPlaying ? 'PAUSE' : 'PLAY'}</span>
                </button>

                {['0.5x', '1.0x', '2.0x', '4.0x'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSpeed(s)}
                    className={`px-2.5 py-1 rounded text-xs font-mono transition ${
                      speed === s ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <div className="flex items-center space-x-3 text-xs text-slate-400">
                <span>Volume</span>
                <input type="range" className="w-16 h-1 accent-cyan-400 bg-slate-800" />
                <button className="p-1.5 rounded bg-slate-800 hover:text-white">
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Telemetry Sidebar */}
        <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800 space-y-6">
          <div>
            <h3 className="text-white font-bold text-base">Match Telemetry</h3>
            <p className="text-xs text-slate-500">Verified EVM session metadata</p>
          </div>

          <div className="space-y-3 text-xs divide-y divide-slate-800/60">
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">GAME TYPE</span>
              <span className="text-white font-mono">Snake Battle Arena</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">STAKE POOL</span>
              <span className="text-purple-400 font-mono font-bold">150 GVT ($15.00 USD)</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">WINNER PAYOUT</span>
              <span className="text-cyan-400 font-mono font-bold">285 GVT</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">TX HASH</span>
              <span className="text-slate-300 font-mono">0x7135...82d3</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">REPLAY ID</span>
              <span className="text-slate-300 font-mono">RPL-9921-XNZ</span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Key Timeline Moments</h4>
            <div className="space-y-2 text-xs">
              {[
                { time: '01:22', label: 'Clutch Speed Zone Dodge' },
                { time: '03:45', label: 'CyberKing Trap Attempt' },
                { time: '06:12', label: 'Final 100-Score Trigger' },
              ].map((m, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center space-x-3 hover:border-cyan-500/50 cursor-pointer transition">
                  <span className="text-cyan-400 font-mono font-bold">{m.time}</span>
                  <span className="text-slate-300">{m.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button className="py-2.5 px-3 rounded-lg bg-purple-600/20 border border-purple-500/40 text-purple-300 font-bold text-xs flex items-center justify-center space-x-1.5 hover:bg-purple-600/30 transition">
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Replay</span>
            </button>
            <button className="py-2.5 px-3 rounded-lg bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center space-x-1.5 hover:bg-cyan-300 transition">
              <Download className="w-3.5 h-3.5" />
              <span>Download MP4</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

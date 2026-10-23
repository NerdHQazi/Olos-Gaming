'use client';

import { useState } from 'react';
import { Sparkles, Check, Download, Share2 } from 'lucide-react';

export default function ReplayEditorPage() {
  const [selectedMilestones, setSelectedMilestones] = useState<number[]>([0, 1, 3]);
  const [format, setFormat] = useState<string>('mp4');

  const milestones = [
    { title: 'Double Kill Block', time: '00:45', badge: 'CLUTCH DEFEND', badgeBg: 'bg-purple-500/20 text-purple-400' },
    { title: 'Max Velocity Zone Run', time: '02:15', badge: 'PERFECT EXECUTION', badgeBg: 'bg-cyan-500/20 text-cyan-400' },
    { title: 'Narrow Escape (5% HP)', time: '05:30', badge: 'CLUTCH DEFEND', badgeBg: 'bg-purple-500/20 text-purple-400' },
    { title: 'Final Strike Win', time: '07:12', badge: 'MATCH WINNER', badgeBg: 'bg-emerald-500/20 text-emerald-400' },
  ];

  const toggleMilestone = (idx: number) => {
    setSelectedMilestones((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">AI Replay Highlights Editor</h1>
        <p className="text-slate-400 text-sm mt-1">
          Review automatically detected milestones and curate your final highlight reels.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Milestones Panel */}
        <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-white font-bold text-sm">AI Key Milestones</h2>
            <button
              onClick={() => setSelectedMilestones(milestones.map((_, i) => i))}
              className="text-xs text-purple-400 hover:underline font-semibold"
            >
              SELECT ALL
            </button>
          </div>

          <div className="space-y-3">
            {milestones.map((m, idx) => {
              const isChecked = selectedMilestones.includes(idx);
              return (
                <div
                  key={idx}
                  onClick={() => toggleMilestone(idx)}
                  className={`p-4 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                    isChecked
                      ? 'bg-purple-950/20 border-purple-500/50'
                      : 'bg-slate-950 border-slate-800 opacity-60'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${m.badgeBg}`}>
                        {m.badge}
                      </span>
                      <span className="text-slate-500 text-xs font-mono">{m.time}</span>
                    </div>
                    <h3 className="text-sm font-bold text-white">{m.title}</h3>
                  </div>

                  <div
                    className={`w-5 h-5 rounded flex items-center justify-center transition ${
                      isChecked ? 'bg-cyan-400 text-slate-950' : 'border border-slate-700'
                    }`}
                  >
                    {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Compiled Video Preview & Export */}
        <div className="space-y-6">
          <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800 space-y-4">
            <h2 className="text-white font-bold text-sm">Compiled Video Preview</h2>

            <div className="aspect-video rounded-xl bg-slate-950 border border-slate-800 overflow-hidden relative flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 via-purple-500/10 to-pink-500/10" />
              <div className="relative text-center space-y-2">
                <div className="w-12 h-12 mx-auto rounded-full bg-cyan-400/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400">
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </div>
                <p className="text-xs text-slate-400">Preview Reel Compiling ({selectedMilestones.length} clips)</p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Curated Duration: <strong>01:15</strong></span>
                <span className="text-emerald-400 font-bold">Reel Score: Outstanding 🔥</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden flex">
                <div className="w-1/3 bg-cyan-400"></div>
                <div className="w-1/3 bg-purple-500"></div>
                <div className="w-1/3 bg-pink-500"></div>
              </div>
            </div>
          </div>

          {/* Export Curation */}
          <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800 space-y-4">
            <h2 className="text-white font-bold text-sm">Export Curations</h2>
            <p className="text-xs text-slate-500">Save highlights locally or broadcast them direct to networks</p>

            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'mp4', title: 'MP4 Video', sub: 'FHD 1080p' },
                { id: 'gif', title: 'Animated GIF', sub: 'Web optimized' },
                { id: 'json', title: 'Raw Metadata', sub: 'JSON Frames' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setFormat(opt.id)}
                  className={`p-3 rounded-xl text-left border transition ${
                    format === opt.id
                      ? 'bg-purple-900/30 border-purple-500/60 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="font-bold text-xs">{opt.title}</div>
                  <div className="text-[10px] text-slate-500">{opt.sub}</div>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <button className="py-2.5 px-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center space-x-2 hover:bg-slate-800 transition">
                <Share2 className="w-4 h-4" />
                <span>Send to Twitter/Discord</span>
              </button>
              <button className="py-2.5 px-4 rounded-xl bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center space-x-2 hover:bg-cyan-300 transition">
                <Download className="w-4 h-4" />
                <span>Create Highlight Reel</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

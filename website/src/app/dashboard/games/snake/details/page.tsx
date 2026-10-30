"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coins,
  Gamepad2,
  Gift,
  Medal,
  Signal,
  Star,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import Avatar from "@/components/app/Avatar";

const PREVIEWS = [
  { src: "/images/snake/snake-preview-1.png", alt: "Snake Battle gameplay with leaderboard" },
  { src: "/images/snake/snake-preview-2.png", alt: "Snake Battle arena, angled view" },
];

const STATS = [
  { label: "Difficulty", value: "Easy", icon: Signal, valueClass: "text-green-400" },
  { label: "Game Duration", value: "3-5 min", icon: Clock, valueClass: "text-white" },
  { label: "Entry Stake", value: "From 10 GVT", icon: Coins, valueClass: "text-white" },
  { label: "Prize Pool", value: "Winner takes all", icon: Trophy, valueClass: "text-white" },
  { label: "Players Online", value: "2,450", icon: Users, valueClass: "text-white" },
];

const STEPS = [
  "Eat the glowing coins to grow longer",
  "Avoid hitting walls or other snakes",
  "Do not collide with yourself",
  "The last snake alive wins",
];

const PERKS = [
  { title: "Win GVT", text: "Winner takes all stake tokens", icon: Coins },
  { title: "XP", text: "Earn experience points", icon: Zap },
  { title: "Rank points", text: "Climb the leaderboard", icon: Medal },
];

const WINNERS = [
  { name: "GreenKing", amount: 120 },
  { name: "ChainLord", amount: 95 },
  { name: "BlockMaster", amount: 80 },
  { name: "YoloLegend", amount: 60 },
  { name: "SnakeMater", amount: 50 },
];

export default function SnakeDetailsPage() {
  const [active, setActive] = useState(0);
  const prev = () => setActive((i) => (i - 1 + PREVIEWS.length) % PREVIEWS.length);
  const next = () => setActive((i) => (i + 1) % PREVIEWS.length);

  return (
    <div className="px-4 md:px-8 py-6 max-w-7xl mx-auto space-y-8">
      <Link
        href="/dashboard/games"
        className="inline-flex items-center gap-2 text-sm text-[#7135DB] hover:text-[#a78bfa] transition-colors"
      >
        <ArrowLeft size={16} /> Back to Games
      </Link>

      {/* Hero */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <div>
          <span className="inline-block rounded-lg border border-[#7135DB] bg-[#1A0A3C] px-3 py-1 text-xs font-bold text-white">
            Classic Game
          </span>
          <h1 className="mt-4 text-4xl font-black text-white">
            SNAKE <span className="text-amber-500">BATTLE</span>
          </h1>
          <p className="mt-1 text-sm text-[#A4B7EB]">Classic PvP skill game</p>

          <div className="mt-4 flex items-center gap-4 text-sm font-bold">
            <span className="flex items-center gap-1.5 text-amber-400">
              <Star size={14} fill="currentColor" /> 4.8
            </span>
            <span className="flex items-center gap-1.5 text-[#A4B7EB]">
              <span className="h-2 w-2 rounded-full bg-green-400" /> 2,450 players online
            </span>
          </div>

          <p className="mt-5 max-w-md text-sm leading-relaxed text-[#A4B7EB]">
            Classic Snake rebuilt for Web3. Compete against real players in real-time
            battles. The last snake standing wins all the staked tokens.
          </p>

          <Link
            href="/dashboard/games/snake/stake"
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-[#0B8BE8] px-8 text-sm font-black text-white transition hover:opacity-90"
          >
            <Gamepad2 size={18} /> Play &amp; Stake
          </Link>
        </div>

        <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-[#7135DB]/60 bg-black">
          <Image
            src="/images/snake/snake-logo.png"
            alt="Snake Battle crowned snake"
            fill
            priority
            className="object-contain"
          />
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        {STATS.map(({ label, value, icon: Icon, valueClass }) => (
          <div
            key={label}
            className="flex items-center gap-3 rounded-xl border border-[#2A1060] bg-[#0B1121] p-3"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#1A0A3C] text-[#a78bfa]">
              <Icon size={18} />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] text-[#A4B7EB]">{label}</p>
              <p className={`truncate text-sm font-black ${valueClass}`}>{value}</p>
            </div>
          </div>
        ))}
      </section>

      {/* How to play / perks / winners */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.1fr_1fr]">
        <div>
          <h2 className="mb-4 text-sm font-black text-white">How to play</h2>
          <ol className="space-y-4">
            {STEPS.map((step, i) => (
              <li key={step} className="flex items-center gap-3 text-sm text-[#A4B7EB]">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#7135DB] text-[11px] font-bold text-[#a78bfa]">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        <div className="space-y-2">
          <div className="rounded-xl border border-[#2A1060] bg-[#1A0A3C]/60 p-4">
            <p className="flex items-center gap-2 text-sm font-black text-white">
              <Gift size={16} className="text-amber-400" /> What you win
            </p>
            <p className="mt-1 text-xs text-[#A4B7EB]">
              Dominate the arena and collect rewards after every match.
            </p>
          </div>
          {PERKS.map(({ title, text, icon: Icon }) => (
            <div
              key={title}
              className="flex items-center gap-3 rounded-xl border border-[#2A1060] bg-[#0B1121] p-3"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1A0A3C] text-amber-400">
                <Icon size={16} />
              </span>
              <div>
                <p className="text-sm font-black text-white">{title}</p>
                <p className="text-xs text-[#A4B7EB]">{text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-[#2A1060] bg-[#0B1121] p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="flex items-center gap-2 text-sm font-black text-white">
              <Trophy size={16} className="text-amber-400" /> Recent Winners
            </p>
            <Link href="/dashboard/leaderboard" className="text-xs font-bold text-[#7135DB] hover:text-[#a78bfa]">
              View all
            </Link>
          </div>
          <ul className="space-y-3">
            {WINNERS.map((w, i) => (
              <li key={w.name} className="flex items-center gap-3">
                <span className="w-4 text-sm font-black text-gray-500">{i + 1}</span>
                <Avatar name={w.name} size={28} />
                <span className="flex-1 truncate text-sm font-bold text-gray-200">{w.name}</span>
                <span className="text-sm font-black text-green-400">+{w.amount} GVT</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Preview gallery */}
      <section>
        <h2 className="mb-3 text-lg font-bold text-amber-500">Snake Play Preview</h2>
        <div className="relative aspect-[3/2] w-full max-w-3xl overflow-hidden rounded-2xl border border-[#7135DB]/50 bg-black">
          <Image
            key={PREVIEWS[active].src}
            src={PREVIEWS[active].src}
            alt={PREVIEWS[active].alt}
            fill
            className="object-cover"
          />
        </div>

        <div className="mt-4 flex max-w-3xl items-center gap-3">
          <button
            type="button"
            onClick={prev}
            aria-label="Previous preview"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-black text-white ring-1 ring-white/10 hover:bg-[#1A0A3C]"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="flex flex-1 gap-3 overflow-x-auto">
            {PREVIEWS.map((p, i) => (
              <button
                key={p.src}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Show preview ${i + 1}`}
                className={`relative h-16 w-28 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                  i === active ? "border-[#7135DB]" : "border-transparent opacity-70 hover:opacity-100"
                }`}
              >
                <Image src={p.src} alt="" fill className="object-cover" />
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={next}
            aria-label="Next preview"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-black text-white ring-1 ring-white/10 hover:bg-[#1A0A3C]"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </section>

      <section className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-[#2A1060] bg-[#0B1121] p-6 sm:flex-row sm:items-center">
        <div>
          <p className="text-lg font-black text-white">Ready for battle?</p>
          <p className="text-sm text-[#A4B7EB]">Stake your tokens and compete for glory.</p>
        </div>
        <Link
          href="/dashboard/games/snake/stake"
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#0B8BE8] px-8 text-sm font-black text-white transition hover:opacity-90"
        >
          <Gamepad2 size={18} /> Play &amp; Stake
        </Link>
      </section>
    </div>
  );
}

"use client";
import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useWallet } from "@/context/WalletContext";
import Avatar from "@/components/app/Avatar";

const MOCK_LEADERBOARD = [
  { name: "Nafisa", score: 12480 },
  { name: "GreenKing", score: 8950 },
  { name: "CryptoSam", score: 6700 },
  { name: "Satoshi12", score: 5210 },
  { name: "BlockM", score: 4380 },
];

const MOCK_MATCHES = [
  { game: "Snake Battle", time: "2m ago", result: "won" as const, amount: 120 },
  { game: "Chess Arena", time: "2m ago", result: "lost" as const, amount: 80 },
  { game: "BlockBlitz", time: "2m ago", result: "won" as const, amount: 95 },
];

type GameCategory = "Strategy" | "Puzzle" | "Arcade" | "Board" | "Action";

type Game = {
  slug: string;
  name: string;
  category: GameCategory;
  modes: ("Solo" | "1v1")[];
  players: string;
  rating: number;
  image: string;
  available: boolean;
  description: string;
};

const CATEGORIES = ["All", "Strategy", "Puzzle", "Arcade", "Board", "Action"] as const;

const GAMES: Game[] = [
  {
    slug: "snake",
    name: "Snake",
    category: "Arcade",
    modes: ["Solo", "1v1"],
    players: "1,920",
    rating: 4.8,
    image: "/images/game-snake-featured.png",
    available: true,
    description: "Classic snake on-chain. Eat, grow, survive — last snake standing wins the pool.",
  },
  {
    slug: "chess",
    name: "Chess Arena",
    category: "Strategy",
    modes: ["Solo", "1v1"],
    players: "1,200",
    rating: 4.9,
    image: "/game-quantumchess-banner.png",
    available: true,
    description: "The ultimate strategy game. Outthink your opponent in real-time 1v1 or AI matches.",
  },
  {
    slug: "checkers",
    name: "Checkers",
    category: "Board",
    modes: ["Solo", "1v1"],
    players: "850",
    rating: 4.7,
    image: "/game-blockblitz-banner.png",
    available: true,
    description: "Classic board game. Captures are mandatory. King me.",
  },
  {
    slug: "jumping-jack",
    name: "Jumping Jack",
    category: "Arcade",
    modes: ["Solo", "1v1"],
    players: "—",
    rating: 0,
    image: "/game-satoshirunner-banner.png",
    available: false,
    description: "Jump between platforms. How high can you climb?",
  },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const { balance, isLoading: walletLoading } = useWallet() as { balance?: number; isLoading?: boolean };
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const filteredGames =
    activeCategory === "All" ? GAMES : GAMES.filter((g) => g.category === activeCategory);

  return (
    <div className="px-4 md:px-8 py-6 max-w-7xl mx-auto space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="GVT Balance" value={walletLoading ? "..." : `${(balance ?? 0).toLocaleString()}.00 GVT`} sub="$248.00 USD" icon="🪙" />
        <StatCard label="Total Winnings" value="840.50 GVT" sub="$84.05 USD" icon="🏆" />
        <StatCard label="Games Played" value="32 Matches" sub="This Month" icon="🎮" />
        <StatCard label="Win Rate" value="68%" sub="High Performance" icon="📈" valueClassName="text-green-400" />
      </div>

      {/* Featured game + leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-6">
        <div className="rounded-3xl border border-[#7135DB]/40 bg-[#0B1121] p-6 flex flex-col sm:flex-row gap-6 items-center">
          <div className="flex-1 min-w-0">
            <span className="inline-block text-[10px] font-bold tracking-wide px-2.5 py-1 rounded-full bg-[#7135DB]/20 text-[#a78bfa] mb-3">
              FEATURED GAME
            </span>
            <h2 className="text-2xl font-black">
              <span className="text-white">CHESS </span>
              <span className="text-[#20ceee]">ARENA</span>
            </h2>
            <p className="text-sm text-gray-400 mt-2 leading-relaxed">
              Real-time competitive chess on EVM. Stake GVT tokens, test strategies against online opponents or practice with AI engines.
            </p>
            <div className="flex items-center gap-3 mt-5">
              <Link
                href="/dashboard/games/chess/details"
                className="h-10 px-5 rounded-xl bg-[#20ceee] hover:opacity-90 text-black text-sm font-bold transition-all inline-flex items-center"
              >
                Play Now
              </Link>
            </div>
          </div>
          <div className="w-full sm:w-64 shrink-0 rounded-2xl overflow-hidden border border-[#7135DB]/30 aspect-video relative">
            <Image src="/game-quantumchess-banner.png" alt="Chess Arena" fill className="object-cover" />
          </div>
        </div>

        {/* Live Leaderboard */}
        <div className="rounded-3xl border border-white/10 bg-[#0B1121] p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="font-black text-white">Live Leaderboard</p>
            <span className="text-[11px] text-gray-500 font-semibold">Season 02</span>
          </div>
          <div className="space-y-3.5">
            {MOCK_LEADERBOARD.map((p, i) => (
              <div key={p.name} className="flex items-center gap-3">
                <span className="text-sm font-black text-gray-500 w-4">{i + 1}</span>
                <Avatar name={p.name} size={30} />
                <span className="flex-1 text-sm font-bold text-gray-200 truncate">{p.name}</span>
                <span className="text-sm font-black text-[#22D3EE]">{p.score.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={`shrink-0 h-8 px-4 rounded-full text-xs font-bold transition-colors ${
              activeCategory === cat
                ? "bg-[#7135DB] text-white"
                : "bg-[#0B1121] border border-white/10 text-gray-400 hover:text-white"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Game Grid / Cards */}
      <div className="space-y-6">
        {filteredGames.map((game) => (
          <div key={game.slug} className="rounded-3xl border border-white/10 bg-[#0B1121] overflow-hidden relative">
            <div className="w-full aspect-[21/9] relative">
              <Image src={game.image} alt={game.name} fill className={`object-cover ${game.available ? "" : "opacity-40"}`} />
            </div>
            <div className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-black text-white">{game.name}</p>
                  <p className="text-sm text-[#22D3EE] mt-0.5">{game.category}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{game.available ? `${game.players} players online` : game.description}</p>
                </div>
                {game.available && <span className="flex items-center gap-1 text-sm font-bold text-amber-400 shrink-0">★ {game.rating}</span>}
              </div>

              {game.available ? (
                <Link
                  href={game.slug === "chess" ? "/dashboard/games/chess/details" : `/dashboard/games/${game.slug}`}
                  className="w-full h-11 mt-4 rounded-xl bg-[#22D3EE] hover:opacity-90 text-black text-sm font-bold transition-all flex items-center justify-center"
                >
                  View Details & Play
                </Link>
              ) : (
                <button type="button" disabled className="w-full h-11 mt-4 rounded-xl bg-white/[0.04] border border-white/[0.05] text-gray-600 text-sm font-bold cursor-not-allowed">
                  Coming Soon
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, icon, valueClassName = "text-white" }: { label: string; value: string; sub: string; icon: string; valueClassName?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0B1121] p-4 md:p-5">
      <div className="flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">{label}</p>
      </div>
      <p className={`mt-3 text-xl md:text-2xl font-black ${valueClassName}`}>{value}</p>
      <p className="mt-1 text-xs text-gray-500">{sub}</p>
    </div>
  );
}

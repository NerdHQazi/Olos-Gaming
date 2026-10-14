"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import StakeSelection from "@/components/StakeSelection";
import Matchmaking from "@/components/Matchmaking";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

// PvS is only wired up for the turn-based games with a System move selector.
const PVS_GAME_SLUGS = ["checkers"];

type FilterType = "All" | "Solo" | "1v1";

type Game = {
  slug: string;
  title: string;
  description: string;
  modes: FilterType[];
  image: string;
  available: boolean;
  detailsHref?: string;
  color: string;
};

const GAMES: Game[] = [
  {
    slug: "snake",
    title: "Hyper-Snake Protocol",
    description: "Classic snake game. Eat food, grow longer, avoid walls!",
    modes: ["Solo", "1v1"],
    image: "/snakeGameImage2.png",
    available: true,
    color: "#00D3FE",
  },
  {
    slug: "chess",
    title: "Quantum Chess Arena",
    description: "The ultimate strategy game. Outthink your opponent.",
    modes: ["1v1"],
    image: "/chessGameImage2.png",
    detailsHref: "/dashboard/games/chess/details",
    available: true,
    color: "#7034D7",
  },
  {
    slug: "tetris",
    title: "Neon Tetris Blitz",
    description: "Stack blocks, clear lines, beat your score!",
    detailsHref: "/dashboard/games/tetris/details",
    modes: ["Solo", "1v1"],
    image: "/tetrisGameImage2.png",
    available: true,
    color: "#FFB800",
  },
  {
    slug: "checkers",
    title: "Checkers Rush",
    description:
    "Tactical on-chain board game. Jump opponents, promote kings, and capture the board for GVT rewards!",
    modes: ["Solo", "1v1"],
    image: "/checkersGameImage.png",
    detailsHref: "/dashboard/games/checkers",
    available: true,
    color: "#00D3FE",
  },
  {
    slug: "bounce",
    title: "Bounce King",
    description: "Keep the ball bouncing. Avoid obstacles!",
    modes: ["Solo", "1v1"],
    image: "/bounceGameImage.png",
    available: false,
    color: "#00FF87",
  },
  {
    slug: "scrabble",
    title: "Scrabble Word Chain",
    description: "Form words and score points. How many points can you make?",
    modes: ["Solo", "1v1"],
    image: "/scrabbleGameImage.png",
    available: false,
    color: "#FFB800",
  },
  {
    slug: "mili-militia",
    title: "Mili-Militia 2D",
    description: "Jump between platforms. How high can you climb?",
    modes: ["Solo", "1v1"],
    image: "/miniMilitiaGameImage.png",
    available: false,
    color: "#FF3B30",
  },
  {
    slug: "jumping-jack",
    title: "Jumping Jack",
    description: "Jump between platforms. How high can you climb?",
    modes: ["Solo", "1v1"],
    image: "/jumpingJackGameImage.png",
    available: false,
    color: "#FF3B30",
  },
];

const FILTERS: FilterType[] = ["All", "Solo", "1v1"];

function GameCard({
  game,
  onSelect1v1,
  onSelectSystem,
}: {
  game: Game;
  onSelect1v1: (game: Game) => void;
  onSelectSystem: (game: Game) => void;
}) {
  return (
    <div className="group flex flex-col bg-[#0d1326] rounded-2xl border border-white/[0.07] overflow-hidden hover:border-blue-500/25 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-950/50">
      {/* Image */}
      <div className="relative aspect-4/3 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={game.image}
          alt={game.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {!game.available && (
          <div className="absolute inset-0 bg-[#0d1326]/70 flex items-center justify-center">
            <span className="px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-white text-[11px] font-black uppercase tracking-widest bai-jamjuree-bold backdrop-blur-sm">
              Coming Soon
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col gap-2.5 p-4 flex-1">
        {/* Title + mode badges */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h2 className="text-[14px] bai-jamjuree-bold max-w-33 truncate text-white">{game.title}</h2>
          <div className="flex items-center gap-0.5">
            {game.modes.map((m) => (
              <span
                key={m}
                className="px-2.5 py-0.5 rounded-full border border-olos-neon/25 bg-olos-neon/6 text-olos-neon text-[7px] font-black uppercase tracking-wide"
              >
                {m}
              </span>
            ))}
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-500 text-[10px] bai-jamjuree-medium leading-relaxed flex-1">
          {game.description}
        </p>
      { 
        game.available && (
        <div className="flex items-center justify-between">
          <h4 className="inter-normal text-[10px] text-[#A4B7EB]">MIN STAKE: 10 GVT</h4>
          <h4 style={{color: game.color}} className="inter-bold text-[10px]">EVM ON-CHAIN</h4>
        </div> )
      }

        {/* Buttons */}
        <div className="flex items-center gap-2">
          {game.available ? (
            <>
              <Link
                href={game.detailsHref ?  `/dashboard/games/${game.slug}/details` : `/dashboard/games/${game.slug}`}
                style={{ backgroundColor: game.color }}
                className="flex-1 py-2 rounded-lg hover:brightness-130 text-[#02040A] text-[12px] font-black text-center transition-all active:scale-95 shadow-md shadow-blue-900/30 uppercase bai-jamjuree-bold"
              >
                Play Now
              </Link>
              {/* {game.detailsHref ? (
                <Link
                  href={game.detailsHref}
                  className="flex-1 py-2.5 rounded-xl bg-[#161e36] hover:bg-[#1d2848] border border-blue-500/20 hover:border-blue-500/40 text-white text-[12px] font-black text-center transition-all active:scale-95"
                >
                  Details & Match
                </Link>
              ) : (
                <>
                  <button
                    onClick={() => onSelect1v1(game)}
                    className="flex-1 py-2.5 rounded-xl bg-[#161e36] hover:bg-[#1d2848] border border-blue-500/20 hover:border-blue-500/40 text-white text-[12px] font-black text-center transition-all active:scale-95"
                  >
                    1v1 Match
                  </button>
                  {PVS_GAME_SLUGS.includes(game.slug) && (
                    <button
                      onClick={() => onSelectSystem(game)}
                      className="flex-1 py-2.5 rounded-xl bg-[#161e36] hover:bg-[#1d2848] border border-purple-500/20 hover:border-purple-500/40 text-white text-[12px] font-black text-center transition-all active:scale-95"
                    >
                      vs System
                    </button>
                  )}
                </>
              )} */}
            </>
          ) : (
            <>
              <button
                disabled
                className="flex-1 py-2 rounded-xl bg-white/[0.04] text-gray-600 text-[12px] font-black text-center border border-white/[0.05] cursor-not-allowed bai-jamjuree-bold uppercase"
              >
                Not Available
              </button>
              {/* <button
                disabled
                className="flex-1 py-2.5 rounded-xl bg-white/[0.04] text-gray-600 text-[12px] font-black text-center border border-white/[0.05] cursor-not-allowed"
              >
                1v1 Match
              </button> */}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function GamesScreen() {
  const { isLoggedIn, user } = useAuth();
  const router = useRouter();
  const [filter, setFilter] = useState<FilterType>("All");
  const [selectedGameForStake, setSelectedGameForStake] = useState<Game | null>(
    null,
  );
  const [matchmakingActive, setMatchmakingActive] = useState(false);
  const [activeStake, setActiveStake] = useState(0);
  const [systemGameForStake, setSystemGameForStake] = useState<Game | null>(
    null,
  );
  const [startingSystemMatch, setStartingSystemMatch] = useState(false);
  const [systemMatchError, setSystemMatchError] = useState<string | null>(null);

  const handleSelect1v1 = (game: Game) => {
    if (game.detailsHref) {
      router.push(game.detailsHref);
      return;
    }
    if (!isLoggedIn) {
      router.push("/auth");
      return;
    }
    setSelectedGameForStake(game);
  };

  const visible = GAMES.filter(
    (g) => filter === "All" || g.modes.includes(filter),
  );

  const handleStartMatch = (stake: number) => {
    setActiveStake(stake);
    setMatchmakingActive(true);
  };

  const handleMatchmakingComplete = (mId: string) => {
    alert(`Game starting now for ${selectedGameForStake?.title}!`);
    location.href = `/dashboard/games/${selectedGameForStake?.slug}?mode=1v1&stake=${activeStake}&matchId=${mId}`;
  };

  const handleSelectSystem = (game: Game) => {
    if (game.detailsHref) {
      router.push(game.detailsHref);
      return;
    }
    if (!isLoggedIn) {
      router.push("/auth");
      return;
    }
    setSystemMatchError(null);
    setSystemGameForStake(game);
  };

  const handleStartSystemMatch = async (stake: number) => {
    if (!systemGameForStake || !user) return;
    setStartingSystemMatch(true);
    setSystemMatchError(null);
    try {
      const { data, error } = await supabase.rpc("start_system_match", {
        p_user_id: user.id,
        p_game_type: systemGameForStake.slug,
        p_stake_amount: stake,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      location.href = `/dashboard/games/${systemGameForStake.slug}?mode=1v1&stake=${stake}&matchId=${data.match_id}`;
    } catch (err) {
      setSystemMatchError(
        err instanceof Error ? err.message : "Could not start match vs System",
      );
      setStartingSystemMatch(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0B1121] text-white">
      <div className="max-w-[1567px] mx-auto px-8 lg:px-16 pb-28">
        {matchmakingActive && selectedGameForStake ? (
          <div className="flex flex-col items-center">
            <Matchmaking
              game={selectedGameForStake}
              stake={activeStake}
              winnerReceives={activeStake * 2 * 0.9}
              onCancel={() => setMatchmakingActive(false)}
              onComplete={handleMatchmakingComplete}
            />
          </div>
        ) : systemGameForStake ? (
          <div className="flex flex-col items-center animate-fade-in">
            <div className="w-full max-w-[560px] mb-8">
              <button
                onClick={() => setSystemGameForStake(null)}
                className="text-gray-500 hover:text-white transition-colors text-sm font-bold flex items-center gap-2"
              >
                <span>←</span> Back to Games
              </button>
            </div>
            {systemMatchError && (
              <p className="w-full max-w-[560px] mb-4 text-red-400 text-sm font-bold">
                {systemMatchError}
              </p>
            )}
            <StakeSelection
              game={systemGameForStake}
              onBack={() => setSystemGameForStake(null)}
              onStart={handleStartSystemMatch}
            />
            {startingSystemMatch && (
              <p className="mt-4 text-gray-400 text-sm font-bold">
                Starting match vs System…
              </p>
            )}
          </div>
        ) : selectedGameForStake ? (
          <div className="flex flex-col items-center animate-fade-in">
            <div className="w-full max-w-[560px] mb-8">
              <button
                onClick={() => setSelectedGameForStake(null)}
                className="text-gray-500 hover:text-white transition-colors text-sm font-bold flex items-center gap-2"
              >
                <span>←</span> Back to Games
              </button>
            </div>
            <StakeSelection
              game={selectedGameForStake}
              onBack={() => setSelectedGameForStake(null)}
              onStart={handleStartMatch}
            />
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end gap-6 mb-8 pt-6">
              <div>
                <p className="text-[#00d2ff] text-[11px] font-black uppercase tracking-[0.4em] mb-2">
                  Olos Gaming
                </p>
                <h1 className="text-5xl font-black tracking-tight text-white leading-none">
                  Games
                </h1>
                <p className="text-gray-500 text-sm font-medium mt-2">
                  Choose a game to play or compete
                </p>
              </div>

              {/* Filter toggle */}
              <div className="sm:ml-auto flex items-center gap-1 bg-white/[0.04] border border-white/[0.07] rounded-xl p-1">
                {FILTERS.map((f) => {
                  const active = filter === f;
                  return (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-5 py-2 rounded-lg text-[13px] font-black uppercase tracking-wide transition-all duration-200 ${
                        active
                          ? "bg-olos-blue text-white shadow-lg shadow-blue-900/40"
                          : "text-gray-400 hover:text-white hover:bg-white/[0.06]"
                      }`}
                    >
                      {f}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Game Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 animate-fade-in-up">
              {visible.map((game) => (
                <GameCard
                  key={game.slug}
                  game={game}
                  onSelect1v1={handleSelect1v1}
                  onSelectSystem={handleSelectSystem}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

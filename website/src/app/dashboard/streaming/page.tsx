"use client";

import { useState } from "react";
import Link from "next/link";

type GameFilter =
  | "All Streams"
  | "Hyper-Snake"
  | "Quantum Chess"
  | "Neon Tetris"
  | "Mili-Militia"
  | "Bounce King";

type Stream = {
  id: string;
  streamer: string;
  avatar: string;
  title: string;
  game: Exclude<GameFilter, "All Streams">;
  gameName: string;
  thumbnail: string;
  viewers: number;
  live: boolean;
};

type Trending = {
  name: string;
  game: string;
  winRate: string;
  avatar: string;
};

const FILTERS: GameFilter[] = [
  "All Streams",
  "Hyper-Snake",
  "Quantum Chess",
  "Neon Tetris",
  "Mili-Militia",
  "Bounce King",
];

// TODO: replace placeholder data and image paths with real data.
const FEATURED = {
  streamer: "CryptoKing.eth",
  headline: "Live from Finals",
  description:
    "Watching the absolute #1 ranked Hyper-Snake master defend his title in a high-octane 500 GVT grand finale arena.",
  viewers: 1843,
  image: "/streams/Banner-Background.png",
  href: "/dashboard/streams/cryptoking-eth",
};

const STREAMS: Stream[] = [
  {
    id: "sithlord",
    streamer: "SithLord_GVT",
    avatar: "/streams/avatars/sithlord.png",
    title: "PRO PvP Arena S2 - 100 GVT Stake Match",
    game: "Hyper-Snake",
    gameName: "Hyper-Snake Protocol",
    thumbnail: "/streams/hyper-snake.png",
    viewers: 1400,
    live: true,
  },
  {
    id: "chessmaster99",
    streamer: "ChessMaster99",
    avatar: "/streams/avatars/chessmaster99.png",
    title: "Grandmaster Speed Chess - Back to Back",
    game: "Quantum Chess",
    gameName: "Quantum Chess Arena",
    thumbnail: "/streams/quantum-chess.png",
    viewers: 952,
    live: true,
  },
  {
    id: "tetrisqueen",
    streamer: "TetrisQueen",
    avatar: "/streams/avatars/tetrisqueen.png",
    title: "Double Multiplier Speedrun! Climbing stakes",
    game: "Neon Tetris",
    gameName: "Neon Tetris Blitz",
    thumbnail: "/streams/neon-tetris.png",
    viewers: 2100,
    live: true,
  },
  {
    id: "militiaking",
    streamer: "MilitiaKing",
    avatar: "/streams/avatars/militiaking.png",
    title: "No Scope Only! 1v1 Stake Arena matches",
    game: "Mili-Militia",
    gameName: "Mili-Militia 2D",
    thumbnail: "/streams/mili-militia.png",
    viewers: 410,
    live: true,
  },
  {
    id: "bouncegod",
    streamer: "BounceGod",
    avatar: "/streams/avatars/bouncegod.png",
    title: "High-Score marathon streak! 50 GVT Stake",
    game: "Bounce King",
    gameName: "Bounce King",
    thumbnail: "/streams/bounce-king.png",
    viewers: 812,
    live: true,
  },
  {
    id: "rookiepro",
    streamer: "RookiePro",
    avatar: "/streams/avatars/rookiepro.png",
    title: "Staking my first GVT! Live gameplay tutorial",
    game: "Hyper-Snake",
    gameName: "Hyper-Snake Protocol",
    thumbnail: "/streams/hyper-snake-2.png",
    viewers: 320,
    live: true,
  },
];

const TRENDING: Trending[] = [
  { name: "WarpRunner", game: "Neon Tetris", winRate: "72.4%", avatar: "/streams/avatars/warprunner.png" },
  { name: "Grandmaster_Z", game: "Quantum Chess", winRate: "81.2%", avatar: "/streams/avatars/grandmaster-z.png" },
  { name: "ToxicSnake", game: "Hyper-Snake", winRate: "68.9%", avatar: "/streams/avatars/toxicsnake.png" },
];

const formatViewers = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k` : String(n);

function Avatar({ src, name, size }: { src: string; name: string; size: number }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span
        style={{ width: size, height: size }}
        className="flex shrink-0 items-center justify-center rounded-full bg-[#1b2442] text-[10px] font-black uppercase text-olos-neon"
        aria-hidden="true"
      >
        {name.slice(0, 2)}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      onError={() => setFailed(true)}
      className="shrink-0 rounded-full border border-white/9 object-cover"
      style={{ width: size, height: size }}
    />
  );
}

function StreamCard({ stream }: { stream: Stream }) {
  return (
    <Link
      href={`/dashboard/streams/${stream.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-white/[0.07] bg-[#0b1020] transition duration-300 hover:-translate-y-0.5 hover:border-olos-neon/30 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-olos-neon"
    >
      <div className="relative aspect-16/10 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={stream.thumbnail}
          alt={`${stream.streamer} streaming ${stream.gameName}`}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {stream.live && (
          <span className="absolute left-2 top-2 rounded-full bg-[#e11d2e] px-1.5 py-0.5 text-[9px] inter-bold uppercase tracking-wide text-white">
            Live
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <Avatar src={stream.avatar} name={stream.streamer} size={22} />
            <span className="truncate text-[12px] bai-jamjuree-bold text-white">
              {stream.streamer}
            </span>
          </div>
          <span className="shrink-0 text-[10px] inter-light text-[#00FF87]">
            {formatViewers(stream.viewers)} Viewers
          </span>
        </div>

        <h3 className="truncate text-[12.5px] inter-bold text-white" title={stream.title}>
          {stream.title}
        </h3>

        <div className="mt-auto flex items-center justify-between pt-3 pr-3 text-[11px] text-[#A4B7EB]">
          <span className="truncate inter-light">{stream.gameName}</span>
          {/* <span className="text-[#ffb400]" aria-hidden="true">★</span> */}
          <img src="/starIcon.png" alt="star icon" width={16} height={16} />
        </div>
      </div>
    </Link>
  );
}

export default function StreamsPage() {
  const [filter, setFilter] = useState<GameFilter>("All Streams");

  const visible = STREAMS.filter(
    (s) => filter === "All Streams" || s.game === filter,
  );

  return (
    <main className="min-h-screen text-white">
      <div className="mx-auto -ml-10 -mr-10 grid max-w-410 gap-6 py-8 lg:grid-cols-[1fr_300px] lg:px-12">
        {/* Left column */}
        <div className="min-w-0">
          {/* Featured broadcast */}
          <section className="relative overflow-hidden rounded-2xl border border-white/8 bg-[#050810]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={FEATURED.image}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover opacity-45"
            />
            <div className="absolute inset-0 bg-linear-to-r" />
            <div className="relative px-6 pb-7 pt-7 sm:px-8">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#7034D7] bg-[#7034D71F] px-3 py-1.5 text-[10px] bai-jamjuree-bold uppercase tracking-wide">
                <i className="h-1.5 w-1.5 rounded-full bg-[#22e08a] shadow-[0_0_8px_#22e08a]" />
                Featured Broadcast
              </span>

              <h1 className="mt-5 text-3xl bai-jamjuree-bold tracking-tight sm:text-[42px]">
                {FEATURED.streamer}{" "}
                <span className="text-olos-neon">{FEATURED.headline}</span>
              </h1>
              <p className="mt-4 max-w-100 text-[13px] inter-light leading-relaxed text-[#A4B7EB]">
                {FEATURED.description}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link
                  href={FEATURED.href}
                  className="flex h-19 w-fit px-6 items-center justify-center gap-1 rounded-lg bg-[#00D3FE] text-[14px] bai-jamjuree-bold uppercase tracking-wide text-[#04121a] transition hover:shadow-[0_0_22px_rgba(0,210,255,.45)] active:scale-[.98] focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  {/* <span aria-hidden="true" className="text-3xl leading-none">🎮</span> */}
                  <img src="/padIcon.png" alt="Pad Icon" width={40} height={40} />
                  Watch Now
                </Link>
                <span className="flex h-11.5 items-center rounded-lg border border-[#00D3FE] bg-olos-neon/4 px-5 text-[13px] bai-jamjuree-bold uppercase tracking-wide text-[#00D3FE]">
                  {FEATURED.viewers.toLocaleString()} Viewers
                </span>
              </div>
            </div>
          </section>

          {/* Filters */}
          <div
            role="tablist"
            aria-label="Filter streams by game"
            className="mt-6 flex flex-wrap gap-2"
          >
            {FILTERS.map((f) => {
              const active = filter === f;
              return (
                <button
                  key={f}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setFilter(f)}
                  className={`rounded-md border px-4 py-2 text-[11px] bai-jamjuree-bold transition focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-[#7034d7] ${
                    active
                      ? "border-[#7034d7] bg-[#7034d7] text-white"
                      : "border-white/10 bg-[#0B0F19] text-white hover:border-white/25"
                  }`}
                >
                  {f}
                </button>
              );
            })}
          </div>

          {/* Stream grid */}
          {visible.length === 0 ? (
            <p className="mt-10 text-sm font-medium text-gray-500">
              No one is streaming {filter} right now. Check back soon or start your own broadcast.
            </p>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {visible.map((s) => (
                <StreamCard key={s.id} stream={s} />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="flex flex-col gap-5">
          <section className="rounded-2xl border border-white/[0.07] bg-[#0b1020] p-5">
            <h2 className="mb-4 text-[16px] bai-jamjuree-bold uppercase tracking-wide">
              Trending Streamers
            </h2>
            <ul className="divide-y divide-white/6">
              {TRENDING.map((t) => (
                <li key={t.name} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <Avatar src={t.avatar} name={t.name} size={32} />
                    <div className="min-w-0">
                      <p className="truncate text-[12px] inter-bold text-white">{t.name}</p>
                      <p className="truncate text-[10px] inter-light text-[#A4B7EB]">{t.game}</p>
                    </div>
                  </div>
                  <span className="shrink-0 text-[11px] inter-bold text-[#22e08a]">
                    {t.winRate} WR
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl bg-[#7034d7] p-5">
            <h2 className="text-[16px] bai-jamjuree-bold uppercase tracking-wide">
              Become a Streamer
            </h2>
            <p className="mt-3 text-[12px] inter-light leading-relaxed text-[#C0C1FF]">
              Broadcast your skill battles, build a fan community, and earn
              direct GVT tips from viewers instantly on-chain.
            </p>
            <Link
              href="/dashboard/streams/start"
              className="mt-5 block rounded-lg bg-white py-3 text-center text-[12px] bai-jamjuree-bold uppercase tracking-wide text-[#02040A] transition hover:bg-white/90 active:scale-[.98] focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Start Broadcasting
            </Link>
          </section>
        </aside>
      </div>
    </main>
  );
}
"use client";

import { useState } from "react";
import Link from "next/link";
import BackButton from "../../marketplace/[id]/back-button";

type GameFilter =
  | "All Streams"
  | "Snake Xenzia"
  | "Chess Arena"
  | "Tetris Blitz"
  | "Bounce King"
  | "Checkers Rush";

type Stream = {
  id: string;
  title: string;
  streamer: string;
  avatar: string;
  game: string; // display name; matches a filter, or "All Games"
  thumbnail: string;
  watching: string;
};

const FILTERS: GameFilter[] = [
  "All Streams",
  "Snake Xenzia",
  "Chess Arena",
  "Tetris Blitz",
  "Bounce King",
  "Checkers Rush",
];

// TODO: replace placeholder data and image paths with real data.
const FEATURED = {
  title: "Snake Battle Pro Cup: SnakeGod99 vs CyberViper",
  description:
    "Watch the current world rank #3 defend his title on-chain with a massive 500 GVT stake pool at play.",
  viewers: "12.4K",
  game: "Snake Battle X",
  image: "/snake2.png",
  href: "/dashboard/streams/snake-battle-pro-cup",
};

const STREAMS: Stream[] = [
  { id: "snakegod99", title: "High Stake Snake Run! 500 GVT", streamer: "SnakeGod99", avatar: "/AvatarGirl.png", game: "Snake Xenzia", thumbnail: "/nft-4891.png", watching: "3.4K" },
  { id: "chessking", title: "Grandmaster Chess Blitz Match", streamer: "ChessKing", avatar: "/AvatarGirl.png", game: "Chess Arena", thumbnail: "/nft-1023.png", watching: "1.2K" },
  { id: "speedster", title: "Ranked Speedruns & Tips", streamer: "Speedster", avatar: "/AvatarGirl.png", game: "Tetris Blitz", thumbnail: "/nft-0552.png", watching: "820" },
  { id: "bouncer", title: "Bounce King PvP Marathon", streamer: "Bouncer", avatar: "/AvatarGirl.png", game: "Bounce King", thumbnail: "/nft-7742.png", watching: "520" },
  { id: "olosofficial", title: "Web3 Tournament Qualifier Day 1", streamer: "OlosOfficial", avatar: "/AvatarGirl.png", game: "All Games", thumbnail: "/nft-1190.png", watching: "5.1K" },
  { id: "tactician", title: "Checkers PvP Road to Elite III", streamer: "Tactician", avatar: "/AvatarGirl.png", game: "Checkers Rush", thumbnail: "/nft-2490.png", watching: "340" },
];

function Avatar({ src, name }: { src: string; name: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span
        aria-hidden="true"
        className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1b2442] text-[9px] font-black uppercase text-olos-neon"
      >
        {name.slice(0, 1)}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={20}
      height={20}
      onError={() => setFailed(true)}
      className="h-5 w-5 rounded-full object-cover"
    />
  );
}

function StreamCard({ stream }: { stream: Stream }) {
  return (
    <Link
      href={`/dashboard/streams/${stream.id}`}
      className="group flex flex-col rounded-xl border border-[#241b52] bg-[#0b0f1f] p-3 transition duration-300 hover:-translate-y-0.5 hover:border-olos-neon/40 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-olos-neon"
    >
      <div className="relative aspect-[16/7.5] overflow-hidden rounded-lg">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={stream.thumbnail}
          alt={`${stream.streamer} streaming ${stream.game}`}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span className="absolute left-2.5 top-2.5 rounded bg-[#e83a3a] px-2 py-0.5 text-[8px] inter-black uppercase tracking-wide text-white">
          Live
        </span>
      </div>

      <div className="px-1 pb-1 pt-4">
        <h3 className="truncate text-[14px] inter-bold text-white" title={stream.title}>
          {stream.title}
        </h3>
        <p className="mt-2.5 flex items-center gap-1.5 text-[11px] inter-light text-[#A4B7EB]">
          <Avatar src={stream.avatar} name={stream.streamer} />
          {stream.streamer}
        </p>
        <div className="mt-3 flex items-center justify-between gap-3 text-[10px]">
          <span className="truncate text-[#908FA0] inter-light">{stream.game}</span>
          <span className="shrink-0 space-mono-regular text-[#20CEEE]">{stream.watching} watching</span>
        </div>
      </div>
    </Link>
  );
}

export default function StreamingHubPage() {
  const [filter, setFilter] = useState<GameFilter>("All Streams");

  const visible = STREAMS.filter(
    (s) => filter === "All Streams" || s.game === filter,
  );

  return (
    <main className="min-h-screen text-white">
        <div className="flex ml-4 pt-5">
            <BackButton />
        </div>
      <div className="mx-auto max-w-400 -ml-4 -mr-4 px-6 py-8">
        {/* Header */}
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl inter-extrabold tracking-tight sm:text-[28px]">
              OLOS Live Streaming Hub
            </h1>
            <p className="mt-1 text-[12px] text-[#A4B7EB] inter-light">
              Watch elite players stake and complete challenges live on-chain
            </p>
          </div>
          <Link
            href="/dashboard/streaming/live"
            className="rounded-md bg-[#22d3ee] px-5 py-2.5 text-[12px] inter-bold text-[#050810] transition hover:shadow-[0_0_18px_rgba(34,211,238,.45)] active:scale-[.98] focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <span aria-hidden="true">🎥 </span>Go Live Now
          </Link>
        </header>

        {/* Featured stream */}
        <section
          aria-label="Featured live stream"
          className="mt-6 grid items-center gap-8 rounded-2xl border border-[#1fb6d0]/70 bg-linear-to-r from-[#0d0a22] to-[#0b0f24] py-6 px-1.5 md:grid-cols-[1fr_240px]"
        >
          <div className="py-6 pl-2 sm:pl-6">
            <span className="inline-block rounded border border-[#EF4444] bg-[#EF444422] px-2.5 py-1 text-[9px] inter-black uppercase tracking-wide text-white">
              Featured Live Stream
            </span>
            <h2 className="mt-5 text-2xl inter-extrabold leading-tight sm:text-[28px]">
              {FEATURED.title}
            </h2>
            <p className="mt-4 text-[12px] leading-relaxed text-[#A4B7EB] inter-light">
              {FEATURED.description}
            </p>
            <p className="mt-5 flex flex-wrap gap-x-4 gap-y-1 space-mono-regular text-[11px] text-[#8d9ab3]">
              <span className="text-[#20CEEE]">{FEATURED.viewers} viewers</span>
              <span>Playing: {FEATURED.game}</span>
            </p>
            <Link
              href={FEATURED.href}
              className="mt-5 inline-block rounded-md bg-[#22d3ee] px-6 py-3 text-[12px] inter-bold text-[#050810] transition hover:shadow-[0_0_18px_rgba(34,211,238,.45)] active:scale-[.98] focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Watch Live
            </Link>
          </div>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={FEATURED.image}
            alt="Neon snake coiled around a glowing arena"
            className="hidden aspect-16/10 w-64 h-72 pr-3 rounded-md object-cover md:block"
          />
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
                className={`rounded-full border px-5 py-2 text-[12px] inter-bold transition focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-[#a478ff] ${
                  active
                    ? "border-[#7034d7] bg-[#7034d7] text-white"
                    : "border-[#2A1060] bg-[#1000A911] text-[#A4B7EB] hover:border-[#4a3a9a]"
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
            No one is streaming {filter} right now. Check back soon or go live yourself.
          </p>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((s) => (
              <StreamCard key={s.id} stream={s} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
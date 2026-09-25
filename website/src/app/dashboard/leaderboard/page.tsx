'use client'

import Image from 'next/image'
import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { mockGuilds, rankGuildsByWins, type Guild } from '../guild-hub/guildHub.mock'

const TIMEFRAMES = ["Weekly", "Monthly", "All-Time"] as const;
type Timeframe = (typeof TIMEFRAMES)[number];

const GAME_FILTERS = ["All Games", "Snake Xenzia", "Chess", "Tetris", "PvP"] as const;

export default function LeaderboardPage() {
  const [timeframe, setTimeframe] = useState<Timeframe>("Monthly");
  const [gameFilter, setGameFilter] = useState<string>("Snake Xenzia");

  const ranked = useMemo(() => rankGuildsByWins(mockGuilds), []);

  return (
    <div className="mt-4 pb-20 flex flex-col gap-6 max-sm:px-1">
      <div>
        <h1 className="inter-extrabold text-[30px] text-white max-sm:text-[24px]">Global Guild Leaderboard</h1>
        <p className="text-[12px] inter-light text-[#A4B7EB] mt-1">
          The absolute arena rankings of OLOS on-chain guilds. Stake, battle, and scale the bracket.
        </p>
      </div>

      <div className="flex items-center justify-between max-sm:flex-col max-sm:items-stretch max-sm:gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {TIMEFRAMES.map((tf) => {
            const isActive = tf === timeframe;
            return (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`rounded-md border px-4 py-2 text-[12px] inter-bold transition-colors
                  ${
                    isActive
                      ? "bg-[#7135DB] border-[#2A1060] text-white"
                      : "border-[#2A1060] bg-[#00000000] text-white hover:border-slate-500"
                  }`}
              >
                {tf}
              </button>
            );
          })}
        </div>

        <div className="relative max-sm:w-full">
          <select
            value={gameFilter}
            onChange={(e) => setGameFilter(e.target.value)}
            className="appearance-none rounded-md border border-[#2A1060] bg-[#060A14CC] pl-3 pr-8 py-2 text-[11px] text-[#A4B7EB] outline-none cursor-pointer inter-light max-sm:w-full"
          >
            {GAME_FILTERS.map((g) => (
              <option key={g} value={g} className="bg-slate-900 text-white">
                Filter: {g}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#A4B7EB]"
          />
        </div>
      </div>

      <div className="rounded-xl border border-[#2A1060] overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[640px]">
            <div className="grid grid-cols-[70px_1fr_110px_130px_90px_110px] gap-4 px-5 py-3 text-[10px] tracking-wide text-[#908FA0] inter-bold border-b border-[#2A1060]">
              <span>RANK</span>
              <span>GUILD</span>
              <span>TOTAL WINS</span>
              <span>TOTAL EARNED</span>
              <span>MEMBERS</span>
              <span>AVG WIN RATE</span>
            </div>

            {ranked.slice(1,7).map((guild, index) => (
              <LeaderboardRow key={guild.id} guild={guild} position={index + 1} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function LeaderboardRow({ guild, position }: { guild: Guild; position: number }) {
  return (
    <div
      className={`grid grid-cols-[70px_1fr_110px_130px_90px_110px] gap-4 items-center px-5 py-3.5 border-b border-[#2A1060] last:border-b-0
        ${guild.isUserGuild ? "border border-[#20CEEE] bg-[#20CEEE]/5 rounded-lg" : ""}`}
    >
      <RankBadge position={position} />

      <div className="flex items-center gap-3">
        <div className="relative w-9 h-9 rounded-md overflow-hidden bg-slate-800 shrink-0">
          <Image src={guild.iconUrl} alt={guild.name} fill className="object-cover" />
        </div>
        <div className="flex flex-col">
          <span className="text-white text-[14px] inter-extrabold">
            {guild.name}{" "}
            <span className="text-[#908FA0] space-mono-regular text-[9px] ml-2 tracking-wider font-normal">
              [{guild.shortName ?? guild.name.slice(0, 3).toUpperCase()}]
            </span>
          </span>
          {guild.isUserGuild && (
            <span className="text-[9px] text-[#20CEEE] inter-bold">Your Guild</span>
          )}
        </div>
      </div>

      <span className="text-white text-[12px] tracking-wide space-mono-regular">
        {(guild.totalWins ?? 0).toLocaleString()}
      </span>
      <span className="text-[#20CEEE] text-[12px] tracking-wide space-mono-bold">
        {(guild.totalEarned ?? 0).toLocaleString()} GVT
      </span>
      <span className="text-[#A4B7EB] text-[12px] inter-light">
        {guild.members}/{guild.maxMembers}
      </span>
      <span className="text-[#10B981] text-[12px] space-mono-bold">{guild.winRate}%</span>
    </div>
  );
}

function RankBadge({ position }: { position: number }) {
  if (position === 1) {
    return (
      <span className="inline-flex w-9 h-6 items-center justify-center rounded-full bg-amber-400/20 border border-amber-400 text-amber-300 text-[10px] inter-extrabold">
        #1
      </span>
    );
  }
  if (position === 2) {
    return (
      <span className="inline-flex w-9 h-6 items-center justify-center rounded-full bg-[#9CA3AF22] border border-[#9CA3AF] text-[#9CA3AF] text-[10px] inter-extrabold">
        #2
      </span>
    );
  }
  if (position === 3) {
    return (
      <span className="inline-flex w-9 h-6 items-center justify-center rounded-full bg-orange-500/20 border border-orange-500 text-orange-300 text-[10px] inter-extrabold">
        #3
      </span>
    );
  }
  return (
    <span className="inline-flex w-9 h-6 items-center justify-center rounded-full text-[#A4B7EB] text-[12px] space-mono-regular">
      #{position}
    </span>
  );
}
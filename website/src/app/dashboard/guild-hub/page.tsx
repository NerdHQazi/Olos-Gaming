'use client'

import Image from 'next/image'
import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import {
  mockGuilds,
  getFeaturedGuild,
  getNonFeaturedGuilds,
  type Guild,
} from './guildHub.mock'
import Link from 'next/link';

export default function GuildHubPage() {
  const [query, setQuery] = useState("");

  const featured = getFeaturedGuild();
  const roster = getNonFeaturedGuilds();

  const filteredRoster = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return roster;
    return roster.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        g.tags.some((tag) => tag.toLowerCase().includes(q))
    );
  }, [query, roster]);

  return (
    <div className="mt-6 pb-20 flex flex-col gap-6 max-sm:px-1">
      {/* Header */}
      <div className="flex items-center justify-between max-sm:flex-col max-sm:items-stretch max-sm:gap-3">
        <h1 className="inter-extrabold text-[26px] text-white max-sm:text-[22px]">Olos Guild Hub</h1>
        <div className="flex items-center gap-3 max-sm:flex-col max-sm:items-stretch max-sm:w-full">
          <div className="relative max-sm:w-full">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 inter-light text-slate-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search guilds, tag or games…"
              className="w-64 rounded-md border border-[#2A1060] bg-slate-900/40 pl-8 pr-3 py-2 text-[12px] inter-light text-white outline-none placeholder:text-slate-500 focus:border-[#20CEEE] max-sm:w-full"
            />
          </div>
          <Link href={`/dashboard/guild-hub/create`} className="rounded-md bg-[#7135DB] px-6 py-2 text-[12px] inter-bold text-white hover:opacity-90 transition-opacity max-sm:text-center">
            Create Guild
          </Link>
        </div>
      </div>

      {/* Featured guild banner */}
      {featured && <FeaturedGuildBanner guild={featured} />}

      {/* Guild grid */}
      <div className="grid grid-cols-3 gap-5 max-lg:grid-cols-2 max-sm:grid-cols-1">
        {filteredRoster.map((guild) => (
          <GuildCard key={guild.id} guild={guild} />
        ))}
        {filteredRoster.length === 0 && (
          <p className="col-span-full text-center text-[13px] text-[#908FA0] py-10">
            No guilds match "{query}".
          </p>
        )}
      </div>
    </div>
  );
}

function FeaturedGuildBanner({ guild }: { guild: Guild }) {
  return (
    <div className="rounded-xl border border-[#20CEEE] bg-[#20CEEE]/5 px-6 py-5 flex items-center justify-between gap-6 max-md:flex-col max-md:items-start">
      <div className="flex items-center gap-4 max-sm:flex-col max-sm:items-start">
        <div className="relative w-29 h-29 rounded-lg overflow-hidden bg-white shrink-0 max-sm:w-20 max-sm:h-20">
          <Image src={guild.iconUrl} alt={guild.name} fill className="object-contain p-1" />
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-white text-[22px] inter-extrabold max-sm:text-[18px]">
              Featured: {guild.name}
              {guild.shortName ? ` [${guild.shortName}]` : ""}
            </h2>
            {guild.tier && (
              <span className="text-[8px] px-2 py-0.5 rounded-full bg-[#20CEEE22] text-[#20CEEE] inter-extrabold whitespace-nowrap">
                {guild.tier.toUpperCase()}
              </span>
            )}
          </div>
          {guild.description && (
            <p className="text-[12px] inter-light text-[#A4B7EB]">{guild.description}</p>
          )}
          <div className="flex items-center gap-5 text-[11px] inter-light text-[#908FA0] flex-wrap gap-y-1.5">
            <span>
              Members: <span className="text-white inter-bold">{guild.members}/{guild.maxMembers}</span>
            </span>
            <span>
              Win Rate: <span className="text-[#10B981] inter-bold">{guild.winRate}%</span>
            </span>
            {guild.totalStaked !== undefined && (
              <span>
                Total Staked:{" "}
                <span className="text-[#20CEEE] inter-bold">
                  {guild.totalStaked.toLocaleString()} {guild.currency}
                </span>
              </span>
            )}
          </div>
        </div>
      </div>
      <Link href={`/dashboard/guild-hub/${guild.id}/apply`} className="shrink-0 rounded-md bg-[#20CEEE] px-6 py-2.5 text-[12px] inter-bold text-[#050810] hover:opacity-90 transition-opacity max-md:w-full max-md:text-center">
        Join Guild
      </Link>
    </div>
  );
}

function GuildCard({ guild }: { guild: Guild }) {
  return (
    <div className="rounded-lg border border-[#2A1060] bg-slate-900/40 p-4 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="relative w-15 h-15 rounded-md overflow-hidden bg-slate-800 shrink-0">
          <Image src={guild.iconUrl} alt={guild.name} fill className="object-cover" />
        </div>
        <div className="flex flex-col gap-0.5">
          <h3 className="text-white text-[16px] inter-extrabold leading-tight">{guild.name}</h3>
          <span className="text-[10px] tracking-wider text-[#20CEEE] space-mono-regular">
            Rank #{guild.globalRank} Global
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] mt-3 inter-light">
        <span className="text-[#908FA0]">
          Members: <span className="">{guild.members}/{guild.maxMembers}</span>
        </span>
        <span className="text-[#908FA0]">
          Win Rate: <span className="text-[#10B981] inter-bold">{guild.winRate}%</span>
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {guild.tags.map((tag) => (
          <span
            key={tag}
            className="text-[8px] px-2 py-0.5 rounded-md bg-[#7135DB33] border border-[#2A1060] text-[#A4B7EB] inter-regular"
          >
            {tag}
          </span>
        ))}
      </div>

      <Link href={`/dashboard/guild-hub/${guild.id}/apply`} className="w-full flex justify-center rounded-md border border-[#20CEEE] py-2 text-[11px] inter-bold text-[#20CEEE] hover:bg-[#20CEEE]/10 transition-colors">
        Apply to Join
      </Link>
    </div>
  );
}
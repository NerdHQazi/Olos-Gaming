'use client'

import Image from 'next/image'
import { useState } from "react";
import { ApplicantStats, Guild } from '../../guildHub.mock';
import BackButton from '@/app/dashboard/marketplace/[id]/back-button';

export interface ApplyForGuildPageProps {
  guild: Guild;
  applicantStats: ApplicantStats;
  pendingApplicationCount?: number;
  reviewWindowHours?: number;
}

export default function ApplyForGuildPage({
  guild,
  applicantStats,
  pendingApplicationCount = 1,
  reviewWindowHours = 48,
}: ApplyForGuildPageProps) {
  const tagline = guild.tagline;
  const requirements = {
    winRateMinPercent: guild.winRateMinPercent ?? 0,
    stakingDuesPerMonth: guild.stakingDuesPerMonth ?? 0,
    currency: guild.currency ?? "GVT",
  };
  const [motivation, setMotivation] = useState("");
  const [guildHistory, setGuildHistory] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = motivation.trim().length > 0 && !isSubmitting;

  function handleSubmit() {
    if (!canSubmit) return;
    setIsSubmitting(true);
    // hook up the real application submission here
    setTimeout(() => setIsSubmitting(false), 1500);
  }

  return (
    <div className="mt-6 pb-20 flex flex-col gap-6">
         <BackButton />
      {/* Guild header */}
      <div className="flex items-center gap-4">
        <div className="relative w-22 h-22 rounded-lg overflow-hidden bg-slate-800 shrink-0">
          <Image src={guild.iconUrl} alt={guild.name} fill className="object-cover" />
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-white text-[30px] inter-extrabold">
              {guild.name}
              {guild.shortName ? ` [${guild.shortName}]` : ""}
            </h1>
            <span className="text-[9px] px-2.5 py-1 rounded-full bg-[#20CEEE22] inter-black text-[#20CEEE] inter-bold whitespace-nowrap">
              RANK #{guild.globalRank} GLOBAL
            </span>
          </div>
          {tagline && <p className="text-[12px] text-[#A4B7EB] inter-light">{tagline}</p>}
        </div>
      </div>

      <div className="grid grid-cols-[1fr_300px] gap-6 items-start">
        {/* Left: application form */}
        <div className="rounded-xl border border-[#2A1060] bg-[#060A14CC] p-5 flex flex-col gap-5">
          <h2 className="inter-extrabold text-[18px] text-white">Apply for Membership</h2>

          <div className="flex flex-col gap-2">
            <span className="text-[12px] tracking-wide text-[#A4B7EB] inter-bold">
              Your On-Chain Stats (Auto-populated from Wallet)
            </span>
            <div className="grid grid-cols-3 gap-3">
              <StatBox label="Win Rate" value={`${applicantStats.winRate}%`} green />
              <StatBox label="Total Matches" value={applicantStats.totalMatches.toLocaleString()} />
              <StatBox
                label="GVT Earned"
                value={`${(applicantStats.gvtEarned / 1000).toFixed(1)}K GVT`}
                accent
              />
            </div>
          </div>

          <Field label={`Why do you want to join ${guild.name}?`}>
            <textarea
              value={motivation}
              onChange={(e) => setMotivation(e.target.value)}
              rows={3}
              placeholder="Explain your competitive experience, which tournaments you play, and how you will contribute to the staking treasury…"
              className="w-full bg-transparent text-white text-[13px] outline-none resize-none placeholder:text-slate-600"
            />
          </Field>

          <Field label="Previous Guild History">
            <input
              value={guildHistory}
              onChange={(e) => setGuildHistory(e.target.value)}
              placeholder="e.g. ViperSlayers [VSL] (Left Jan 2026), EthWarriors [ETHW] (Disbanded)"
              className="w-full bg-transparent text-white text-[13px] outline-none placeholder:text-slate-600"
            />
          </Field>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="rounded-md bg-[#20CEEE] disabled:opacity-50 disabled:cursor-not-allowed text-[#050810] px-5 py-2.5 uppercase inter-extrabold text-[12px] transition-opacity"
            >
              {isSubmitting ? "Submitting…" : "Submit Secure Application"}
            </button>
            <button className="rounded-md border border-[#2A1060] text-white px-5 py-2.5 inter-bold text-[12px] hover:bg-slate-900/60 transition-colors uppercase">
              Cancel
            </button>
          </div>
        </div>

        {/* Right: guild status + pending applications */}
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-[#2A1060] bg-slate-900/30 p-5 flex flex-col gap-3">
            <h3 className="inter-extrabold text-[16px] text-white">{guild.name.split(" ")[1] ?? guild.name} Status</h3>

            <StatusRow label="Current Roster" value={`${guild.members} / ${guild.maxMembers} Members`} />
            <StatusRow
              label="Win Rate Requirement"
              value={`${requirements.winRateMinPercent}% Min`}
              green
            />
            <StatusRow
              label="Staking Dues"
              value={`${requirements.stakingDuesPerMonth} ${requirements.currency ?? "GVT"} / Month`}
              accent
            />
          </div>

          {pendingApplicationCount > 0 && (
            <div className="rounded-xl border border-[#7135DB]/60 bg-[#1A0A3C4D] p-4 flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                <span className="text-[12px] text-white inter-extrabold">Your Pending Applications</span>
              </div>
              <p className="text-[11px] text-[#A4B7EB] inter-light">
                You have {pendingApplicationCount} pending application
                {pendingApplicationCount > 1 ? "s" : ""} to {guild.name} submitted today. Leader
                review takes up to {reviewWindowHours} hours.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatBox({
  label,
  value,
  accent = false,
  green = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
  green?: boolean;
}) {
  const colorClass = green ? "text-[#10B981]" : accent ? "text-[#20CEEE]" : "text-white";

  return (
    <div className="rounded-lg inter-light border border-[#2A1060] bg-[#060A14] px-3.5 py-2.5">
      <p className="text-[9px] tracking-wide text-[#908FA0]">{label.toUpperCase()}</p>
      <p className={`text-[14px] inter-bold space-mono-bold ${colorClass}`}>
        {value}
      </p>
    </div>
  );
}

function StatusRow({ label, value, accent = false, green = false }: { label: string; value: string; accent?: boolean; green?: boolean; }) {
      const colorClass = green ? "text-[#10B981]" : accent ? "text-[#20CEEE]" : "text-white";

  return (
    <div className="flex items-center justify-between text-[11px] border-b border-[#FFFFFF0D] pb-1">
      <span className="text-[#908FA0]">{label}</span>
      <span className={`space-mono-bold ${colorClass}`}>{value}</span>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[12px] text-[#A4B7EB] inter-bold">{label}</span>
      <div className="rounded-lg inter-light text-[12px] border border-[#2A1060] bg-slate-900/40 px-3.5 py-2.5">
        {children}
      </div>
    </div>
  );
}
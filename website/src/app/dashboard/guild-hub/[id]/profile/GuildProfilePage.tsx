'use client'

import Image from 'next/image'
import { useState } from "react";
import { MessageCircle, Swords, SwordsIcon, ChevronDown } from "lucide-react";
import type { Guild, GuildMember, ChatMessage, UpcomingBattle, ActiveWar, GuildWarBattle, BattleHistoryEntry, IncomeBreakdownItem,
  TreasuryTransaction, } from '../../guildHub.mock'
import BackButton from '@/app/dashboard/marketplace/[id]/back-button';

const TABS = ["Roster", "Guild Wars", "Treasury", "Settings"] as const;
type Tab = (typeof TABS)[number];

export interface GuildProfilePageProps {
  guild: Guild;
  members: GuildMember[];
  chatPreview: ChatMessage[];
  upcomingBattles: UpcomingBattle[];
  activeWar?: ActiveWar;
  guildWarBattles: GuildWarBattle[];
  battleHistory: BattleHistoryEntry[];
  incomeBreakdown: IncomeBreakdownItem[];
  treasuryTransactions: TreasuryTransaction[];
}

export default function GuildProfilePage({
  guild,
  members,
  chatPreview,
  upcomingBattles,
  activeWar,
  guildWarBattles,
  battleHistory,
  incomeBreakdown,
  treasuryTransactions,
}: GuildProfilePageProps) {
  const [isLeaving, setIsLeaving] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("Guild Wars");

  function handleLeave() {
    setIsLeaving(true);
    // hook up the real leave-guild transaction here
    setTimeout(() => setIsLeaving(false), 1500);
  }

  return (
    <div className="mt-6 pb-20 flex flex-col gap-6 max-sm:px-1">
      <BackButton />
      {/* Header */}
      <div className="flex items-center justify-between max-sm:flex-col max-sm:items-start max-sm:gap-4">
        <div className="flex items-center gap-4 max-sm:items-start">
          <div className="relative w-22 h-22 rounded-lg overflow-hidden bg-slate-800 shrink-0 max-sm:w-16 max-sm:h-16">
            <Image src={guild.iconUrl} alt={guild.name} fill className="object-cover" />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-white text-[30px] inter-extrabold max-sm:text-[22px]">
                {guild.name}
                {guild.shortName ? ` [${guild.shortName}]` : ""}
              </h1>
              <span className="text-[9px] px-2.5 py-1 rounded-full bg-[#20CEEE]/15 text-[#20CEEE] inter-bold whitespace-nowrap">
                RANK #{guild.globalRank} GLOBAL
              </span>
            </div>
            {guild.tagline && <p className="text-[12px] text-[#A4B7EB]">{guild.tagline}</p>}
          </div>
        </div>

        <button
          onClick={handleLeave}
          disabled={isLeaving}
          className="rounded-md border border-[#EF444444] text-[#EF4444] px-4 py-2 text-[12px] inter-bold hover:bg-[#EF44441A] disabled:opacity-50 transition-colors max-sm:w-full"
        >
          {isLeaving ? "Leaving…" : "Leave Guild"}
        </button>
      </div>

      <div>
        <div className="flex items-center gap-6 mb-6 flex-wrap max-sm:gap-4">
          {TABS.map((tab) => {
            const isActive = tab === activeTab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-1 text-[13px] inter-normal transition-colors border-b-2 -mb-px
                  ${
                    isActive
                      ? "text-[#20CEEE] border-[#20CEEE]"
                      : "text-[#A4B7EB] border-transparent hover:text-white"
                  }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

          {activeTab === "Roster" && (
            <RosterTab guild={guild} members={members} chatPreview={chatPreview} upcomingBattles={upcomingBattles} />
          )}

          {activeTab === "Guild Wars" && (
            <GuildWarsTab guild={guild} activeWar={activeWar} battles={guildWarBattles} history={battleHistory} />
          )}

          {activeTab === "Treasury" && (
            <TreasuryTab
              guild={guild}
              incomeBreakdown={incomeBreakdown}
              transactions={treasuryTransactions}
            />
          )}
           {activeTab === "Settings" && <SettingsTab guild={guild} members={members} />}
      </div>

    </div>
  );
}

function ComingSoon({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-[#2A1060] bg-slate-900/20 py-16 flex items-center justify-center">
      <p className="text-[13px] text-[#908FA0]">{label} tab coming soon.</p>
    </div>
  );
}


function StatBox({
  label,
  value,
  note,
  accent = false,
}: {
  label: string;
  value: string;
  note?: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-lg border border-[#2A1060] bg-[#060A14CC] px-4 py-3 flex flex-col gap-0.5">
      <p className="text-[9px] tracking-wide text-[#908FA0] inter-bold">{label.toUpperCase()}</p>
      <p className={`text-[18px] space-mono-bold text-white`}>
        {value}
      </p>
      {note && <p className="text-[9px] text-[#A4B7EB]">{note}</p>}
    </div>
  );
}

function MemberRow({ member }: { member: GuildMember }) {
  return (
    <div className="grid grid-cols-[1fr_120px_120px_100px] gap-4 items-center px-5 py-3 border-b border-[#2A1060] last:border-b-0">
      <div className="flex items-center gap-3">
        <div className="relative w-8 h-8 rounded-full overflow-hidden bg-slate-800 shrink-0">
          <Image src={member.avatarUrl} alt={member.username} fill className="object-cover" />
        </div>
        <span className="text-white text-[12px] inter-semibold">{member.username}</span>
      </div>
      <span className="text-[#A4B7EB] text-[12px] inter-light">{member.role}</span>
      <span className="text-[#20CEEE] text-[12px] space-mono-bold">{member.winRate}%</span>
      <div className="flex items-center gap-1">
        <span
          className={`w-1.25 h-1.25 rounded-full ${member.isOnline ? "bg-emerald-400" : "bg-slate-600"}`}
        />
        <span className="text-[10px] text-[#A4B7EB]">{member.isOnline ? "Online" : "Offline"}</span>
      </div>
    </div>
  );
}

function RosterTab({
  guild,
  members,
  chatPreview,
  upcomingBattles,
}: {
  guild: Guild,
  members: GuildMember[];
  chatPreview: ChatMessage[];
  upcomingBattles: UpcomingBattle[];
}) {

  const openSlots = guild.maxMembers - guild.members;

  return (
    <div>
      <div className="grid grid-cols-4 gap-4 mb-6 max-xl:grid-cols-2 max-sm:grid-cols-1">
        <StatBox
          label="Members"
          value={`${guild.members} / ${guild.maxMembers}`}
          note={`${openSlots} Open slot${openSlots === 1 ? "" : "s"} available`}
        />
        <StatBox
          label="Collective Win Rate"
          value={`${guild.winRate}%`}
          note={guild.winRatePercentileLabel}
          accent
        />
        <StatBox
          label="Guild Staked GVT"
          value={`${(guild.totalStaked ?? 0).toLocaleString()} ${guild.currency ?? "GVT"}`}
          note={
            guild.stakedUsdEstimate !== undefined
              ? `Est. $${guild.stakedUsdEstimate.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD`
              : undefined
          }
        />
        <StatBox label="Tier Bracket" value={(guild.tierBracket ?? "—").toUpperCase()} note={guild.tierNote} />
      </div>

      <div className="grid grid-cols-[1fr_320px] gap-6 items-start max-lg:grid-cols-1">
        {/* Stat boxes */}
        <div className="flex flex-col gap-3">
          <h2 className="inter-extrabold text-[18px] text-white">Guild Member Roster</h2>
          <div className="rounded-xl border border-[#2A1060] overflow-hidden">
            <div className="overflow-x-auto">
              <div className="min-w-135">
                <div className="grid grid-cols-[1fr_120px_120px_100px] gap-4 px-5 py-3 text-[9px] tracking-wide text-[#908FA0] inter-bold border-b border-[#2A1060]">
                  <span>USERNAME</span>
                  <span>ROLE</span>
                  <span>WIN RATE</span>
                  <span>STATUS</span>
                </div>
                {members.map((member) => (
                  <MemberRow key={member.id} member={member} />
                ))}
              </div>
            </div>
          </div>
        </div>
  
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-[#2A1060] bg-slate-900/30 p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <MessageCircle size={14} className="text-[#908FA0]" />
              <h3 className="inter-extrabold text-[14px] text-white">Guild Chat Preview</h3>
            </div>
            <div className="flex flex-col gap-3">
              {chatPreview.map((msg) => (
                <div key={msg.id} className="flex flex-col">
                  <span className="text-[#20CEEE] text-[10px] inter-bold">{msg.username}</span>
                  <span className="text-[11px] text-[#A4B7EB]">{msg.message}</span>
                </div>
              ))}
            </div>
            <button className="w-full rounded-md bg-[#7135DB] py-2.5 text-[11px] inter-bold text-white hover:opacity-90 transition-opacity">
              Open Full Chat
            </button>
          </div>
  
          <div className="rounded-xl border border-[#2A1060] bg-slate-900/30 p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Swords size={14} className="text-[#908FA0]" />
              <h3 className="inter-extrabold text-[14px] text-white">Upcoming Guild Battles</h3>
            </div>
            <div className="flex flex-col gap-3">
              {upcomingBattles.map((battle) => (
                <div key={battle.id} className="flex flex-col gap-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-white inter-bold">vs {battle.opponentName}</span>
                    <span className="text-[11px] text-[#20CEEE] space-mono-bold">
                      {battle.stakeAmount.toLocaleString()} {battle.currency}
                    </span>
                  </div>
                  <span className="text-[9px] inter-light text-[#908FA0]">{battle.scheduleLabel}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GuildWarsTab({
  guild,
  activeWar,
  battles,
  history,
}: {
  guild: Guild;
  activeWar?: ActiveWar;
  battles: GuildWarBattle[];
  history: BattleHistoryEntry[];
}) {
  const [isChallenging, setIsChallenging] = useState(false);
 
  function handleChallenge() {
    setIsChallenging(true);
    // hook up the real challenge-issuing transaction here
    setTimeout(() => setIsChallenging(false), 1500);
  }
 
  return (
    <div className="grid grid-cols-[1fr_420px] gap-6 items-start max-lg:grid-cols-1">
      {/* Left: active war + upcoming battles */}
      <div className="flex flex-col gap-5">
        {activeWar && (
          <div className="rounded-xl border border-[#EF4444] bg-[#1A0A3C4D] p-5 flex flex-col gap-6 max-sm:p-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#EF4444] animate-pulse" />
                <span className="text-[12px] tracking-wide text-red-400 inter-extrabold">ACTIVE WAR LIVE</span>
              </div>
              <span className="text-[10px] space-mono-regular text-[#908FA0]">
                Stakes: {activeWar.stakeAmount.toLocaleString()} {activeWar.currency}
              </span>
            </div>
 
            <div className="flex items-center justify-between gap-8 max-sm:flex-col max-sm:gap-4">
              <div className="flex items-center gap-2">
                <div className="relative w-9 h-9 rounded-full overflow-hidden bg-slate-800 shrink-0">
                  <Image src={guild.iconUrl} alt={guild.name} fill className="object-cover" />
                </div>
                <span className="text-white text-[14px] inter-extrabold">{guild.name}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[#20CEEE] text-[30px] space-mono-bold">{activeWar.ourScore}</span>

                <span className="text-[#908FA0] inter-light text-[18px]">vs</span>

                <span className="text-[#EF4444] text-[30px] space-mono-bold">{activeWar.opponentScore}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white text-[14px] inter-extrabold">{activeWar.opponentName}</span>
                <div className="relative w-9 h-9 rounded-full overflow-hidden bg-slate-800 shrink-0">
                  <Image src={activeWar.opponentIconUrl} alt={activeWar.opponentName} fill className="object-cover" />
                </div>
              </div>
            </div>
 
            <div className="rounded-md bg-[#EF444422] text-center py-1.5">
              <span className="text-[10px] text-[#EF4444] inter-bold">{activeWar.timeRemainingLabel}</span>
            </div>
          </div>
        )}
 
        <div className="flex flex-col mt-4 gap-3">
          <h2 className="inter-extrabold text-[18px] text-white">Upcoming Battles</h2>
          <div className="flex flex-col gap-3">
            {battles.map((battle) => (
              <div
                key={battle.id}
                className="rounded-lg border border-[#2A1060] bg-[#060A14CC] px-4 py-5 flex items-center justify-between max-sm:flex-col max-sm:items-start max-sm:gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="relative w-10 h-10 rounded-md overflow-hidden bg-slate-800 shrink-0">
                    <Image src={battle.opponentIconUrl} alt={battle.opponentName} fill className="object-cover" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-white text-[13px] inter-extrabold">
                      vs {battle.opponentName}
                      {battle.opponentShortName ? ` [${battle.opponentShortName}]` : ""}
                    </span>
                    <span className="text-[10px] inter-light text-[#908FA0]">{battle.scheduleLabel}</span>
                  </div>
                </div>
                <div className="flex items-center gap-8 max-sm:w-full max-sm:justify-between max-sm:gap-4">
                  <div className="flex flex-col items-end max-sm:items-start">
                    <span className="text-[9px] inter-light text-[#908FA0] tracking-wide">GAME TYPE</span>
                    <span className="text-[12px] text-[#20CEEE] inter-bold">{battle.gameType}</span>
                  </div>
                  <div className="flex flex-col items-end max-sm:items-start">
                    <span className="text-[9px] inter-light text-[#908FA0] tracking-wide">STAKES</span>
                    <span className="text-[12px] text-white space-mono-bold">
                      {battle.stakeAmount.toLocaleString()} {battle.currency}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
 
      {/* Right: challenge card + battle history */}
      <div className="flex flex-col gap-4">
        <div className="rounded-xl border border-[#20CEEE] bg-[#060A14CC] p-4 flex flex-col gap-3">
          <h3 className="inter-extrabold text-[16px] text-white">Initiate GvG Strike</h3>
          <p className="text-[11px] inter-light text-[#908FA0] leading-snug">
            Lock contract stakes and issue a direct challenge to any active guild. Minimum stakes
            are 500 GVT.
          </p>
          <button
            onClick={handleChallenge}
            disabled={isChallenging}
            className="w-full rounded-md bg-[#20CEEE] disabled:opacity-50 text-[#050810] py-2.5 text-[12px] inter-extrabold hover:opacity-90 transition-opacity uppercase"
          >
            {isChallenging ? "Sending Challenge…" : "Challenge Another Guild"}
          </button>
        </div>
 
        <div className="rounded-xl border border-[#2A1060] bg-slate-900/30 p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <SwordsIcon size={14} className="text-[#908FA0]" />
            <h3 className="inter-extrabold text-[14px] text-white">Battle History (Past {history.length})</h3>
          </div>
          <div className="flex flex-col gap-3">
            {history.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-white text-[11px] inter-bold">vs {entry.opponentName}</span>
                  <span className="text-[9px] inter-light text-[#908FA0]">{entry.arena}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span
                    className={`text-[11px] space-mono-bold ${
                      entry.result === "Victory" ? "text-[#10B981]" : "text-[#EF4444]"
                    }`}
                  >
                    {entry.result.toUpperCase()}
                  </span>
                  <span className="text-[10px] text-[#908FA0] space-mono-regular">
                    {entry.amount > 0 ? "+" : ""}
                    {entry.amount.toLocaleString()} {entry.currency}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Treasury tab (balance + deposit/withdraw + income breakdown + audit trail)
// ---------------------------------------------------------------------------
 
function TreasuryTab({
  guild,
  incomeBreakdown,
  transactions,
}: {
  guild: Guild;
  incomeBreakdown: IncomeBreakdownItem[];
  transactions: TreasuryTransaction[];
}) {
  const [isDepositing, setIsDepositing] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
 
  function handleDeposit() {
    setIsDepositing(true);
    // hook up the real deposit transaction here
    setTimeout(() => setIsDepositing(false), 1500);
  }
 
  function handleWithdraw() {
    setIsWithdrawing(true);
    // hook up the real withdraw transaction here
    setTimeout(() => setIsWithdrawing(false), 1500);
  }
 
  return (
    <div className="grid grid-cols-[1fr_400px] gap-6 items-start max-lg:grid-cols-1">
      {/* Left: balance + audit trail */}
      <div className="flex flex-col gap-5">
        <div className="rounded-xl border border-[#2A1060] bg-[#1A0A3C4D] p-5 flex items-center justify-between gap-6 max-sm:flex-col max-sm:items-start max-sm:gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-[12px] tracking-wide text-[#A4B7EB] inter-light">
              MULTISIG TREASURY BALANCE
            </span>
            <span className="text-[38px] text-[#20CEEE] space-mono-bold space-mono-bold leading-none max-sm:text-[28px]">
              {(guild.totalStaked ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}{" "}
              {guild.currency ?? "GVT"}
            </span>
            {guild.stakedUsdEstimate !== undefined && (
              <span className="text-[14px] space-mono-regular text-[#908FA0]">
                ≈ ${guild.stakedUsdEstimate.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD
              </span>
            )}
          </div>
 
          <div className="flex items-center gap-3 shrink-0 max-sm:w-full max-sm:grid max-sm:grid-cols-2 max-sm:gap-2">
            <button
              onClick={handleDeposit}
              disabled={isDepositing}
              className="rounded-md bg-[#20CEEE] disabled:opacity-50 text-[#050810] px-5 py-2.5 text-[12px] inter-extrabold hover:opacity-90 transition-opacity uppercase"
            >
              {isDepositing ? "Depositing…" : "Deposit GVT"}
            </button>
            <button
              onClick={handleWithdraw}
              disabled={isWithdrawing}
              className="rounded-md border border-[#7135DB] text-[#776295] disabled:opacity-50 px-5 py-2.5 text-[12px] inter-extrabold hover:bg-[#7135DB]/10 transition-colors uppercase"
            >
              {isWithdrawing ? "Withdrawing…" : "Withdraw"}
            </button>
          </div>
        </div>
 
        <div className="flex flex-col gap-3">
          <h2 className="inter-extrabold text-[18px] text-white">Treasury Audit Trail</h2>
          <div className="rounded-xl border border-[#2A1060] overflow-hidden">
            <div className="overflow-x-auto">
              <div className="min-w-140">
                <div className="grid grid-cols-[1fr_140px_140px_100px] gap-4 px-5 py-3 text-[9px] tracking-wide text-[#908FA0] inter-bold border-b border-[#2A1060]">
                  <span>TRANSACTION TYPE / ID</span>
                  <span>MEMBER</span>
                  <span>AMOUNT</span>
                  <span>DATE</span>
                </div>
                {transactions.map((txn) => (
                  <div
                    key={txn.id}
                    className="grid grid-cols-[1fr_140px_140px_100px] gap-4 items-center px-5 py-3 border-b border-[#2A1060] last:border-b-0"
                  >
                    <span className="text-white text-[12px] inter-bold">{txn.type}</span>
                    <span className="text-[#A4B7EB] text-[12px] inter-light">{txn.member}</span>
                    <span
                      className={`text-[12px] space-mono-bold ${
                        txn.amount >= 0 ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      {txn.amount > 0 ? "+" : ""}
                      {txn.amount.toLocaleString()} {txn.currency}
                    </span>
                    <span className="text-[#908FA0] text-[11px] inter-light">{txn.dateLabel}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
 
      {/* Right: income breakdown */}
      <div className="rounded-xl border border-[#2A1060] bg-slate-900/30 p-5 flex flex-col gap-4">
        <h3 className="inter-extrabold text-[16px] text-white">Income Breakdown</h3>
        <div className="flex flex-col gap-3">
          {incomeBreakdown.map((item) => (
            <div key={item.id} className="flex items-center justify-between text-[11px]">
              <span className="text-[#A4B7EB] inter-light">{item.label}</span>
              <span className="text-[#20CEEE] space-mono-bold">
                {item.percent}% ({(item.amount / 1000).toFixed(1)}K {item.currency})
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Settings tab (guild info, roster roles, announcements, tax rate, danger zone)
// ---------------------------------------------------------------------------
 
function SettingsTab({ guild, members }: { guild: Guild; members: GuildMember[] }) {
  const [motto, setMotto] = useState(guild.tagline ?? "");
  const [rules, setRules] = useState(guild.recruitmentRulesSummary ?? "");
  const [isSaving, setIsSaving] = useState(false);
 
  const [announcement, setAnnouncement] = useState(guild.draftAnnouncement ?? "");
  const [isPosting, setIsPosting] = useState(false);
 
  const [isDisbanding, setIsDisbanding] = useState(false);
 
  // Roles are managed here locally; Leader isn't shown since their role isn't editable from this list.
  const [roster, setRoster] = useState(
    members
      .filter((m) => m.role !== "Leader")
      .map((m) => ({ ...m }))
  );
 
  function updateRole(memberId: string, role: GuildMember["role"]) {
    setRoster((prev) => prev.map((m) => (m.id === memberId ? { ...m, role } : m)));
  }
 
  function kickMember(memberId: string) {
    setRoster((prev) => prev.filter((m) => m.id !== memberId));
    // hook up the real kick transaction here
  }
 
  function handleSave() {
    setIsSaving(true);
    // hook up the real guild-settings update here
    setTimeout(() => setIsSaving(false), 1200);
  }
 
  function handlePost() {
    if (!announcement.trim()) return;
    setIsPosting(true);
    // hook up the real announcement post here
    setTimeout(() => setIsPosting(false), 1200);
  }
 
  function handleDisband() {
    setIsDisbanding(true);
    // hook up the real disband-guild transaction here
    setTimeout(() => setIsDisbanding(false), 1500);
  }
 
  return (
    <div className="grid grid-cols-[1fr_400px] gap-6 items-start max-lg:grid-cols-1">
      {/* Left: guild info + roster roles */}
      <div className="flex flex-col gap-5">
        <div className="rounded-xl border border-[#2A1060] bg-[#060A14CC] p-5 flex flex-col gap-4 max-sm:p-4">
          <h2 className="inter-extrabold text-[16px] text-white">Guild Information</h2>
 
          <SettingsField label="Motto / Slogan">
            <input
              value={motto}
              onChange={(e) => setMotto(e.target.value)}
              className="w-full bg-transparent text-white text-[12px] inter-light outline-none"
            />
          </SettingsField>
 
          <SettingsField label="Recruitment Rules Summary">
            <textarea
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              rows={3}
              className="w-full bg-transparent text-white text-[12px] inter-light outline-none resize-none"
            />
          </SettingsField>
 
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="self-start rounded-md bg-[#20CEEE] disabled:opacity-50 text-[#050810] px-5 py-2 text-[11px] inter-extrabold hover:opacity-90 transition-opacity uppercase max-sm:w-full max-sm:self-stretch"
          >
            {isSaving ? "Saving…" : "Save Changes"}
          </button>
        </div>
 
        <div className="rounded-xl border border-[#2A1060] bg-[#060A14CC] p-5 flex flex-col gap-3 max-sm:p-4">
          <h2 className="inter-extrabold text-[16px] text-white">Manage Roster Roles</h2>
          <div className="flex flex-col divide-y divide-[#2A1060]">
            {roster.map((member) => (
              <div key={member.id} className="flex items-center justify-between py-3 max-sm:flex-col max-sm:items-start max-sm:gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative w-8 h-8 rounded-full overflow-hidden bg-slate-800 shrink-0">
                    <Image src={member.avatarUrl} alt={member.username} fill className="object-cover" />
                  </div>
                  <span className="text-white text-[12px] inter-bold">{member.username}</span>
                </div>
                <div className="flex items-center gap-2.5 max-sm:w-full max-sm:justify-between">
                  <div className="relative">
                    <select
                      value={member.role}
                      onChange={(e) =>
                        updateRole(member.id, e.target.value as GuildMember["role"])
                      }
                      className="appearance-none rounded-md border border-[#2A1060] bg-[#060A14] pl-3 pr-7 py-1.5 text-[12px] text-white outline-none cursor-pointer"
                    >
                      <option value="Officer" className="bg-slate-900">
                        Officer
                      </option>
                      <option value="Member" className="bg-slate-900">
                        Member
                      </option>
                    </select>
                    <ChevronDown
                      size={12}
                      className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                  </div>
                  <button
                    onClick={() => kickMember(member.id)}
                    className="rounded-md border border-red-500/50 text-red-400 px-3 py-1.5 text-[10px] inter-bold hover:bg-[#EF44441A] transition-colors"
                  >
                    KICK
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
 
      {/* Right: announcements + tax rate + danger zone */}
      <div className="flex flex-col gap-4">
        <div className="rounded-xl border border-[#2A1060] bg-slate-900/30 p-4 flex flex-col gap-3">
          <h3 className="inter-extrabold text-[16px] text-white">Announcements</h3>
          <div className="rounded-lg border border-[#2A1060] bg-[#060A14] px-3.5 py-2.5">
            <textarea
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
              rows={3}
              className="w-full bg-transparent text-white text-[12px] outline-none resize-none"
            />
          </div>
          <button
            onClick={handlePost}
            disabled={isPosting || !announcement.trim()}
            className="w-full rounded-md bg-[#20CEEE] disabled:opacity-50 text-[#050810] py-2.5 text-[11px] inter-extrabold uppercase hover:opacity-90 transition-opacity"
          >
            {isPosting ? "Posting…" : "Post Announcement"}
          </button>
        </div>
 
        <div className="rounded-xl border border-[#2A1060] bg-slate-900/30 p-4 flex flex-col gap-2">
          <h3 className="inter-extrabold text-[14px] text-white">Treasury &amp; Tax Rate</h3>
          <div className="flex items-center justify-between">
            <span className="text-[11px] inter-light text-[#A4B7EB]">Staking Tax Percentage</span>
            <span className="text-[11px] px-2.5 py-1 rounded-md border border-[#2A1060] text-[#20CEEE] space-mono-regular">
              {guild.stakingTaxPercent ?? 0}%
            </span>
          </div>
          <p className="text-[9px] inter-light text-[#908FA0] leading-snug">
            This percentage of individual GvG rewards will automatically route to the guild
            treasury contract.
          </p>
        </div>
 
        <div className="rounded-xl border border-red-500/50 bg-[#EF44440F] p-4 flex flex-col gap-3">
          <h3 className="inter-extrabold text-[14px] text-[#EF4444]">Danger Zone</h3>
          <p className="text-[10px] inter-light text-[#A4B7EB] leading-snug">
            Disbanding the guild terminates the smart contract and refunds all staked treasury to
            active members relative to their win rates.
          </p>
          <button
            onClick={handleDisband}
            disabled={isDisbanding}
            className="w-full rounded-md bg-red-500 disabled:opacity-50 text-[#000000] py-2.5 text-[11px] inter-extrabold hover:opacity-90 transition-opacity uppercase"
          >
            {isDisbanding ? "Disbanding…" : "Disband Guild Contract"}
          </button>
        </div>
      </div>
    </div>
  );
}
 
function SettingsField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[11px] inter-light text-[#A4B7EB]">{label}</span>
      <div className="rounded-lg border border-[#2A1060] bg-[#060A14] px-3.5 py-2.5">
        {children}
      </div>
    </div>
  );
}
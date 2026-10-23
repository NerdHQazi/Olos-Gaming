// guildHub.mock.ts
// Mock data for the Olos Guild Hub UI

export interface Guild {
  id: string;
  name: string;
  shortName?: string; // e.g. "CS" for Cyber Serpents, shown in the featured badge
  iconUrl: string;
  globalRank: number;
  members: number;
  maxMembers: number;
  winRate: number; // percentage, e.g. 72.3
  tags: string[];
  isFeatured?: boolean;
  tier?: string; // e.g. "Tier 1 Elite"
  description?: string; // shown on the featured guild only
  totalStaked?: number; // GVT, shown on the featured guild only
  currency?: string;
  tagline?: string; // shown on the guild profile / apply page
  winRateMinPercent?: number; // membership requirement, e.g. 55.0
  stakingDuesPerMonth?: number; // membership requirement, GVT/month
  totalWins?: number; // shown on the leaderboard
  totalEarned?: number; // GVT, shown on the leaderboard
  isUserGuild?: boolean; // highlights this row as "Your Guild" on the leaderboard
  winRatePercentileLabel?: string; // e.g. "Top 1.5% worldwide", shown on the guild profile
  stakedUsdEstimate?: number; // shown alongside totalStaked on the guild profile
  tierBracket?: string; // e.g. "Elite I"
  tierNote?: string; 
  recruitmentRulesSummary?: string; // shown on the Settings tab
  stakingTaxPercent?: number; // e.g. 10
  draftAnnouncement?: string; // pre-filled text in the announcement composer
}

export interface ApplicantStats {
  winRate: number; // percentage, e.g. 74.8
  totalMatches: number;
  gvtEarned: number;
}

export interface GuildMember {
  id: string;
  guildId: string;
  username: string;
  avatarUrl: string;
  role: "Leader" | "Officer" | "Member";
  winRate: number; // percentage
  isOnline: boolean;
}
 
export interface ChatMessage {
  id: string;
  guildId: string;
  username: string;
  message: string;
}
 
export interface UpcomingBattle {
  id: string;
  guildId: string;
  opponentName: string;
  stakeAmount: number;
  currency: string;
  scheduleLabel: string; // e.g. "Tonight, 8:30 PM"
}

export interface ActiveWar {
  id: string;
  guildId: string;
  opponentName: string;
  opponentIconUrl: string;
  ourScore: number;
  opponentScore: number;
  stakeAmount: number;
  currency: string;
  timeRemainingLabel: string; // e.g. "1 Hour 20 Mins Remaining in Bracket Matchup"
}
 
export interface GuildWarBattle {
  id: string;
  guildId: string;
  opponentName: string;
  opponentShortName?: string;
  opponentIconUrl: string;
  scheduleLabel: string; // e.g. "Jan 26, 9:00 PM UTC"
  gameType: string; // e.g. "Chess Arena"
  stakeAmount: number;
  currency: string;
}
 
export interface BattleHistoryEntry {
  id: string;
  guildId: string;
  opponentName: string;
  arena: string;
  result: "Victory" | "Defeat";
  amount: number; // signed, e.g. 1200 or -800
  currency: string;
}

export interface IncomeBreakdownItem {
  id: string;
  guildId: string;
  label: string; // e.g. "Match Winnings"
  percent: number; // e.g. 65
  amount: number; // e.g. 29700
  currency: string;
}
 
export interface TreasuryTransaction {
  id: string;
  guildId: string;
  type: string; // e.g. "Match Winnings (GvG)"
  member: string; // username, or "Guild Pool" / "Team CS" for collective entries
  amount: number; // signed, e.g. 2000 or -500
  currency: string;
  dateLabel: string; // e.g. "Today", "Yesterday", "Jan 22"
}

// ---------------------------------------------------------------------------
// Guilds
// ---------------------------------------------------------------------------

export const mockGuilds: Guild[] = [
  {
    id: "guild-001",
    name: "Cyber Serpents",
    shortName: "CS",
    iconUrl: "/guilds/cyberSerpentImage.png",
    globalRank: 7,
    members: 24,
    maxMembers: 30,
    winRate: 72.3,
    tags: ["Snake", "Speed"],
    isFeatured: true,
    tier: "Tier 1 Elite",
    description:
      "Dominated local snake pool arenas this month. Staking hard and taking first place in bracket tourneys.",
    totalStaked: 45800,
    currency: "GVT",
    tagline: "\u201cNo mercy in the pit. Cold-blooded on-chain slayers.\u201d",
    winRateMinPercent: 55.0,
    stakingDuesPerMonth: 50,
    totalWins: 2840,
    totalEarned: 45800,
    winRatePercentileLabel: "Top 1.5% worldwide",
    stakedUsdEstimate: 4580.0,
    tierBracket: "Elite I",
    tierNote: "Promoted last season",
  },
  {
    id: "guild-002",
    name: "Cyber Serpents",
    iconUrl: "/guilds/cyberSerpent2Image.png",
    globalRank: 7,
    members: 24,
    maxMembers: 30,
    winRate: 72.3,
    tags: ["Snake", "Speed"],
    tagline: "\u201cNo mercy in the pit. Cold-blooded on-chain slayers.\u201d",
    winRateMinPercent: 55.0,
    stakingDuesPerMonth: 50,
    totalWins: 2840,
    totalEarned: 45800,
    isUserGuild: true,
    winRatePercentileLabel: "Top 1.5% worldwide",
    stakedUsdEstimate: 4580.0,
    tierBracket: "Elite I",
    tierNote: "Promoted last season",
  },
  {
    id: "guild-003",
    name: "Eth Warriors",
    iconUrl: "/guilds/ethWarriorsImage.png",
    globalRank: 15,
    members: 28,
    maxMembers: 30,
    winRate: 68.4,
    tags: ["PvP", "All-Games"],
    tagline: "\u201cGas is just the cost of victory.\u201d",
    winRateMinPercent: 50.0,
    stakingDuesPerMonth: 40,
    totalWins: 2610,
    totalEarned: 38200,
  },
  {
    id: "guild-004",
    name: "Giga GVT Stakers",
    iconUrl: "/guilds/gigaGVTImage.png",
    globalRank: 22,
    members: 19,
    maxMembers: 30,
    winRate: 65.1,
    tags: ["Stake", "Chess"],
    tagline: "\u201cCompound wins, compound yield.\u201d",
    winRateMinPercent: 45.0,
    stakingDuesPerMonth: 75,
    totalWins: 2190,
    totalEarned: 32400,
  },
  {
    id: "guild-005",
    name: "Meta Cobras",
    iconUrl: "/guilds/metaCobraImage.png",
    globalRank: 9,
    members: 30,
    maxMembers: 30,
    winRate: 70.8,
    tags: ["Snake"],
    tagline: "\u201cFull roster, full venom.\u201d",
    winRateMinPercent: 55.0,
    stakingDuesPerMonth: 60,
    totalWins: 1980,
    totalEarned: 28100,
  },
  {
    id: "guild-006",
    name: "Web3 Wizards",
    iconUrl: "/guilds/web3WizardImage.png",
    globalRank: 40,
    members: 15,
    maxMembers: 30,
    winRate: 59.2,
    tags: ["Tetris", "Classic"],
    tagline: "\u201cCasting spells, stacking blocks.\u201d",
    winRateMinPercent: 40.0,
    stakingDuesPerMonth: 20,
    totalWins: 1450,
    totalEarned: 19500,
  },
  {
    id: "guild-007",
    name: "Alpha Blitzers",
    iconUrl: "/guilds/alphaBlitzerImage.png",
    globalRank: 29,
    members: 22,
    maxMembers: 30,
    winRate: 63.7,
    tags: ["Classic"],
    tagline: "\u201cSpeed is the only strategy.\u201d",
    winRateMinPercent: 45.0,
    stakingDuesPerMonth: 30,
    totalWins: 1200,
    totalEarned: 14200,
  },
];

// ---------------------------------------------------------------------------
// Applicant (connected wallet) stats — same for any guild being applied to,
// since these describe the current user, not the guild.
// ---------------------------------------------------------------------------

export const mockApplicantStats: ApplicantStats = {
  winRate: 74.8,
  totalMatches: 542,
  gvtEarned: 12400,
};

export const mockGuildMembers: GuildMember[] = [
  {
    id: "member-001",
    guildId: "guild-001",
    username: "SnakeGod99",
    avatarUrl: "/AvatarGirl.png",
    role: "Leader",
    winRate: 74.8,
    isOnline: true,
  },
  {
    id: "member-002",
    guildId: "guild-001",
    username: "ViperKing",
    avatarUrl: "/AvatarGirl.png",
    role: "Officer",
    winRate: 69.1,
    isOnline: true,
  },
  {
    id: "member-003",
    guildId: "guild-001",
    username: "CyberCobra",
    avatarUrl: "/AvatarGirl.png",
    role: "Officer",
    winRate: 68.5,
    isOnline: false,
  },
  {
    id: "member-004",
    guildId: "guild-001",
    username: "VenomHunter",
    avatarUrl: "/AvatarGirl.png",
    role: "Member",
    winRate: 61.3,
    isOnline: true,
  },
  {
    id: "member-005",
    guildId: "guild-001",
    username: "Constrictor",
    avatarUrl: "/AvatarGirl.png",
    role: "Member",
    winRate: 58.9,
    isOnline: true,
  },
];

// ---------------------------------------------------------------------------
// Guild chat preview
// ---------------------------------------------------------------------------
 
export const mockChatPreview: ChatMessage[] = [
  {
    id: "chat-001",
    guildId: "guild-001",
    username: "ViperKing",
    message: "Are we matching tonight for tournament bracket?",
  },
  {
    id: "chat-002",
    guildId: "guild-001",
    username: "SnakeGod99",
    message: "Yeah, starting lobby at 8 PM UTC.",
  },
  {
    id: "chat-003",
    guildId: "guild-001",
    username: "VenomHunter",
    message: "Count me in, let's stake 100 GVT.",
  },
];
 
// ---------------------------------------------------------------------------
// Upcoming guild battles
// ---------------------------------------------------------------------------
 
export const mockUpcomingBattles: UpcomingBattle[] = [
  {
    id: "battle-001",
    guildId: "guild-001",
    opponentName: "Eth Warriors",
    stakeAmount: 500,
    currency: "GVT",
    scheduleLabel: "Tonight, 8:30 PM",
  },
  {
    id: "battle-002",
    guildId: "guild-001",
    opponentName: "Meta Cobras",
    stakeAmount: 1600,
    currency: "GVT",
    scheduleLabel: "Tomorrow, 9:00 PM",
  },
];


// ---------------------------------------------------------------------------
// Active guild war
// ---------------------------------------------------------------------------
 
export const mockActiveWars: ActiveWar[] = [
  {
    id: "war-001",
    guildId: "guild-001",
    opponentName: "Eth Warriors",
    opponentIconUrl: "/guilds/ethWarriorsImage.png",
    ourScore: 14,
    opponentScore: 12,
    stakeAmount: 2000,
    currency: "GVT",
    timeRemainingLabel: "1 Hour 20 Mins Remaining in Bracket Matchup",
  },
];
 
// ---------------------------------------------------------------------------
// Guild war upcoming battles (richer than the roster-tab quick list)
// ---------------------------------------------------------------------------
 
export const mockGuildWarBattles: GuildWarBattle[] = [
  {
    id: "warbattle-001",
    guildId: "guild-001",
    opponentName: "Web3 Wizards",
    opponentShortName: "W3W",
    opponentIconUrl: "/guilds/web3WizardImage.png",
    scheduleLabel: "Jan 26, 9:00 PM UTC",
    gameType: "Chess Arena",
    stakeAmount: 1000,
    currency: "GVT",
  },
  {
    id: "warbattle-002",
    guildId: "guild-001",
    opponentName: "Meta Cobras",
    opponentShortName: "MC",
    opponentIconUrl: "/guilds/metaCobraImage.png",
    scheduleLabel: "Jan 28, 10:30 PM UTC",
    gameType: "Snake Xenzia",
    stakeAmount: 900,
    currency: "GVT",
  },
];
 
// ---------------------------------------------------------------------------
// Battle history
// ---------------------------------------------------------------------------
 
export const mockBattleHistory: BattleHistoryEntry[] = [
  {
    id: "history-001",
    guildId: "guild-001",
    opponentName: "Alpha Blitzers",
    arena: "Snake Pool Arena",
    result: "Victory",
    amount: 1200,
    currency: "GVT",
  },
  {
    id: "history-002",
    guildId: "guild-001",
    opponentName: "Giga GVT Stakers",
    arena: "Snake Pool Arena",
    result: "Defeat",
    amount: -800,
    currency: "GVT",
  },
  {
    id: "history-003",
    guildId: "guild-001",
    opponentName: "Eth Warriors",
    arena: "Snake Pool Arena",
    result: "Victory",
    amount: 2000,
    currency: "GVT",
  },
];

// ---------------------------------------------------------------------------
// Treasury income breakdown
// ---------------------------------------------------------------------------
 
export const mockIncomeBreakdown: IncomeBreakdownItem[] = [
  { id: "income-001", guildId: "guild-001", label: "Match Winnings", percent: 65, amount: 29700, currency: "GVT" },
  { id: "income-002", guildId: "guild-001", label: "Member Dues", percent: 20, amount: 9100, currency: "GVT" },
  { id: "income-003", guildId: "guild-001", label: "Tournament Prizes", percent: 15, amount: 6800, currency: "GVT" },
];

// ---------------------------------------------------------------------------
// Treasury audit trail
// ---------------------------------------------------------------------------
 
export const mockTreasuryTransactions: TreasuryTransaction[] = [
  {
    id: "txn-001",
    guildId: "guild-001",
    type: "Match Winnings (GvG)",
    member: "Guild Pool",
    amount: 2000,
    currency: "GVT",
    dateLabel: "Today",
  },
  {
    id: "txn-002",
    guildId: "guild-001",
    type: "Payout Distribution",
    member: "SnakeGod99",
    amount: -500,
    currency: "GVT",
    dateLabel: "Yesterday",
  },
  {
    id: "txn-003",
    guildId: "guild-001",
    type: "Member Monthly Dues",
    member: "ViperKing",
    amount: 50,
    currency: "GVT",
    dateLabel: "Jan 22",
  },
  {
    id: "txn-004",
    guildId: "guild-001",
    type: "Tournament Prize Pool",
    member: "Team CS",
    amount: 5000,
    currency: "GVT",
    dateLabel: "Jan 18",
  },
  {
    id: "txn-005",
    guildId: "guild-001",
    type: "Hardware Expense Payout",
    member: "ViperKing",
    amount: -150,
    currency: "GVT",
    dateLabel: "Jan 15",
  },
];
 

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

export function getFeaturedGuild(): Guild | undefined {
  return mockGuilds.find((g) => g.isFeatured);
}

export function getNonFeaturedGuilds(): Guild[] {
  return mockGuilds.filter((g) => !g.isFeatured);
}

export function sortGuildsByRank(guilds: Guild[]): Guild[] {
  return [...guilds].sort((a, b) => a.globalRank - b.globalRank);
}

export function searchGuilds(query: string): Guild[] {
  const q = query.trim().toLowerCase();
  if (!q) return mockGuilds;
  return mockGuilds.filter(
    (g) =>
      g.name.toLowerCase().includes(q) ||
      g.tags.some((tag) => tag.toLowerCase().includes(q))
  );
}

export function getGuildById(id: string): Guild | undefined {
  return mockGuilds.find((g) => g.id === id);
}


export function rankGuildsByWins(guilds: Guild[]): Guild[] {
  return [...guilds].sort((a, b) => (b.totalWins ?? 0) - (a.totalWins ?? 0));
}
 
export function getMembersByGuildId(guildId: string): GuildMember[] {
  return mockGuildMembers.filter((m) => m.guildId === guildId);
}
 
export function getChatPreviewByGuildId(guildId: string): ChatMessage[] {
  return mockChatPreview.filter((c) => c.guildId === guildId);
}
 
export function getUpcomingBattlesByGuildId(guildId: string): UpcomingBattle[] {
  return mockUpcomingBattles.filter((b) => b.guildId === guildId);
}

export function getActiveWarByGuildId(guildId: string): ActiveWar | undefined {
  return mockActiveWars.find((w) => w.guildId === guildId);
}
 
export function getGuildWarBattlesByGuildId(guildId: string): GuildWarBattle[] {
  return mockGuildWarBattles.filter((b) => b.guildId === guildId);
}
 
export function getBattleHistoryByGuildId(guildId: string): BattleHistoryEntry[] {
  return mockBattleHistory.filter((h) => h.guildId === guildId);
}

export function getIncomeBreakdownByGuildId(guildId: string): IncomeBreakdownItem[] {
  return mockIncomeBreakdown.filter((i) => i.guildId === guildId);
}
 
export function getTreasuryTransactionsByGuildId(guildId: string): TreasuryTransaction[] {
  return mockTreasuryTransactions.filter((t) => t.guildId === guildId);
}
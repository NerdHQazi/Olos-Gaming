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
  {
    id: "member-006",
    guildId: "guild-002",
    username: "SnakeGod99",
    avatarUrl: "/AvatarGirl.png",
    role: "Leader",
    winRate: 74.8,
    isOnline: true,
  },
  {
    id: "member-007",
    guildId: "guild-002",
    username: "ViperKing",
    avatarUrl: "/AvatarGirl.png",
    role: "Officer",
    winRate: 69.1,
    isOnline: true,
  },
  {
    id: "member-008",
    guildId: "guild-002",
    username: "CyberCobra",
    avatarUrl: "/AvatarGirl.png",
    role: "Officer",
    winRate: 68.5,
    isOnline: false,
  },
  {
    id: "member-009",
    guildId: "guild-002",
    username: "VenomHunter",
    avatarUrl: "/AvatarGirl.png",
    role: "Member",
    winRate: 61.3,
    isOnline: true,
  },
  {
    id: "member-010",
    guildId: "guild-002",
    username: "Constrictor",
    avatarUrl: "/AvatarGirl.png",
    role: "Member",
    winRate: 58.9,
    isOnline: true,
  },
  { 
    id: "member-101", 
    guildId: "guild-003", 
    username: "GasLordKai", 
    avatarUrl: "/AvatarGirl.png", 
    role: "Leader", 
    winRate: 71.2, 
    isOnline: true 
  },
  { 
    id: "member-102", 
    guildId: "guild-003", 
    username: "MerkleMike", 
    avatarUrl: "/AvatarGirl.png", 
    role: "Officer", 
    winRate: 67.9, 
    isOnline: true 
  },
  { 
    id: "member-103", 
    guildId: "guild-003", 
    username: "SolidityQueen", 
    avatarUrl: "/AvatarGirl.png", 
    role: "Officer", 
    winRate: 66.4, 
    isOnline: false 
  },
  { 
    id: "member-104", 
    guildId: "guild-003", 
    username: "L2Legend", 
    avatarUrl: "/AvatarGirl.png", 
    role: "Member", 
    winRate: 62.8, 
    isOnline: true 
  },
  // guild-004 Giga GVT Stakers
  { 
    id: "member-201", 
    guildId: "guild-004", 
    username: "YieldYoda", 
    avatarUrl: "/AvatarGirl.png", 
    role: "Leader", 
    winRate: 68.0, 
    isOnline: true 
  },
  { 
    id: "member-202", 
    guildId: "guild-004", 
    username: "ChessBaron", 
    avatarUrl: "/AvatarGirl.png", 
    role: "Officer", 
    winRate: 65.5, 
    isOnline: false 
  },
  { 
    id: "member-203", 
    guildId: "guild-004", 
    username: "StakeSage", 
    avatarUrl: "/AvatarGirl.png", 
    role: "Member", 
    winRate: 60.9, 
    isOnline: true 
  },
  // guild-005 Meta Cobras
  { 
    id: "member-301", 
    guildId: "guild-005", 
    username: "KingCobraZ", 
    avatarUrl: "/AvatarGirl.png", 
    role: "Leader", 
    winRate: 73.4, 
    isOnline: true 
  },
  { 
    id: "member-302", 
    guildId: "guild-005", 
    username: "HoodedHex", 
    avatarUrl: "/AvatarGirl.png", 
    role: "Officer", 
    winRate: 69.8, 
    isOnline: true 
  },
  { 
    id: "member-303", 
    guildId: "guild-005", 
    username: "SpitfireSol", 
    avatarUrl: "/AvatarGirl.png", 
    role: "Member", 
    winRate: 64.2, 
    isOnline: false 
  },
  // guild-006 Web3 Wizards
  { 
    id: "member-401", 
    guildId: "guild-006", 
    username: "ArchmageAda", 
    avatarUrl: "/AvatarGirl.png", 
    role: "Leader", 
    winRate: 63.5, 
    isOnline: true 
  },
  { 
    id: "member-402", 
    guildId: "guild-006", 
    username: "TetraTom", 
    avatarUrl: "/AvatarGirl.png", 
    role: "Officer", 
    winRate: 60.1, 
    isOnline: false 
  },
  { 
    id: "member-403", 
    guildId: "guild-006", 
    username: "BlockStacker", 
    avatarUrl: "/AvatarGirl.png", 
    role: "Member", 
    winRate: 55.7, 
    isOnline: true 
  },
  // guild-007 Alpha Blitzers
  { 
    id: "member-501", 
    guildId: "guild-007", 
    username: "BlitzBella", 
    avatarUrl: "/AvatarGirl.png", 
    role: "Leader", 
    winRate: 67.3, 
    isOnline: true 
  },
  { 
    id: "member-502", 
    guildId: "guild-007", 
    username: "QuickDraw", 
    avatarUrl: "/AvatarGirl.png", 
    role: "Officer", 
    winRate: 62.4, 
    isOnline: false 
  },
  { 
    id: "member-503", 
    guildId: "guild-007", 
    username: "TurboTrey", 
    avatarUrl: "/AvatarGirl.png", 
    role: "Member", 
    winRate: 58.6, 
    isOnline: 
    true }
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
  {
    id: "chat-004",
    guildId: "guild-002",
    username: "ViperKing",
    message: "Are we matching tonight for tournament bracket?",
  },
  {
    id: "chat-005",
    guildId: "guild-002",
    username: "SnakeGod99",
    message: "Yeah, starting lobby at 8 PM UTC.",
  },
  {
    id: "chat-006",
    guildId: "guild-002",
    username: "VenomHunter",
    message: "Count me in, let's stake 100 GVT.",
  },
  { 
    id: "chat-007", 
    guildId: "guild-003", 
    username: "GasLordKai", 
    message: "Bracket opens at 9 PM, everyone staked up?" 
  },
  { 
    id: "chat-008", 
    guildId: "guild-003", 
    username: "L2Legend", 
    message: "Ready. Bringing the 500 GVT stake." 
  },
  { 
    id: "chat-009", 
    guildId: "guild-004", 
    username: "YieldYoda", 
    message: "Chess scrims in 30 mins, bring your best openings." 
  },
  { 
    id: "chat-010", 
    guildId: "guild-004", 
    username: "StakeSage", 
    message: "Dues are in. Treasury looking healthy." 
  },
  { 
    id: "chat-011", 
    guildId: "guild-005", 
    username: "KingCobraZ", 
    message: "Full roster tonight. No excuses." 
  },
  { 
    id: "chat-012", 
    guildId: "guild-005", 
    username: "HoodedHex", 
    message: "Warm-up lobby is live." 
  },
  { 
    id: "chat-013", 
    guildId: "guild-006", 
    username: "ArchmageAda", 
    message: "Tetris tourney sign-ups close at midnight." 
  },
  { 
    id: "chat-014", 
    guildId: "guild-007", 
    username: "BlitzBella", 
    message: "Speed rounds at 7 PM, don't be late." 
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
  {
    id: "battle-003",
    guildId: "guild-002",
    opponentName: "Eth Warriors",
    stakeAmount: 500,
    currency: "GVT",
    scheduleLabel: "Tonight, 8:30 PM",
  },
  {
    id: "battle-004",
    guildId: "guild-002",
    opponentName: "Meta Cobras",
    stakeAmount: 1600,
    currency: "GVT",
    scheduleLabel: "Tomorrow, 9:00 PM",
  },
  {
    id: "battle-004",
    guildId: "guild-003",
    opponentName: "Cyber Serpents",
    stakeAmount: 500,
    currency: "GVT",
    scheduleLabel: "Tonight, 8:30 PM",
  },
  {
    id: "battle-005",
    guildId: "guild-003",
    opponentName: "Node Knights",
    stakeAmount: 1200,
    currency: "GVT",
    scheduleLabel: "Friday, 7:00 PM",
  },
  {
    id: "battle-006",
    guildId: "guild-004",
    opponentName: "Web3 Wizards",
    stakeAmount: 700,
    currency: "GVT",
    scheduleLabel: "Tomorrow, 6:00 PM",
  },
  {
    id: "battle-007",
    guildId: "guild-005",
    opponentName: "Block Vipers",
    stakeAmount: 1500,
    currency: "GVT",
    scheduleLabel: "Tonight, 10:00 PM",
  },
  {
    id: "battle-008",
    guildId: "guild-006",
    opponentName: "Pixel Pythons",
    stakeAmount: 400,
    currency: "GVT",
    scheduleLabel: "Saturday, 5:00 PM",
  },
  {
    id: "battle-009",
    guildId: "guild-007",
    opponentName: "Giga GVT Stakers",
    stakeAmount: 60,
    currency: "GVT",
    scheduleLabel: "Tomorrow, 7:3<PASSWORD>",
  }
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
  {
    id: "war-001",
    guildId: "guild-002",
    opponentName: "Eth Warriors",
    opponentIconUrl: "/guilds/ethWarriorsImage.png",
    ourScore: 14,
    opponentScore: 12,
    stakeAmount: 2000,
    currency: "GVT",
    timeRemainingLabel: "1 Hour 20 Mins Remaining in Bracket Matchup",
  },
  {
    id: "war-002",
    guildId: "guild-003",
    opponentName: "Cyber Serpents",
    opponentIconUrl: "/guilds/cyberSerpentImage.png",
    ourScore: 12,
    opponentScore: 14,
    stakeAmount: 2000,
    currency: "GVT",
    timeRemainingLabel: "1 Hour 20 Mins Remaining in Bracket Matchup",
  },
  {
    id: "war-003",
    guildId: "guild-005",
    opponentName: "Block Vipers",
    opponentIconUrl: "/guilds/blockViperImage.png",
    ourScore: 9,
    opponentScore: 9,
    stakeAmount: 1500,
    currency: "GVT",
    timeRemainingLabel: "45 Mins Remaining in Bracket Matchup",
  },
  {
    id: "war-004",
    guildId: "guild-004",
    opponentName: "Web3 Wizards",
    opponentIconUrl: "/guilds/web3WizardImage.png",
    ourScore: 6,
    opponentScore: 4,
    stakeAmount: 700,
    currency: "GVT",
    timeRemainingLabel: "3 Hours Remaining in Bracket Matchup",
  },
  {
    id: "war-005",
    guildId: "guild-006",
    opponentName: "Block Vipers",
    opponentIconUrl: "/guilds/gigaGVTImage.png",
    ourScore: 9,
    opponentScore: 9,
    stakeAmount: 1500,
    currency: "GVT",
    timeRemainingLabel: "45 Mins Remaining in Bracket Matchup",
  },
  {
    id: "war-006",
    guildId: "guild-007",
    opponentName: "Web3 Wizards",
    opponentIconUrl: "/guilds/web3WizardImage.png",
    ourScore: 6,
    opponentScore: 4,
    stakeAmount: 700,
    currency: "GVT",
    timeRemainingLabel: "3 Hours Remaining in Bracket Matchup",
  }
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
  {
    id: "warbattle-003",
    guildId: "guild-002",
    opponentName: "Web3 Wizards",
    opponentShortName: "W3W",
    opponentIconUrl: "/guilds/web3WizardImage.png",
    scheduleLabel: "Jan 26, 9:00 PM UTC",
    gameType: "Chess Arena",
    stakeAmount: 1000,
    currency: "GVT",
  },
  {
    id: "warbattle-004",
    guildId: "guild-002",
    opponentName: "Meta Cobras",
    opponentShortName: "MC",
    opponentIconUrl: "/guilds/metaCobraImage.png",
    scheduleLabel: "Jan 28, 10:30 PM UTC",
    gameType: "Snake Xenzia",
    stakeAmount: 900,
    currency: "GVT",
  },
  {
    id: "warbattle-007",
    guildId: "guild-003",
    opponentName: "Cyber Serpents",
    opponentShortName: "CS",
    opponentIconUrl: "/guilds/cyberSerpentImage.png",
    scheduleLabel: "Jan 31, 9:00 PM UTC",
    gameType: "Snake Xenzia",
    stakeAmount: 1500,
    currency: "GVT",
  },
  // guild-004 Giga GVT Stakers
  {
    id: "warbattle-008",
    guildId: "guild-004",
    opponentName: "Node Knights",
    opponentShortName: "NK",
    opponentIconUrl: "/guilds/gigaGVTImage.png",
    scheduleLabel: "Jan 27, 8:00 PM UTC",
    gameType: "Chess Arena",
    stakeAmount: 900,
    currency: "GVT",
  },
  {
    id: "warbattle-009",
    guildId: "guild-004",
    opponentName: "Eth Warriors",
    opponentShortName: "EW",
    opponentIconUrl: "/guilds/ethWarriorsImage.png",
    scheduleLabel: "Jan 30, 10:00 PM UTC",
    gameType: "Chess Arena",
    stakeAmount: 1100,
    currency: "GVT",
  },
  // guild-005 Meta Cobras (second battle)
  {
    id: "warbattle-010",
    guildId: "guild-005",
    opponentName: "Cyber Serpents",
    opponentShortName: "CS",
    opponentIconUrl: "/guilds/cyberSerpentImage.png",
    scheduleLabel: "Feb 1, 9:30 PM UTC",
    gameType: "Snake Xenzia",
    stakeAmount: 1600,
    currency: "GVT",
  },
  // guild-006 Web3 Wizards
  {
    id: "warbattle-011",
    guildId: "guild-006",
    opponentName: "Pixel Pythons",
    opponentShortName: "PP",
    opponentIconUrl: "/guilds/pixelPythonImage.png",
    scheduleLabel: "Jan 28, 7:00 PM UTC",
    gameType: "Tetris Classic",
    stakeAmount: 400,
    currency: "GVT",
  },
  {
    id: "warbattle-012",
    guildId: "guild-006",
    opponentName: "Alpha Blitzers",
    opponentShortName: "AB",
    opponentIconUrl: "/guilds/alphaBlitzerImage.png",
    scheduleLabel: "Feb 3, 8:30 PM UTC",
    gameType: "Tetris Classic",
    stakeAmount: 450,
    currency: "GVT",
  },
  // guild-007 Alpha Blitzers
  {
    id: "warbattle-013",
    guildId: "guild-007",
    opponentName: "Giga GVT Stakers",
    opponentShortName: "GG",
    opponentIconUrl: "/guilds/gigaGVTImage.png",
    scheduleLabel: "Jan 26, 6:00 PM UTC",
    gameType: "Classic Arena",
    stakeAmount: 600,
    currency: "GVT",
  },
  {
    id: "warbattle-014",
    guildId: "guild-007",
    opponentName: "Web3 Wizards",
    opponentShortName: "W3W",
    opponentIconUrl: "/guilds/web3WizardImage.png",
    scheduleLabel: "Feb 2, 9:00 PM UTC",
    gameType: "Classic Arena",
    stakeAmount: 500,
    currency: "GVT",
  },
  // guild-008 Block Vipers
  {
    id: "warbattle-015",
    guildId: "guild-003",
    opponentName: "Meta Cobras",
    opponentShortName: "MC",
    opponentIconUrl: "/guilds/metaCobraImage.png",
    scheduleLabel: "Jan 27, 10:00 PM UTC",
    gameType: "Snake Xenzia",
    stakeAmount: 1300,
    currency: "GVT",
  },
  {
    id: "warbattle-016",
    guildId: "guild-004",
    opponentName: "Eth Warriors",
    opponentShortName: "EW",
    opponentIconUrl: "/guilds/ethWarriorsImage.png",
    scheduleLabel: "Jan 31, 8:00 PM UTC",
    gameType: "Snake Xenzia",
    stakeAmount: 1000,
    currency: "GVT",
  },
  // guild-009 Pixel Pythons
  {
    id: "warbattle-017",
    guildId: "guild-005",
    opponentName: "Web3 Wizards",
    opponentShortName: "W3W",
    opponentIconUrl: "/guilds/web3WizardImage.png",
    scheduleLabel: "Jan 28, 7:00 PM UTC",
    gameType: "Tetris Classic",
    stakeAmount: 400,
    currency: "GVT",
  },
  {
    id: "warbattle-018",
    guildId: "guild-005",
    opponentName: "Alpha Blitzers",
    opponentShortName: "AB",
    opponentIconUrl: "/guilds/alphaBlitzerImage.png",
    scheduleLabel: "Feb 4, 9:00 PM UTC",
    gameType: "Classic Arena",
    stakeAmount: 550,
    currency: "GVT",
  },
  // guild-010 Node Knights
  {
    id: "warbattle-019",
    guildId: "guild-004",
    opponentName: "Giga GVT Stakers",
    opponentShortName: "GG",
    opponentIconUrl: "/guilds/gigaGVTImage.png",
    scheduleLabel: "Jan 27, 8:00 PM UTC",
    gameType: "Chess Arena",
    stakeAmount: 900,
    currency: "GVT",
  },
  {
    id: "warbattle-020",
    guildId: "guild-006",
    opponentName: "Cyber Serpents",
    opponentShortName: "CS",
    opponentIconUrl: "/guilds/cyberSerpentImage.png",
    scheduleLabel: "Jan 30, 8:00 PM UTC",
    gameType: "Chess Arena",
    stakeAmount: 1200,
    currency: "GVT",
  }
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
  { 
    id: "history-004", 
    guildId: "guild-001", 
    opponentName: "Web3 Wizards", 
    arena: "Tetris Arena", 
    result: "Victory", 
    amount: 900, 
    currency: "GVT" 
  },
  { 
    id: "history-005", 
    guildId: "guild-001", 
    opponentName: "Meta Cobras", 
    arena: "Snake Pool Arena", 
    result: "Defeat", 
    amount: -1100, 
    currency: "GVT" 
  },
  { 
    id: "history-006", 
    guildId: "guild-001", 
    opponentName: "Node Knights", 
    arena: "Chess Arena", 
    result: "Victory", 
    amount: 1500, 
    currency: "GVT" 
  },
  { 
    id: "history-007", 
    guildId: "guild-002", 
    opponentName: "Giga GVT Stakers", 
    arena: "Chess Arena", 
    result: "Victory", 
    amount: 1000, 
    currency: "GVT" 
  },
  { 
    id: "history-008", 
    guildId: "guild-002", 
    opponentName: "Meta Cobras", 
    arena: "Snake Pool Arena", 
    result: "Defeat", 
    amount: -700, 
    currency: "GVT" 
  },
  { 
    id: "history-009", 
    guildId: "guild-003", 
    opponentName: "Alpha Blitzers", 
    arena: "Chess Arena", 
    result: "Victory", 
    amount: 800, 
    currency: "GVT" 
  },
  { 
    id: "history-010", 
    guildId: "guild-004", 
    opponentName: "Eth Warriors", 
    arena: "Snake Pool Arena", 
    result: "Victory", 
    amount: 1600, 
    currency: "GVT" 
  },
  { 
    id: "history-011", 
    guildId: "guild-005", 
    opponentName: "Cyber Serpents", 
    arena: "Snake Pool Arena", 
    result: "Defeat", 
    amount: -1100, 
    currency: "GVT" 
  },
  { 
    id: "history-012", 
    guildId: "guild-006", 
    opponentName: "Pixel Pythons", 
    arena: "Tetris Arena", 
    result: "Victory", 
    amount: 500, 
    currency: "GVT" 
  },
  { 
    id: "history-013", 
    guildId: "guild-007", 
    opponentName: "Web3 Wizards", 
    arena: "Classic Arena", 
    result: "Defeat", 
    amount: -400, 
    currency: "GVT" 
  }
];

// ---------------------------------------------------------------------------
// Treasury income breakdown
// ---------------------------------------------------------------------------
 
export const mockIncomeBreakdown: IncomeBreakdownItem[] = [
  { id: "income-001", guildId: "guild-001", label: "Match Winnings", percent: 65, amount: 29700, currency: "GVT" },
  { id: "income-002", guildId: "guild-001", label: "Member Dues", percent: 20, amount: 9100, currency: "GVT" },
  { id: "income-003", guildId: "guild-001", label: "Tournament Prizes", percent: 15, amount: 6800, currency: "GVT" },
  { id: "income-004", guildId: "guild-002", label: "Match Winnings", percent: 60, amount: 22900, currency: "GVT" },
  { id: "income-005", guildId: "guild-002", label: "Member Dues", percent: 25, amount: 9500, currency: "GVT" },
  { id: "income-006", guildId: "guild-002", label: "Tournament Prizes", percent: 15, amount: 5800, currency: "GVT" },
  { id: "income-007", guildId: "guild-003", label: "Match Winnings", percent: 55, amount: 17800, currency: "GVT" },
  { id: "income-008", guildId: "guild-003", label: "Member Dues", percent: 30, amount: 9700, currency: "GVT" },
  { id: "income-009", guildId: "guild-003", label: "Tournament Prizes", percent: 15, amount: 4900, currency: "GVT" },
  { id: "income-010", guildId: "guild-004", label: "Match Winnings", percent: 62, amount: 17400, currency: "GVT" },
  { id: "income-011", guildId: "guild-004", label: "Member Dues", percent: 23, amount: 6500, currency: "GVT" },
  { id: "income-012", guildId: "guild-004", label: "Tournament Prizes", percent: 15, amount: 4200, currency: "GVT" },
  { id: "income-013", guildId: "guild-005", label: "Match Winnings", percent: 62, amount: 17400, currency: "GVT" },
  { id: "income-014", guildId: "guild-005", label: "Member Dues", percent: 23, amount: 6500, currency: "GVT" },
  { id: "income-015", guildId: "guild-005", label: "Tournament Prizes", percent: 15, amount: 4200, currency: "GVT" },
  { id: "income-016", guildId: "guild-006", label: "Match Winnings", percent: 62, amount: 17400, currency: "GVT" },
  { id: "income-017", guildId: "guild-006", label: "Member Dues", percent: 23, amount: 6500, currency: "GVT" },
  { id: "income-018", guildId: "guild-006", label: "Tournament Prizes", percent: 15, amount: 4200, currency: "GVT" },
  { id: "income-019", guildId: "guild-007", label: "Match Winnings", percent: 62, amount: 17400, currency: "GVT" },
  { id: "income-020", guildId: "guild-007", label: "Member Dues", percent: 23, amount: 6500, currency: "GVT" },
  { id: "income-021", guildId: "guild-007", label: "Tournament Prizes", percent: 15, amount: 4200, currency: "GVT" },
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
  { 
    id: "txn-006", 
    guildId: "guild-002", 
    type: "Member Monthly Dues", 
    member: "VenomHunter", 
    amount: 50, 
    currency: "GVT", 
    dateLabel: "Jan 12" 
  },
  { 
    id: "txn-007", 
    guildId: "guild-002", 
    type: "Match Winnings (GvG)", 
    member: "Guild Pool", 
    amount: 1200, 
    currency: "GVT", 
    dateLabel: "Jan 10" },
  { 
    id: "txn-008", 
    guildId: "guild-002", 
    type: "Payout Distribution", 
    member: "CyberCobra", 
    amount: -300, 
    currency: "GVT", 
    dateLabel: "Jan 8" },
  { 
    id: "txn-009", 
    guildId: "guild-002", 
    type: "Match Stake Lost (GvG)", 
    member: "Guild Pool", 
    amount: -800, 
    currency: "GVT", 
    dateLabel: "Jan 5" },
  { 
    id: "txn-010", 
    guildId: "guild-003", 
    type: "Match Winnings (GvG)", 
    member: "Guild Pool", 
    amount: 1000, 
    currency: "GVT", 
    dateLabel: "Today" },
  { 
    id: "txn-011", 
    guildId: "guild-003", 
    type: "Member Monthly Dues", 
    member: "GasLordKai", 
    amount: 40, 
    currency: "GVT", 
    dateLabel: "Yesterday" },
  { 
    id: "txn-012", 
    guildId: "guild-003", 
    type: "Payout Distribution", 
    member: "MerkleMike", 
    amount: -250, 
    currency: "GVT", 
    dateLabel: "Jan 20" },
  { 
    id: "txn-013", 
    guildId: "guild-004", 
    type: "Match Winnings (GvG)", 
    member: "Guild Pool", 
    amount: 800, 
    currency: "GVT", 
   dateLabel: "Yesterday" 
  },
  { 
    id: "txn-014", 
    guildId: "guild-004", 
    type: "Member Monthly Dues", 
    member: "StakeSage", 
    amount: 75, 
    currency: "GVT", 
    dateLabel: "Jan 22" 
  },
  { 
    id: "txn-015", 
    guildId: "guild-005", 
    type: "Match Winnings (GvG)", 
    member: "Guild Pool", 
    amount: 1600, 
    currency: "GVT", 
    dateLabel: "Today" 
  },
  { 
    id: "txn-016", 
    guildId: "guild-005", 
    type: "Tournament Prize Pool", 
    member: "Team MC", 
    amount: 3500, 
    currency: "GVT", 
    dateLabel: "Jan 17" 
  },
  { 
    id: "txn-017", 
    guildId: "guild-005", 
    type: "Hardware Expense Payout", 
    member: "HoodedHex", 
    amount: -200, 
    currency: "GVT", 
    dateLabel: "Jan 14" 
  },
  { 
    id: "txn-018", 
    guildId: "guild-006", 
    type: "Member Monthly Dues", 
    member: "StakeSage", 
    amount: 175, 
    currency: "GVT", 
    dateLabel: "Jan 22" 
  }, 
  { 
    id: "txn-019", 
    guildId: "guild-006", 
    type: "Match Winnings (GvG)", 
    member: "Guild Pool", 
    amount: 2600, 
    currency: "GVT", 
    dateLabel: "Today" },
  
    { 
    id: "txn-020", 
    guildId: "guild-006", 
    type: "Tournament Prize Pool", 
    member: "Team MC", 
    amount: -3530, 
    currency: "GVT", 
    dateLabel: "Jan 17" 
  },
  { 
    id: "txn-021", 
    guildId: "guild-006", 
    type: "Hardware Expense Payout", 
    member: "HoodedHex", 
    amount: 200, 
    currency: "GVT", 
    dateLabel: "Jan 14" 
  },
  { 
    id: "txn-022", 
    guildId: "guild-007", 
    type: "Member Monthly Dues", 
    member: "StakeSage", 
    amount: 5655, 
    currency: "GVT", 
    dateLabel: "Jan 22" 
  },
  { 
    id: "txn-023", 
    guildId: "guild-007", 
    type: "Match Winnings (GvG)", 
    member: "Guild Pool", 
    amount: 165650, 
    currency: "GVT", 
    dateLabel: "Today" },
  
    { 
    id: "txn-024", 
    guildId: "guild-007", 
    type: "Tournament Prize Pool", 
    member: "Team MC", 
    amount: 350, 
    currency: "GVT", 
    dateLabel: "Jan 17" 
  },
  { 
    id: "txn-0124", 
    guildId: "guild-007", 
    type: "Hardware Expense Payout", 
    member: "HoodedHex", 
    amount: -700, 
    currency: "GVT", 
    dateLabel: "Jan 14" 
  }
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
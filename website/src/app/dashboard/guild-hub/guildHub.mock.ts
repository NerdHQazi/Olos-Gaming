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
}

export interface ApplicantStats {
  winRate: number; // percentage, e.g. 74.8
  totalMatches: number;
  gvtEarned: number;
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
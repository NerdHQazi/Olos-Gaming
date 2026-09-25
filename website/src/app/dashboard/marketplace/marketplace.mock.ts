// ─────────────────────────────────────────────
// OLOS Marketplace – types + mock data
// ─────────────────────────────────────────────

/** 1 GVT = $0.10 USD (matches the prices shown in the UI) */
export const GVT_USD_RATE = 0.1;

// ── Types ────────────────────────────────────

export type Rarity = "COMMON" | "RARE" | "EPIC" | "LEGENDARY";

export type MarketplaceCategory =
  | "all"
  | "skins"
  | "power-ups"
  | "boosts"
  | "bundles"
  | "limited-edition";

export interface CategoryTab {
  id: MarketplaceCategory;
  label: string;
}

export interface MarketplaceItem {
  id: string;
  name: string;
  badge: Rarity;
  category: Exclude<MarketplaceCategory, "all">;
  priceGvt: number;
  priceUsd: number;
  imageUrl: string;
  isLimitedEdition?: boolean;
  collection: string;
  createdBy: string;
}

export interface PromoBanner {
  id: string;
  badge: string;
  title: string;
  name: string;
  description: string;
  imageUrl: string;
  /** ISO timestamp – drive the countdown from this */
  endsAt: string;
  ctaLabel?: string;
  bundleItemIds?: string[];
  collection: string;
  createdBy: string;
  priceGvt: number;
  priceUsd: number;
}

export interface TrendingItem {
  rank: number;
  itemId?: string;
  name: string;
  volumeGvt: number;
}

export interface RecentSale {
  id: string;
  itemName: string;
  priceGvt: number;
  /** Truncated wallet address, as displayed in the UI */
  buyerAddress: string;
  thumbnailUrl?: string;
  soldAt: string; // ISO timestamp
}

export interface MarketplaceData {
  promo: PromoBanner;
  categories: CategoryTab[];
  items: MarketplaceItem[];
  trending: TrendingItem[];
  recentlySold: RecentSale[];
}

// ── Helpers ──────────────────────────────────

const gvtToUsd = (gvt: number): number =>
  Math.round(gvt * GVT_USD_RATE * 100) / 100;

/** Promo countdown that starts at 14h 35m 02s from "now" (matches the screenshot) */
const promoEndsAt = new Date(
  Date.now() + (14 * 3600 + 35 * 60 + 2) * 1000
).toISOString();

const minutesAgo = (m: number): string =>
  new Date(Date.now() - m * 60 * 1000).toISOString();

// ── Mock data ────────────────────────────────

export const promoBanner: PromoBanner = {
  id: "promo-genesis-viper-elite",
  badge: "LEGENDARY",
  name: 'Neon Viper Skin',
  title: "Genesis Viper Elite Pack",
  collection: 'Genesis',
  description:
    "Unlock premium neon visual upgrades and 3 powerful consumable boosts in one limited edition Web3 drop bundle.",
  imageUrl: "/snakeNft.png",
  endsAt: promoEndsAt,
  priceGvt: 120,
  priceUsd: gvtToUsd(120),
  ctaLabel: "Grab the Pack",
  bundleItemIds: ["item-001", "item-002", "item-003"],
  createdBy: "CyberStrike Studios",
};

export const categoryTabs: CategoryTab[] = [
  { id: "all", label: "All" },
  { id: "skins", label: "Skins" },
  { id: "power-ups", label: "Power-Ups" },
  { id: "boosts", label: "Boosts" },
  { id: "bundles", label: "Bundles" },
  { id: "limited-edition", label: "Limited Edition" },
];

export const marketplaceItems: MarketplaceItem[] = [
  {
    id: "item-001",
    name: "Neon Cobra Fang Skin",
    badge: "LEGENDARY",
    collection: "Genesis",
    category: "skins",
    priceGvt: 450,
    priceUsd: gvtToUsd(450), // 45
    imageUrl: "/neonCobraFang.png",
    createdBy: "CyberStrike Studios",
  },
  {
    id: "item-002",
    name: "Hyper Speed Boost v2",
    collection: "Hyper",
    badge: "EPIC",
    category: "boosts",
    priceGvt: 120,
    priceUsd: gvtToUsd(120), // 12
    imageUrl: "/hyperSpeedBoost.png",
    createdBy: "CyberStrike Studios",
  },
  {
    id: "item-003",
    name: "Cyber Armor Shield",
    collection: "Cyber",
    badge: "RARE",
    category: "power-ups",
    priceGvt: 80,
    priceUsd: gvtToUsd(80), // 8
    imageUrl: "/cyberArmorShield.png",
    createdBy: "CyberStrike Studios",
  },
  {
    id: "item-004",
    name: "Lethal Poison Vial",
    collection: "Genesis",
    badge: "COMMON",
    category: "power-ups",
    priceGvt: 25,
    priceUsd: gvtToUsd(25), // 2.5
    imageUrl: "/lethalPoisonVial.png",
    createdBy: "CyberStrike Studios",
  },
  {
    id: "item-005",
    name: "Quantum Portal Key",
    collection: "Quantum",
    badge: "EPIC",
    category: "limited-edition",
    priceGvt: 250,
    priceUsd: gvtToUsd(250), // 25
    imageUrl: "/quantumPortalKey.png",
    isLimitedEdition: true,
    createdBy: "CyberStrike Studios",
  },
  {
    id: "item-006",
    name: "Gold Snake Crown",
    collection: "Genesis",
    badge: "LEGENDARY",
    category: "skins",
    priceGvt: 750,
    priceUsd: gvtToUsd(750), // 75
    imageUrl: "/goldSnakeCrown.png",
    createdBy: "CyberStrike Studios",
  },
];

export const trendingItems: TrendingItem[] = [
  { rank: 1, name: "Viper Spine Tail", volumeGvt: 1240 },
  { rank: 2, name: "Chess King Avatar", volumeGvt: 980 },
  { rank: 3, name: "Bounce Speed Trail", volumeGvt: 850 },
];

export const recentlySold: RecentSale[] = [
  {
    id: "sale-001",
    itemName: "Tetris Matrix Frame",
    priceGvt: 120,
    buyerAddress: "0x32A...E4",
    thumbnailUrl: "/tetris.png",
    soldAt: minutesAgo(3),
  },
  {
    id: "sale-002",
    // Name is cut off in the screenshot ("Jack P...") – placeholder guess
    itemName: "Jack Rocket Boots",
    priceGvt: 350,
    buyerAddress: "0x89D...A1",
    thumbnailUrl: "/hexaIcon.png",
    soldAt: minutesAgo(12),
  },
  {
    id: "sale-003",
    itemName: "Snake Pearl Eye",
    priceGvt: 45,
    buyerAddress: "0xF21...CC",
    thumbnailUrl: "/snakeNft.png",
    soldAt: minutesAgo(27),
  },
];

/** Single object if your page/API expects one payload */
export const marketplaceMock: MarketplaceData = {
  promo: promoBanner,
  categories: categoryTabs,
  items: marketplaceItems,
  trending: trendingItems,
  recentlySold,
};

// ── UI helpers ───────────────────────────────

/** Rarity badge colours matching the screenshot */
export const rarityStyles: Record<Rarity, { label: string; color: string; bg: string }> = {
  COMMON: { label: "COMMON", color: "#34d399", bg: "rgba(52, 211, 153, 0.12)" },
  RARE: { label: "RARE", color: "#60a5fa", bg: "rgba(96, 165, 250, 0.12)" },
  EPIC: { label: "EPIC", color: "#a78bfa", bg: "rgba(167, 139, 250, 0.12)" },
  LEGENDARY: { label: "LEGENDARY", color: "#fbbf24", bg: "rgba(251, 191, 36, 0.12)" },
};

export const filterItems = (
  items: MarketplaceItem[],
  category: MarketplaceCategory
): MarketplaceItem[] =>
  category === "all" ? items : items.filter((i) => i.category === category);

/** Splits remaining ms into the "14h : 35m : 02s" format shown in the banner */
export const formatCountdown = (endsAt: string, now: number = Date.now()): string => {
  const total = Math.max(0, Math.floor((new Date(endsAt).getTime() - now) / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${h}h : ${m}m : ${String(s).padStart(2, "0")}s`;
};

export const formatUsd = (usd: number): string =>
  `$${Number.isInteger(usd) ? usd : usd.toFixed(1)} USD`;




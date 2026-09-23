// nftGalleryMockData.ts
// Mock data for the Player NFT Gallery UI

export type NFTStatus = "OWNED" | "FOR_SALE";

export interface NFTTrait {
  label: string;
  value: string;
  rarityPercent: number; // e.g. 10 -> "10% have this"
}

export interface NFT {
    id: string;
    tokenName: string;
    tokenNumber: string;
    collection: string;
    imageUrl: string;
    floorPrice: number;
    currency: string;
    status: NFTStatus;
    ownerAddress: string;
    contractAddress: string;
    rarityScore: number;
    rarityPercentile: number; // e.g. 5 -> "Top 5%"
    traits: NFTTrait[];
    lastSalePrice: number;
}

export interface PlayerProfile {
  displayName: string;
  walletAddress: string;
  avatarUrl: string;
  collectionValue: number;
  currency: string;
}

export type FilterTab = "MY_NFTS" | "BROWSE_ALL" | "RECENTLY_MINTED";

export type SortOption =
  | "HIGHEST_FLOOR"
  | "LOWEST_FLOOR"
  | "RECENTLY_ADDED"
  | "NAME_A_Z";

export interface CollectionOption {
  id: string;
  label: string;
}

// ---------------------------------------------------------------------------
// Player profile
// ---------------------------------------------------------------------------

export const mockPlayerProfile: PlayerProfile = {
  displayName: "Player NFT Gallery",
  walletAddress: "0x7135..DB5D",
  avatarUrl: "/Avatar.png",
  collectionValue: 1840.0,
  currency: "GVT",
};

// ---------------------------------------------------------------------------
// Collections (for the "Collection: All" filter dropdown)
// ---------------------------------------------------------------------------

export const mockCollections: CollectionOption[] = [
  { id: "all", label: "All" },
  { id: "serpent-lords", label: "Serpent Lords" },
  { id: "genesis-boosts", label: "Genesis Boosts" },
  { id: "chess-masters", label: "Chess Masters" },
  { id: "tetris-masters", label: "Tetris Masters" },
];

// ---------------------------------------------------------------------------
// NFTs
// ---------------------------------------------------------------------------

export const mockNFTs: NFT[] = [
  {
    id: "nft-001",
    tokenName: "Serpent Lords",
    tokenNumber: "#4891",
    collection: "serpent-lords",
    imageUrl: "/nft-4891.png",
    floorPrice: 380,
    currency: "GVT",
    status: "OWNED",
    ownerAddress: "0x7135..DB5D",
    contractAddress: "0x844a..2022",
    rarityScore: 94.2,
    rarityPercentile: 5,
    traits: [{ label: "Mouth", value: "Venom Fang", rarityPercent: 10 }],
    lastSalePrice: 410,
  },
  {
    id: "nft-002",
    tokenName: "Serpent Lords",
    tokenNumber: "#1023",
    collection: "serpent-lords",
    imageUrl: "/nft-1023.png",
    floorPrice: 410,
    currency: "GVT",
    status: "OWNED",
    ownerAddress: "0x7135..DB5D",
    contractAddress: "0x844a..2022",
    rarityScore: 94.2,
    rarityPercentile: 5,
    traits: [{ label: "Mouth", value: "Venom Fang", rarityPercent: 10 }],
    lastSalePrice: 410,
  },
  {
    id: "nft-003",
    tokenName: "Genesis Boosts",
    tokenNumber: "#0552",
    collection: "genesis-boosts",
    imageUrl: "/nft-0552.png",
    floorPrice: 90,
    currency: "GVT",
    status: "FOR_SALE",
    ownerAddress: "0x7135..DB5D",
    contractAddress: "0x844a..2022",
    rarityScore: 94.2,
    rarityPercentile: 5,
    traits: [{ label: "Mouth", value: "Venom Fang", rarityPercent: 10 }],
    lastSalePrice: 410,
  },
  {
    id: "nft-004",
    tokenName: "Chess Masters",
    tokenNumber: "#7742",
    collection: "chess-masters",
    imageUrl: "/nft-7742.png",
    floorPrice: 250,
    currency: "GVT",
    status: "OWNED",
    ownerAddress: "0x7135..DB5D",
    contractAddress: "0x844a..2022",
    rarityScore: 94.2,
    rarityPercentile: 5,
    traits: [{ label: "Mouth", value: "Venom Fang", rarityPercent: 10 }],
    lastSalePrice: 410,
  },
  {
    id: "nft-005",
    tokenName: "Serpent Lords",
    tokenNumber: "#1190",
    collection: "serpent-lords",
    imageUrl: "/nft-1190.png",
    floorPrice: 350,
    currency: "GVT",
    status: "OWNED",
    ownerAddress: "0x7135..DB5D",
    contractAddress: "0x844a..2022",
    rarityScore: 94.2,
    rarityPercentile: 5,
    traits: [{ label: "Mouth", value: "Venom Fang", rarityPercent: 10 }],
    lastSalePrice: 410,
  },
  {
    id: "nft-006",
    tokenName: "Tetris Masters",
    tokenNumber: "#2490",
    collection: "tetris-masters",
    imageUrl: "/nft-2490.png",
    floorPrice: 180,
    currency: "GVT",
    status: "FOR_SALE",
    ownerAddress: "0x7135..DB5D",
    contractAddress: "0x844a..2022",
    rarityScore: 94.2,
    rarityPercentile: 5,
    traits: [{ label: "Mouth", value: "Venom Fang", rarityPercent: 10 }],
    lastSalePrice: 410,
  },
  {
    id: "nft-007",
    tokenName: "Serpent Lords",
    tokenNumber: "#9901",
    collection: "serpent-lords",
    imageUrl: "/nft-9901.png",
    floorPrice: 420,
    currency: "GVT",
    status: "OWNED",
    ownerAddress: "0x7135..DB5D",
    contractAddress: "0x844a..2022",
    rarityScore: 94.2,
    rarityPercentile: 5,
    traits: [{ label: "Mouth", value: "Venom Fang", rarityPercent: 10 }],
    lastSalePrice: 410,
  },
  {
    id: "nft-008",
    tokenName: "Genesis Boosts",
    tokenNumber: "#5430",
    collection: "genesis-boosts",
    imageUrl: "/nft-5430.png",
    floorPrice: 95,
    currency: "GVT",
    status: "FOR_SALE",
    ownerAddress: "0x7135..DB5D",
    contractAddress: "0x844a..2022",
    rarityScore: 94.2,
    rarityPercentile: 5,
    traits: [{ label: "Mouth", value: "Venom Fang", rarityPercent: 10 }],
    lastSalePrice: 410,
  },
];

// ---------------------------------------------------------------------------
// Filter tabs & sort options (for rendering the top toolbar)
// ---------------------------------------------------------------------------

export const mockFilterTabs: { id: FilterTab; label: string }[] = [
  { id: "MY_NFTS", label: "My NFTs" },
  { id: "BROWSE_ALL", label: "Browse All" },
  { id: "RECENTLY_MINTED", label: "Recently Minted" },
];

export const mockSortOptions: { id: SortOption; label: string }[] = [
  { id: "HIGHEST_FLOOR", label: "Highest Floor" },
  { id: "LOWEST_FLOOR", label: "Lowest Floor" },
  { id: "RECENTLY_ADDED", label: "Recently Added" },
  { id: "NAME_A_Z", label: "Name (A-Z)" },
];

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

export function getNFTsByCollection(collectionId: string): NFT[] {
  if (collectionId === "all") return mockNFTs;
  return mockNFTs.filter((nft) => nft.collection === collectionId);
}

export function sortNFTs(nfts: NFT[], sortBy: string): NFT[] {
  const sorted = [...nfts];
  switch (sortBy) {
    case "HIGHEST_FLOOR":
      return sorted.sort((a, b) => b.floorPrice - a.floorPrice);
    case "LOWEST_FLOOR":
      return sorted.sort((a, b) => a.floorPrice - b.floorPrice);
    case "NAME_A_Z":
      return sorted.sort((a, b) =>
        `${a.tokenName} ${a.tokenNumber}`.localeCompare(
          `${b.tokenName} ${b.tokenNumber}`
        )
      );
    case "RECENTLY_ADDED":
    default:
      return sorted;
  }
}

export function getOwnedNFTs(): NFT[] {
  return mockNFTs.filter((nft) => nft.status === "OWNED");
}

export function getForSaleNFTs(): NFT[] {
  return mockNFTs.filter((nft) => nft.status === "FOR_SALE");
}
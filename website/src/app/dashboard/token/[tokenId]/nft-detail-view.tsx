'use client'

import Image from 'next/image'
import { useState } from "react";
import type { NFT } from '../token.mock';
import Link from 'next/link';

export default function NFTDetailView({ nft }: { nft: NFT }) {
  const [isListing, setIsListing] = useState(false);

  return (
    <div className="grid grid-cols-[1fr_520px] gap-8 items-start max-lg:grid-cols-1">
      {/* Left: artwork */}
      <div className="flex flex-col gap-3">
        <Image src={`${nft.imageUrl}`} alt={`${nft.tokenName} ${nft.tokenNumber}`} width={720} height={440} className="object-contain rounded-xl border border-[#2A1060] w-full h-auto"  />
        <div className="flex flex-col gap-1">
          <span className="text-[10px] tracking-wide text-[#908FA0] inter-bold">CONTRACT ADDRESS</span>
          <span className="text-[13px] space-mono-regular text-[#20CEEE] break-all">{nft.contractAddress}</span>
        </div>
      </div>

      {/* Right: details */}
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <span className="text-[12px] tracking-wider text-[#20CEEE] inter-bold">
            {nft.collection.toUpperCase()}
          </span>
          <h1 className="text-[30px] text-white inter-extrabold leading-tight max-sm:text-[24px]">
            {nft.tokenName} {nft.tokenNumber}
          </h1>
          <span className="text-[12px] text-[#908FA0] inter-light break-all">
            Owned by <span className="space-mono-regular text-[#20CEEE]">{nft.ownerAddress}</span>
          </span>
        </div>

        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between max-sm:flex-col max-sm:items-start max-sm:gap-2">
            <h3 className="inter-extrabold text-[14px] text-white">Traits &amp; Properties</h3>
            <span className="text-[10px] px-2.5 py-1 rounded-full border border-[#2A1060] bg-[#20CEEE22] text-[#20CEEE] inter-bold whitespace-nowrap">
              Rarity Score: {nft.rarityScore} (Top {nft.rarityPercentile}%)
            </span>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {nft.traits.map((trait) => (
              <div
                key={trait.label}
                className="rounded-lg border border-[#2A1060] bg-[#060A14CC] px-4 py-2.5 min-w-35 max-sm:min-w-[calc(50%-0.3125rem)] max-sm:flex-1"
              >
                <p className="text-[9px] tracking-wide text-[#908FA0] inter-light">
                  {trait.label.toUpperCase()}
                </p>
                <p className="text-[13px] text-white inter-bold mt-0.5">{trait.value}</p>
                <p className="text-[9px] text-[#20CEEE] inter-light mt-0.5">{trait.rarityPercent}% have this</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-[#2A1060] bg-[#060A14CC] px-4 py-3">
            <p className="text-[10px] text-[#908FA0] inter-light">Floor Price</p>
            <p className="text-[16px] text-white space-mono-bold mt-0.5">
              {nft.floorPrice} {nft.currency}
            </p>
          </div>
          <div className="rounded-lg border border-[#2A1060] bg-[#060A14CC] px-4 py-3">
            <p className="text-[10px] text-[#908FA0] inter-light">Last Sale Price</p>
            <p className="text-[16px] text-[#20CEEE] space-mono-bold mt-0.5">
              {nft.lastSalePrice} {nft.currency}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsListing(true)}
          className="w-full bg-[#20CEEE] text-[#050810] py-3 rounded-md inter-extrabold text-[13px] hover:opacity-90 transition-opacity"
        >
          {isListing ? "Listing…" : "List for Sale"}
        </button>

        <div className="grid grid-cols-2 gap-3">
          <Link href={`/dashboard/token/${nft.id}/transfer`} className="border flex justify-center border-[#2A1060] text-white py-2.5 rounded-md inter-bold text-[12px] hover:bg-slate-900/60 transition-colors">
            Transfer NFT
          </Link>
          <button className="border border-[#2A1060] text-white py-2.5 rounded-md inter-bold text-[12px] hover:bg-slate-900/60 transition-colors">
            Share
          </button>
        </div>
      </div>
    </div>
  );
}
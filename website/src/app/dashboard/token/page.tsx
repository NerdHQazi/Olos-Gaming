'use client'

import Image from 'next/image'
import { useState, useRef, useEffect } from "react";
import { Check } from "lucide-react";
import { FilterTab, getOwnedNFTs, mockCollections, mockFilterTabs, mockNFTs, mockPlayerProfile, mockSortOptions, NFT, sortNFTs, SortOption } from './token.mock'
import Link from 'next/link';

export default function TokenPage() {

    const [activeTab, setActiveTab] = useState<FilterTab>("MY_NFTS");
    const [collection, setCollection] = useState<string>("all");
    const [sortBy, setSortBy] = useState<string>("HIGHEST_FLOOR");

    const tabFiltered = activeTab === "MY_NFTS" ? getOwnedNFTs() : mockNFTs;

    const collectionFiltered = collection === "all"
    ? tabFiltered
    : tabFiltered.filter((nft) => nft.collection === collection);

    const visibleNFTs = sortNFTs(collectionFiltered, sortBy);

  return (
    <div className='mt-6 pb-20 flex flex-col gap-5 max-sm:px-1'>
        <div className="flex items-center justify-between max-sm:flex-col max-sm:items-start max-sm:gap-4">
            <div className="flex items-center gap-4">
                <Image src={`${mockPlayerProfile.avatarUrl}`} alt='avatar icon' width={60} height={60} className="shrink-0" />
                <div className="flex flex-col ">
                    <h3 className='inter-extrabold text-[22px] max-sm:text-[18px]'>{mockPlayerProfile.displayName}</h3>
                    <h4 className='space-mono-regular text-[#20CEEE] text-[12px] break-all'>{mockPlayerProfile.walletAddress}</h4>
                </div>
            </div>
            <div className="flex items-center gap-5 max-sm:w-full max-sm:justify-between max-sm:gap-3">
                <div className="flex flex-col ">
                    <h4 className='inter-bold text-[#908FA0] text-[9px]'>COLLECTION VALUE</h4>
                    <h3 className='space-mono-bold text-[22px] max-sm:text-[18px]'>{mockPlayerProfile.collectionValue} {mockPlayerProfile.currency}</h3>
                </div>
                <Link href={`/dashboard/mint`} className='text-[#050810] px-6 py-2 bg-[#20CEEE] rounded-md inter-bold text-[12px] max-sm:px-4 max-sm:shrink-0'>Mint New NFT</Link>
            </div>
        </div>

        <div className="flex items-center justify-between mt-3 max-md:flex-wrap max-md:gap-y-3 max-sm:flex-col max-sm:items-start">
            <div className="flex items-center gap-3 flex-wrap">
                {
                    mockFilterTabs.map((tab) => {
                        const isActive = tab.id === activeTab;
                        return (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={` ${isActive ? "text-white bg-[#7135DB] border-[#2A1060]" : "text-[#A4B7EB] border-[#2A1060]"} border  rounded-md px-4 py-2 inter-bold text-[12px]`} 
                        >

                            {tab.label}
                        </button>
                    )})
                }
            </div>
            <div className="flex items-center gap-3 flex-wrap max-sm:w-full">
                <FilterDropdown
                    label="Collection"
                    options={mockCollections}
                    value={collection}
                    onChange={setCollection}
                />
                <FilterDropdown
                    label="Sort by"
                    options={mockSortOptions}
                    value={sortBy}
                    onChange={setSortBy}
                />
            </div>
        </div>

        <div className="grid grid-cols-4 gap-4 max-xl:grid-cols-3 max-lg:grid-cols-2 max-sm:grid-cols-1">
            {visibleNFTs.map((nft) => (
                <NFTCard key={nft.id} nft={nft} />
            ))}
        </div>
    </div>
  )
}



export interface DropdownOption {
  id: string;
  label: string;
}
 
export interface FilterDropdownProps {
  label: string;
  options: DropdownOption[];
  value: string;
  onChange: (id: string) => void;
}

export function FilterDropdown({
  label,
  options,
  value,
  onChange,
}: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
 
  const selected = options.find((o) => o.id === value) ?? options[0];
 
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);
 
  return (
    <div className="relative inline-block text-[11px] max-sm:flex-1" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex items-center gap-2 rounded-lg border px-3.5 py-2 transition-colors border-[#2A1060] max-sm:w-full max-sm:justify-between
          ${
            open
              ? " bg-slate-900 shadow-[0_0_0_1px_rgba(34,211,238,0.25)]"
              : " bg-slate-900/60 hover:border-slate-500"
              
          }`}
      >
        <span className="text-slate-400">{label}:</span>
        <span className="font-medium text-slate-100">{selected.label}</span>
      </button>
 
      {open && (
        <div
          role="listbox"
          className="absolute right-0 z-20 mt-2 w-52 origin-top-right overflow-hidden rounded-lg border border-slate-700 bg-slate-900 shadow-xl shadow-black/40 animate-[fadeIn_120ms_ease-out] max-sm:w-full"
        >
          <ul className="max-h-64 overflow-y-auto py-1">
            {options.map((opt) => {
              const isSelected = opt.id === selected.id;
              return (
                <li key={opt.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(opt.id);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center justify-between px-3.5 py-2 text-left transition-colors
                      ${
                        isSelected
                          ? "text-white bg-[#7135DB] border-[#2A1060]"
                          : "text-slate-200 hover:bg-slate-800"
                      }`}
                  >
                    <span>{opt.label}</span>
                    {isSelected && <Check size={15} className="text-white" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
 
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export function NFTCard({ nft }: { nft: NFT }) {
  const isOwned = nft.status === "OWNED";

  return (
    <Link href={`/dashboard/token/${nft.id}`} className="rounded-lg border border-[#2A1060] p-2 bg-slate-900/40 overflow-hidden">
        <Image
          src={`${nft.imageUrl}`}
          alt={`${nft.tokenName} ${nft.tokenNumber}`}
          width={280}
          height={180}
          className="object-cover w-full h-auto"
        />


      <div className="p-3 flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-[#908FA0] text-[10px] inter-light">
            {nft.tokenName}
          </span>
          <span
            className={`text-[8px] px-2 py-0.5 rounded-sm inter-extrabold ${
              isOwned
                ? "text-[#20CEEE] border bg-[#20CEEE22] border-[#20CEEE]"
                : "text-[#908FA0] bg-[#222222]"
            }`}
          >
            {isOwned ? "OWNED" : "FOR SALE"}
          </span>
        </div>

        <h4 className="text-white text-[14px] inter-bold">
          {nft.tokenName} {nft.tokenNumber}
        </h4>

        <p className="text-[10px] flex items-center gap-2 inter-light text-[#908FA0]">
          Floor Price:{" "}
          <span className="text-[#20CEEE] text-[12px] space-mono-bold">
            {nft.floorPrice} {nft.currency}
          </span>
        </p>
      </div>
    </Link>
  )
}
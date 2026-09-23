'use client'

import Image from 'next/image'
import Link from 'next/link';
import { useEffect, useState } from 'react'
import { marketplaceItems, categoryTabs, promoBanner, trendingItems, recentlySold, filterItems, MarketplaceCategory } from './marketplace.mock'

const pad = (n: number) => String(n).padStart(2, "0");

export default function page() {

    const { hours, minutes, seconds, isExpired } = useCountdown(promoBanner.endsAt);

    const [activeTab, setActiveTab] = useState<MarketplaceCategory>("all");

  return (
    <div className="w-full pb-20 pt-4 inter-normal flex flex-col gap-5">
        <Link href={`/dashboard/marketplace/${promoBanner.id}`} className="w-full flex justify-between py-3 px-6 rounded-lg border animate-promo-border bg-linear-to-r from-[#1A0A3C99] from-60% to-[#060A14] items-center max-md:flex-col max-md:items-start max-md:gap-4 max-md:px-4">
            <div className="flex flex-col gap-1">
                <div className="bg-[#20CEEE22] px-3 py-1 max-w-25 rounded-md">
                    <h3 className="inter-extrabold text-[9px] text-[#20CEEE] animate-text-blink">SPECIAL PROMO</h3>
                </div>
                <h1 className="plus-jakarta-sans-bold text-[30px] text-white max-sm:text-[24px]">{promoBanner.title}</h1>  
                <p className="inter-light text-[12px] text-[#A4B7EB] max-md:max-w-100">{promoBanner.description}</p>
                <div className="flex space-mono-regular gap-2 text-[12px] flex-wrap">
                    <h3 className={`text-[#20CEEE] ${isExpired ? "" : "animate-text-blink"}`}>{isExpired ? "PROMO ENDED" : "ENDS IN: "}</h3>
                    {!isExpired && (
                    <>
                        <h3 className="text-white font-bold">{pad(hours)}h </h3>
                        <h3>: </h3>
                        <h3 className="text-white font-bold">{pad(minutes)}m </h3>
                        <h3>: </h3>
                        <h3 className="text-white font-bold">{pad(seconds)}s </h3>
                    </>
                    )}
                </div>
            </div> 
            <Image src={`${promoBanner.imageUrl}`} alt="Snake NFT" width={190} height={212} className="max-md:w-32 max-md:h-auto max-md:self-center" />
        </Link>
        <div className='w-full flex gap-6 max-lg:flex-col'>
            <div className='w-full border p-4 gap-2 flex flex-col bg-[#060A14CC] border-[#2A1060] rounded-lg max-sm:p-3'>
                <div className="flex gap-4 items-center max-sm:flex-col max-sm:items-start max-sm:gap-3">
                    <h2 className="text-white inter-extrabold text-[20px]">OLOS Marketplace</h2>
                    <div className="flex gap-2 flex-wrap max-sm:w-full">
                        {categoryTabs.map((tab) => {
                            const isActive = tab.id === activeTab;
                            return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={` ${isActive ? "text-[#050810] bg-[#20CEEE] border-[#20CEEE]" : "text-[#A4B7EB] border-[#2A1060]"} border  rounded-xl px-3 py-1 inter-bold text-[11px]`}
                            >
                                {tab.label}
                            </button>
                            );
                        })}
                    </div>
                </div>
                <div className='grid grid-cols-3 gap-5 max-lg:grid-cols-2 max-sm:grid-cols-1'>
                    {filterItems(marketplaceItems, activeTab).map((item) => (
                        <Link href={`/dashboard/marketplace/${item.id}`} key={item.id} className='border py-4 px-2 gap-2 flex flex-col bg-[#060A14CC] border-[#2A1060] rounded-lg'>
                            <Image src={`${item.imageUrl}`} alt={item.name} width={270} height={150} className="rounded-lg w-full h-auto" />
                            <h4 className={` inter-bold text-[9px] px-2 py-0.5 rounded-2xl w-fit 
                            ${item.badge === "LEGENDARY" && 'text-[#F59E0B] bg-[#F59E0B22]'} 
                            ${item.badge === "EPIC" && 'text-[#A855F7] bg-[#A855F722]'} 
                            ${item.badge === "RARE" && 'text-[#3B82F6] bg-[#3B82F622]'} 
                            ${item.badge === "COMMON" && 'text-[#10B981] bg-[#10B98122]'} 
                            ` }>{item.badge}</h4>

                            <h3 className="inter-bold text-[15px]">{item.name}</h3>
                            <div className='flex items-center gap-1'>
                                <h4 className="space-mono-bold text-[16px] text-[#20CEEE]">{item.priceGvt} GVT</h4>
                                <h4 className="space-mono-regular text-[10px] text-[#908FA0] mt-1">(${item.priceUsd} USD)</h4>
                            </div>
                            <button className="inter-bold text-[12px] bg-[#7135DB] hover:bg-[#3A1A70] text-white py-2 px-4 rounded-md transition duration-300">
                                Buy Now
                            </button>
                        </Link>))}
                </div>
            </div>
            <div className='flex flex-col w-[32%] gap-4 max-lg:w-full'>
                <div className='border p-4 gap-2 flex flex-col bg-[#060A14CC] border-[#2A1060] rounded-lg'>
                    <h2 className="text-white inter-bold text-[14px] mb-2">🔥 Trending Items</h2>
                    {
                        trendingItems.map((item, index) => (
                            <div className="flex gap-4 items-center" key={index}>
                                <h3 className="space-mono-bold text-[#20CEEE] text-[12px]">#{index + 1}</h3>
                                <div className="flex flex-col">
                                    <h4 className="inter-semibold text-[12px]">{item.name}</h4>
                                    <h4 className="inter-light text-[9px] text-[#908FA0]">Vol: {item.volumeGvt} GVT</h4>
                                </div>
                            </div>
                        ))
                    }
                </div>
                <div className='border p-4 gap-3 flex flex-col bg-[#060A14CC] border-[#2A1060] rounded-lg'>
                    <h2 className="text-white inter-bold text-[14px] mb-2">🕒 Recently Sold</h2>
                    {
                        recentlySold.map((item, index) => (
                            <div className="flex gap-4 items-center" key={index}>
                                <Image src={`${item.thumbnailUrl}`} alt="Tetris NFT" width={30} height={30} className="rounded-full shrink-0" />
                                <div className="flex flex-col min-w-0">
                                    <h4 className="inter-semibold text-[12px]">{item.itemName}</h4>
                                    <h4 className="inter-light text-[9px] text-[#908FA0] truncate">Sold for <span className="text-[#20CEEE] inter-bold">{item.priceGvt} GVT</span> to {item.buyerAddress}</h4>
                                </div>
                            </div>

                        ))
                    }
                    
                </div>
            </div>
        </div>
    </div>
  )
}



export interface CountdownParts {
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
  isExpired: boolean;
}

const getParts = (endsAt: string): CountdownParts => {
  const totalSeconds = Math.max(0, Math.floor((new Date(endsAt).getTime() - Date.now()) / 1000));
  return {
    hours: Math.floor(totalSeconds / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    totalSeconds,
    isExpired: totalSeconds === 0,
  };
};

export function useCountdown(endsAt: string): CountdownParts {
  const [parts, setParts] = useState<CountdownParts>({
    hours: 0, minutes: 0, seconds: 0, totalSeconds: 0, isExpired: false,
  });

  useEffect(() => {
    setParts(getParts(endsAt));
    const id = setInterval(() => setParts(getParts(endsAt)), 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  return parts;
}

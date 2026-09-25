import Image from 'next/image';
import { notFound } from 'next/navigation';
import { marketplaceItems, promoBanner } from '../../../marketplace.mock';
import Link from 'next/link';

export default async function ConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = marketplaceItems.find((i) => i.id === id)
    ?? (promoBanner.id === id ? promoBanner : undefined);

  if (!item) return notFound();

  return (
    <div className="w-full px-5 pt-10 pb-12 inter-normal flex flex-col gap-5 max-sm:px-4">
        <div className="w-full flex justify-center">
            <div className="border p-5 w-[420px] bg-[#060A14CC] border-[#2A1060] rounded-lg flex flex-col items-center gap-3 max-sm:w-full max-sm:p-4">
                <Image src='/check.png' alt='check mark' width={52} height={52} />
                <h3 className='inter-extrabold text-[20px] text-center'>Purchase Complete!</h3>
                <p className='text-[#908FA0] text-[12px] inter-light text-center'>Your Web3 assets have been minted and transferred to your connected wallet.</p>
                <div
                    key={item.id}
                    className='flex items-center justify-between w-full border p-3 bg-[#1A0A3C99] border-[#2A1060] rounded-lg gap-3'
                    >
                    <div className="flex items-center gap-4 max-sm:w-full">
                        <Image
                            src={`${item.imageUrl}`}
                            alt={item.name}
                            width={60}
                            height={60}
                            className="object-contain rounded-md shrink-0"
                        />
                        <div className="flex flex-col">
                        <h4 className={` inter-bold text-[9px] px-2 py-0.5 rounded-2xl w-fit 
                                    ${item.badge === "LEGENDARY" && 'text-[#F59E0B] bg-[#F59E0B22]'} 
                                    ${item.badge === "EPIC" && 'text-[#A855F7] bg-[#A855F722]'} 
                                    ${item.badge === "RARE" && 'text-[#3B82F6] bg-[#3B82F622]'} 
                                    ${item.badge === "COMMON" && 'text-[#10B981] bg-[#10B98122]'} 
                            ` }>{item.badge}</h4>
                        <h2 className='text-white inter-extrabold text-[16px] max-sm:text-[24px]'>{item.name}</h2>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 max-sm:w-full max-sm:justify-between">
                        <div className="flex flex-col">
                        <h4 className="space-mono-bold text-[16px] text-[#20CEEE]">{item.priceGvt} GVT</h4>
                        </div>
                    </div>
                </div>
                <div className='flex w-full items-center justify-between '>
                    <h4 className='text-[#A4B7EB] inter-light text-[11px]'> Transaction Hash</h4>
                    <h4 className='inter-bold text-[#10B981] text-[11px]'>0x7b5a...e31b</h4>
                </div>
                <div className='flex w-full items-center justify-between max-sm:flex-col max-sm:items-start max-sm:gap-1'>
                    <h4 className='text-[#A4B7EB] inter-light text-[11px]'> Network Status</h4>
                    <h4 className='inter-bold text-[#10B981] text-[11px]'>Confirmed (12 Block Confirmations)</h4>
                </div>
                <div className="flex gap-2 mt-7 items-center w-full">
                    <Link href={`/dashboard/marketplace/`} className="inter-bold text-[10px] border-[#2A1060] border hover:bg-[#160f23] text-[#A4B7EB] py-2 px-3 rounded-md transition duration-300 flex items-center justify-center flex-1">
                        Continue Shopping
                    </Link>
                    <Link
                        className='bg-[#20CEEE] disabled:opacity-40 disabled:cursor-not-allowed py-2 px-3 rounded-md text-[#050810] flex-1 flex justify-center inter-extrabold text-[10px]'
                        href={`/dashboard`}
                        // disabled={!hasSufficientBalance}
                    >
                        View Inventory
                    </Link>
                </div>
            </div>
        </div>
    </div>
  );
}
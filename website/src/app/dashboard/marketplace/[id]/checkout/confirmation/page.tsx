import Image from 'next/image';
import { notFound } from 'next/navigation';
import { marketplaceItems, promoBanner } from '../../../marketplace.mock';
import BackButton from '../../back-button';
import Link from 'next/link';

export default async function ConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = marketplaceItems.find((i) => i.id === id)
    ?? (promoBanner.id === id ? promoBanner : undefined);

  if (!item) return notFound();

  // Mock cart: the selected item plus 2 other random distinct items.
  const cartItems = [
    item,
    ...[...marketplaceItems]
      .filter((i) => i.id !== item.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 2),
  ];

  const subtotalGvt = cartItems.reduce((sum, i) => sum + i.priceGvt, 0);
  const subtotalUsd = cartItems.reduce((sum, i) => sum + i.priceUsd, 0);
  const platformFeeGvt = subtotalGvt * 0.025;
  const totalGvt = subtotalGvt + platformFeeGvt;
  const totalUsd = subtotalUsd * 1.025;

  const userBalanceGvt = 2808; // placeholder balance
  const remainingGvt = userBalanceGvt - totalGvt;
  const hasSufficientBalance = remainingGvt >= 0;

  return (
    <div className="w-full pt-4 pb-20 inter-normal flex flex-col gap-5">
        <BackButton />
        <div className="w-full h-full flex justify-center max-sm:px-1">
            <div className="border p-5 bg-[#060A14CC] border-[#2A1060] rounded-lg flex flex-col items-center gap-3 max-sm:w-full max-sm:p-4">
                <Image src='/check.png' alt='check mark' width={60} height={60} />
                <h3 className='inter-extrabold text-[26px] max-sm:text-[22px] text-center'>Purchase Complete!</h3>
                <p className='text-[#908FA0] text-[12px] inter-light text-center'>Your Web3 assets have been minted and transferred to your connected wallet.</p>
                <div
                    key={item.id}
                    className='flex items-center justify-between min-w-xl border p-3 bg-[#1A0A3C99] border-[#2A1060] rounded-lg gap-3 max-lg:min-w-0 max-lg:w-full max-sm:flex-col max-sm:items-start'
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
                <div className="flex gap-5 mt-10 items-center max-sm:w-full max-sm:flex-col max-sm:gap-3 max-sm:mt-6">
                    <Link href={`/dashboard/marketplace/`} className=" inter-bold text-[13px] border-[#2A1060] border hover:bg-[#160f23] text-[#A4B7EB] py-3 px-4 rounded-md transition duration-300 flex items-center justify-center min-w-60 max-sm:min-w-0 max-sm:w-full">
                        Continue Shopping
                    </Link>
                    <Link
                        className='bg-[#20CEEE] disabled:opacity-40 disabled:cursor-not-allowed py-3 px-4 rounded-lg text-[#050810] min-w-60 flex justify-center  inter-extrabold text-[14px] max-sm:min-w-0 max-sm:w-full'
                        href={`/dashobard`}
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
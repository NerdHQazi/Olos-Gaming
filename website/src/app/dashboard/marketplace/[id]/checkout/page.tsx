import Image from 'next/image';
import { marketplaceItems, promoBanner } from '../../marketplace.mock'
import { notFound } from 'next/navigation';
import Link from 'next/link';

export default async function CheckoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = marketplaceItems.find((i) => i.id === id)
    ?? (promoBanner.id === id ? promoBanner : undefined);

  if (!item) return notFound();

  const cartItems = [item, marketplaceItems[1], marketplaceItems[2]];

  const subtotalGvt = cartItems.reduce((sum, i) => sum + i.priceGvt, 0);
  const subtotalUsd = cartItems.reduce((sum, i) => sum + i.priceUsd, 0);
  const platformFeeGvt = subtotalGvt * 0.025;
  const totalGvt = subtotalGvt + platformFeeGvt;
  const totalUsd = subtotalUsd * 1.025;

  const userBalanceGvt = 2808; // placeholder balance
  const remainingGvt = userBalanceGvt - totalGvt;
  const hasSufficientBalance = remainingGvt >= 0;

  return (
    <div className="w-full px-5 pt-7 pb-12 inter-normal flex flex-col gap-5 max-sm:px-4">
        <h1 className='inter-extrabold text-[20px]'>Shopping Cart</h1>
        <div className="flex gap-5 items-start max-lg:flex-col">
          <div className="flex flex-1 flex-col gap-3 w-full">
            {cartItems.map((cartItem) => (
              <div
                key={cartItem.id}
                className='flex items-center justify-between w-full border p-3 bg-[#060A14CC] border-[#2A1060] rounded-lg gap-3 max-sm:flex-col max-sm:items-start'
              >
                <div className="flex items-center gap-4 max-sm:w-full">
                    <Image
                        src={`${cartItem.imageUrl}`}
                        alt={cartItem.name}
                        width={60}
                        height={60}
                        className="object-contain rounded-md shrink-0"
                    />
                  <div className="flex flex-col">
                    <h4 className={` inter-bold text-[9px] px-2 py-0.5 rounded-2xl w-fit 
                              ${cartItem.badge === "LEGENDARY" && 'text-[#F59E0B] bg-[#F59E0B22]'} 
                              ${cartItem.badge === "EPIC" && 'text-[#A855F7] bg-[#A855F722]'} 
                              ${cartItem.badge === "RARE" && 'text-[#3B82F6] bg-[#3B82F622]'} 
                              ${cartItem.badge === "COMMON" && 'text-[#10B981] bg-[#10B98122]'} 
                      ` }>{cartItem.badge}</h4>
                    <h2 className='text-white inter-extrabold text-[16px] max-sm:text-[24px]'>{cartItem.name}</h2>
                  </div>
                </div>
                <div className="flex items-center gap-4 max-sm:w-full max-sm:justify-between">
                  <div className="flex flex-col">
                    <h4 className="space-mono-bold text-[16px] text-[#20CEEE]">{cartItem.priceGvt} GVT</h4>
                    <h4 className="space-mono-regular text-[10px] text-[#908FA0]">(${cartItem.priceUsd} USD)</h4>
                  </div>
                  <button className='bg-[#EF444422] text-[#EF4444] text-[11px] inter-light px-2 py-1 rounded-md'>Remove</button>
                </div>
              </div>
            ))}
          </div>
          <div className="border p-3 w-[288px] shrink-0 bg-[#060A14CC] border-[#2A1060] rounded-lg max-lg:w-full">
            <h3 className='inter-bold text-[16px] mb-3'>Order Summary</h3>
            <div className="flex items-center mb-1 justify-between">
               <h4 className='inter-light text-[12px] text-[#A4B7EB]'>Subtotal</h4>
               <h4 className='space-mono-regular text-[12px]'>{subtotalGvt.toFixed(2)} GVT</h4>
            </div>
            <div className="flex items-center mb-1 justify-between">
               <h4 className='inter-light text-[12px] text-[#A4B7EB]'>Platform Fee (2.5%)</h4>
               <h4 className='space-mono-regular text-[12px]'>{platformFeeGvt.toFixed(2)} GVT</h4>
            </div>
            <div className="flex items-center mb-1 justify-between">
               <h4 className='inter-light text-[12px] text-[#A4B7EB]'>Estimated Gas Fee</h4>
               <h4 className='space-mono-regular text-[12px]'>0.001 ETH</h4>
            </div>
            <div className="flex items-center my-4 justify-between">
                <h4 className='inter-bold text-[12px] text-white'>Total</h4>
                <div className="flex flex-col items-end">
                  <h4 className="space-mono-bold text-[20px] text-[#20CEEE]">{totalGvt.toFixed(2)} GVT</h4>
                  <h4 className="space-mono-regular text-[10px] text-[#908FA0]">(${totalUsd.toFixed(2)} USD)</h4>
                </div>
            </div>

            <div className={`flex items-center gap-1 border mb-4 inter-light text-[11px] p-2 rounded-lg
              ${hasSufficientBalance ? 'bg-[#10B9811A] border-[#10B981]' : 'bg-[#EF44441A] border-[#EF4444]'}`}>
              <h3>{hasSufficientBalance ? '✅' : '⚠️'}</h3>
              <h3>
                {hasSufficientBalance
                  ? `Balance sufficient! You have ${remainingGvt.toFixed(2)} GVT remaining.`
                  : `Insufficient balance. You need ${Math.abs(remainingGvt).toFixed(2)} more GVT.`}
              </h3>
            </div>

            <Link
              className='bg-[#20CEEE] disabled:opacity-40 disabled:cursor-not-allowed p-3 rounded-lg text-[#050810] w-full flex justify-center mb-4 inter-extrabold text-[14px]'
              href={`/dashboard/marketplace/${item.id}/checkout/confirmation`}
              // disabled={!hasSufficientBalance}
            >
              Confirm Purchase
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-2 max-sm:flex-col max-sm:items-stretch">
          <input type="text" className='text-[12px] flex-1 p-2 inter-light bg-[#060A14CC] border border-[#2A1060] rounded-md outline-0 max-sm:w-full' placeholder='Enter Promo Code' />
          <button className='text-[12px] text-[#20CEEE] inter-bold bg-[#1A0A3C99] border border-[#20CEEE] rounded-md py-2 px-5 max-sm:w-full'>Apply</button>
        </div>
    </div>
  );
}
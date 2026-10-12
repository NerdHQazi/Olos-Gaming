import Image from 'next/image';
import { marketplaceItems, promoBanner } from '../marketplace.mock'
import { notFound } from 'next/navigation';
import Link from 'next/link';


export default async function MarketplaceItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = marketplaceItems.find((i) => i.id === id) 
    ?? (promoBanner.id === id ? promoBanner : undefined);

  if (!item) return notFound();

    const relatedItems = marketplaceItems.filter((related) =>
        ['item-002', 'item-003', 'item-004'].includes(related.id),
    );

  return (
        <div className="w-full px-5 pt-6 pb-12 inter-normal flex flex-col gap-5 max-sm:px-4">
                <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-5 items-start max-lg:flex max-lg:flex-col">
                    <div className='flex flex-col items-center w-full h-[222px] border p-3 bg-[#060A14CC] border-[#2A1060] rounded-lg gap-3 max-lg:h-[300px] max-sm:h-[250px]'>
                <div className='w-full justify-end flex'>
                    <div className='flex text-[#20CEEE] bg-[#20CEEE22] border border-[#20CEEE] rounded-sm inter-bold text-[10px] px-2 py-1'>3D PREVIEW ACTIVE</div>
                </div>
                <div className="relative w-full flex-1 min-h-0">
                    <Image
                        src={`${item.imageUrl}`}
                        alt="Snake NFT"
                        fill
                        className="object-contain rounded-md"
                    />
                </div>
                <p className="text-[#908FA0] text-[11px] inter-light">Drag to rotate 360° · Animated cyber spine emissive shaders</p>
            </div>
            <div className='flex flex-col gap-1 min-w-0 w-full'>
                <div className="flex gap-2">
                    <h4 className={` inter-bold text-[9px] px-2 py-0.5 rounded-2xl w-fit 
                            ${item.badge === "LEGENDARY" && 'text-[#F59E0B] bg-[#F59E0B22]'} 
                            ${item.badge === "EPIC" && 'text-[#A855F7] bg-[#A855F722]'} 
                            ${item.badge === "RARE" && 'text-[#3B82F6] bg-[#3B82F622]'} 
                            ${item.badge === "COMMON" && 'text-[#10B981] bg-[#10B98122]'} 
                        ` }>{item.badge}</h4>
                    <h3 className='text-[#20CEEE] space-mono-regular text-[13px] uppercase'>{item.collection} collection</h3>
                </div>
                <h2 className='text-white inter-extrabold text-[30px] max-sm:text-[24px]'>{item.name}</h2>
                <h4 className='inter-light text-[13px] text-[#A4B7EB]'>Created by: <span className='inter-bold text-[#20CEEE]   '>{item.createdBy}</span></h4>
                <div className='flex flex-col bg-[#1A0A3C99] border border-[#2A1060] rounded-lg p-3 my-3'>
                    <h4 className='text-[#908FA0] inter-light text-[11px]'>Current Price</h4>
                    <div className='flex items-center gap-1'>
                        <h4 className="space-mono-bold text-[30px] text-[#20CEEE]">{item.priceGvt} GVT</h4>
                        <h4 className="space-mono-regular text-[14px] text-[#908FA0] mt-1">(${item.priceUsd} USD)</h4>
                    </div>
                </div>
                <h3 className='inter-extrabold text-[13px] uppercase'>Item Attributes</h3>
                <div className='flex flex-col p-3 bg-[#060A14CC] rounded-lg'>
                    <div className='flex w-full items-center justify-between border-b border-[#2A1060] py-2 '>
                        <h4 className='text-[#A4B7EB] inter-light text-[11px]'> Speed Boost</h4>
                        <h4 className='inter-bold text-[#10B981] text-[11px]'>+15%</h4>
                    </div>
                    <div className='flex w-full items-center justify-between border-b border-[#2A1060] py-2 '>
                        <h4 className='text-[#A4B7EB] inter-light text-[11px]'> Visibility</h4>
                        <h4 className='inter-bold text-[#EF4444] text-[11px]'>-10%</h4>
                    </div>
                    <div className='flex w-full items-center justify-between border-b border-[#2A1060] py-2 '>
                        <h4 className='text-[#A4B7EB] inter-light text-[11px]'> Emissive Glow</h4>
                        <h4 className='inter-bold text-[#20CEEE] text-[11px]'>Neon Cyan</h4>
                    </div>
                </div>
                <Link href={`/dashboard/marketplace/${item.id}/checkout`} className="inter-bold text-[13px] bg-[#7135DB] hover:bg-[#3A1A70] text-white py-3 px-4 rounded-md transition duration-300 flex items-center justify-center">
                    Buy Now
                </Link>
                <Link href={`/dashboard/marketplace/${item.id}/wishlist`} className=" mt-2 inter-bold text-[13px] border-[#2A1060] border hover:bg-[#160f23] text-[#A4B7EB] py-3 px-4 rounded-md transition duration-300 flex items-center justify-center">
                    Add to Wishlist
                </Link>
            </div>
        </div>
        <h2 className='inter-extrabold text-[19px] text-white mt-5'>Related Skins & Items</h2>
        <div className='grid grid-cols-3 gap-5 max-lg:grid-cols-2 max-sm:grid-cols-1'>
            {relatedItems.map((related) => (
                    <Link href={`/dashboard/marketplace/${related.id}`} key={related.id} className='border py-4 px-2 gap-2 flex flex-col bg-[#060A14CC] border-[#2A1060] rounded-lg'>
                        <Image src={`${related.imageUrl}`} alt={related.name} width={270} height={150} className="rounded-lg w-full h-auto" />
                        <h4 className={` inter-bold text-[9px] px-2 py-0.5 rounded-2xl w-fit 
                        ${related.badge === "LEGENDARY" && 'text-[#F59E0B] bg-[#F59E0B22]'} 
                        ${related.badge === "EPIC" && 'text-[#A855F7] bg-[#A855F722]'} 
                        ${related.badge === "RARE" && 'text-[#3B82F6] bg-[#3B82F622]'} 
                        ${related.badge === "COMMON" && 'text-[#10B981] bg-[#10B98122]'} 
                        ` }>{related.badge}</h4>

                        <h3 className="inter-bold text-[15px]">{related.name}</h3>
                        <h4 className="space-mono-bold text-[16px] text-[#20CEEE]">{related.priceGvt} GVT</h4>
                    </Link>
                ))}
        </div>
    </div>
  );
}
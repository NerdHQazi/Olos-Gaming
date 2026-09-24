import { notFound } from 'next/navigation';
import BackButton from '../../marketplace/[id]/back-button';
import { mockNFTs } from '../token.mock';
import NFTDetailView from './nft-detail-view';

export default async function NFTDetailPage({ params }: { params: Promise<{ tokenId: string }> }) {
  const { tokenId } = await params;

  console.log(tokenId);
  
  const nft = mockNFTs.find((i) => i.id === tokenId);

  if (!nft) return notFound();

  return (
    <div className="pb-20">
      <div className="my-4">
        <BackButton />
      </div>
      <NFTDetailView nft={nft} />
    </div>
  );
}
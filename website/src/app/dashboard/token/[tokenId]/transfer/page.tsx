import { notFound } from 'next/navigation';
import { mockNFTs } from '../../token.mock';
import TransferAssetPage from './transfer-asset-view';

export default async function TransferPage({ params }: { params: Promise<{ tokenId: string }> }) {
  const { tokenId } = await params;
  const nft = mockNFTs.find((i) => i.id === tokenId);

  if (!nft) return notFound();

  return <TransferAssetPage nft={nft} />;
}
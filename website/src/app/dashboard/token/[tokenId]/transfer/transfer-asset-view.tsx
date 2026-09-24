'use client'

import Image from 'next/image'
import { useState } from "react";
import { AlertTriangle, Contact } from "lucide-react";
import type { NFT } from '../../token.mock';
import BackButton from '@/app/dashboard/marketplace/[id]/back-button';

const NETWORKS = ["Ethereum", "Arbitrum", "Base", "Polygon"] as const;
type Network = (typeof NETWORKS)[number];

export interface TransferAssetPageProps {
  nft: NFT;
  fromAddress?: string;
}

export default function TransferAssetPage({
  nft,
  fromAddress = "0x71353db5d...002241",
}: TransferAssetPageProps) {
  const [recipient, setRecipient] = useState("0x32AEe4810e74e4...f1a67d");
  const [network, setNetwork] = useState<Network>("Ethereum");
  const [isTransferring, setIsTransferring] = useState(false);

  const canConfirm = recipient.trim().length > 0 && !isTransferring;

  function handleConfirm() {
    if (!canConfirm) return;
    setIsTransferring(true);
    // hook up the real transfer transaction here
    setTimeout(() => setIsTransferring(false), 1500);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="my-4">
        <BackButton />
      </div>
      <h1 className="inter-extrabold text-[26px] text-white max-sm:text-[22px]">Transfer Web3 Asset</h1>

      <div className="grid grid-cols-[1fr_340px] gap-6 items-start max-lg:grid-cols-1">
        {/* Left: transfer form */}
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3 rounded-lg border border-[#F59E0B] bg-[#F59E0B22] px-4 py-3 inter-light">
            <AlertTriangle size={16} className=" text-amber-400 shrink-0" />
            <p className="text-[11px] text-white">
              Warning: Web3 blockchain transfers are permanent. Double check the destination
              address before sending.
            </p>
          </div>

          <Field label="From Wallet Address (Sender)">
            <input
              value={`${fromAddress} (Connected)`}
              readOnly
              className="w-full bg-transparent text-[#908FA0] tracking-wider text-[12px] space-mono-regular outline-none cursor-not-allowed"
            />
          </Field>

          <Field label="Recipient Wallet Address (To)" active>
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center space-mono-regular text-[12px] tracking-wider gap-2 min-w-0">
                    <input
                        value={recipient}
                        onChange={(e) => setRecipient(e.target.value)}
                        placeholder="0x…"
                        className="w-full bg-transparent text-white outline-none placeholder:text-slate-600 min-w-0"
                    />
                    {recipient && <span className=" text-[#908FA0] w-full max-sm:hidden">(Address Book)</span>}
                </div>
                <button
                    type="button"
                    title="Choose from address book"
                    className="text-[#20CEEE] hover:text-white transition-colors shrink-0"
                >
                    <Contact size={16} />
                </button>
            </div>
          </Field>

          <div className="flex flex-col gap-2">
            <span className="inter-bold text-[10px] tracking-wide text-[#908FA0]">
              DESTINATION BLOCKCHAIN NETWORK
            </span>
            <div className="grid grid-cols-4 gap-3 max-sm:grid-cols-2">
              {NETWORKS.map((n) => {
                const isSelected = n === network;
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setNetwork(n)}
                    className={`rounded-lg border py-2.5 text-[11px] inter-bold transition-colors
                      ${
                        isSelected
                          ? "border-[#20CEEE] text-[#20CEEE] bg-[#20CEEE]/5"
                          : "border-[#2A1060] text-white hover:border-slate-500"
                      }`}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: item selected */}
        <div className="rounded-lg border border-[#2A1060] bg-slate-900/40 p-5 flex flex-col gap-4">
          <h3 className="inter-bold text-[16px] text-white">Item Selected</h3>

          <div className="rounded-lg border border-[#2A1060] overflow-hidden">
            <div className="relative w-full aspect-video bg-slate-800">
              <Image
                src={nft.imageUrl}
                alt={`${nft.tokenName} ${nft.tokenNumber}`}
                width={360}
                height={190}
                className="object-cover w-full h-full"
              />
            </div>
            <div className="p-3 flex flex-col gap-1">
              <span className="text-[#908FA0] inter-light text-[10px]">{nft.tokenName}</span>
              <h4 className="text-white text-[14px] inter-bold leading-tight">
                {nft.tokenName} {nft.tokenNumber}
              </h4>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] inter-light">
            <span className="text-[#908FA0]">Gas Priority Fee</span>
            <span className="text-[#20CEEE] space-mono-bold">Fast (2 Gwei)</span>
          </div>

          <button
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="w-full bg-[#20CEEE] disabled:opacity-50 disabled:cursor-not-allowed text-[#050810] py-2.5 rounded-md inter-extrabold text-[13px] transition-opacity"
          >
            {isTransferring ? "Transferring…" : "Confirm Transfer"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  active = false,
  children,
}: {
  label: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="inter-bold text-[10px] tracking-wide text-[#908FA0]">
        {label.toUpperCase()}
      </span>
      <div
        className={`rounded-lg border px-3.5 py-2.5 flex flex-col gap-1 ${
          active ? "border-[#20CEEE]" : "border-[#2A1060]"
        } bg-slate-900/40`}
      >
        {children}
      </div>
    </div>
  );
}
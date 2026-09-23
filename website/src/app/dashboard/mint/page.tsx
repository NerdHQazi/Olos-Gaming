'use client'

import Image from 'next/image'
import { useState, useRef, useCallback } from "react";
import { Folder, ChevronDown } from "lucide-react";
import { mockCollections } from '../token/token.mock';
import BackButton from '../marketplace/[id]/back-button';

export default function MintCreatorNFTPage() {
  const [artworkUrl, setArtworkUrl] = useState<string | null>(null);
  const [nftName, setNftName] = useState("");
  const [description, setDescription] = useState(
    ""
  );
  const [collection, setCollection] = useState(mockCollections[1]?.id ?? "all");
  const [royalty, setRoyalty] = useState(5.0);
  const [isDragging, setIsDragging] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const collectionLabel =
    mockCollections.find((c) => c.id === collection)?.label ?? "Preview Collection";

  const loadFile = useCallback((file: File | undefined) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setArtworkUrl(url);
  }, []);

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    loadFile(e.dataTransfer.files?.[0]);
  }

  function handleMint() {
    setIsMinting(true);
    // hook up real mint tx here
    setTimeout(() => setIsMinting(false), 1500);
  }

  return (
    <div className="flex flex-col gap-6 pt-4">
      <BackButton /> 
      <h1 className="inter-extrabold text-[26px] text-white max-sm:text-[22px]">Mint New Creator NFT</h1>

      <div className="grid grid-cols-[1fr_340px] gap-6 items-start max-lg:grid-cols-1">
        {/* Left: form */}
        <div className="flex flex-col gap-5">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed py-14 cursor-pointer transition-colors max-sm:py-10 max-sm:px-4
              ${isDragging ? "border-[#20CEEE] bg-[#20CEEE]/5" : "border-[#20CEEE]/60 hover:border-[#20CEEE]"}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/gif,video/mp4"
              className="hidden"
              onChange={(e) => loadFile(e.target.files?.[0])}
            />
            {artworkUrl ? (
              <div className="relative w-24 h-24 rounded-md overflow-hidden">
                <Image src={artworkUrl} alt="Uploaded artwork" fill className="object-cover" />
              </div>
            ) : (
              <Folder className="text-slate-500" size={34} strokeWidth={1.5} />
            )}
            <p className="inter-bold text-[14px] text-white mt-1 text-center">
              {artworkUrl ? "Artwork uploaded — click to replace" : "Drag and drop artwork here"}
            </p>
            <p className="text-[11px] text-[#908FA0] text-center">Supports PNG, JPG, GIF or MP4. Max size 50MB.</p>
          </div>

          <Field label="NFT Name">
            <input
              value={nftName}
              onChange={(e) => setNftName(e.target.value)}
              placeholder="Give your NFT a name"
              className="w-full bg-transparent text-white text-[14px] outline-none placeholder:text-slate-600"
            />
          </Field>

          <Field label="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Describe your creation"
              className="w-full bg-transparent text-white text-[14px] outline-none resize-none placeholder:text-slate-600"
            />
          </Field>

          <div className="grid grid-cols-2 gap-5 max-sm:grid-cols-1">
            <Field label="Collection">
              <div className="relative">
                <select
                  value={collection}
                  onChange={(e) => setCollection(e.target.value)}
                  className="w-full appearance-none bg-transparent text-white text-[14px] outline-none pr-6 cursor-pointer"
                >
                  {mockCollections
                    .filter((c) => c.id !== "all")
                    .map((c) => (
                      <option key={c.id} value={c.id} className="bg-slate-900">
                        {c.label}
                      </option>
                    ))}
                </select>
                <ChevronDown
                  size={15}
                  className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>
            </Field>

            <Field label="Royalty Percentage (0-10%)">
              <div className="flex items-center justify-between gap-2">
                <input
                  type="number"
                  min={0}
                  max={10}
                  step={0.5}
                  value={royalty}
                  onChange={(e) =>
                    setRoyalty(Math.min(10, Math.max(0, Number(e.target.value))))
                  }
                  className="w-14 bg-transparent text-white text-[14px] outline-none shrink-0"
                />
                <span className="text-white text-[14px] shrink-0">%</span>
                <input
                  type="range"
                  min={0}
                  max={10}
                  step={0.5}
                  value={royalty}
                  onChange={(e) => setRoyalty(Number(e.target.value))}
                  className="flex-1 accent-[#20CEEE] cursor-pointer min-w-0"
                  aria-label="Royalty percentage slider"
                />
              </div>
            </Field>
          </div>
        </div>

        {/* Right: live preview */}
        <div className="rounded-lg border border-[#2A1060] bg-slate-900/40 p-5 flex flex-col gap-4">
          <h3 className="inter-bold text-[15px] text-white">Live NFT Preview</h3>

          <div className="rounded-lg border border-[#2A1060] overflow-hidden">
            <div className="relative w-full aspect-video bg-slate-800">
              {artworkUrl ? (
                <Image src={artworkUrl} alt={nftName} fill className="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-slate-600 text-[12px]">
                  No artwork yet
                </div>
              )}
            </div>
            <div className="p-3 flex flex-col gap-1">
              <span className="text-[#908FA0] text-[11px]">{collectionLabel}</span>
              <h4 className="text-white text-[15px] inter-bold leading-tight">
                {nftName || "Untitled NFT"}
              </h4>
              <p className="text-[13px] space-mono-bold text-[#20CEEE]">
                0.00 GVT <span className="text-[#908FA0] space-mono-regular">(Minting)</span>
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between text-[12px]">
            <span className="text-[#908FA0]">Estimated Gas Fee</span>
            <span className="text-[#20CEEE] space-mono-bold">0.005 ETH</span>
          </div>

          <button
            onClick={handleMint}
            disabled={isMinting || !nftName}
            className="w-full bg-[#20CEEE] disabled:opacity-50 disabled:cursor-not-allowed text-[#050810] py-2.5 rounded-md inter-bold text-[13px] transition-opacity"
          >
            {isMinting ? "Minting…" : "Mint NFT"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="inter-bold text-[10px] tracking-wide text-[#908FA0]">{label.toUpperCase()}</span>
      <div className="rounded-lg border border-[#2A1060] bg-slate-900/40 px-3.5 py-2.5">
        {children}
      </div>
    </div>
  );
}
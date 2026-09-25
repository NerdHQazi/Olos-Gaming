'use client'

import { useState, useRef, useCallback } from "react";
import { UploadCloud, ChevronDown } from "lucide-react";
import BackButton from "../../marketplace/[id]/back-button";

const RANK_REQUIREMENTS = [
  "No Requirement",
  "Bronze Bracket (Tier IV)",
  "Silver Bracket (Tier III)",
  "Silver Bracket (Tier II)",
  "Gold Bracket (Tier I)",
] as const;

export default function CreateGuildPage() {
  const [guildName, setGuildName] = useState("");
  const [guildTag, setGuildTag] = useState("");
  const [description, setDescription] = useState("");
  const [emblemUrl, setEmblemUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [isPrivate, setIsPrivate] = useState(true);
  const [maxMembers, setMaxMembers] = useState(30);
  const [minRank, setMinRank] = useState<string>(RANK_REQUIREMENTS[2]);
  const [entryFee, setEntryFee] = useState(100);

  const [isCreating, setIsCreating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFile = useCallback((file: File | undefined) => {
    if (!file) return;
    setEmblemUrl(URL.createObjectURL(file));
  }, []);

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    loadFile(e.dataTransfer.files?.[0]);
  }

  const canCreate = guildName.trim().length > 0 && guildTag.trim().length >= 3 && !isCreating;

  function handleCreate() {
    if (!canCreate) return;
    setIsCreating(true);
    // hook up the real guild-creation transaction here
    setTimeout(() => setIsCreating(false), 1500);
  }

  return (
    <div className="mt-6 pb-20 flex flex-col gap-5">
        <BackButton />
      <div>
        <h1 className="inter-extrabold text-[30px] text-white">Create Your Guild</h1>
        <p className="text-[12px] inter-light text-[#A4B7EB]">
          Establish your team on the smart contract, set entry parameters, and draft your on-chain
          rules.
        </p>
      </div>

      <div className="grid grid-cols-[1fr_320px] gap-6 items-start">
        {/* Left: Guild Identity */}
        <div className="rounded-xl border border-[#2A1060] bg-[#060A14CC] p-5 flex flex-col gap-5">
          <h2 className="inter-bold text-[18px] text-white">Guild Identity</h2>

          <Field label="Guild Name" accent>
            <input
              value={guildName}
              onChange={(e) => setGuildName(e.target.value)}
              placeholder="Enter high-caliber guild name…"
              className="w-full bg-transparent text-white text-[12px] outline-none placeholder:text-slate-600"
            />
          </Field>

          <Field label="Guild Tag (3-5 Characters)" accent>
            <input
              value={guildTag}
              onChange={(e) => setGuildTag(e.target.value.toUpperCase().slice(0, 5))}
              placeholder="e.g. SLAY"
              className="w-full bg-transparent text-white text-[12px] outline-none placeholder:text-slate-600"
            />
          </Field>

          <div className="flex flex-col gap-2">
            <span className="text-[12px] text-[#A4B7EB] inter-bold">Upload Emblem / Guild Logo</span>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed py-10 cursor-pointer transition-colors
                ${isDragging ? "border-[#20CEEE] bg-[#20CEEE]/5" : "border-[#20CEEE]/50 hover:border-[#20CEEE]"}`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg"
                className="hidden"
                onChange={(e) => loadFile(e.target.files?.[0])}
              />
              {emblemUrl ? (
                <img src={emblemUrl} alt="Guild emblem" className="w-16 h-16 rounded-md object-cover" />
              ) : (
                <UploadCloud className="text-[#20CEEE]" size={30} strokeWidth={1.75} />
              )}
              <p className="inter-semibold text-[12px] text-white">
                {emblemUrl ? "Emblem uploaded — click to replace" : "Drag and drop guild logo or click to browse"}
              </p>
              <p className="text-[10px] text-[#908FA0] inter-light">Supports PNG, JPG (Max 2MB). Ideal size 512×512px</p>
            </div>
          </div>

          <Field label="Guild Description" accent>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Describe your guild's primary game strategy, community values, and on-chain goals…"
              className="w-full bg-transparent text-white text-[12px] outline-none resize-none placeholder:text-slate-600"
            />
          </Field>
        </div>

        {/* Right: Contract Rules */}
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-[#2A1060] bg-slate-900/30 p-5 flex flex-col gap-5">
            <h2 className="inter-extrabold text-[18px] text-white">Contract Rules</h2>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-[12px] text-white inter-bold">Private Guild</p>
                <p className="text-[10px] text-[#908FA0] inter-light">Requires application review</p>
              </div>
              <Toggle checked={isPrivate} onChange={setIsPrivate} />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-[#A4B7EB] inter-bold">Max Members Cap</span>
                <span className="text-[12px] space-mono-bold text-[#20CEEE] tracking-wide">{maxMembers} / 50</span>
              </div>
              <input
                type="range"
                min={5}
                max={50}
                step={1}
                value={maxMembers}
                onChange={(e) => setMaxMembers(Number(e.target.value))}
                className="w-full accent-[#20CEEE] outline-0 border-0 cursor-pointer"
              />
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[12px] text-[#A4B7EB] inter-bold">Minimum Rank Requirement</span>
              <div className="relative inter-light">
                <select
                  value={minRank}
                  onChange={(e) => setMinRank(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-[#2A1060] bg-[#060A14] px-3.5 py-2.5 text-[12px] text-white outline-none pr-8 cursor-pointer"
                >
                  {RANK_REQUIREMENTS.map((r) => (
                    <option key={r} value={r} className="bg-slate-900">
                      {r}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={15}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[12px] text-[#A4B7EB] inter-bold">Entry Fee (GVT Staked)</span>
              <div className="rounded-lg border border-[#2A1060] bg-[#060A14] px-3.5 py-2.5 flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  value={entryFee}
                  onChange={(e) => setEntryFee(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-transparent text-white text-[12px] inter-light outline-none"
                />
                <span className="text-[#20CEEE] text-[12px] space-mono-regular shrink-0">GVT</span>
              </div>
              <p className="text-[9px] inter-light text-[#908FA0]">Optional: Players must stake GVT to enter the guild.</p>
            </div>
          </div>

          <div className="rounded-xl border border-[#20CEEE] bg-[#1A0A3C4D] p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-[#A4B7EB] inter-light text-[12px]">Contract Creation Fee</span>
              <span className="text-[#20CEEE] space-mono-bold text-[16px] tracking-wide">5.00 GVT</span>
            </div>
            <button
              onClick={handleCreate}
              disabled={!canCreate}
              className="w-full bg-[#20CEEE] disabled:opacity-50 disabled:cursor-not-allowed text-[#050810] py-2.5 rounded-md inter-extrabold text-[12px] transition-opacity uppercase"
            >
              {isCreating ? "Creating…" : "Create Guild Contract"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  accent = false,
  children,
}: {
  label: string;
  accent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className={`text-[12px] inter-bold ${accent ? "text-[#A4B7EB]" : "text-[#908FA0]"}`}>
        {label}
      </span>
      <div className="rounded-lg border border-[#2A1060] inter-light bg-[#060A14] px-3.5 py-1.5">
        {children}
      </div>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
        checked ? "bg-[#7135DB]" : "bg-slate-700"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}
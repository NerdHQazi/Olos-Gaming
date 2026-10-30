"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Gamepad2, Info, Pencil, Plus, Star } from "lucide-react";
import { useWallet } from "@/context/WalletContext";

const PRESETS = [10, 25, 50, 100];
const USD_PER_GVT = 0.1;
const MIN_STAKE = 10;
const NETWORK_FEE = 0.5;
const MULTIPLIER = 2;

const usd = (gvt: number) => `$${(gvt * USD_PER_GVT).toFixed(2)} USD`;

export default function SnakeStakePage() {
  const router = useRouter();
  const { balance } = useWallet() as { balance?: number };
  const walletBalance = balance ?? 0;

  const [selected, setSelected] = useState<number | "custom">(50);
  const [customValue, setCustomValue] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const stake = selected === "custom" ? Number(customValue) || 0 : selected;
  const potentialWin = stake * MULTIPLIER;
  const balanceAfter = walletBalance - stake - NETWORK_FEE;

  let error: string | null = null;
  if (stake < MIN_STAKE) error = `Minimum stake is ${MIN_STAKE} GVT`;
  else if (balanceAfter < 0) error = "Not enough GVT. Add funds to continue";

  const canPlay = !error && agreed && !loading;

  const handleConfirm = async () => {
    if (!canPlay) return;
    setLoading(true);
    try {
      // TODO: call your existing matchmaking here (the one that stakes GVT and
      // returns a matchId), e.g.
      //   const { data } = await supabase.rpc("find_or_create_match", { p_game: "snake", p_stake: stake });
      //   router.push(`/dashboard/games/snake?mode=1v1&matchId=${data.id}`);
      router.push(`/dashboard/games/snake?mode=1v1&stake=${stake}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 md:px-8 py-6 max-w-5xl mx-auto space-y-6">
      <Link
        href="/dashboard/games/snake/details"
        className="inline-flex items-center gap-2 text-sm text-[#7135DB] hover:text-[#a78bfa] transition-colors"
      >
        <ArrowLeft size={16} /> Back to Game Details
      </Link>

      {/* Title + game card */}
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-4xl font-black text-white">
            Stake &amp; <span className="text-amber-500">Play</span>
          </h1>
          <p className="mt-2 max-w-sm text-xl text-[#A4B7EB]">
            Choose your stake amount and confirm to find an opponent
          </p>
        </div>

        <div className="flex w-full items-center gap-4 rounded-2xl border border-[#7135DB]/60 bg-[#0B1121] p-4 md:w-80">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-black">
            <Image src="/images/snake/snake-logo.png" alt="Snake Battle" fill className="object-cover" />
          </div>
          <div>
            <p className="font-black text-white">Snake Battle</p>
            <div className="mt-2 flex gap-2">
              <span className="rounded-md border border-[#7135DB] px-2 py-0.5 text-[11px] font-bold text-[#a78bfa]">
                Classic Game
              </span>
              <span className="rounded-md border border-[#7135DB] px-2 py-0.5 text-[11px] font-bold text-[#a78bfa]">
                PvP
              </span>
            </div>
            <Link
              href="/dashboard/games/snake/details"
              className="mt-3 inline-block text-xs font-bold text-[#7135DB] hover:text-[#a78bfa]"
            >
              View game details
            </Link>
          </div>
        </div>
      </div>

      {/* Step 1: pick stake */}
      <section className="rounded-2xl border border-[#2A1060] bg-[#0B1121] p-6">
        <StepTitle n={1}>Choose your stake</StepTitle>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {PRESETS.map((amount) => {
            const on = selected === amount;
            return (
              <button
                key={amount}
                type="button"
                onClick={() => setSelected(amount)}
                aria-pressed={on}
                className={`relative flex h-32 flex-col items-center justify-center gap-1 rounded-xl border transition ${
                  on
                    ? "border-[#7135DB] bg-[#1A0A3C] shadow-[0_0_0_1px_rgba(113,53,219,0.5)]"
                    : "border-[#2A1060] bg-[#05080f] hover:border-[#7135DB]/60"
                }`}
              >
                {amount === 50 && (
                  <span className="absolute -top-2.5 flex items-center gap-1 rounded-full bg-gradient-to-r from-[#22D3EE] to-[#7135DB] px-3 py-0.5 text-[10px] font-bold text-white">
                    <Star size={10} /> Popular
                  </span>
                )}
                <Checkbox on={on} />
                <span className="mt-2 text-lg font-black text-white">{amount} GVT</span>
                <span className="text-xs text-gray-500">{usd(amount).replace(" USD", "")}</span>
              </button>
            );
          })}

          <div
            onClick={() => setSelected("custom")}
            className={`flex h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border transition ${
              selected === "custom"
                ? "border-[#7135DB] bg-[#1A0A3C] shadow-[0_0_0_1px_rgba(113,53,219,0.5)]"
                : "border-[#2A1060] bg-[#05080f] hover:border-[#7135DB]/60"
            }`}
          >
            <span className="flex items-center gap-1.5 text-sm font-black text-[#A4B7EB]">
              <Pencil size={14} className="text-amber-400" /> Custom
            </span>
            <input
              type="number"
              min={MIN_STAKE}
              inputMode="numeric"
              value={customValue}
              placeholder="0"
              aria-label="Custom stake in GVT"
              onFocus={() => setSelected("custom")}
              onChange={(e) => {
                setCustomValue(e.target.value);
                setSelected("custom");
              }}
              className="h-8 w-20 rounded-md border border-[#2A1060] bg-black text-center text-sm font-bold text-white focus:border-[#22D3EE] focus:outline-none"
            />
            <span className="text-xs font-bold text-gray-500">GVT</span>
          </div>
        </div>
      </section>

      {/* Step 2: art + review */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_1.4fr]">
        <div className="relative hidden min-h-64 overflow-hidden rounded-2xl border border-[#2A1060] bg-black md:block">
          <Image src="/images/snake/snake-logo.png" alt="" fill className="object-contain p-4" />
        </div>

        <div className="rounded-2xl border border-[#2A1060] bg-[#0B1121] p-6">
          <StepTitle n={2}>Review your stake</StepTitle>
          <div className="mt-5 space-y-2 text-sm">
            <ReviewRow label="Stake Amount">
              <span className="font-black text-amber-400">{stake} GVT</span>
              <Chip>{usd(stake)}</Chip>
            </ReviewRow>
            <ReviewRow label="Potential Win">
              <span className="font-black text-green-400">{potentialWin} GVT</span>
              <Chip tone="green">{MULTIPLIER.toFixed(1)}x</Chip>
              <Chip>{usd(potentialWin)}</Chip>
            </ReviewRow>
            <ReviewRow label="Win Probability">
              <span className="font-black text-white">68%</span>
              <span className="text-xs text-gray-400">Based on your stats</span>
            </ReviewRow>
            <ReviewRow label="Network Fee">
              <span className="font-black text-white">~{NETWORK_FEE.toFixed(2)} GVT</span>
              <Chip>{usd(NETWORK_FEE)}</Chip>
            </ReviewRow>
          </div>
          <p className="mt-4 flex items-start gap-3 rounded-lg bg-[#1A0A3C] p-3 text-xs text-[#A4B7EB]">
            <Info size={16} className="mt-0.5 shrink-0 text-[#22D3EE]" />
            Higher stakes offer higher rewards, but come with increased competition.
          </p>
        </div>
      </section>

      {/* Balance */}
      <section className="rounded-2xl border border-[#2A1060] bg-[#0B1121] p-6">
        <StepTitle n={3}>Your balance</StepTitle>
        <div className="mt-6 flex items-center justify-between gap-4 border-b border-[#2A1060] pb-6">
          <div>
            <p className="text-2xl font-black text-white">
              {walletBalance.toLocaleString()}.00 <span className="text-sm text-[#7135DB]">GVT</span>
            </p>
            <p className="text-xs text-gray-500">{usd(walletBalance)}</p>
          </div>
          <Link
            href="/dashboard/wallet"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#7135DB] px-4 text-xs font-black text-white hover:bg-[#1A0A3C]"
          >
            Add Funds <Plus size={14} />
          </Link>
        </div>
        <p className={`mt-4 text-xs ${error ? "text-red-400" : "text-[#A4B7EB]"}`} role={error ? "alert" : undefined}>
          {error ?? `After staking, your new balance is ${balanceAfter.toLocaleString(undefined, { maximumFractionDigits: 2 })} GVT`}
        </p>
      </section>

      {/* Confirm */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex max-w-sm cursor-pointer items-start gap-3 rounded-xl border border-[#2A1060] bg-[#0B1121] p-4 text-xs text-[#A4B7EB]">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-[#7135DB]"
          />
          <span>
            I agree to the{" "}
            <Link href="/terms" className="text-[#a78bfa] underline">
              Terms of Service
            </Link>{" "}
            and confirm that I want to stake and play.
          </span>
        </label>

        <button
          type="button"
          onClick={handleConfirm}
          disabled={!canPlay}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#0B8BE8] px-10 text-sm font-black text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 sm:min-w-64"
        >
          {loading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <>
              <Gamepad2 size={18} /> Confirm &amp; Play
            </>
          )}
        </button>
      </section>
    </div>
  );
}

function StepTitle({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-3 text-sm font-black text-white">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-[#22D3EE] to-[#7135DB] text-[11px]">
        {n}
      </span>
      {children}
    </h2>
  );
}

function Checkbox({ on }: { on: boolean }) {
  return (
    <span
      className={`flex h-4 w-4 items-center justify-center rounded border ${
        on ? "border-[#7135DB] bg-[#7135DB]" : "border-[#4b3a8a]"
      }`}
    >
      {on && <Check size={11} className="text-white" strokeWidth={3} />}
    </span>
  );
}

function ReviewRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-[#2A1060] bg-black/30 px-3 py-2">
      <span className="text-xs text-[#A4B7EB]">{label}</span>
      <span className="flex items-center gap-2">{children}</span>
    </div>
  );
}

function Chip({ children, tone = "cyan" }: { children: React.ReactNode; tone?: "cyan" | "green" }) {
  return (
    <span
      className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${
        tone === "green" ? "bg-green-600 text-white" : "bg-[#0e5566] text-[#4CD7F6]"
      }`}
    >
      {children}
    </span>
  );
}

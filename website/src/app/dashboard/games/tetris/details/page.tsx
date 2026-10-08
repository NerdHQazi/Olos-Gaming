"use client";

import BackButton from "@/app/dashboard/marketplace/[id]/back-button";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

const STAKES = [10, 25, 50, 100, 250] as const;
type Stake = (typeof STAKES)[number];
type Mode = "pvp" | "system";

const RULES = [
  "Use Arrow keys to Rotate and slide block structures left and right.",
  "Press Space for a hard drop, or Down Arrow for a soft drop.",
  "Clear lines sequentially to rack up high multiplier values.",
  "Maintain high clear speeds. Overflowing the top grid instantly triggers a forfeit defeat state.",
];

const MIN_STAKE = 50;
const FEE_PERCENT = 5;

type Props = {
  /** Path to the hero image. Put tetrisHeroImage.png in /public or pass an imported URL. */
  heroImage?: string;
  totalMatches?: number;
  feesBurned?: number;
  onPlay?: (mode: Mode, stake: Stake) => void;
};

const card = "rounded-2xl border border-[#FFFFFF1A] bg-[#0B0F19] px-6 py-[22px]";
const cardTitle =
  "mb-4 bai-jamjuree-bold text-[18px] uppercase tracking-wide ";
const metaLabel =
  "text-[8px] inter-bold uppercase text-[#6B7280]";

export default function NeonTetrisBlitz({
  heroImage = "/tetrisHeroImage.png",
  totalMatches = 89410,
  feesBurned = 12410,
  onPlay,
}: Props) {
  const [stake, setStake] = useState<Stake>(50);
  const belowMin = stake < MIN_STAKE;
  const router = useRouter()

  const play = (mode: Mode) => {
    if (!belowMin) onPlay?.(mode, stake);


    router.push(`/dashboard/games/tetris`)
  };

  return (
    <div className="min-h-screen text-[15px] text-[#e9eef7]">
      <div className="mt-4 mb-2">
        <BackButton />
      </div>

      
      {/* Hero */}
      <header className="relative overflow-hidden border-b border-[#1a2335] bg-[#050810]">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[#060A16]/15 backdrop-blur-[1px]"
        />
        <div className="relative w-full px-6 pb-13 pt-10.5">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#7034D7] bg-[#7034D71F] px-3 py-1.25 text-[10px] font-bold uppercase tracking-wider">
            <i className="h-1.75 w-1.75 rounded-full bg-[#22e08a] shadow-[0_0_8px_#22e08a] bai-jamjuree-semibold " />
            Featured Blitz Arena
          </span>
          <h1 className="mt-5.5 text-[clamp(30px,5vw,46px)] font-extrabold bai-jamjuree-bold leading-[1.1] tracking-wide">
            NEON TETRIS <span className="text-[#00d4ff]">BLITZ</span>
          </h1>
          <p className="mt-4 max-w-160 text-[14px] leading-relaxed inter-light text-[#A4B7EB]">
            Drop blocks, stage perfect clears, and lock in high multipliers.
            Compete 1v1 on-chain or build high scores in lightning sprints.
            Winner sweeps the escrowed GVT pool instantly.
          </p>
        </div>
      </header>

      {/* Body */}
      <main className="grid w-full grid-cols-1 gap-4.5 px-6 pb-14 pt-7 md:grid-cols-[1.75fr_1fr]">
        <div className="flex min-w-0 flex-col gap-4.5">
          <section className={card}>
            <h2 className={cardTitle}>How to play &amp; system rules</h2>
            <ol className="list-decimal inter-light space-y-1.25 pl-4.5 text-[12px] leading-normal text-[#A4B7EB]">
              {RULES.map((r) => (
                <li key={r} className="pl-0.5">
                  {r}
                </li>
              ))}
            </ol>
          </section>

          <section className={card}>
            <h2 className={cardTitle}>Choose your GVT stake</h2>
            <div
              role="radiogroup"
              aria-label="GVT stake"
              className="flex flex-wrap gap-2.5"
            >
              {STAKES.map((s) => {
                const active = stake === s;
                return (
                  <button
                    key={s}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setStake(s)}
                    className={`min-w-16 rounded-lg border bai-jamjuree-bold px-4 py-2.5 text-[13px] transition focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-[#00d4ff] motion-reduce:transition-none ${
                      active
                        ? "border-[#00d4ff] bg-[#00d4ff]/10 shadow-[0_0_14px_rgba(0,212,255,.25)]"
                        : "border-[#1a2335] bg-[#080d17] hover:border-[#33435f]"
                    }`}
                  >
                    {s} GVT
                  </button>
                );
              })}
            </div>

            <dl className="mt-5.5 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div>
                <dt className={metaLabel}>Min stake</dt>
                <dd className="mt-px text-[14px] inter-bold">{MIN_STAKE} GVT</dd>
              </div>
              <div>
                <dt className={metaLabel}>Volatility</dt>
                <dd className="mt-px text-[14px] inter-bold text-[#00d4ff]">High</dd>
              </div>
              <div>
                <dt className={metaLabel}>Platform fee</dt>
                <dd className="mt-px text-[14px] inter-bold text-[#ffb400]">
                  {FEE_PERCENT}% Victory Fee
                </dd>
              </div>
            </dl>

            {belowMin && (
              <p role="alert" className="mt-4 text-[13px] text-[#ff8a7a]">
                Stakes below {MIN_STAKE} GVT can't enter this arena. Pick {MIN_STAKE} GVT or higher.
              </p>
            )}
          </section>
        </div>

        <aside className="flex min-w-0 flex-col gap-4.5">
          <section className={card}>
            <h2 className={cardTitle}>Enter game mode</h2>
            <button
              type="button"
              disabled={belowMin}
              onClick={() => play("pvp")}
              className="mb-3 flex h-18 w-full items-center justify-center gap-3 rounded-lg border border-[#00d4ff] bg-[#00d4ff] text-[13px] bai-jamjuree-bold uppercase tracking-wide text-[#04121a] transition hover:enabled:shadow-[0_0_22px_rgba(0,212,255,.45)] active:enabled:translate-y-px focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-[#00d4ff] disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none"
            >
              <span aria-hidden="true" className="leading-none">
                <Image src="/padIcon.png" alt="Play vs Player" width={40} height={40} />
              </span>
              Play vs Player
            </button>
            <button
              type="button"
              disabled={belowMin}
              onClick={() => play("system")}
              className="flex h-15 w-full items-center justify-center gap-3 rounded-lg border border-[#12506a] bg-transparent text-[13px] bai-jamjuree-bold uppercase tracking-wide text-[#00d4ff] transition hover:enabled:border-[#00d4ff] hover:enabled:bg-[#00d4ff]/[.07] active:enabled:translate-y-px focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-[#00d4ff] disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none"
            >
              <span aria-hidden="true" className=" leading-none">
                <Image src="/trophyIcon.png" alt="Play vs System" width={24} height={24} />

              </span>
              Play vs System
            </button>
          </section>

          <section className={card}>
            <h2 className={cardTitle}>Arena status</h2>
            <dl className="flex flex-col gap-2.5">
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-[12px] inter-light text-[#A4B7EB]">Total matches played</dt>
                <dd className="text-[12px] inter-bold">{totalMatches.toLocaleString()}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-[12px] inter-light text-[#A4B7EB]">Current pool fees burned</dt>
                <dd className="text-[12px] inter-bold text-[#00d4ff]">
                  {feesBurned.toLocaleString()} GVT
                </dd>
              </div>
            </dl>
          </section>
        </aside>
      </main>
    </div>
  );
}
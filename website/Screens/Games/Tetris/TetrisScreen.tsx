"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  NextPieceCard,
  NextPieceStrip,
  StartupOverlay,
  formatClock,
  useCoarsePointer,
  useTetrisFeed,
} from "./tetrisShared";

const CYAN = "#00D3FE";
const PURPLE = "#7034D7";

type Difficulty = "easy" | "medium" | "hard";
const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];
const label = (d: Difficulty) => d[0].toUpperCase() + d.slice(1);

export interface TetrisPracticeScreenProps {
  gameSrc?: string;
  player?: { name: string; initials: string };
  initialDifficulty?: Difficulty;
  onExit?: () => void;
}

export default function TetrisPracticeScreen({
  gameSrc = "/tetris/index.html",
  player = { name: "You (CryptoKing)", initials: "ME" },
  initialDifficulty = "medium",
  onExit,
}: TetrisPracticeScreenProps) {
  const router = useRouter();
  const isTouch = useCoarsePointer();
  const { iframeRef, stats, phase, started, over, reset } = useTetrisFeed();

  const [difficulty, setDifficulty] = useState<Difficulty>(initialDifficulty);
  const [elapsed, setElapsed] = useState(0);
  const [gameKey, setGameKey] = useState(0);

  /* ---- elapsed time counts up while a game is running -------------------- */
  useEffect(() => {
    if (!started || over) return;
    const id = setInterval(() => setElapsed((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [started, over]);

  const restart = () => {
    reset();
    setElapsed(0);
    setGameKey((k) => k + 1); // remounts the iframe, which reloads the game
  };

  const changeDifficulty = (next: Difficulty) => {
    if (next === difficulty) return;
    setDifficulty(next);
    restart(); // a new difficulty always starts a fresh game
  };

  const exit = () => (onExit ? onExit() : router.back());

  const src = `${gameSrc}?mode=practice&difficulty=${difficulty}`;

  return (
    <div className="flex h-dvh min-h-120 flex-col bg-[#03050b] font-bai text-white">
      {/* ------------------------------ Header ------------------------------ */}
      <header className="grid shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-white/[0.07] bg-[#070b17] px-3 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:gap-3 sm:px-5 sm:py-4">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs bai-jamjuree-bold sm:h-9 sm:w-9 sm:text-sm"
            style={{ background: PURPLE }}
          >
            {player.initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs bai-jamjuree-bold sm:text-sm">{player.name}</p>
            <p
              className="truncate text-[11px] inter-bold tabular-nums sm:text-xs"
              style={{ color: CYAN }}
            >
              Score: {stats.score.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-0.5 text-center">
          <span
            className="rounded-full border border-white/8 bg-[#0d1626] px-2.5 py-0.5 text-[9px] inter-bold uppercase tracking-wider sm:text-[10px]"
            style={{ color: CYAN }}
          >
            Practice mode
          </span>
          <p className="whitespace-nowrap text-sm bai-jamjuree-bold tabular-nums sm:text-lg">
            Time Elapsed: {formatClock(elapsed)}
          </p>
        </div>

        <div className="flex min-w-0 items-center justify-end gap-2 sm:gap-3">
          <div className="min-w-0 text-right">
            <p className="truncate text-xs bai-jamjuree-bold sm:text-sm">OLOS AI (System)</p>
            <p className="truncate text-[11px] inter-bold text-indigo-300 sm:text-xs">
              Difficulty: <span className="uppercase">{difficulty}</span>
            </p>
          </div>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-[#161d2e] text-xs bai-jamjuree-bold sm:h-10 sm:w-10 sm:text-sm">
            AI
          </div>
        </div>
      </header>

      {/* ------------------------------- Stage ------------------------------ */}
      <main className="flex min-h-0 flex-1 flex-col items-center px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:pt-8">
        {/* Difficulty selector */}
        <div className="flex shrink-0 flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <span className="text-xs inter-light sm:text-sm">Select AI Difficulty:</span>
          <div role="group" aria-label="AI difficulty" className="flex gap-2">
            {DIFFICULTIES.map((d) => {
              const active = d === difficulty;
              return (
                <button
                  key={d}
                  onClick={() => changeDifficulty(d)}
                  aria-pressed={active}
                  className={`rounded-lg border px-4 py-2 text-xs inter-bold transition touch-manipulation focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-white ${
                    active
                      ? "border-transparent text-[#03050b]"
                      : "border-white/10 bg-[#0b1020] text-white hover:bg-white/10"
                  }`}
                  style={active ? { background: CYAN } : undefined}
                >
                  {label(d)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Phones: next piece, level and multiplier in one compact row */}
        <div className="mt-3 w-full max-w-105 shrink-0 sm:hidden">
          <NextPieceStrip next={stats.next} level={stats.level} multiplier={stats.multiplier} />
        </div>

        {/* Board + side cards: the board takes whatever height is left */}
        <div className="mt-4 flex min-h-0 w-full flex-1 items-start justify-center gap-4 sm:mt-8 sm:gap-6">
          <div
            className="relative h-full max-h-140 shrink-0"
            style={{ aspectRatio: "1 / 2" }}
          >
            <div
              className="h-full w-full touch-none select-none overflow-hidden rounded-2xl border bg-[#04070f]"
              style={{ borderColor: PURPLE, boxShadow: `0 0 18px ${PURPLE}40` }}
            >
              <iframe
                key={`${difficulty}-${gameKey}`}
                ref={iframeRef}
                src={src}
                title="Tetris practice"
                scrolling="no"
                allow="autoplay; fullscreen; gamepad"
                className="block h-full w-full touch-none border-0"
                onLoad={() => iframeRef.current?.contentWindow?.focus()}
              />
            </div>

            {/* Startup screen: loader, then "tap to start", then fades out */}
            <StartupOverlay phase={phase} touch={isTouch} />

            {over && (
              <div className="absolute inset-0 z-20 bai-jamjuree-semibold flex flex-col items-center justify-center gap-3 rounded-2xl bg-[#03050b]/90 px-4 text-center backdrop-blur-sm sm:gap-4 sm:px-6">
                <p className="text-2xl font-semibold sm:text-3xl">Game over</p>
                <p className="text-xs tabular-nums text-slate-300 sm:text-sm">
                  {stats.score.toLocaleString()} points · {stats.lines} lines
                </p>
                <p className="text-xs text-slate-400">No payout in practice mode.</p>
                <div className="mt-1 flex flex-wrap justify-center gap-2 sm:gap-3">
                  <button
                    onClick={restart}
                    className="rounded-full px-4 py-2 text-sm font-bold text-[#03050b] transition hover:brightness-110 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-white sm:px-5"
                    style={{ background: CYAN }}
                  >
                    Try again
                  </button>
                  <button
                    onClick={exit}
                    className="rounded-full border border-white/20 px-4 py-2 text-sm font-bold transition hover:bg-white/10 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-white sm:px-5"
                  >
                    Exit
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Next piece + level / multiplier (tablet and up) */}
          <div className="hidden w-32 shrink-0 sm:block">
            <NextPieceCard next={stats.next} level={stats.level} multiplier={stats.multiplier} />
          </div>

          {/* Info card (desktop) */}
          <aside className="hidden min-w-0 max-w-105 flex-1 rounded-xl border border-white/9 bg-[#060A16] p-5 md:block">
            <h2 className="text-sm bai-jamjuree-bold uppercase tracking-wide">AI Training</h2>
            <p className="mt-2 text-xs inter-light leading-relaxed text-indigo-200/80">
              Use this sandbox zone to refine your block manipulation, clearing pacing, and layout planning before staking live on-chain assets.
            </p>
          </aside>
        </div>

        {/* Footer row */}
        <div className="mt-4 flex w-full max-w-140 shrink-0 items-center justify-between gap-3 sm:mt-6">
          <div className="space-y-0.5 text-xs text-indigo-200/80 inter-light">
            <p>Sandbox rules apply. Payouts are not rewarded for PRACTICE mode.</p>
            {isTouch && (
              <p className="text-[11px] text-slate-500">
                Tap to rotate · Swipe to move · Flick down to drop
              </p>
            )}
          </div>
          <button
            onClick={exit}
            className="shrink-0 rounded-lg border border-red-500/70 bg-red-950/20 px-4 py-2.5 text-xs bai-jamjuree-bold uppercase tracking-wide text-red-500 transition touch-manipulation hover:bg-red-500/10 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-red-400 sm:px-5"
          >
            Exit sandbox
          </button>
        </div>
      </main>
    </div>
  );
}
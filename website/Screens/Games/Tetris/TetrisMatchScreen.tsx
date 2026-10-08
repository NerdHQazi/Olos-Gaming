"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  NextPieceCard,
  NextPieceStrip,
  StartupOverlay,
  formatClock,
  useCoarsePointer,
  useTetrisFeed,
} from "./tetrisShared";

const CYAN = "#00D2FF";
const PURPLE = "#7C3AED";
const AMBER = "#FFB800";

type Difficulty = "easy" | "medium" | "hard";
export type MatchVerdict = "win" | "lose" | "draw";
export type MatchReason = "timeout" | "topped_out" | "forfeit" | "opponent";

export interface MatchPlayer {
  name: string;
  initials: string;
}

export interface LiveStats {
  score: number;
  lines: number;
}

/** What onMatchEnd receives. The match server stays the authority on the real result. */
export interface MatchResult {
  result: MatchVerdict;
  reason: MatchReason;
  score: number;
  lines: number;
  level: number;
  opponentScore: number;
}

export interface TetrisMatchScreenProps {
  /** URL of the pygbag build. */
  gameSrc?: string;
  player?: MatchPlayer;
  opponent?: MatchPlayer;
  /** Stake in GVT, shown in the header. */
  stake?: number;
  /** Match length in seconds. The game itself runs the clock and ends with "timeout". */
  duration?: number;
  /** Both players must get the same seed to face identical pieces. Letters, digits, "_" and "-" only. */
  seed?: string;
  difficulty?: Difficulty;
  /** Live opponent score and lines, pushed in by the parent (websocket, polling, ...). */
  opponentStats?: LiveStats;
  /** Set by the parent when the server has decided the match (also ends it for this player). */
  settledResult?: MatchVerdict;
  /** Amount won, in GVT, when the server reports it. Only shown on a win. */
  payout?: number;
  /** Called whenever this player's score, lines or level change. Send it to the server from here. */
  onStatsChange?: (stats: { score: number; lines: number; level: number }) => void;
  /** Called once when this player's match ends (stack-out, time up or forfeit). */
  onMatchEnd?: (result: MatchResult) => void;
  /** Leave the match screen. Defaults to going back one page. */
  onExit?: () => void;
  /** When given, the result card shows a "Play again" button. */
  onRematch?: () => void;
}

const REASON_TEXT: Record<MatchReason, string> = {
  timeout: "Time's up.",
  topped_out: "Your stack reached the top.",
  forfeit: "You forfeited the match.",
  opponent: "The match has been settled.",
};

const VERDICT: Record<MatchVerdict, { title: string; color: string }> = {
  win: { title: "You won", color: "#34D399" },
  lose: { title: "You lost", color: "#FB7185" },
  draw: { title: "Draw", color: AMBER },
};

export default function TetrisMatchScreen({
  gameSrc = "/tetris/index.html",
  player = { name: "You (CryptoKing)", initials: "ME" },
  opponent = { name: "NeonSteer.eth", initials: "OP" },
  stake = 50,
  duration = 180,
  seed,
  difficulty = "medium",
  opponentStats = { score: 0, lines: 0 },
  settledResult,
  payout,
  onStatsChange,
  onMatchEnd,
  onExit,
  onRematch,
}: TetrisMatchScreenProps) {
  const router = useRouter();
  const isTouch = useCoarsePointer();
  const { iframeRef, stats, phase, started, over, outcome } = useTetrisFeed();

  const [forfeited, setForfeited] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const matchLength = Math.max(1, Math.round(duration));
  const safeSeed = seed?.replace(/[^A-Za-z0-9_-]/g, "");
  const params = new URLSearchParams({
    mode: "match",
    difficulty,
    time: String(matchLength),
  });
  if (safeSeed) params.set("seed", safeSeed);
  const src = `${gameSrc}?${params.toString()}`;

  /* ---- who won, and why ---------------------------------------------------- */
  let result: MatchVerdict | null = null;
  let reason: MatchReason | null = null;
  if (forfeited) {
    result = "lose";
    reason = "forfeit";
  } else if (settledResult) {
    result = settledResult;
    reason = over ? (outcome === "timeout" ? "timeout" : "topped_out") : "opponent";
  } else if (over) {
    if (outcome === "lose") {
      result = "lose";
      reason = "topped_out";
    } else if (outcome === "win") {
      result = "win";
      reason = "timeout";
    } else {
      // Time ran out: higher score wins.
      reason = "timeout";
      result =
        stats.score > opponentStats.score
          ? "win"
          : stats.score < opponentStats.score
            ? "lose"
            : "draw";
    }
  }
  const matchOver = result !== null;
  const gameRunning = !forfeited && settledResult === undefined;

  /* ---- report to the parent ------------------------------------------------ */
  const onStatsChangeRef = useRef(onStatsChange);
  const onMatchEndRef = useRef(onMatchEnd);
  useEffect(() => {
    onStatsChangeRef.current = onStatsChange;
    onMatchEndRef.current = onMatchEnd;
  }, [onStatsChange, onMatchEnd]);

  useEffect(() => {
    if (!started) return;
    onStatsChangeRef.current?.({ score: stats.score, lines: stats.lines, level: stats.level });
  }, [started, stats.score, stats.lines, stats.level]);

  const endReported = useRef(false);
  useEffect(() => {
    if (!result || !reason || endReported.current) return;
    endReported.current = true;
    onMatchEndRef.current?.({
      result,
      reason,
      score: stats.score,
      lines: stats.lines,
      level: stats.level,
      opponentScore: opponentStats.score,
    });
  }, [result, reason, stats.score, stats.lines, stats.level, opponentStats.score]);

  /* ---- forfeit dialog ------------------------------------------------------ */
  useEffect(() => {
    if (!confirmOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeConfirm();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmOpen]);

  const closeConfirm = () => {
    setConfirmOpen(false);
    iframeRef.current?.contentWindow?.focus(); // give the keyboard back to the game
  };

  const confirmForfeit = () => {
    setConfirmOpen(false);
    setForfeited(true);
  };

  const exit = () => (onExit ? onExit() : router.back());

  /* ---- clock --------------------------------------------------------------- */
  const secondsLeft = started ? stats.timeLeft ?? matchLength : matchLength;
  const timePct = Math.max(0, Math.min(100, (secondsLeft / matchLength) * 100));
  const urgent = started && !matchOver && secondsLeft <= 10;

  return (
    <div className="flex h-dvh min-h-120 flex-col bg-[#03050b] font-bai text-white">
      {/* ------------------------------ Header ------------------------------ */}
      <header className="grid shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-white/[0.07] bg-[#070b17] px-3 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:gap-3 sm:px-5 sm:py-4">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <div
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bai-jamjuree-bold sm:h-9 sm:w-9 sm:text-[12px]"
            style={{ background: PURPLE }}
          >
            {player.initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs bai-jamjuree-bold sm:text-sm">{player.name}</p>
            <p
              className="truncate text-[11px] inter-bold tabular-nums text-[#00D3FE]"
            >
              Score: {stats.score.toLocaleString()} · Lines: {stats.lines}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-0.5 text-center">
          <p
            className={`text-lg bai-jamjuree-bold tabular-nums sm:text-[22px] ${
              urgent ? "text-rose-400" : ""
            }`}
            aria-label="Time remaining"
          >
            {formatClock(secondsLeft)}
          </p>
          <p
            className="whitespace-nowrap text-[10px] inter-bold uppercase text-[#FFB800]"
          >
            Active stake: {stake.toLocaleString()} GVT
          </p>
        </div>

        <div className="flex min-w-0 items-center justify-end gap-2 sm:gap-3">
          <div className="min-w-0 text-right">
            <p className="truncate text-xs bai-jamjuree-bold sm:text-sm">{opponent.name}</p>
            <p
              className="truncate text-[11px] inter-bold tabular-nums"
              style={{ color: AMBER }}
            >
              Score: {opponentStats.score.toLocaleString()} · Lines: {opponentStats.lines}
            </p>
          </div>
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs bai-jamjuree-bold text-[#03050b] sm:h-9 sm:w-9 sm:text-sm"
            style={{ background: AMBER }}
          >
            {opponent.initials}
          </div>
        </div>
      </header>

      {/* ------------------------------- Stage ------------------------------ */}
      <main className="flex min-h-0 flex-1 flex-col items-center px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:pt-6">
        {/* Time-left bar */}
        <div
          role="progressbar"
          aria-label="Match time left"
          aria-valuemin={0}
          aria-valuemax={matchLength}
          aria-valuenow={secondsLeft}
          className="h-1.5 w-full max-w-147.5 shrink-0 overflow-hidden rounded-full bg-white/10"
        >
          <div
            className="h-full rounded-full transition-[width] duration-1000 ease-linear motion-reduce:transition-none"
            style={{ width: `${timePct}%`, background: urgent ? "#FB7185" : AMBER }}
          />
        </div>

        {/* Phones: next piece, level and multiplier in one compact row */}
        <div className="mt-3 w-full max-w-105 shrink-0 sm:hidden">
          <NextPieceStrip next={stats.next} level={stats.level} multiplier={stats.multiplier} />
        </div>

        {/* Board + side cards: the board takes whatever height is left */}
        <div className="mt-4 flex min-h-0 w-full flex-1 items-start justify-center gap-4 sm:mt-6 sm:gap-6">
          <div
            className="relative h-full max-h-150 shrink-0"
            style={{ aspectRatio: "1 / 2" }}
          >
            <div
              className="h-full w-full touch-none select-none overflow-hidden rounded-2xl border bg-[#04070f]"
              style={{ borderColor: CYAN, boxShadow: `0 0 18px ${CYAN}40` }}
            >
              {gameRunning && (
                <iframe
                  ref={iframeRef}
                  src={src}
                  title="Tetris match"
                  scrolling="no"
                  allow="autoplay; fullscreen; gamepad"
                  className="block h-full w-full touch-none border-0"
                  onLoad={() => iframeRef.current?.contentWindow?.focus()}
                />
              )}
            </div>

            {/* Startup screen: loader, then "tap to start", then fades out */}
            {gameRunning && <StartupOverlay phase={phase} touch={isTouch} />}

            {result && reason && (
              <div
                role="dialog"
                aria-label="Match result"
                className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-2xl bg-[#03050b]/90 px-4 text-center backdrop-blur-sm sm:gap-3 sm:px-6"
              >
                <p
                  className="text-3xl bai-jamjuree-semibold uppercase sm:text-4xl"
                  style={{ color: VERDICT[result].color }}
                >
                  {VERDICT[result].title}
                </p>
                <p className="text-xs bai-jamjuree-light text-slate-300 sm:text-sm">{REASON_TEXT[reason]}</p>
                <p className="text-xs bai-jamjuree-light tabular-nums text-slate-300 sm:text-sm">
                  You {stats.score.toLocaleString()} · {opponent.name}{" "}
                  {opponentStats.score.toLocaleString()}
                </p>
                {result === "win" && (
                  <p className="text-xs font-bold sm:text-sm" style={{ color: AMBER }}>
                    {payout !== undefined
                      ? `+${payout.toLocaleString()} GVT`
                      : "Winner sweeps the escrowed pool."}
                  </p>
                )}
                <div className="mt-1 flex flex-wrap justify-center gap-2 sm:gap-3">
                  <button
                    onClick={exit}
                    className="rounded-full px-4 py-2 text-sm bai-jamjuree-bold text-[#03050b] transition hover:brightness-110 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-white sm:px-5"
                    style={{ background: CYAN }}
                  >
                    Back to lobby
                  </button>
                  {onRematch && (
                    <button
                      onClick={onRematch}
                      className="rounded-full border border-white/20 px-4 py-2 text-sm bai-jamjuree-bold transition hover:bg-white/10 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-white sm:px-5"
                    >
                      Play again
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Next piece + level / multiplier (tablet and up) */}
          <div className="hidden w-32 shrink-0 sm:block">
            <NextPieceCard next={stats.next} level={stats.level} multiplier={stats.multiplier} />
          </div>
        </div>

        {/* Footer row */}
        <div className="mt-4 flex w-full max-w-160 shrink-0 items-center justify-between gap-3 sm:mt-5">
          <p className="text-xs inter-light text-indigo-200/80">
            {isTouch
              ? "Tap to rotate · Swipe to move · Flick down to drop"
              : "Use Arrow keys to Rotate & Slide pieces · Space to hard drop"}
          </p>
          <button
            onClick={() => setConfirmOpen(true)}
            disabled={matchOver}
            className="shrink-0 rounded-lg border border-red-500/70 bg-red-950/20 px-4 py-2.5 text-xs bai-jamjuree-bold uppercase tracking-wide text-red-500 transition touch-manipulation hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-red-400 sm:px-5"
          >
            Forfeit game
          </button>
        </div>
      </main>

      {/* ---------------------------- Forfeit dialog -------------------------- */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center bai-jamjuree-semibold justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="forfeit-title"
            aria-describedby="forfeit-text"
            className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#070b17] p-5 text-center sm:p-6"
          >
            <h2 id="forfeit-title" className="text-lg font-semibold">
              Forfeit this match?
            </h2>
            <p id="forfeit-text" className="inter-light mt-2 text-sm text-slate-300">
              Forfeiting counts as a loss, and your {stake.toLocaleString()} GVT stake goes with it.
            </p>
            <div className="mt-5 flex flex-col-reverse justify-center gap-2 sm:flex-row sm:gap-3">
              <button
                onClick={confirmForfeit}
                className="rounded-lg border border-red-500/70 px-5 py-2 text-sm font-bold text-red-400 transition hover:bg-red-500/10 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-red-400"
              >
                Forfeit
              </button>
              <button
                autoFocus
                onClick={closeConfirm}
                className="rounded-lg px-5 py-2 text-sm font-bold text-[#03050b] transition hover:brightness-110 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-white"
                style={{ background: CYAN }}
              >
                Keep playing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
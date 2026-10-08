"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";

const CYAN = "#00D2FF";
const AMBER = "#FFB800";
const PURPLE = "#7C3AED";

/* -------------------------------------------------------------------------- */
/*  Messages sent by the pygbag game                                          */
/* -------------------------------------------------------------------------- */

type Outcome = "win" | "lose" | "draw" | "forfeit";

interface NextPiece {
  /** 1 = filled, 0 = empty. e.g. [[1,1,1],[0,1,0]] */
  shape: number[][];
  color?: string;
}

type GameMessage =
  | {
      source: "olos-tetris";
      type: "state";
      score: number;
      lines: number;
      level?: number;
      multiplier?: number;
      secondsLeft?: number;
      next?: NextPiece;
    }
  | { source: "olos-tetris"; type: "end"; outcome?: "win" | "lose" | "draw" };

function parseMessage(data: unknown): GameMessage | null {
  let d = data;
  if (typeof d === "string") {
    try {
      d = JSON.parse(d);
    } catch {
      return null;
    }
  }
  if (!d || typeof d !== "object") return null;
  const m = d as { source?: string; type?: string };
  if (m.source !== "olos-tetris") return null;
  return m.type === "state" || m.type === "end" ? (d as GameMessage) : null;
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

/** True on phones and tablets (touch as the primary input). */
function useCoarsePointer() {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia("(pointer: coarse)");
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia("(pointer: coarse)").matches,
    () => false
  );
}

const formatTime = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

function NextShape({ piece, cell }: { piece: NextPiece | null; cell: number }) {
  return (
    <div className="flex flex-col items-center gap-0.75" aria-hidden="true">
      {piece?.shape.map((row, r) => (
        <div key={r} className="flex gap-0.75">
          {row.map((filled, c) => (
            <div
              key={c}
              className="rounded-[3px]"
              style={{
                width: cell,
                height: cell,
                background: filled ? (piece.color ?? PURPLE) : "transparent",
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

interface Stats {
  score: number;
  lines: number;
}

interface LiveState extends Stats {
  level: number;
  multiplier: number;
  next: NextPiece | null;
}

const INITIAL: LiveState = { score: 0, lines: 0, level: 1, multiplier: 1, next: null };

export interface TetrisScreenProps {
  gameSrc?: string;
  player?: { name: string; initials: string };
  opponent?: { name: string; initials: string };
  stake?: string;
  durationSeconds?: number;
  /** Feed this from your match server / websocket. */
  opponentStats?: Stats;
  onMatchEnd?: (outcome: Outcome, stats: Stats) => void;
  onForfeit?: () => void;
}

export default function TetrisScreen({
  gameSrc = "/tetris/index.html",
  player = { name: "You (CryptoKing)", initials: "ME" },
  opponent = { name: "NeonSteer.eth", initials: "OP" },
  stake = "50 GVT",
  durationSeconds = 180,
  opponentStats = { score: 0, lines: 0 },
  onMatchEnd,
  onForfeit,
}: TetrisScreenProps) {
  const router = useRouter();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const isTouch = useCoarsePointer();

  const [game, setGame] = useState<LiveState>(INITIAL);
  const [started, setStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(durationSeconds);
  const [ended, setEnded] = useState<"win" | "lose" | "draw" | null>(null);
  const [forfeited, setForfeited] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [gameKey, setGameKey] = useState(0);

  const opp = opponentStats;

  const result: Outcome | null = forfeited
    ? "forfeit"
    : ended
      ? ended
      : started && timeLeft === 0
        ? game.score > opp.score
          ? "win"
          : game.score < opp.score
            ? "lose"
            : "draw"
        : null;

  /* ---- messages from the game iframe ------------------------------------ */
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e.source !== iframeRef.current?.contentWindow) return;
      const msg = parseMessage(e.data);
      if (!msg) return;

      if (msg.type === "state") {
        setStarted(true);
        setGame((g) => ({
          score: msg.score,
          lines: msg.lines,
          level: msg.level ?? g.level,
          multiplier: msg.multiplier ?? g.multiplier,
          next: msg.next ?? g.next,
        }));
        if (typeof msg.secondsLeft === "number") setTimeLeft(msg.secondsLeft);
      } else {
        setEnded(msg.outcome ?? "lose");
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  /* ---- local clock (starts with the first state message) ----------------- */
  useEffect(() => {
    if (!started || result) return;
    const id = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(id);
  }, [started, result]);

  /* ---- stop arrow keys / space from scrolling the page ------------------- */
  useEffect(() => {
    const block = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", block);
    return () => window.removeEventListener("keydown", block);
  }, []);

  /* ---- report result ----------------------------------------------------- */
  useEffect(() => {
    if (result) onMatchEnd?.(result, { score: game.score, lines: game.lines });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  /* ---- forfeit confirm reverts on its own -------------------------------- */
  useEffect(() => {
    if (!confirming) return;
    const id = setTimeout(() => setConfirming(false), 3000);
    return () => clearTimeout(id);
  }, [confirming]);

  const handleForfeit = () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setConfirming(false);
    setForfeited(true);
    iframeRef.current?.contentWindow?.postMessage(
      { source: "olos-host", type: "forfeit" },
      window.location.origin
    );
    onForfeit?.();
  };

  const playAgain = () => {
    setGame(INITIAL);
    setStarted(false);
    setTimeLeft(durationSeconds);
    setEnded(null);
    setForfeited(false);
    setGameKey((k) => k + 1); // remounts the iframe, reloading the game
  };

  const total = game.score + opp.score;
  const myShare = total === 0 ? 50 : (game.score / total) * 100;

  const resultCopy: Record<Outcome, { title: string; body: string; tone: string }> = {
    win: { title: "You won", body: `${stake} has been sent to your wallet.`, tone: "text-emerald-400" },
    lose: { title: "You lost", body: `${opponent.name} takes the ${stake} stake.`, tone: "text-red-400" },
    draw: { title: "Draw", body: "Scores were level. Both stakes are returned.", tone: "text-slate-200" },
    forfeit: { title: "You forfeited", body: `${opponent.name} takes the ${stake} stake.`, tone: "text-red-400" },
  };

  const hint = isTouch
    ? "Tap to rotate · Swipe to move · Flick down to drop"
    : "Use Arrow keys to Rotate & Slide pieces";

  return (
    // h-dvh follows the visible viewport on mobile browsers (address bar showing or hidden).
    <div className="flex h-dvh min-h-120 flex-col bg-[#03050b] font-sans text-white">
      {/* ------------------------------ Header ------------------------------ */}
      <header className="grid shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-white/[0.07] bg-[#070b17] px-3 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:gap-3 sm:px-5 sm:py-4">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bai-jamjuree-bold text-[12px] font-semibold sm:h-10 sm:w-10 sm:text-sm"
            style={{ background: PURPLE }}
          >
            {player.initials}
          </div>
          <div className="min-w-0">
            <p className="truncate bai-jamjuree-bold text-[14px]">{player.name}</p>
            <p
              className="truncate text-[11px] inter-semibold tabular-nums sm:text-xs"
              style={{ color: CYAN }}
            >
              Score: {game.score.toLocaleString()} · Lines: {game.lines}
            </p>
          </div>
        </div>

        <div className="text-center">
          <p className="bai-jamjuree-bold text-[22px] leading-none tabular-nums">
            {formatTime(timeLeft)}
          </p>
          <p
            className="mt-1 text-[10px] inter-semibold uppercase tracking-wide sm:mt-1.5 sm:text-[11px]"
            style={{ color: AMBER }}
          >
            Active stake: {stake}
          </p>
        </div>

        <div className="flex min-w-0 items-center justify-end gap-2 sm:gap-3">
          <div className="min-w-0 text-right">
            <p className="truncate bai-jamjuree-bold text-[14px]">{opponent.name}</p>
            <p
              className="truncate text-[11px] inter-semibold tabular-nums sm:text-xs"
              style={{ color: AMBER }}
            >
              Score: {opp.score.toLocaleString()} · Lines: {opp.lines}
            </p>
          </div>
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bai-jamjuree-bold text-[14px] sm:h-10 sm:w-10"
            style={{ background: AMBER }}
          >
            {opponent.initials}
          </div>
        </div>
      </header>

      {/* ------------------------------- Stage ------------------------------ */}
      <main className="flex min-h-0 flex-1 flex-col items-center px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:pt-8">
        {/* Score share bar */}
        <div
          className="flex h-1.5 w-full max-w-118.5 shrink-0 overflow-hidden rounded-full"
          role="img"
          aria-label={`Score share: you ${Math.round(myShare)}%, opponent ${Math.round(100 - myShare)}%`}
        >
          <div
            className="h-full transition-[width] duration-500 ease-out"
            style={{ width: `${myShare}%`, background: CYAN }}
          />
          <div className="h-full flex-1" style={{ background: AMBER }} />
        </div>

        {/* Phone HUD: next piece, level and multiplier in one slim row */}
        <div className="mt-3 flex w-full max-w-118.5 shrink-0 items-center justify-between rounded-xl border border-white/9 bg-[#070b17] px-4 py-2 sm:hidden">
          <div className="flex items-center justify-center gap-3">
            <span className="text-[10px] inter-semibold uppercase tracking-wider text-[#A4B7EB]">
              Next
            </span>
            <div className="flex min-h-5.75 items-center">
              <NextShape piece={game.next} cell={10} />
            </div>
          </div>
          <div className="text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Level
            </p>
            <p className="text-sm font-bold leading-tight">
              {String(game.level).padStart(2, "0")}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Multiplier
            </p>
            <p className="text-sm font-bold leading-tight tabular-nums text-emerald-400">
              ×{game.multiplier.toFixed(1)}
            </p>
          </div>
        </div>

        {/* Board row: the board takes whatever height is left on the screen */}
        <div className="mt-3 flex min-h-0 w-full flex-1 items-start justify-center gap-5 sm:mt-8">
          <div
            className="relative h-full max-h-140 shrink-0"
            style={{ aspectRatio: "1 / 2" }}
          >
            <div
              className="h-full w-full touch-none select-none overflow-hidden rounded-2xl border bg-[#04070f]"
              style={{ borderColor: CYAN, boxShadow: `0 0 18px ${CYAN}33` }}
            >
              <iframe
                key={gameKey}
                ref={iframeRef}
                src={gameSrc}
                title="Tetris"
                scrolling="no"
                allow="autoplay; fullscreen; gamepad"
                className="block h-full w-full touch-none border-0"
                onLoad={() => iframeRef.current?.contentWindow?.focus()}
              />
            </div>

            {result && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl bg-[#03050b]/90 px-4 text-center backdrop-blur-sm sm:gap-4 sm:px-6">
                <p className={`font-heading bai-jamjuree-bold uppercase text-[22px] ${resultCopy[result].tone}`}>
                  {resultCopy[result].title}!
                </p>
                <p className="text-xs bai-jamjuree-light text-slate-300 sm:text-sm">{resultCopy[result].body}</p>
                <p className="text-xs bai-jamjuree-bold tabular-nums text-slate-400 sm:text-sm">
                  {game.score.toLocaleString()} vs {opp.score.toLocaleString()}
                </p>
                <div className="mt-1 flex flex-wrap justify-center gap-2 sm:mt-2 sm:gap-2">
                  <button
                    onClick={playAgain}
                    className="rounded-xl uppercase bai-jamjuree-bold px-4 py-2 text-[11px] text-[#03050b] transition hover:brightness-110 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-white sm:px-5"
                    style={{ background: CYAN }}
                  >
                    Play again
                  </button>
                  <button
                    onClick={() => router.back()}
                    className="rounded-xl uppercase bai-jamjuree-bold border border-white/20 px-4 py-2 text-[11px] transition hover:bg-white/10 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-white sm:px-5"
                  >
                    Exit
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Side panel (tablets and desktop) */}
          <aside className="hidden shrink-0 flex-col gap-3 sm:flex">
            <div className="w-25 rounded-xl border border-white/9 bg-[#060A16] p-3">
              <p className="text-[10px] text-center inter-semibold uppercase tracking-wider text-[#A4B7EB]">
                Next piece
              </p>
              <div className="mt-2 flex min-h-8 justify-center">
                <NextShape piece={game.next} cell={14} />
              </div>
            </div>

            <div className="w-fit rounded-xl border border-white/9 bg-[#060A16] p-3">
              <p className="text-[8px] inter-semibold uppercase tracking-wider text-slate-500">
                Speed level
              </p>
              <p className="mt-0.5 text-[18px] inter-bold leading-tight">
                LEVEL {String(game.level).padStart(2, "0")}
              </p>
              <p className="mt-3 text-[8px] inter-semibold uppercase tracking-wider text-slate-500">
                Multiplier
              </p>
              <p className="mt-0.5 text-[#00FF87] inter-bold tabular-nums text-[18px]">
                ×{game.multiplier.toFixed(1)}
              </p>
            </div>
          </aside>
        </div>

        {/* Footer row */}
        <div className="mt-3 flex w-full max-w-140 shrink-0 items-center justify-between gap-3 sm:mt-6">
          <p className="text-[10px] text-[#A4B7EB] inter-light sm:text-[12px]">{hint}</p>
          <button
            onClick={handleForfeit}
            disabled={!!result}
            className="shrink-0 rounded-lg border border-red-500/70 bg-red-950/20 px-4 py-2.5 text-xs bai-jamjuree-bold uppercase tracking-wide text-red-500 transition touch-manipulation hover:bg-red-500/10 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-red-400 disabled:opacity-40 sm:px-5"
          >
            {confirming ? "Confirm forfeit?" : "Forfeit game"}
          </button>
        </div>
      </main>
    </div>
  );
}
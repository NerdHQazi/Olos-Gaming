"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

/* -------------------------------------------------------------------------- */
/*  Messages sent by the pygbag game (see main.py and index.html template)    */
/* -------------------------------------------------------------------------- */

export interface NextPiece {
  /** 1 = filled, 0 = empty. e.g. [[1,1,1],[0,1,0]] */
  shape: number[][];
  color?: string;
}

export interface TetrisStats {
  score: number;
  lines: number;
  level: number;
  multiplier: number;
  /** Whole seconds left when the game was started with ?time=..., otherwise null. */
  timeLeft?: number | null;
  next: NextPiece | null;
}

export type GameOutcome = "win" | "lose" | "draw" | "timeout";

/**
 * loading = the game is still starting up
 * ready   = waiting for the player's first tap / click
 * running = the game is playing
 */
export type GamePhase = "loading" | "ready" | "running";

type GameMessage =
  | {
      source: "olos-tetris";
      type: "state";
      score: number;
      lines: number;
      level?: number;
      multiplier?: number;
      timeLeft?: number | null;
      next?: NextPiece;
    }
  | {
      source: "olos-tetris";
      type: "end";
      outcome?: GameOutcome;
      score?: number;
      lines?: number;
      level?: number;
    }
  | { source: "olos-tetris"; type: "status"; status: "loading" | "ready" };

export function parseGameMessage(data: unknown): GameMessage | null {
  let d = data;
  if (typeof d === "string") {
    try {
      d = JSON.parse(d);
    } catch {
      return null;
    }
  }
  if (!d || typeof d !== "object") return null;
  const m = d as { source?: string; type?: string; status?: string };
  if (m.source !== "olos-tetris") return null;
  if (m.type === "state" || m.type === "end") return d as GameMessage;
  if (m.type === "status" && (m.status === "loading" || m.status === "ready")) {
    return d as GameMessage;
  }
  return null;
}

export const INITIAL_STATS: TetrisStats = {
  score: 0,
  lines: 0,
  level: 1,
  multiplier: 1,
  timeLeft: null,
  next: null,
};

/* -------------------------------------------------------------------------- */
/*  Hooks                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Listens to the game iframe. Attach `iframeRef` to the <iframe>; `stats`,
 * `phase`, `started`, `over` and `outcome` update as the game reports in.
 *
 * `phase` is null until the page inside the iframe sends its first status
 * message (older builds never do, so the page falls back to the game's own splash).
 */
export function useTetrisFeed() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [stats, setStats] = useState<TetrisStats>(INITIAL_STATS);
  const [phase, setPhase] = useState<GamePhase | null>(null);
  const [started, setStarted] = useState(false);
  const [over, setOver] = useState(false);
  const [outcome, setOutcome] = useState<GameOutcome | null>(null);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e.source !== iframeRef.current?.contentWindow) return;
      const msg = parseGameMessage(e.data);
      if (!msg) return;

      if (msg.type === "state") {
        setStarted(true);
        setPhase("running");
        setStats((s) => ({
          score: msg.score,
          lines: msg.lines,
          level: msg.level ?? s.level,
          multiplier: msg.multiplier ?? s.multiplier,
          timeLeft: msg.timeLeft ?? null,
          next: msg.next ?? s.next,
        }));
      } else if (msg.type === "end") {
        setOver(true);
        setOutcome(msg.outcome ?? "lose");
        setStats((s) => ({
          ...s,
          score: msg.score ?? s.score,
          lines: msg.lines ?? s.lines,
          level: msg.level ?? s.level,
        }));
      } else {
        // A late "loading" status must never pull a running game back to the splash.
        setPhase((p) => (p === "running" ? p : msg.status));
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  // Arrow keys and Space must not scroll the page while playing.
  useEffect(() => {
    const block = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", block);
    return () => window.removeEventListener("keydown", block);
  }, []);

  const reset = useCallback(() => {
    setStats(INITIAL_STATS);
    setPhase(null);
    setStarted(false);
    setOver(false);
    setOutcome(null);
  }, []);

  return { iframeRef, stats, phase, started, over, outcome, reset };
}

/** True on phones and tablets (touch as the primary input). */
export function useCoarsePointer() {
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

export const formatClock = (seconds: number) =>
  `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

/* -------------------------------------------------------------------------- */
/*  Shared UI                                                                 */
/* -------------------------------------------------------------------------- */

const CYAN = "#00D2FF";
const pad2 = (n: number) => String(n).padStart(2, "0");

/** Draws a piece from its 0/1 matrix, in the exact orientation it will spawn in. */
export function PiecePreview({ piece, cell = 16 }: { piece: NextPiece | null; cell?: number }) {
  if (!piece || piece.shape.length === 0 || piece.shape[0].length === 0) {
    return <div aria-hidden style={{ height: cell * 2 }} />;
  }
  const cols = piece.shape[0].length;
  return (
    <div
      role="img"
      aria-label="Next piece"
      className="grid"
      style={{ gridTemplateColumns: `repeat(${cols}, ${cell}px)`, gap: Math.max(1, cell / 8) }}
    >
      {piece.shape.flatMap((row, r) =>
        row.map((on, c) => (
          <span
            key={`${r}-${c}`}
            className="rounded-[3px]"
            style={{ height: cell, background: on ? piece.color ?? CYAN : "transparent" }}
          />
        ))
      )}
    </div>
  );
}

interface PieceInfoProps {
  next: NextPiece | null;
  level: number;
  multiplier: number;
}

/** "Next piece" card plus "Speed level / Multiplier" card, same look as the match screen. */
export function NextPieceCard({ next, level, multiplier }: PieceInfoProps) {
  return (
    <div className="flex flex-col gap-3">
      <section
        aria-label="Next piece"
        className="rounded-xl border border-white/9 bg-[#060A16] p-3"
      >
        <h3 className="text-[10px] inter-bold text-center uppercase tracking-wider text-[#A4B7EB]">
          Next piece
        </h3>
        <div className="mt-1 flex min-h-18 items-center justify-center">
          <PiecePreview piece={next} />
        </div>
      </section>

      <section
        aria-label="Speed level and multiplier"
        className="rounded-xl border border-white/9 bg-[#060A16] p-3"
      >
        <p className="text-[8px] uppercase tracking-wider text-[#6B7280]">Speed level</p>
        <p className="mt-1 text-lg uppercase inter-bold leading-tight tabular-nums">Level {pad2(level)}</p>
        <p className="mt-3 text-[8px] uppercase tracking-wider text-[#6B7280]">Multiplier</p>
        <p className="mt-1 text-lg inter-bold tabular-nums text-emerald-400">
          ×{multiplier.toFixed(1)}
        </p>
      </section>
    </div>
  );
}

/** One-row version of NextPieceCard for phones, where the side column is hidden. */
export function NextPieceStrip({ next, level, multiplier }: PieceInfoProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-white/9 bg-[#070b17] px-4 py-2">
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-200">Next</span>
        <div className="flex h-10 w-14 items-center justify-center">
          <PiecePreview piece={next} cell={8} />
        </div>
      </div>
      <p className="text-xs font-bold tabular-nums">Level {pad2(level)}</p>
      <p className="text-xs font-bold tabular-nums text-emerald-400">×{multiplier.toFixed(1)}</p>
    </div>
  );
}

const LOADER_CELLS = [
  { color: "#00D2FF", place: "col-start-1 row-start-1", delay: 0 },
  { color: "#FFB800", place: "col-start-2 row-start-1", delay: 150 },
  { color: "#7C3AED", place: "col-start-3 row-start-1", delay: 300 },
  { color: "#F43F5E", place: "col-start-2 row-start-2", delay: 450 },
];

/**
 * Startup screen drawn over the board: T-piece loader while the game loads, then a
 * "tap to start" prompt, then it fades out once the game is running. It ignores
 * pointer events, so the player's tap goes straight through to the game.
 */
export function StartupOverlay({ phase, touch }: { phase: GamePhase | null; touch: boolean }) {
  const ready = phase === "ready";
  const visible = phase === "loading" || ready;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-hidden={!visible}
      className={`pointer-events-none absolute inset-px z-10 overflow-hidden rounded-[15px] transition-opacity duration-500 motion-reduce:transition-none ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      style={{
        background: [
          "linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px) 0 0 / 100% 5%",
          "linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px) 0 0 / 10% 100%",
          "radial-gradient(ellipse at 50% 42%, rgba(0,210,255,.10), transparent 60%)",
          "#04070f",
        ].join(", "),
      }}
    >
      <div className="absolute left-1/2 top-[38%] grid -translate-x-1/2 grid-cols-[repeat(3,22px)] grid-rows-[repeat(2,22px)] gap-1">
        {LOADER_CELLS.map((c) => (
          <i
            key={c.color}
            className={`${c.place} rounded-[5px] ${
              ready ? "" : "animate-pulse motion-reduce:animate-none"
            }`}
            style={{ background: c.color, animationDelay: `${c.delay}ms` }}
          />
        ))}
      </div>

      <div className="absolute left-1/2 top-[56%] -translate-x-1/2 whitespace-nowrap">
        {ready ? (
          <span
            className="inline-block animate-pulse rounded-full border-[1.5px] px-7 py-3 text-base font-bold motion-reduce:animate-none"
            style={{ color: CYAN, borderColor: CYAN, background: "rgba(0,210,255,.08)" }}
          >
            {touch ? "Tap to start" : "Click to start"}
          </span>
        ) : (
          <span className="text-sm font-medium tracking-wide text-slate-400">Loading game…</span>
        )}
      </div>
    </div>
  );
}
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { Color, Piece } from "chess.js";
import { useAuth } from "@/context/AuthContext";
import ChessBoard from "@/components/chess/ChessBoard";
import { useChessGame } from "@/lib/chess/useChessGame";
import { GLYPHS, LEVELS, PIECE_VALUES, type Difficulty } from "@/lib/chess/constants";

const MATCH_SECONDS = 300; // 5:00 per side in PvP
const EXIT_ROUTE = "/dashboard/games/chess/details";

const label = (d: Difficulty) => d.charAt(0).toUpperCase() + d.slice(1);

const fmt = (total: number) => {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

function capturedText(pieces: Piece[]): string {
  if (pieces.length === 0) return "none";
  return [...pieces]
    .sort((a, b) => PIECE_VALUES[b.type] - PIECE_VALUES[a.type])
    .map((p) => GLYPHS[p.color][p.type])
    .join(" ");
}

export default function ChessScreen() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const mode = searchParams.get("mode") === "pve" ? "pve" : "pvp";
  const isPve = mode === "pve";

  // Clocks: PvP counts each side down, PvE counts the session up.
  const [clocks, setClocks] = useState<Record<Color, number>>({ w: MATCH_SECONDS, b: MATCH_SECONDS });
  const [elapsed, setElapsed] = useState(0);
  const [timedOut, setTimedOut] = useState<Color | null>(null);

  const g = useChessGame({
    vsAi: isPve,
    initialDifficulty: "hard",
    locked: timedOut !== null,
  });

  const userColor: Color = isPve ? g.playerColor : "w";
  const started = g.history.length > 0;
  const finished = g.isGameOver || timedOut !== null;

  useEffect(() => {
    if (!started || finished) return;
    const id = setInterval(() => {
      if (isPve) setElapsed((e) => e + 1);
      else setClocks((c) => ({ ...c, [g.turn]: Math.max(0, c[g.turn] - 1) }));
    }, 1000);
    return () => clearInterval(id);
  }, [started, finished, isPve, g.turn]);

  useEffect(() => {
    if (isPve || timedOut || g.isGameOver) return;
    if (clocks.w === 0) setTimedOut("w");
    else if (clocks.b === 0) setTimedOut("b");
  }, [clocks, isPve, timedOut, g.isGameOver]);

  const resetClocks = () => {
    setClocks({ w: MATCH_SECONDS, b: MATCH_SECONDS });
    setElapsed(0);
    setTimedOut(null);
  };

  const restart = () => {
    g.reset();
    resetClocks();
  };

  const chooseSide = (c: Color) => {
    if (c === g.playerColor) return;
    g.setPlayerColor(c);
    resetClocks();
  };

  // Captured pieces from each side's perspective
  const userCaptured = userColor === "w" ? g.captured.black : g.captured.white;
  const oppCaptured = userColor === "w" ? g.captured.white : g.captured.black;

  // Move log rows: 1. e4 e5
  const rows = useMemo(() => {
    const out: { n: number; w: string; b?: string }[] = [];
    g.history.forEach((m, i) => {
      if (i % 2 === 0) out.push({ n: i / 2 + 1, w: m.san });
      else out[out.length - 1].b = m.san;
    });
    return out;
  }, [g.history]);

  const logRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [rows.length]);

  const resultText = timedOut
    ? `${timedOut === "w" ? "Black" : "White"} Wins on Time`
    : g.status ?? "Game Over";

  let resultSub: string | null = null;
  if (isPve && g.isGameOver && g.isCheckmate) {
    resultSub = g.turn === g.playerColor ? "You were checkmated" : "You won";
  } else if (isPve && g.isGameOver) {
    resultSub = "Draw";
  }

  let statusLine: string;
  if (finished) statusLine = "Game over";
  else if (g.aiThinking) statusLine = "OLOS AI is thinking...";
  else if (isPve) statusLine = `Your move (${g.turn === "w" ? "White" : "Black"})`;
  else statusLine = `${g.turn === "w" ? "White" : "Black"} to move`;
  if (g.isCheck && !finished) statusLine += " — Check!";

  const oppName = isPve ? "OLOS AI (Bot)" : "GrandmasterX.eth";
  const username = user?.username || "CryptoKing";

  return (
    <div className="min-h-screen bg-[#03060d] text-white flex flex-col justify-between">
      {/* Top Header Match Stats */}
      <div className="border-b border-white/10 bg-[#080d1c] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 shrink-0 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center border border-amber-500/30 text-xs">
              {isPve ? "AI" : "OP"}
            </div>
            <div className="min-w-0">
              <span className="text-sm font-bold text-white block truncate">{oppName}</span>
              {isPve ? (
                <span className="text-[10px] font-black uppercase tracking-wider text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                  {label(g.difficulty)} DIFFICULTY
                </span>
              ) : (
                <span className="text-xs text-gray-400">Captured: {capturedText(oppCaptured)}</span>
              )}
            </div>
          </div>

          <div className="text-center space-y-1 shrink-0">
            <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-[#20ceee]/10 text-[#20ceee] border border-[#20ceee]/30 block">
              {isPve ? "AI PRACTICE TRAINING" : "MATCH CLOCK"}
            </span>
            {isPve ? (
              <span className="text-lg font-mono font-bold text-white block">
                Session Clock: {fmt(elapsed)}
              </span>
            ) : (
              <span className="text-lg font-mono font-bold block" aria-live="off">
                <span className={g.turn === "b" && !finished ? "text-[#20ceee]" : "text-gray-400"}>
                  {fmt(clocks.b)}
                </span>
                <span className="text-gray-600 mx-2">|</span>
                <span className={g.turn === "w" && !finished ? "text-[#20ceee]" : "text-gray-400"}>
                  {fmt(clocks.w)}
                </span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 min-w-0">
            <div className="text-right min-w-0">
              <span className="text-sm font-bold text-white block truncate">You ({username})</span>
              <span className="text-xs text-gray-400">Captured: {capturedText(userCaptured)}</span>
            </div>
            <div className="w-10 h-10 shrink-0 rounded-full bg-[#7135DB]/20 text-[#a78bfa] font-bold flex items-center justify-center border border-[#7135DB]/30 text-xs">
              ME
            </div>
          </div>
        </div>
      </div>

      {/* Main Board Area */}
      <div className="max-w-7xl mx-auto px-4 py-6 w-full flex-1 flex flex-col items-center gap-6">
        {isPve && (
          <div className="flex flex-wrap items-center justify-center gap-3 bg-[#080d1c] border border-white/10 px-4 py-2 rounded-xl text-xs">
            <span className="text-gray-400 font-medium">System Intelligence Power:</span>
            {LEVELS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => g.setDifficulty(d)}
                aria-pressed={g.difficulty === d}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  g.difficulty === d
                    ? "bg-[#20ceee] text-black"
                    : "bg-white/5 text-gray-400 hover:text-white"
                }`}
              >
                {label(d)}
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full items-start">
          <div className="lg:col-span-8 flex justify-center">
            <div className="w-full max-w-136 rounded-2xl shadow-2xl">
              <ChessBoard g={g}>
                {finished && (
                  <div
                    role="alertdialog"
                    aria-label="Game over"
                    className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-2xl bg-[#03060d]/85 p-4 text-center"
                  >
                    <h2 className="text-2xl sm:text-3xl font-black text-[#20ceee]">{resultText}</h2>
                    {resultSub && <p className="text-base text-gray-200 font-medium">{resultSub}</p>}
                    <div className="mt-4 flex gap-3">
                      <button
                        type="button"
                        onClick={restart}
                        autoFocus
                        className="px-5 py-2.5 rounded-xl bg-[#20ceee] text-black text-xs font-black uppercase tracking-wider hover:brightness-110 transition-all"
                      >
                        Play Again
                      </button>
                      <button
                        type="button"
                        onClick={() => router.push(EXIT_ROUTE)}
                        className="px-5 py-2.5 rounded-xl border border-white/15 text-gray-300 hover:bg-white/5 text-xs font-black uppercase tracking-wider transition-all"
                      >
                        {isPve ? "Exit Sandbox" : "Leave"}
                      </button>
                    </div>
                  </div>
                )}
              </ChessBoard>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="rounded-2xl border border-white/10 bg-[#080d1c] px-6 py-4 flex items-center justify-between gap-3">
              <h3 className="text-xs font-black text-white uppercase tracking-wider">STATUS</h3>
              <p
                role="status"
                className={`text-xs font-bold ${
                  g.isCheck && !finished ? "text-red-400" : g.aiThinking ? "text-amber-400" : "text-gray-300"
                }`}
              >
                {statusLine}
              </p>
            </div>

            {isPve && (
              <div className="rounded-2xl border border-white/10 bg-[#080d1c] p-6 space-y-4">
                <h3 className="text-xs font-black text-white uppercase tracking-wider">TRAINING ENGINE</h3>
                <p className="text-xs text-gray-400 leading-relaxed font-medium">
                  You are running checkmate test runs against OLOS Chess Engine v2.1. Standard evaluation
                  algorithms apply. Practice is completely gas-free.
                </p>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-gray-400 font-medium">Play as:</span>
                  {(["w", "b"] as const).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => chooseSide(c)}
                      aria-pressed={g.playerColor === c}
                      className={`px-3 py-1 rounded-lg font-bold transition-all ${
                        g.playerColor === c
                          ? "bg-[#20ceee] text-black"
                          : "bg-white/5 text-gray-400 hover:text-white"
                      }`}
                    >
                      {c === "w" ? "White" : "Black"}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-white/10 bg-[#080d1c] p-6 space-y-3 min-h-50">
              <h3 className="text-xs font-black text-white uppercase tracking-wider">MOVE LOG</h3>
              <div ref={logRef} className="max-h-65 overflow-y-auto font-mono text-xs text-gray-300">
                {rows.length === 0 ? (
                  <p className="text-gray-500 py-1">No moves yet. White opens.</p>
                ) : (
                  rows.map((r) => (
                    <div
                      key={r.n}
                      className="grid grid-cols-[2.5rem_1fr_1fr] border-b border-white/5 py-1"
                    >
                      <span className="text-gray-500">{r.n}.</span>
                      <span>{r.w}</span>
                      <span>{r.b ?? ""}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={g.undo}
                  disabled={!started || timedOut !== null}
                  className="px-4 py-2.5 rounded-xl border border-white/15 text-gray-300 hover:bg-white/5 disabled:opacity-40 disabled:hover:bg-transparent text-xs font-black uppercase tracking-wider transition-all"
                >
                  Undo
                </button>
                <button
                  type="button"
                  onClick={restart}
                  className="px-4 py-2.5 rounded-xl border border-white/15 text-gray-300 hover:bg-white/5 text-xs font-black uppercase tracking-wider transition-all"
                >
                  Restart
                </button>
              </div>
              <button
                type="button"
                onClick={() => router.push(EXIT_ROUTE)}
                className="px-6 py-2.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-black uppercase tracking-wider transition-all"
              >
                {isPve ? "EXIT SANDBOX" : "FORFEIT GAME"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
"use client";

import React, { useCallback, useEffect, useState } from "react";
import CheckersBoard from "./CheckersBoard";
import {
  allMovesFor,
  applyMove,
  computeAiMove,
  exploreCaptures,
  initialBoard,
  movesForPiece,
} from "./engine";
import { Board, Color, DifficultyMode, Move, Sq } from "./types";

interface CheckersPracticeEngineProps {
  onForfeit?: () => void;
  onBackToLobby?: () => void;
}

const ENGINE_DESCRIPTIONS: Record<
  DifficultyMode,
  { title: string; desc: string; latency: number }
> = {
  Easy: {
    title: "Easy Engine Mode",
    desc: "Evaluates basic positional heuristics with randomized exploratory moves. Ideal for beginners learning board mechanics.",
    latency: 220,
  },
  Medium: {
    title: "Medium Engine Mode",
    desc: "Uses tree search simulation capped at depth 6. Excellent for solid strategic testing and improving baseline board control.",
    latency: 340,
  },
  Hard: {
    title: "Hard Engine Mode",
    desc: "Full minimax depth search with alpha-beta pruning and dynamic king evaluation. Aggressively exploits forced jumps.",
    latency: 480,
  },
};

export default function CheckersPracticeEngine({
  onForfeit,
  onBackToLobby,
}: CheckersPracticeEngineProps) {
  const [board, setBoard] = useState<Board>(initialBoard);
  const [selected, setSelected] = useState<Sq | null>(null);
  const [validMoves, setValidMoves] = useState<Move[]>([]);
  const [turn, setTurn] = useState<Color>("red");
  const [difficulty, setDifficulty] = useState<DifficultyMode>("Medium");
  const [status, setStatus] = useState<"playing" | "victory" | "defeat">("playing");
  const [aiLatencyDisplay, setAiLatencyDisplay] = useState<number>(340);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [mustContinue, setMustContinue] = useState<Sq | null>(null);
  const [showForfeitModal, setShowForfeitModal] = useState(false);

  // Initialize selected valid moves as in image 3
  useEffect(() => {
    const p = board[2][3];
    if (p && p.color === "red") {
      const moves = movesForPiece(board, 2, 3);
      if (moves.length) {
        setSelected([2, 3]);
        setValidMoves(moves);
      }
    }
  }, []);

  // Update latency display when difficulty changes
  useEffect(() => {
    setAiLatencyDisplay(ENGINE_DESCRIPTIONS[difficulty].latency);
  }, [difficulty]);

  // Handle clicking square
  const handleSelectSquare = useCallback(
    (r: number, c: number) => {
      if (status !== "playing" || isAiThinking || turn !== "red") return;

      // When player must continue a multi-jump sequence
      if (mustContinue) {
        const jump = validMoves.find((m) => m.to[0] === r && m.to[1] === c);
        if (jump) {
          const nextBoard = applyMove(board, jump);
          setBoard(nextBoard);

          const followUp = jump.captured.length
            ? exploreCaptures(nextBoard, r, c, nextBoard[r][c]!, [])
            : [];

          if (followUp.length > 0) {
            setMustContinue([r, c]);
            setSelected([r, c]);
            setValidMoves(followUp);
          } else {
            setMustContinue(null);
            setSelected(null);
            setValidMoves([]);
            setTurn("black");
          }
        }
        return;
      }

      // Moving piece to valid destination
      if (selected) {
        const chosen = validMoves.find((m) => m.to[0] === r && m.to[1] === c);
        if (chosen) {
          const nextBoard = applyMove(board, chosen);
          setBoard(nextBoard);

          const followUp = chosen.captured.length
            ? exploreCaptures(nextBoard, r, c, nextBoard[r][c]!, [])
            : [];

          if (followUp.length > 0) {
            setMustContinue([r, c]);
            setSelected([r, c]);
            setValidMoves(followUp);
          } else {
            setSelected(null);
            setValidMoves([]);
            setTurn("black");
          }
          return;
        }
      }

      // Selecting own piece
      const piece = board[r][c];
      if (piece?.color === "red") {
        const moves = movesForPiece(board, r, c);
        setSelected(moves.length ? [r, c] : null);
        setValidMoves(moves);
      } else {
        setSelected(null);
        setValidMoves([]);
      }
    },
    [board, isAiThinking, mustContinue, selected, status, turn, validMoves],
  );

  // AI response move
  useEffect(() => {
    if (turn !== "black" || status !== "playing") return;

    setIsAiThinking(true);
    const startMs = performance.now();
    const baseLatency = ENGINE_DESCRIPTIONS[difficulty].latency;
    // Add realistic jitter (+/- 20ms)
    const jitter = Math.floor(Math.random() * 30) - 15;
    const computedWait = Math.max(150, baseLatency + jitter);

    const timer = setTimeout(() => {
      const move = computeAiMove(board, "black", difficulty);
      const endMs = performance.now();
      setAiLatencyDisplay(Math.round(computedWait + (endMs - startMs) * 0.1));

      if (!move) {
        setStatus("victory");
        setIsAiThinking(false);
        return;
      }

      const nextBoard = applyMove(board, move);
      setBoard(nextBoard);

      // Check if user has legal moves
      const userMoves = allMovesFor(nextBoard, "red");
      if (!userMoves.length) {
        setStatus("defeat");
      } else {
        setTurn("red");
      }
      setIsAiThinking(false);
    }, computedWait);

    return () => clearTimeout(timer);
  }, [board, difficulty, status, turn]);

  const handleConfirmForfeit = () => {
    setShowForfeitModal(false);
    setStatus("defeat");
    if (onForfeit) onForfeit();
  };

  const handleResetGame = () => {
    setBoard(initialBoard());
    setSelected(null);
    setValidMoves([]);
    setTurn("red");
    setStatus("playing");
    setMustContinue(null);
    setIsAiThinking(false);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* ── HEADER BANNER ──────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
            SOLOS PRACTICE ENGINE
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 font-medium leading-relaxed">
            No stakes required. Train against custom neural chess/checkers systems.
          </p>
        </div>

        {/* Top-Right Badge: Practice Arena */}
        <div className="self-start sm:self-center">
          <span className="inline-flex items-center px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-[#3b1262] text-[#c084fc] border border-[#7e22ce] shadow-[0_0_15px_rgba(126,34,206,0.3)]">
            PRACTICE ARENA
          </span>
        </div>
      </div>

      {/* ── MAIN 2-COLUMN LAYOUT ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Board & Bottom Stats (approx 7 cols) */}
        <div className="lg:col-span-7 flex flex-col items-center space-y-4">
          <CheckersBoard
            board={board}
            selected={selected}
            validMoves={validMoves}
            onSelectSquare={handleSelectSquare}
            interactive={turn === "red" && status === "playing" && !isAiThinking}
          />

          {/* Under-board controls row matching image 3 */}
          <div className="w-full max-w-[460px] flex items-center justify-between pt-2">
            <span className="text-xs text-gray-400 font-mono">
              AI Turn response time: ~{aiLatencyDisplay}ms
            </span>

            <button
              type="button"
              onClick={() => setShowForfeitModal(true)}
              className="px-5 py-2 rounded-lg border border-[#ef4444] text-[#ef4444] hover:bg-[#ef4444]/10 text-xs font-black uppercase tracking-wider transition-all duration-200 active:scale-95 cursor-pointer"
            >
              FORFEIT MATCH
            </button>
          </div>
        </div>

        {/* Right Column: AI Engine Profile & Training Score (approx 5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card 1: AI Engine Profile */}
          <div className="rounded-2xl border border-white/10 bg-[#0a0f1d] p-6 space-y-5 shadow-xl">
            <h2 className="text-xs font-black uppercase tracking-wider text-white">
              AI ENGINE PROFILE
            </h2>

            <div className="space-y-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
                DIFFICULTY MODE
              </span>

              {/* 3 Difficulty buttons */}
              <div className="grid grid-cols-3 gap-3">
                {(["Easy", "Medium", "Hard"] as DifficultyMode[]).map((mode) => {
                  const isActive = difficulty === mode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setDifficulty(mode)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-black uppercase transition-all duration-200 text-center cursor-pointer ${
                        isActive
                          ? "bg-[#00f0ff]/10 border border-[#00f0ff] text-[#00f0ff] shadow-[0_0_12px_rgba(0,240,255,0.25)]"
                          : "bg-[#060a16] border border-white/10 text-gray-300 hover:border-white/20 hover:text-white"
                      }`}
                    >
                      {mode}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dynamic engine description */}
            <div className="pt-4 border-t border-white/5 space-y-1.5">
              <h3 className="text-xs font-bold text-white">
                {ENGINE_DESCRIPTIONS[difficulty].title}
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed font-normal">
                {ENGINE_DESCRIPTIONS[difficulty].desc}
              </p>
            </div>
          </div>

          {/* Card 2: Your Training Score */}
          <div className="rounded-2xl border border-white/10 bg-[#0a0f1d] p-6 space-y-4 shadow-xl">
            <h2 className="text-xs font-black uppercase tracking-wider text-white">
              YOUR TRAINING SCORE
            </h2>

            <div className="space-y-3 pt-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 font-bold uppercase tracking-wider text-[11px]">
                  TOTAL MATCHES
                </span>
                <span className="font-mono font-black text-white text-sm">
                  42
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-400 font-bold uppercase tracking-wider text-[11px]">
                  WIN RATE
                </span>
                <span className="font-mono font-black text-[#00ff88] text-sm">
                  84.0%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── FORFEIT MODAL ──────────────────────────────────── */}
      {showForfeitModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0a0f1d] border border-white/10 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-base font-black text-white uppercase tracking-wider">
              Forfeit Confirmation
            </h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              Are you sure you want to forfeit this practice match against the AI engine?
            </p>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowForfeitModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-300 text-xs font-bold hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmForfeit}
                className="flex-1 py-2.5 rounded-xl bg-[#ef4444] hover:bg-[#dc2626] text-white text-xs font-black transition-colors"
              >
                Forfeit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── VICTORY / DEFEAT MODAL ─────────────────────────── */}
      {status !== "playing" && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0a0f1d] border border-white/10 rounded-2xl p-8 max-w-md w-full space-y-6 text-center shadow-2xl animate-in zoom-in-95">
            <div
              className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center text-3xl ${
                status === "victory"
                  ? "bg-[#00ff88]/10 border border-[#00ff88] text-[#00ff88] shadow-[0_0_20px_#00ff88]"
                  : "bg-[#ef4444]/10 border border-[#ef4444] text-[#ef4444] shadow-[0_0_20px_#ef4444]"
              }`}
            >
              {status === "victory" ? "🏆" : "✕"}
            </div>

            <div className="space-y-2">
              <h3
                className={`text-2xl font-black uppercase tracking-wider ${
                  status === "victory" ? "text-[#00ff88]" : "text-[#ef4444]"
                }`}
              >
                {status === "victory" ? "PRACTICE VICTORY!" : "PRACTICE DEFEAT"}
              </h3>
              <p className="text-xs text-gray-400">
                {status === "victory"
                  ? `Outstanding! You defeated the ${difficulty} engine.`
                  : `The ${difficulty} engine claimed victory. Try another strategy!`}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleResetGame}
                className="flex-1 py-3 rounded-xl bg-[#00f0ff] hover:bg-[#38bdf8] text-[#050810] text-xs font-black uppercase tracking-wider transition-all"
              >
                REMATCH
              </button>
              {onBackToLobby && (
                <button
                  type="button"
                  onClick={onBackToLobby}
                  className="flex-1 py-3 rounded-xl border border-white/10 hover:bg-white/5 text-gray-300 text-xs font-black uppercase tracking-wider transition-all"
                >
                  LOBBY
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

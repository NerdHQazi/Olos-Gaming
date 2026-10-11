"use client";

import React, { useCallback, useEffect, useState } from "react";
import CheckersBoard from "./CheckersBoard";
import {
  allMovesFor,
  applyMove,
  countPieces,
  exploreCaptures,
  initialBoard,
  movesForPiece,
  oppColor,
} from "./engine";
import { Board, Color, Move, Sq } from "./types";

interface CheckersPvPArenaProps {
  stake?: number;
  onForfeit?: () => void;
  onBackToLobby?: () => void;
}

export default function CheckersPvPArena({
  stake = 50,
  onForfeit,
  onBackToLobby,
}: CheckersPvPArenaProps) {
  const [board, setBoard] = useState<Board>(initialBoard);
  const [selected, setSelected] = useState<Sq | null>(null);
  const [validMoves, setValidMoves] = useState<Move[]>([]);
  const [turn, setTurn] = useState<Color>("red"); // You are red
  const [timeSeconds, setTimeSeconds] = useState<number>(252); // 04:12 = 252s
  const [status, setStatus] = useState<"playing" | "victory" | "defeat">("playing");
  const [showForfeitModal, setShowForfeitModal] = useState(false);
  const [mustContinue, setMustContinue] = useState<Sq | null>(null);

  // Countdown timer
  useEffect(() => {
    if (status !== "playing") return;
    const interval = setInterval(() => {
      setTimeSeconds((prev) => {
        if (prev <= 1) {
          setStatus("defeat");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [status]);

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const { redCount, redKings, blackCount, blackKings } = countPieces(board);
  const capturedOpponent = 12 - blackCount;

  // Handle clicking a square
  const handleSelectSquare = useCallback(
    (r: number, c: number) => {
      if (status !== "playing") return;

      // When player must continue a multi-jump sequence
      if (mustContinue) {
        const jump = validMoves.find((m) => m.to[0] === r && m.to[1] === c);
        if (jump) {
          const nextBoard = applyMove(board, jump);
          setBoard(nextBoard);

          // Check for another jump
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

      // If moving selected piece to valid destination
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

      // Otherwise select a piece
      if (turn !== "red") return;
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
    [board, mustContinue, selected, status, turn, validMoves],
  );

  // Opponent turn simulation
  useEffect(() => {
    if (turn !== "black" || status !== "playing") return;

    const timer = setTimeout(() => {
      const oppMoves = allMovesFor(board, "black");
      if (!oppMoves.length) {
        setStatus("victory");
        return;
      }

      // Pick a move
      const chosen = oppMoves[Math.floor(Math.random() * oppMoves.length)];
      const nextBoard = applyMove(board, chosen);
      setBoard(nextBoard);

      // Check win/loss for Red
      const myMoves = allMovesFor(nextBoard, "red");
      if (!myMoves.length) {
        setStatus("defeat");
      } else {
        setTurn("red");
      }
    }, 900);

    return () => clearTimeout(timer);
  }, [board, status, turn]);

  // Initial check on load
  useEffect(() => {
    // Select initial valid moves for demonstration as in image 2
    // In image 2, piece at [2, 3] is selected and has two destinations at [3, 2] and [3, 4]
    const p = board[2][3];
    if (p && p.color === "red") {
      const moves = movesForPiece(board, 2, 3);
      if (moves.length) {
        setSelected([2, 3]);
        setValidMoves(moves);
      }
    }
  }, []);

  const handleConfirmForfeit = () => {
    setShowForfeitModal(false);
    setStatus("defeat");
    if (onForfeit) onForfeit();
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-fade-in flex flex-col items-center">
      {/* ── TOP MATCH STATUS BAR ───────────────────────────── */}
      <div className="w-full max-w-[560px] rounded-2xl bg-[#0a0f1d] border border-white/10 p-4 sm:p-5 flex items-center justify-between shadow-xl">
        {/* Left: You (CryptoKing) */}
        <div className="flex items-center gap-3">
          {/* Red circular avatar */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ff5247] to-[#b91c1c] border border-[#ff8882]/40 shadow-[0_0_10px_rgba(239,68,68,0.5)] shrink-0" />
          <div className="flex flex-col leading-tight">
            <span className="text-xs sm:text-sm font-black text-white">
              You (CryptoKing)
            </span>
            <span className="text-[11px] font-bold text-[#ef4444]">
              Pieces Left: {redCount} ({redKings} King{redKings !== 1 ? "s" : ""})
            </span>
          </div>
        </div>

        {/* Center: Clock & Stake */}
        <div className="flex flex-col items-center leading-tight">
          <span className="text-xl sm:text-2xl font-mono font-black text-white tracking-wider">
            {formatTimer(timeSeconds)}
          </span>
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-[#f59e0b]">
            ACTIVE STAKE: {stake} GVT
          </span>
        </div>

        {/* Right: Opponent (SnakeMstr.sol) */}
        <div className="flex items-center gap-3 text-right">
          <div className="flex flex-col leading-tight">
            <span className="text-xs sm:text-sm font-black text-white">
              SnakeMstr.sol
            </span>
            <span className="text-[11px] font-medium text-gray-400">
              Pieces Left: {blackCount}
            </span>
          </div>
          {/* Charcoal circular avatar */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#333d52] to-[#121622] border border-[#4a5568]/50 shadow-md shrink-0" />
        </div>
      </div>

      {/* ── TURN BADGE ─────────────────────────────────────── */}
      <div className="flex justify-center">
        <div className="px-5 py-1.5 rounded-full border border-[#00ff88] bg-[#00ff88]/10 text-[#00ff88] text-[11px] font-black uppercase tracking-wider shadow-[0_0_12px_rgba(0,255,136,0.2)]">
          {turn === "red"
            ? "YOUR TURN • SELECT PIECE TO MOVE"
            : "OPPONENT'S TURN • CALCULATING..."}
        </div>
      </div>

      {/* ── BOARD ──────────────────────────────────────────── */}
      <div className="w-full flex justify-center">
        <CheckersBoard
          board={board}
          selected={selected}
          validMoves={validMoves}
          onSelectSquare={handleSelectSquare}
          interactive={turn === "red" && status === "playing"}
        />
      </div>

      {/* ── BOTTOM STATS & FORFEIT ─────────────────────────── */}
      <div className="w-full max-w-[460px] flex items-center justify-between pt-1">
        {/* Left: Captured Pieces */}
        <div className="flex items-center gap-2 text-xs font-bold text-gray-300">
          <span>Captured Opponent Pieces: {capturedOpponent}</span>
          <div className="w-3.5 h-3.5 rounded-full border border-gray-500 bg-[#283244]" />
        </div>

        {/* Right: Forfeit Game */}
        <button
          type="button"
          onClick={() => setShowForfeitModal(true)}
          className="px-5 py-2 rounded-lg border border-[#ef4444] text-[#ef4444] hover:bg-[#ef4444]/10 text-xs font-black uppercase tracking-wider transition-all duration-200 active:scale-95 cursor-pointer"
        >
          FORFEIT GAME
        </button>
      </div>

      {/* ── FORFEIT MODAL ──────────────────────────────────── */}
      {showForfeitModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0a0f1d] border border-white/10 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-base font-black text-white uppercase tracking-wider">
              Forfeit Confirmation
            </h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              Are you sure you want to forfeit this match? Your active stake of{" "}
              <strong className="text-amber-400">{stake} GVT</strong> will be
              settled immediately in favor of your opponent.
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
                Confirm Forfeit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SETTLEMENT OUTCOME MODAL ───────────────────────── */}
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
                {status === "victory" ? "MATCH VICTORY!" : "MATCH DEFEAT"}
              </h3>
              <p className="text-xs text-gray-400">
                {status === "victory"
                  ? "Congratulations! You captured the battlefield and secured on-chain settlement."
                  : "The match has ended. Better luck in your next battle!"}
              </p>
            </div>

            {/* Payout box */}
            <div className="bg-[#060a16] border border-white/5 rounded-xl p-4 flex items-center justify-between text-xs">
              <span className="text-gray-400 font-bold uppercase tracking-wider">
                Payout Settlement
              </span>
              <span
                className={`font-mono font-black text-sm ${
                  status === "victory" ? "text-[#00ff88]" : "text-[#ef4444]"
                }`}
              >
                {status === "victory"
                  ? `+${(stake * 1.9).toFixed(2)} GVT`
                  : `-${stake.toFixed(2)} GVT`}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setBoard(initialBoard());
                  setSelected(null);
                  setValidMoves([]);
                  setTurn("red");
                  setTimeSeconds(252);
                  setStatus("playing");
                }}
                className="flex-1 py-3 rounded-xl bg-[#00f0ff] hover:bg-[#38bdf8] text-[#050810] text-xs font-black uppercase tracking-wider transition-all"
              >
                PLAY AGAIN
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

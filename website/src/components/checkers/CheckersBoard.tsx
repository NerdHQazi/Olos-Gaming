"use client";

import React from "react";
import { Board, Color, Move, Piece, Sq } from "./types";

interface CheckersBoardProps {
  board: Board;
  selected: Sq | null;
  validMoves: Move[];
  onSelectSquare: (r: number, c: number) => void;
  interactive?: boolean;
  activeTurn?: Color;
}

export default function CheckersBoard({
  board,
  selected,
  validMoves,
  onSelectSquare,
  interactive = true,
}: CheckersBoardProps) {
  // Helper to check if a square is a valid move destination
  const isDestination = (r: number, c: number) => {
    return validMoves.some((m) => m.to[0] === r && m.to[1] === c);
  };

  const isSelected = (r: number, c: number) => {
    return selected !== null && selected[0] === r && selected[1] === c;
  };

  return (
    <div className="relative p-1.5 rounded-2xl bg-[#060a14] border-2 border-[#00f0ff] shadow-[0_0_25px_rgba(0,240,255,0.35)] w-full max-w-[460px] aspect-square mx-auto">
      <div className="grid grid-cols-8 grid-rows-8 w-full h-full rounded-xl overflow-hidden select-none bg-[#0e1628]">
        {board.map((row, r) =>
          row.map((piece, c) => {
            const isDark = (r + c) % 2 === 1;
            const validDest = isDestination(r, c);
            const selectedCell = isSelected(r, c);

            return (
              <div
                key={`${r}-${c}`}
                onClick={() => interactive && onSelectSquare(r, c)}
                className={`relative flex items-center justify-center transition-colors cursor-pointer ${
                  isDark ? "bg-[#060a16]" : "bg-[#0e1628]"
                } ${
                  validDest
                    ? "border-2 border-[#00f0ff] bg-[#00f0ff]/10"
                    : selectedCell
                    ? "border-2 border-yellow-400 bg-yellow-400/10"
                    : ""
                }`}
              >
                {/* Valid destination indicator dot */}
                {validDest && !piece && (
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#00f0ff] shadow-[0_0_10px_#00f0ff] animate-pulse" />
                )}

                {/* Checkers Piece */}
                {piece && (
                  <PieceView
                    piece={piece}
                    isSelected={selectedCell}
                  />
                )}
              </div>
            );
          }),
        )}
      </div>
    </div>
  );
}

function PieceView({
  piece,
  isSelected,
}: {
  piece: Piece;
  isSelected: boolean;
}) {
  const isRed = piece.color === "red";

  return (
    <div
      className={`relative w-[78%] h-[78%] rounded-full flex items-center justify-center transition-all duration-200 transform ${
        isSelected
          ? "scale-105 ring-2 ring-[#00f0ff] ring-offset-2 ring-offset-[#060a16] shadow-[0_0_18px_rgba(0,240,255,0.8)]"
          : "hover:scale-102 hover:brightness-110 shadow-lg shadow-black/60"
      }`}
      style={{
        background: isRed
          ? "radial-gradient(circle at 35% 35%, #ff5247 0%, #dc2626 55%, #991b1b 100%)"
          : "radial-gradient(circle at 35% 35%, #333d52 0%, #1f2737 60%, #101624 100%)",
        boxShadow: isRed
          ? "inset 0 2px 4px rgba(255,255,255,0.4), inset 0 -3px 5px rgba(0,0,0,0.6), 0 4px 8px rgba(0,0,0,0.7)"
          : "inset 0 2px 3px rgba(255,255,255,0.2), inset 0 -3px 5px rgba(0,0,0,0.8), 0 4px 8px rgba(0,0,0,0.8)",
      }}
    >
      {/* Outer concentric groove */}
      <div
        className="w-[78%] h-[78%] rounded-full flex items-center justify-center"
        style={{
          border: isRed
            ? "1.5px solid rgba(255, 120, 110, 0.45)"
            : "1.5px solid rgba(100, 116, 139, 0.4)",
          background: isRed
            ? "radial-gradient(circle at 40% 40%, #ef4444 0%, #b91c1c 100%)"
            : "radial-gradient(circle at 40% 40%, #283244 0%, #131a29 100%)",
          boxShadow: "inset 0 2px 3px rgba(0,0,0,0.5)",
        }}
      >
        {/* Inner concentric ring */}
        <div
          className="w-[58%] h-[58%] rounded-full flex items-center justify-center"
          style={{
            border: isRed
              ? "1px solid rgba(255, 180, 170, 0.4)"
              : "1px solid rgba(148, 163, 184, 0.3)",
            background: isRed
              ? "radial-gradient(circle at 40% 40%, #dc2626 0%, #7f1d1d 100%)"
              : "radial-gradient(circle at 40% 40%, #1f2737 0%, #0c111c 100%)",
          }}
        >
          {/* King Crown Symbol */}
          {piece.type === "king" && (
            <span
              className={`text-sm sm:text-base leading-none select-none font-bold ${
                isRed ? "text-amber-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" : "text-amber-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
              }`}
            >
              ♛
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

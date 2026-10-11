"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const SQ = 68;
const W = SQ * 8;
const H = SQ * 8;

type Color = "w" | "b";
type PieceType = "K" | "Q" | "R" | "B" | "N" | "P";
type Piece = { type: PieceType; color: Color };
type Board = (Piece | null)[][];
type Sq = [number, number];

const GLYPHS: Record<Color, Record<PieceType, string>> = {
  w: { K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘", P: "♙" },
  b: { K: "♚", Q: "♛", R: "♜", B: "♝", N: "♞", P: "♟" },
};

function emptyBoard(): Board {
  return Array.from({ length: 8 }, () => Array(8).fill(null));
}

function initialBoard(): Board {
  const b = emptyBoard();
  const back: PieceType[] = ["R", "N", "B", "Q", "K", "B", "N", "R"];
  for (let c = 0; c < 8; c++) {
    b[0][c] = { type: back[c], color: "b" };
    b[1][c] = { type: "P", color: "b" };
    b[6][c] = { type: "P", color: "w" };
    b[7][c] = { type: back[c], color: "w" };
  }
  return b;
}

function opp(c: Color): Color {
  return c === "w" ? "b" : "w";
}

function inBounds(r: number, c: number) {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

function rawMoves(board: Board, r: number, c: number): Sq[] {
  const piece = board[r][c];
  if (!piece) return [];
  const { type, color } = piece;
  const moves: Sq[] = [];

  const slide = (dr: number, dc: number) => {
    let nr = r + dr;
    let nc = c + dc;
    while (inBounds(nr, nc)) {
      const t = board[nr][nc];
      if (t) {
        if (t.color !== color) moves.push([nr, nc]);
        break;
      }
      moves.push([nr, nc]);
      nr += dr;
      nc += dc;
    }
  };

  const step = (dr: number, dc: number) => {
    const nr = r + dr;
    const nc = c + dc;
    if (inBounds(nr, nc) && board[nr][nc]?.color !== color)
      moves.push([nr, nc]);
  };

  switch (type) {
    case "R": [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([dr, dc]) => slide(dr, dc)); break;
    case "B": [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([dr, dc]) => slide(dr, dc)); break;
    case "Q": [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([dr, dc]) => slide(dr, dc)); break;
    case "N": [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]].forEach(([dr, dc]) => step(dr, dc)); break;
    case "K": [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]].forEach(([dr, dc]) => step(dr, dc)); break;
    case "P": {
      const dir = color === "w" ? -1 : 1;
      const startRow = color === "w" ? 6 : 1;
      if (inBounds(r + dir, c) && !board[r + dir][c]) {
        moves.push([r + dir, c]);
        if (r === startRow && !board[r + 2 * dir][c]) moves.push([r + 2 * dir, c]);
      }
      [-1, 1].forEach((dc) => {
        const nr = r + dir;
        const nc = c + dc;
        if (inBounds(nr, nc) && board[nr][nc]?.color === opp(color)) moves.push([nr, nc]);
      });
      break;
    }
  }
  return moves;
}

function isInCheck(board: Board, color: Color): boolean {
  let kingR = -1, kingC = -1;
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++)
      if (board[r][c]?.type === "K" && board[r][c]?.color === color) { kingR = r; kingC = c; }
  if (kingR === -1) return true;
  const enemy = opp(color);
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++)
      if (board[r][c]?.color === enemy)
        if (rawMoves(board, r, c).some(([mr, mc]) => mr === kingR && mc === kingC)) return true;
  return false;
}

function applyMove(board: Board, from: Sq, to: Sq): Board {
  const nb = board.map((row) => [...row]);
  const [fr, fc] = from;
  const [tr, tc] = to;
  nb[tr][tc] = nb[fr][fc];
  nb[fr][fc] = null;
  if (nb[tr][tc]?.type === "P") {
    if (tr === 0 && nb[tr][tc]?.color === "w") nb[tr][tc] = { type: "Q", color: "w" };
    if (tr === 7 && nb[tr][tc]?.color === "b") nb[tr][tc] = { type: "Q", color: "b" };
  }
  return nb;
}

function legalMoves(board: Board, r: number, c: number, color: Color): Sq[] {
  return rawMoves(board, r, c).filter(([tr, tc]) => !isInCheck(applyMove(board, [r, c], [tr, tc]), color));
}

export default function ChessScreen() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const mode = searchParams.get("mode") || "pvp";
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [board, setBoard] = useState<Board>(initialBoard);
  const [selected, setSelected] = useState<Sq | null>(null);
  const [highlights, setHighlights] = useState<Sq[]>([]);
  const [turn, setTurn] = useState<Color>("w");
  const [difficulty, setDifficulty] = useState<"Easy" | "Medium" | "Hard">("Hard");

  const boardRef = useRef(board);
  boardRef.current = board;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, W, H);

    const LIGHT = "#222a3d";
    const DARK = "#151b28";

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        ctx.fillStyle = (r + c) % 2 === 0 ? LIGHT : DARK;
        ctx.fillRect(c * SQ, r * SQ, SQ, SQ);

        if (selected && selected[0] === r && selected[1] === c) {
          ctx.fillStyle = "rgba(234,179,8,0.4)";
          ctx.fillRect(c * SQ, r * SQ, SQ, SQ);
        }

        if (highlights.some(([hr, hc]) => hr === r && hc === c)) {
          ctx.fillStyle = "#20ceee";
          ctx.beginPath();
          ctx.arc(c * SQ + SQ / 2, r * SQ + SQ / 2, 8, 0, Math.PI * 2);
          ctx.fill();
        }

        const p = boardRef.current[r][c];
        if (p) {
          ctx.font = `${SQ * 0.65}px sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = p.color === "w" ? "#ffffff" : "#94a3b8";
          ctx.fillText(GLYPHS[p.color][p.type], c * SQ + SQ / 2, r * SQ + SQ / 2);
        }
      }
    }
  }, [selected, highlights]);

  useEffect(() => { draw(); }, [draw, board]);

  const handlePointerClick = (clientX: number, clientY: number) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const c = Math.floor(((clientX - rect.left) * (W / rect.width)) / SQ);
    const r = Math.floor(((clientY - rect.top) * (H / rect.height)) / SQ);

    if (!inBounds(r, c)) return;

    if (selected) {
      const move = highlights.find(([hr, hc]) => hr === r && hc === c);
      if (move) {
        const nb = applyMove(boardRef.current, selected, [r, c]);
        setBoard(nb);
        setSelected(null);
        setHighlights([]);
        setTurn(opp(turn));
        return;
      }
    }

    const p = boardRef.current[r][c];
    if (p && p.color === turn) {
      setSelected([r, c]);
      setHighlights(legalMoves(boardRef.current, r, c, turn));
    } else {
      setSelected(null);
      setHighlights([]);
    }
  };

  return (
    <div className="min-h-screen bg-[#03060d] text-white flex flex-col justify-between">
      {/* Top Header Match Stats */}
      <div className="border-b border-white/10 bg-[#080d1c] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center border border-amber-500/30 text-xs">
              {mode === "pve" ? "AI" : "OP"}
            </div>
            <div>
              <span className="text-sm font-bold text-white block">
                {mode === "pve" ? "OLOS AI (Bot)" : "GrandmasterX.eth"}
              </span>
              {mode === "pve" && (
                <span className="text-[10px] font-black uppercase tracking-wider text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                  {difficulty} DIFFICULTY
                </span>
              )}
            </div>
          </div>

          <div className="text-center space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-[#20ceee]/10 text-[#20ceee] border border-[#20ceee]/30 block">
              {mode === "pve" ? "AI PRACTICE TRAINING" : "MATCH CLOCK"}
            </span>
            <span className="text-lg font-mono font-bold text-white block">
              {mode === "pve" ? "System Clock: 04:52" : "05:00"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-sm font-bold text-white block">You ({user?.username || "CryptoKing"})</span>
              <span className="text-xs text-gray-400">Captured: ♟ ♞</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#7135DB]/20 text-[#a78bfa] font-bold flex items-center justify-center border border-[#7135DB]/30 text-xs">
              ME
            </div>
          </div>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="max-w-7xl mx-auto px-4 py-6 w-full flex-1 flex flex-col items-center gap-6">
        {mode === "pve" && (
          <div className="flex items-center gap-3 bg-[#080d1c] border border-white/10 px-4 py-2 rounded-xl text-xs">
            <span className="text-gray-400 font-medium">System Intelligence Power:</span>
            {(["Easy", "Medium", "Hard"] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  difficulty === d ? "bg-[#20ceee] text-black" : "bg-white/5 text-gray-400 hover:text-white"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full items-start">
          <div className="lg:col-span-8 flex justify-center">
            <div className="w-full max-w-[544px] aspect-square rounded-2xl overflow-hidden border border-[#20ceee]/30 shadow-2xl bg-[#151b28]">
              <canvas
                ref={canvasRef}
                width={W}
                height={H}
                onClick={(e) => handlePointerClick(e.clientX, e.clientY)}
                className="w-full h-full block cursor-pointer touch-none"
              />
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            {mode === "pve" ? (
              <div className="rounded-2xl border border-white/10 bg-[#080d1c] p-6 space-y-3">
                <h3 className="text-xs font-black text-white uppercase tracking-wider">TRAINING ENGINE</h3>
                <p className="text-xs text-gray-400 leading-relaxed font-medium">
                  You are running checkmate test runs against OLOS Chess Engine v2.1. Standard evaluation algorithms apply. Practice is completely gas-free.
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-[#080d1c] p-6 space-y-3 min-h-[260px]">
                <h3 className="text-xs font-black text-white uppercase tracking-wider">MOVE LOG</h3>
                <div className="space-y-1.5 font-mono text-xs text-gray-300">
                  <div className="flex justify-between border-b border-white/5 py-1"><span>1. e4</span><span>e5</span></div>
                  <div className="flex justify-between border-b border-white/5 py-1"><span>2. Nf3</span><span>Nc6</span></div>
                  <div className="flex justify-between border-b border-white/5 py-1"><span>3. Bb5</span><span>a6</span></div>
                  <div className="flex justify-between border-b border-white/5 py-1"><span>4. Ba4</span><span>Nf6</span></div>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => router.push("/dashboard/games/chess/details")}
                className="px-6 py-2.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-black uppercase tracking-wider transition-all"
              >
                {mode === "pve" ? "EXIT SANDBOX" : "FORFEIT GAME"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

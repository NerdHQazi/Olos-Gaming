'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Color, Move, Piece, PieceSymbol, Square } from 'chess.js';
import { FILES } from './constants';

/** A piece with a stable identity, so the UI can animate it between squares. */
export interface TrackedPiece {
  id: string;
  type: PieceSymbol;
  color: Color;
  square: Square;
}

function initialPieces(): TrackedPiece[] {
  const back: PieceSymbol[] = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
  const out: TrackedPiece[] = [];
  for (let f = 0; f < 8; f++) {
    const file = FILES[f];
    out.push({ id: `w-${file}1`, type: back[f], color: 'w', square: `${file}1` as Square });
    out.push({ id: `w-${file}2`, type: 'p', color: 'w', square: `${file}2` as Square });
    out.push({ id: `b-${file}7`, type: 'p', color: 'b', square: `${file}7` as Square });
    out.push({ id: `b-${file}8`, type: back[f], color: 'b', square: `${file}8` as Square });
  }
  return out;
}

/** Replays the move list so every piece keeps the same id for its whole life. */
export function replay(history: Move[]): TrackedPiece[] {
  let pieces = initialPieces();
  for (const m of history) {
    let captureSq: string | null = null;
    if (m.flags.includes('e')) captureSq = `${m.to[0]}${m.from[1]}`; // en passant
    else if (m.flags.includes('c')) captureSq = m.to;
    if (captureSq) pieces = pieces.filter((p) => p.square !== captureSq);

    pieces = pieces.map((p) =>
      p.square === m.from ? { ...p, square: m.to, type: m.promotion ?? p.type } : p,
    );

    if (m.flags.includes('k') || m.flags.includes('q')) {
      const rank = m.color === 'w' ? '1' : '8';
      const [rookFrom, rookTo] = m.flags.includes('k') ? ['h', 'f'] : ['a', 'd'];
      pieces = pieces.map((p) =>
        p.square === `${rookFrom}${rank}` ? { ...p, square: `${rookTo}${rank}` as Square } : p,
      );
    }
  }
  return pieces;
}

/** Tracked pieces plus "ghosts" (captured pieces that linger briefly to animate out). */
export function useTrackedPieces(history: Move[]) {
  const pieces = useMemo(() => replay(history), [history]);
  const prev = useRef<TrackedPiece[]>(pieces);
  const seq = useRef(0);
  const [ghosts, setGhosts] = useState<TrackedPiece[]>([]);

  useEffect(() => {
    const removed = prev.current.filter((p) => !pieces.some((q) => q.id === p.id));
    prev.current = pieces;
    if (removed.length) {
      setGhosts((gs) => [...gs, ...removed.map((r) => ({ ...r, id: `${r.id}#${seq.current++}` }))]);
    }
  }, [pieces]);

  const dropGhost = (id: string) => setGhosts((gs) => gs.filter((x) => x.id !== id));
  return { pieces, ghosts, dropGhost };
}

/** Grid column / row (0..7, top-left origin) for a square, honouring board orientation. */
export function sqToCell(sq: Square, flipped: boolean): [number, number] {
  const f = FILES.indexOf(sq[0]);
  const r = parseInt(sq[1], 10) - 1;
  return flipped ? [7 - f, r] : [f, 7 - r];
}

export function pieceAt(board: (Piece | null)[][], sq: Square): Piece | null {
  const f = FILES.indexOf(sq[0]);
  const r = parseInt(sq[1], 10) - 1;
  return board[7 - r][f] ?? null;
}
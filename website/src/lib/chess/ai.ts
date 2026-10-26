/**
 * Chess AI — computer opponent with three difficulty levels.
 * Direct port of ai.py on top of chess.js.
 *
 *   easy    mostly random; occasionally grabs a capture.
 *   medium  checkmate in one > best capture > random.
 *   hard    iterative-deepening alpha-beta (up to 4 plies) with capture
 *           quiescence, under a time budget.
 *
 * Pure logic, no DOM access — safe to run inside a Web Worker.
 */
import { Chess, type Move, type PieceSymbol, type Square } from 'chess.js';
import type { Difficulty } from './constants';

export interface AiMove {
  from: Square;
  to: Square;
  promotion?: PieceSymbol;
}

const HARD_MAX_DEPTH = 4;
const HARD_TIME_MS = 1000;
const MATE = 100000;

// Simple values (easy / medium)
const PIECE_VALUE: Record<PieceSymbol, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
// Centipawns (search)
const CP: Record<PieceSymbol, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const isCapture = (m: Move) => m.flags.includes('c') || m.flags.includes('e');
const toAiMove = (m: Move): AiMove => ({ from: m.from, to: m.to, promotion: m.promotion });
const play = (g: Chess, m: Move) => g.move({ from: m.from, to: m.to, promotion: m.promotion });

// ── Entry point ───────────────────────────────────────────
export function getBestMove(game: Chess, difficulty: Difficulty): AiMove | null {
  const legal = game.moves({ verbose: true });
  if (legal.length === 0) return null;
  if (difficulty === 'easy') return easy(legal);
  if (difficulty === 'hard') return hard(game, legal);
  return medium(game, legal);
}

// ── Easy ──────────────────────────────────────────────────
function easy(legal: Move[]): AiMove {
  if (Math.random() < 0.25) {
    const caps = legal.filter(isCapture);
    if (caps.length) return toAiMove(pick(caps));
  }
  return toAiMove(pick(legal));
}

// ── Medium ────────────────────────────────────────────────
function medium(game: Chess, legal: Move[]): AiMove {
  for (const m of legal) {
    play(game, m);
    const mate = game.isCheckmate();
    game.undo();
    if (mate) return toAiMove(m);
  }

  const captures = legal
    .filter(isCapture)
    .map((m) => ({ m, v: m.captured ? PIECE_VALUE[m.captured] : PIECE_VALUE.p }));

  if (captures.length) {
    const best = Math.max(...captures.map((c) => c.v));
    return toAiMove(pick(captures.filter((c) => c.v === best)).m);
  }
  return toAiMove(pick(legal));
}

// ── Hard ──────────────────────────────────────────────────
const TIMEOUT = Symbol('ai-timeout');

/** Material + small positional terms, from the side-to-move's view. */
function staticEval(game: Chess): number {
  const turn = game.turn();
  const rows = game.board(); // rows[0] is rank 8
  let score = 0;
  for (let i = 0; i < 8; i++) {
    for (let f = 0; f < 8; f++) {
      const piece = rows[i][f];
      if (!piece) continue;
      const r = 7 - i;
      const centre = 3.5 - Math.abs(f - 3.5) + (3.5 - Math.abs(r - 3.5)); // 0..7
      let val = CP[piece.type];
      if (piece.type === 'n' || piece.type === 'b') {
        val += centre * 5;
      } else if (piece.type === 'p') {
        const progress = piece.color === 'w' ? r : 7 - r;
        val += progress * 6 + centre * 2;
      } else if (piece.type === 'q') {
        val += centre;
      }
      score += piece.color === turn ? val : -val;
    }
  }
  return score;
}

/** Lower sorts first (best moves searched first). */
function moveKey(m: Move, first: AiMove | null): number {
  let s = 0;
  if (first && m.from === first.from && m.to === first.to && m.promotion === first.promotion) {
    s += 1e6;
  }
  if (isCapture(m)) {
    const v = m.captured ? CP[m.captured] : 100;
    const a = CP[m.piece];
    s += 1000 + 10 * v - Math.floor(a / 10);
  }
  if (m.promotion) s += 800;
  return -s;
}

function quiesce(game: Chess, alpha: number, beta: number, deadline: number, qdepth: number): number {
  if (Date.now() > deadline) throw TIMEOUT;
  const stand = staticEval(game);
  if (stand >= beta) return stand;
  if (stand > alpha) alpha = stand;
  if (qdepth <= 0) return alpha;

  const caps = game.moves({ verbose: true }).filter(isCapture);
  caps.sort((a, b) => moveKey(a, null) - moveKey(b, null));
  for (const m of caps) {
    play(game, m);
    let score: number;
    try {
      score = -quiesce(game, -beta, -alpha, deadline, qdepth - 1);
    } finally {
      game.undo();
    }
    if (score >= beta) return score;
    if (score > alpha) alpha = score;
  }
  return alpha;
}

function negamax(
  game: Chess,
  depth: number,
  alpha: number,
  beta: number,
  ply: number,
  deadline: number,
): number {
  if (Date.now() > deadline) throw TIMEOUT;
  const moves = game.moves({ verbose: true });
  if (moves.length === 0) return game.isCheck() ? -MATE + ply : 0;
  if (game.isInsufficientMaterial()) return 0;
  if (depth <= 0) return quiesce(game, alpha, beta, deadline, 4);

  moves.sort((a, b) => moveKey(a, null) - moveKey(b, null));
  let best = -MATE - 1;
  for (const m of moves) {
    play(game, m);
    let score: number;
    try {
      score = -negamax(game, depth - 1, -beta, -alpha, ply + 1, deadline);
    } finally {
      game.undo();
    }
    if (score > best) best = score;
    if (best > alpha) alpha = best;
    if (alpha >= beta) break;
  }
  return best;
}

function hard(game: Chess, legal: Move[]): AiMove {
  const deadline = Date.now() + HARD_TIME_MS;
  let bestMove: AiMove = toAiMove(pick(legal));
  let first: AiMove | null = null;

  for (let depth = 1; depth <= HARD_MAX_DEPTH; depth++) {
    try {
      let curMove: Move | null = null;
      let curNoisy = -Infinity;
      let curReal = -MATE - 1;
      let alpha = -MATE - 1;
      const beta = MATE + 1;

      const ordered = [...legal].sort((a, b) => moveKey(a, first) - moveKey(b, first));
      for (const m of ordered) {
        play(game, m);
        let score: number;
        try {
          score = -negamax(game, depth - 1, -beta, -alpha, 1, deadline);
        } finally {
          game.undo();
        }
        const noisy = score + Math.random() * 3; // break ties variably
        if (noisy > curNoisy) {
          curMove = m;
          curNoisy = noisy;
          curReal = score;
        }
        if (score > alpha) alpha = score;
      }

      if (curMove) {
        bestMove = first = toAiMove(curMove);
      }
      if (curReal > MATE - 100) break; // forced mate found
    } catch (e) {
      if (e === TIMEOUT) break;
      throw e;
    }
  }
  return bestMove;
}
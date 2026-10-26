'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Chess, type Color, type Move, type Piece, type PieceSymbol, type Square } from 'chess.js';
import { requestAiMove } from './aiClient';
import type { Difficulty } from './constants';

const AI_DELAY_MS = 300;

export interface PendingPromotion {
  from: Square;
  to: Square;
}

export interface CapturedLists {
  /** White pieces captured (by black) */
  white: Piece[];
  /** Black pieces captured (by white) */
  black: Piece[];
}

export function outcomeMessage(game: Chess): string | null {
  if (!game.isGameOver()) return null;
  if (game.isCheckmate()) {
    // Side to move is the one mated.
    return `Checkmate — ${game.turn() === 'w' ? 'Black' : 'White'} Wins!`;
  }
  if (game.isStalemate()) return 'Stalemate — Draw!';
  if (game.isInsufficientMaterial()) return 'Insufficient Material — Draw!';
  if (game.isThreefoldRepetition()) return 'Threefold Repetition — Draw!';
  const halfMoves = parseInt(game.fen().split(' ')[4] ?? '0', 10);
  if (halfMoves >= 100) return '50-Move Rule — Draw!';
  return 'Draw!';
}

export interface UseChessGameOptions {
  /** true: play the AI (default). false: two humans share the board (pass-and-play). */
  vsAi?: boolean;
  initialDifficulty?: Difficulty;
  /** Freeze all input and AI moves (e.g. a clock ran out). */
  locked?: boolean;
}

export function useChessGame(options: UseChessGameOptions = {}) {
  // chess.js is mutable; opt out of compiler memoisation so game.* reads are never cached.
  'use no memo';
  const vsAi = options.vsAi ?? true;
  const locked = options.locked ?? false;
  const gameRef = useRef<Chess | null>(null);
  if (gameRef.current === null) gameRef.current = new Chess();
  const game = gameRef.current;

  // chess.js is mutable, so we bump a counter to re-render after every change.
  const [version, setVersion] = useState(0);
  const bump = useCallback(() => setVersion((v) => v + 1), []);

  const [playerColor, setPlayerColorState] = useState<Color>('w');
  const [difficulty, setDifficulty] = useState<Difficulty>(options.initialDifficulty ?? 'medium');
  const [selected, setSelected] = useState<Square | null>(null);
  const [promotion, setPromotion] = useState<PendingPromotion | null>(null);

  // ── Derived state ───────────────────────────────────────
  const turn = game.turn();
  const isGameOver = game.isGameOver();
  const isCheck = game.isCheck();
  const humanColor: Color = vsAi ? playerColor : turn;
  const aiThinking = vsAi && !locked && !isGameOver && turn !== playerColor;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const history = useMemo<Move[]>(() => game.history({ verbose: true }), [game, version]);
  const lastMove = history.length ? history[history.length - 1] : null;

  // Immutable snapshots for rendering (new objects after every move).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const board = useMemo(() => game.board(), [game, version]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fen = useMemo(() => game.fen(), [game, version]);
  const isCheckmate = game.isCheckmate();

  const captured = useMemo<CapturedLists>(() => {
    const white: Piece[] = [];
    const black: Piece[] = [];
    for (const m of history) {
      if (!m.captured) continue;
      // The capturer's opponent lost the piece.
      if (m.color === 'b') white.push({ type: m.captured, color: 'w' });
      else black.push({ type: m.captured, color: 'b' });
    }
    return { white, black };
  }, [history]);

  const kingSquare = useMemo<Square | null>(() => {
    if (!isCheck) return null;
    const rows = game.board();
    for (const row of rows) {
      for (const p of row) {
        if (p && p.type === 'k' && p.color === turn) return p.square;
      }
    }
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game, isCheck, turn, version]);

  const legalTargets = useMemo<Set<Square>>(() => {
    if (!selected) return new Set();
    return new Set(game.moves({ square: selected, verbose: true }).map((m) => m.to));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game, selected, version]);

  const status = outcomeMessage(game);

  // ── Actions ─────────────────────────────────────────────
  const applyMove = useCallback(
    (from: Square, to: Square, promo?: PieceSymbol): boolean => {
      try {
        game.move({ from, to, promotion: promo });
      } catch {
        return false;
      }
      setSelected(null);
      setPromotion(null);
      bump();
      return true;
    },
    [game, bump],
  );

  const clickSquare = useCallback(
    (sq: Square) => {
      if (locked || promotion || isGameOver || aiThinking) return;
      if (game.turn() !== humanColor) return;

      const piece = game.get(sq);

      // Own piece -> select it
      if (piece && piece.color === humanColor) {
        setSelected(sq);
        return;
      }

      // Legal target -> move (or open promotion dialog)
      if (selected && legalTargets.has(sq)) {
        const candidates = game.moves({ square: selected, verbose: true }).filter((m) => m.to === sq);
        if (candidates.some((m) => m.promotion)) {
          setPromotion({ from: selected, to: sq });
          return;
        }
        applyMove(selected, sq);
        return;
      }

      // Anywhere else -> deselect
      setSelected(null);
    },
    [locked, promotion, isGameOver, aiThinking, game, humanColor, selected, legalTargets, applyMove],
  );

  const choosePromotion = useCallback(
    (piece: PieceSymbol) => {
      if (!promotion) return;
      applyMove(promotion.from, promotion.to, piece);
    },
    [promotion, applyMove],
  );

  const cancelPromotion = useCallback(() => {
    setPromotion(null);
    setSelected(null);
  }, []);

  const reset = useCallback(() => {
    game.reset();
    setSelected(null);
    setPromotion(null);
    bump();
  }, [game, bump]);

  const setPlayerColor = useCallback(
    (color: Color) => {
      if (color === playerColor) return;
      setPlayerColorState(color);
      game.reset(); // new side => new game, White moves first
      setSelected(null);
      setPromotion(null);
      bump();
    },
    [playerColor, game, bump],
  );

  const undo = useCallback(() => {
    const count = game.history().length;
    if (count === 0) return;
    // Human to move -> AI replied last: undo AI reply + human move (2).
    // AI to move    -> human just moved, AI hasn't answered yet: undo 1.
    const pops = Math.min(vsAi && game.turn() === playerColor ? 2 : 1, count);
    for (let i = 0; i < pops; i++) game.undo();
    setSelected(null);
    setPromotion(null);
    bump();
  }, [game, playerColor, vsAi, bump]);

  // ── AI turn ─────────────────────────────────────────────
  const requestId = useRef(0);
  useEffect(() => {
    if (!vsAi || locked || game.isGameOver() || game.turn() === playerColor) return;

    const id = ++requestId.current;
    const timer = setTimeout(() => {
      requestAiMove(game.fen(), difficulty).then((move) => {
        if (id !== requestId.current) return; // stale (reset / undo / side switch)
        if (!move || game.isGameOver() || game.turn() === playerColor) return;
        try {
          game.move({ from: move.from, to: move.to, promotion: move.promotion });
        } catch {
          return;
        }
        bump();
      });
    }, AI_DELAY_MS);

    return () => {
      clearTimeout(timer);
      requestId.current++;
    };
  }, [version, playerColor, difficulty, vsAi, locked, game, bump]);

  return {
    game,
    turn,
    playerColor,
    difficulty,
    selected,
    legalTargets,
    promotion,
    lastMove,
    kingSquare,
    captured,
    isCheck,
    isGameOver,
    aiThinking,
    status,
    moveNumber: Math.floor(history.length / 2) + 1,
    flipped: vsAi && playerColor === 'b',
    humanColor,
    history,
    vsAi,
    board,
    fen,
    isCheckmate,
    clickSquare,
    choosePromotion,
    cancelPromotion,
    reset,
    undo,
    setPlayerColor,
    setDifficulty,
  };
}
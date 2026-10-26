import type { Color, PieceSymbol } from 'chess.js';

export type Difficulty = 'easy' | 'medium' | 'hard';
export const LEVELS: Difficulty[] = ['easy', 'medium', 'hard'];

// Unicode glyphs (same table as the Pygame renderer / web canvas).
// The trailing U+FE0E forces text presentation so iOS/Android don't swap
// the black pawn for an emoji.
const TEXT = '\uFE0E';
export const GLYPHS: Record<Color, Record<PieceSymbol, string>> = {
  w: {
    k: '\u2654' + TEXT,
    q: '\u2655' + TEXT,
    r: '\u2656' + TEXT,
    b: '\u2657' + TEXT,
    n: '\u2658' + TEXT,
    p: '\u2659' + TEXT,
  },
  b: {
    k: '\u265a' + TEXT,
    q: '\u265b' + TEXT,
    r: '\u265c' + TEXT,
    b: '\u265d' + TEXT,
    n: '\u265e' + TEXT,
    p: '\u265f' + TEXT,
  },
};

// Material values for captured-piece ordering
export const PIECE_VALUES: Record<PieceSymbol, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};

export const PROMOTION_PIECES: PieceSymbol[] = ['q', 'r', 'b', 'n'];

export const FILES = 'abcdefgh';
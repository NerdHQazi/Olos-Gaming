'use client';

import { useMemo, type ReactNode } from 'react';
import type { Piece, Square } from 'chess.js';
import type { useChessGame } from '@/lib/chess/useChessGame';
import { FILES, GLYPHS, PROMOTION_PIECES } from '@/lib/chess/constants';
import styles from './Chess.module.css';

type Game = ReturnType<typeof useChessGame>;

const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(' ');

const NAMES = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' } as const;
const pieceName = (p: Pick<Piece, 'type' | 'color'>) => NAMES[p.type];

interface ChessBoardProps {
  g: Game;
  /** Rendered on top of the board (e.g. a game-over card). */
  children?: ReactNode;
}

export default function ChessBoard({ g, children }: ChessBoardProps) {
  const {
    board,
    humanColor,
    selected,
    legalTargets,
    promotion,
    lastMove,
    kingSquare,
    isGameOver,
    aiThinking,
    flipped,
  } = g;

  const squares = useMemo(() => {
    const out: Array<{ name: Square; light: boolean; piece: Piece | null }> = [];
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const f = flipped ? 7 - col : col;
        const r = flipped ? row : 7 - row;
        const name = `${FILES[f]}${r + 1}` as Square;
        out.push({ name, light: (f + r) % 2 === 1, piece: board[7 - r][f] }); // a1 is dark
      }
    }
    return out;
  }, [board, flipped]);

  const canInteract = !isGameOver && !aiThinking && !promotion;

  return (
    <div className={styles.boardScope}>
      <div className={styles.boardWrap}>
        <div className={styles.board} role="grid" aria-label="Chess board">
          {squares.map(({ name, light, piece }) => {
            const isTarget = legalTargets.has(name);
            const clickable =
              canInteract && (isTarget || (piece !== null && piece.color === humanColor));
            return (
              <button
                key={name}
                type="button"
                role="gridcell"
                className={cx(
                  styles.square,
                  light ? styles.light : styles.dark,
                  clickable && styles.clickable,
                  lastMove && (lastMove.from === name || lastMove.to === name) && styles.lastMove,
                  kingSquare === name && styles.check,
                  selected === name && styles.selected,
                  isTarget && styles.target,
                )}
                aria-label={`${name}${
                  piece ? ` ${piece.color === 'w' ? 'white' : 'black'} ${pieceName(piece)}` : ''
                }${isTarget ? ', legal move' : ''}`}
                onClick={() => g.clickSquare(name)}
              >
                {piece && (
                  <span
                    className={cx(
                      styles.piece,
                      piece.color === 'w' ? styles.pieceWhite : styles.pieceBlack,
                    )}
                    aria-hidden="true"
                  >
                    {GLYPHS[piece.color][piece.type]}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {promotion && !isGameOver && (
          <div
            className={cx(styles.overlay, styles.promoBackdrop)}
            role="dialog"
            aria-label="Promote pawn"
          >
            <div className={styles.promoBox}>
              <p className={styles.promoTitle}>Promote pawn to:</p>
              <div className={styles.promoOptions}>
                {PROMOTION_PIECES.map((pt) => (
                  <button
                    key={pt}
                    type="button"
                    className={cx(
                      styles.promoOption,
                      humanColor === 'w' ? styles.pieceWhite : styles.pieceBlack,
                    )}
                    aria-label={`Promote to ${pieceName({ type: pt, color: humanColor })}`}
                    onClick={() => g.choosePromotion(pt)}
                  >
                    {GLYPHS[humanColor][pt]}
                  </button>
                ))}
              </div>
              <button type="button" className={styles.promoCancel} onClick={g.cancelPromotion}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {children}
      </div>
    </div>
  );
}
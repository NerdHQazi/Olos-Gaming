'use client';

import { useEffect, useMemo } from 'react';
import type { Piece, Square } from 'chess.js';
import { useChessGame } from '@/lib/chess/useChessGame';
import {
  FILES,
  GLYPHS,
  LEVELS,
  PIECE_VALUES,
  PROMOTION_PIECES,
} from '@/lib/chess/constants';
import styles from './Chess.module.css';

const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(' ');

const CAPTURED_ICON = 22;
const CAPTURED_AVAIL = 220 - 28 - CAPTURED_ICON; // panel width - padding - icon

function CapturedRow({ pieces }: { pieces: Piece[] }) {
  const sorted = useMemo(
    () => [...pieces].sort((a, b) => PIECE_VALUES[b.type] - PIECE_VALUES[a.type]),
    [pieces],
  );
  // Overlap icons when crowded, same as the Pygame panel.
  const step =
    sorted.length <= 1 ? 20 : Math.min(20, Math.floor(CAPTURED_AVAIL / (sorted.length - 1)));

  return (
    <div className={styles.capturedRow} aria-label={`${sorted.length} captured`}>
      {sorted.map((p, i) => (
        <span
          key={i}
          className={cx(styles.capturedIcon, p.color === 'w' ? styles.pieceWhite : styles.pieceBlack)}
          style={{ marginLeft: i === 0 ? 0 : step - CAPTURED_ICON }}
        >
          {GLYPHS[p.color][p.type]}
        </span>
      ))}
    </div>
  );
}

export default function ChessGame() {
  const g = useChessGame();
  const {
    board,
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
    moveNumber,
    flipped,
  } = g;

  // Keyboard shortcuts: R restart, U undo, Esc cancels promotion
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      const k = e.key.toLowerCase();
      if (k === 'r') g.reset();
      else if (k === 'u') g.undo();
      else if (k === 'escape' && promotion) g.cancelPromotion();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [g, promotion]);

  // Build the 64 squares in display order (respects board orientation)
  const squares = useMemo(() => {
    const out: Array<{ name: Square; light: boolean; piece: Piece | null }> = [];
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const f = flipped ? 7 - col : col;
        const r = flipped ? row : 7 - row;
        const name = `${FILES[f]}${r + 1}` as Square;
        const piece = board[7 - r][f];
        out.push({ name, light: (f + r) % 2 === 1, piece }); // a1 is dark
      }
    }
    return out;
  }, [board, flipped]);

  const whiteTurn = turn === 'w';
  const who = turn === playerColor ? 'You' : 'AI';
  const canInteract = !isGameOver && !aiThinking && !promotion && turn === playerColor;

  return (
    <div className={styles.root}>
      <div className={styles.boardWrap}>
        <div className={styles.board} role="grid" aria-label="Chess board">
          {squares.map(({ name, light, piece }) => {
            const isTarget = legalTargets.has(name);
            const clickable =
              canInteract && (isTarget || (piece !== null && piece.color === playerColor));
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
          <div className={cx(styles.overlay, styles.promoBackdrop)} role="dialog" aria-label="Promote pawn">
            <div className={styles.promoBox}>
              <p className={styles.promoTitle}>Promote pawn to:</p>
              <div className={styles.promoOptions}>
                {PROMOTION_PIECES.map((pt) => (
                  <button
                    key={pt}
                    type="button"
                    className={cx(
                      styles.promoOption,
                      playerColor === 'w' ? styles.pieceWhite : styles.pieceBlack,
                    )}
                    aria-label={`Promote to ${pieceName({ type: pt, color: playerColor })}`}
                    onClick={() => g.choosePromotion(pt)}
                  >
                    {GLYPHS[playerColor][pt]}
                  </button>
                ))}
              </div>
              <button type="button" className={styles.promoCancel} onClick={g.cancelPromotion}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <aside className={styles.panel}>
        <h2 className={styles.title}>CHESS</h2>

        <p className={styles.label}>Current Turn</p>
        <p className={cx(styles.turn, whiteTurn ? styles.turnWhite : styles.turnBlack)}>
          {whiteTurn ? 'White' : 'Black'} ({who})
        </p>
        {isCheck && !isGameOver && <p className={styles.checkText}>CHECK!</p>}

        <hr className={styles.divider} />
        <p className={styles.label}>Captured</p>
        <CapturedRow pieces={captured.white} />
        <CapturedRow pieces={captured.black} />

        <hr className={styles.divider} />
        <p className={styles.label}>Stats</p>
        <p className={styles.stat}>Move: {moveNumber}</p>

        {aiThinking && (
          <p className={styles.thinking} role="status">
            AI is thinking...
          </p>
        )}

        <hr className={styles.divider} />
        <p className={styles.label}>AI Difficulty</p>
        <div className={styles.btnRow} role="group" aria-label="AI difficulty">
          {LEVELS.map((lvl) => (
            <button
              key={lvl}
              type="button"
              className={cx(styles.btn, lvl === difficulty && styles.btnOn)}
              aria-pressed={lvl === difficulty}
              onClick={() => g.setDifficulty(lvl)}
            >
              {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
            </button>
          ))}
        </div>

        <p className={styles.label}>Play as</p>
        <div className={styles.btnRow} role="group" aria-label="Play as">
          {(['w', 'b'] as const).map((c) => (
            <button
              key={c}
              type="button"
              className={cx(styles.btn, c === playerColor && styles.btnOn)}
              aria-pressed={c === playerColor}
              onClick={() => g.setPlayerColor(c)}
            >
              {c === 'w' ? 'White' : 'Black'}
            </button>
          ))}
        </div>

        <div className={styles.spacer} />
        <hr className={styles.divider} />
        <div className={styles.controls}>
          <p className={styles.label} style={{ margin: 0 }}>
            Controls
          </p>
          <div className={styles.controlsList}>
            <button type="button" className={styles.keyBtn} onClick={g.reset}>
              [R] Restart
            </button>
            <button type="button" className={styles.keyBtn} onClick={g.undo}>
              [U] Undo
            </button>
          </div>
        </div>
      </aside>

      {isGameOver && (
        <div className={cx(styles.overlay, styles.gameOver)} role="alertdialog" aria-label="Game over">
          <h2 className={styles.gameOverTitle}>{status ?? 'Game Over'}</h2>
          <p className={styles.gameOverSub}>Game Over</p>
          <button type="button" className={styles.playAgain} onClick={g.reset} autoFocus>
            [R] Play Again
          </button>
        </div>
      )}
    </div>
  );
}

function pieceName(p: Pick<Piece, 'type' | 'color'>): string {
  return { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' }[p.type];
}
'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import type { Piece, Square } from 'chess.js';
import type { useChessGame } from '@/lib/chess/useChessGame';
import { FILES, GLYPHS, PROMOTION_PIECES } from '@/lib/chess/constants';
import { pieceAt, sqToCell, useTrackedPieces, type TrackedPiece } from '@/lib/chess/tracking';
import PieceImg, { preloadChessAssets } from './PieceImg';
import wood from './ChessWood.module.css';
import base from './Chess.module.css'; // shared overlay + promotion dialog styles

type Game = ReturnType<typeof useChessGame>;

const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(' ');
const PROMO_NAMES = { q: 'queen', r: 'rook', b: 'bishop', n: 'knight' } as const;
const NAMES = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' } as const;

/* ── One animated piece ───────────────────────────────────── */
interface PieceActorProps {
  p: TrackedPiece;
  flipped: boolean;
  selected: boolean;
  clickable: boolean;
  onSquare: (sq: Square) => void;
}

function PieceActor({ p, flipped, selected, clickable, onSquare }: PieceActorProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const hopRef = useRef<HTMLDivElement>(null);
  const [col, row] = sqToCell(p.square, flipped);
  const zRef = useRef(row + 1);
  zRef.current = row + 1;

  const prevSquare = useRef(p.square);
  const prevFlipped = useRef(flipped);

  // Hop when the piece changes square (knights jump higher). Position itself is a CSS transition.
  useEffect(() => {
    const moved = prevSquare.current !== p.square;
    const flipChanged = prevFlipped.current !== flipped;
    prevSquare.current = p.square;
    prevFlipped.current = flipped;
    if (!moved || flipChanged) return;

    const hop = hopRef.current;
    const root = rootRef.current;
    if (!hop || !root || typeof hop.animate !== 'function') return;

    root.style.zIndex = '40'; // travel above the other pieces
    const lift = p.type === 'n' ? -75 : -24;
    const anim = hop.animate(
      [
        { transform: 'translateY(0) scale(1)' },
        { transform: `translateY(${lift}%) scale(1.12)`, offset: 0.5 },
        { transform: 'translateY(0) scale(1)' },
      ],
      { duration: 420, easing: 'ease-in-out' },
    );
    const settle = () => {
      root.style.zIndex = String(zRef.current);
    };
    anim.onfinish = settle;
    anim.oncancel = settle;
  }, [p.square, p.type, flipped]);

  return (
    <div
      ref={rootRef}
      className={cx(wood.piece, clickable && wood.pieceClickable)}
      style={{ transform: `translate(${col * 100}%, ${row * 100}%)`, zIndex: row + 1 }}
      onClick={() => onSquare(p.square)}
    >
      <div ref={hopRef} className={wood.hop}>
        <div className={cx(wood.lift, selected && wood.liftOn)}>
          {/* <PieceImg type={p.type} color={p.color} className={wood.art} /> */}
          <PieceImg
            type={p.type}
            color={p.color}
            className={cx(wood.art, p.color === 'b' ? wood.artBlack : wood.artWhite)}
          />
        </div>
      </div>
    </div>
  );
}

function Ghost({
  p,
  flipped,
  onDone,
}: {
  p: TrackedPiece;
  flipped: boolean;
  onDone: (id: string) => void;
}) {
  const [col, row] = sqToCell(p.square, flipped);
  return (
    <div className={wood.ghost} style={{ transform: `translate(${col * 100}%, ${row * 100}%)` }}>
      <div className={wood.ghostInner} onAnimationEnd={() => onDone(p.id)}>
        {/* <PieceImg type={p.type} color={p.color} className={wood.art} /> */}
        <PieceImg
          type={p.type}
          color={p.color}
          className={cx(wood.art, p.color === 'b' ? wood.artBlack : wood.artWhite)}
        />
      </div>
    </div>
  );
}

/* ── Board ────────────────────────────────────────────────── */
interface ChessBoardWoodProps {
  g: Game;
  /** Rendered on top of the board (e.g. a game-over card). */
  children?: ReactNode;
  className?: string;
}

export default function ChessBoardWood({ g, children, className }: ChessBoardWoodProps) {
  const {
    board,
    history,
    humanColor,
    selected,
    legalTargets,
    lastMove,
    kingSquare,
    isGameOver,
    aiThinking,
    promotion,
    flipped,
  } = g;

  const { pieces, ghosts, dropGhost } = useTrackedPieces(history);

  useEffect(() => {
    preloadChessAssets();
  }, []);
  const canInteract = !isGameOver && !aiThinking && !promotion;

  // 64 squares in display order
  const squares: Array<{ name: Square; light: boolean; piece: Piece | null; row: number; col: number }> = [];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const f = flipped ? 7 - col : col;
      const r = flipped ? row : 7 - row;
      const name = `${FILES[f]}${r + 1}` as Square;
      squares.push({ name, light: (f + r) % 2 === 1, piece: board[7 - r][f], row, col }); // a1 is dark
    }
  }

  return (
    <div
      className={cx(base.boardScope, wood.frame, className)}
      style={{ aspectRatio: '1 / 1', backgroundImage: 'url(/chess/board.webp)' }}
    >

      <div className={wood.field} role="grid" aria-label="Chess board">
        {squares.map(({ name, light, piece, row, col }) => {
          const isTarget = legalTargets.has(name);
          const clickable = canInteract && (isTarget || (piece !== null && piece.color === humanColor));
          return (
            <button
              key={name}
              type="button"
              role="gridcell"
              className={cx(
                wood.sq,
                light ? wood.sqLight : wood.sqDark,
                wood[`v${(col * 3 + row * 5) % 4}` as 'v0'],
                clickable && wood.clickable,
                lastMove && (lastMove.from === name || lastMove.to === name) && wood.lastMove,
                kingSquare === name && wood.check,
                selected === name && wood.selected,
                isTarget && wood.target,
                isTarget && piece !== null && wood.capture,
              )}
              aria-label={`${name}${
                piece ? ` ${piece.color === 'w' ? 'white' : 'black'} ${NAMES[piece.type]}` : ''
              }${isTarget ? ', legal move' : ''}`}
              onClick={() => g.clickSquare(name)}
            >
              {col === 0 && (
                <span className={cx(wood.rank, light ? wood.onLight : wood.onDark)}>{name[1]}</span>
              )}
              {row === 7 && (
                <span className={cx(wood.file, light ? wood.onLight : wood.onDark)}>{name[0]}</span>
              )}
            </button>
          );
        })}

        <div className={wood.piecesLayer}>
          {ghosts.map((p) => (
            <Ghost key={p.id} p={p} flipped={flipped} onDone={dropGhost} />
          ))}
          {pieces.map((p) => {
            const isTarget = legalTargets.has(p.square);
            const clickable = canInteract && (isTarget || p.color === humanColor);
            return (
              <PieceActor
                key={p.id}
                p={p}
                flipped={flipped}
                selected={selected === p.square}
                clickable={clickable}
                onSquare={g.clickSquare}
              />
            );
          })}
        </div>
      </div>

      {/* screen-reader announcement */}
      <p
        aria-live="polite"
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          overflow: 'hidden',
          clip: 'rect(0 0 0 0)',
          whiteSpace: 'nowrap',
        }}
      >
        {lastMove ? `Last move: ${lastMove.san}` : 'No moves yet'}
        {g.isCheck && !isGameOver ? '. Check.' : ''}
      </p>

      {promotion && !isGameOver && (
        <div className={cx(base.overlay, base.promoBackdrop)} role="dialog" aria-label="Promote pawn">
          <div className={base.promoBox}>
            <p className={base.promoTitle}>Promote pawn to:</p>
            <div className={base.promoOptions}>
              {PROMOTION_PIECES.map((pt) => (
                <button
                  key={pt}
                  type="button"
                  className={cx(base.promoOption, humanColor === 'w' ? base.pieceWhite : base.pieceBlack)}
                  aria-label={`Promote to ${PROMO_NAMES[pt as 'q' | 'r' | 'b' | 'n']}`}
                  onClick={() => g.choosePromotion(pt)}
                >
                  {GLYPHS[humanColor][pt]}
                </button>
              ))}
            </div>
            <button type="button" className={base.promoCancel} onClick={g.cancelPromotion}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {children}
    </div>
  );
}
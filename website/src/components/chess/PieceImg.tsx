import type { Color, PieceSymbol } from 'chess.js';

const COLORS: Color[] = ['w', 'b'];
const TYPES: PieceSymbol[] = ['k', 'q', 'r', 'b', 'n', 'p'];

export const pieceSrc = (color: Color, type: PieceSymbol) => `/chess/pieces/${color}${type}.webp`;

/** Warm the browser cache so pieces never pop in late. Call once on the client. */
export function preloadChessAssets() {
  if (typeof window === 'undefined') return;
  const urls = ['/chess/board.webp'];
  for (const c of COLORS) for (const t of TYPES) urls.push(pieceSrc(c, t));
  for (const u of urls) {
    const img = new Image();
    img.decoding = 'async';
    img.src = u;
  }
}

interface PieceImgProps {
  type: PieceSymbol;
  color: Color;
  className?: string;
}

/** Pre-rendered 3D sprite of a piece (see /public/chess/pieces). */
export default function PieceImg({ type, color, className }: PieceImgProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={pieceSrc(color, type)}
      alt=""
      aria-hidden="true"
      draggable={false}
      decoding="async"
      className={className}
    />
  );
}
import type { Color, PieceSymbol } from 'chess.js';
import { VIEWBOX, getPieceArt } from '@/lib/chess/pieceShapes';

/** Render once per board: gradients shared by every piece (referenced by id). */
export function PieceGradients() {
  return (
    <svg
      width="0"
      height="0"
      aria-hidden="true"
      focusable="false"
      style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
    >
      <defs>
        {/* Silver / pearl (white pieces): light catches the left-centre, dark rim */}
        <linearGradient id="cwBodyW" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#80879a" />
          <stop offset="0.2" stopColor="#d3d8e3" />
          <stop offset="0.4" stopColor="#ffffff" />
          <stop offset="0.62" stopColor="#c2c8d5" />
          <stop offset="0.85" stopColor="#8b92a3" />
          <stop offset="1" stopColor="#666d80" />
        </linearGradient>
        {/* Dark navy gloss (black pieces) */}
        <linearGradient id="cwBodyB" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#06070c" />
          <stop offset="0.2" stopColor="#1e2333" />
          <stop offset="0.38" stopColor="#4c556e" />
          <stop offset="0.55" stopColor="#1a1f2e" />
          <stop offset="0.8" stopColor="#0a0c13" />
          <stop offset="1" stopColor="#03040a" />
        </linearGradient>
        {/* Top-down sheen laid over each piece */}
        <linearGradient id="cwShineW" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="1" stopColor="#000000" stopOpacity="0.18" />
        </linearGradient>
        <linearGradient id="cwShineB" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.28" />
          <stop offset="0.45" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="1" stopColor="#000000" stopOpacity="0.35" />
        </linearGradient>
        {/* Spherical highlights for balls / crown beads */}
        <radialGradient id="cwBallW" cx="0.35" cy="0.3" r="0.75">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.55" stopColor="#c6ccd8" />
          <stop offset="1" stopColor="#737a8d" />
        </radialGradient>
        <radialGradient id="cwBallB" cx="0.35" cy="0.3" r="0.75">
          <stop offset="0" stopColor="#7d88a6" />
          <stop offset="0.5" stopColor="#1e2333" />
          <stop offset="1" stopColor="#04050a" />
        </radialGradient>
      </defs>
    </svg>
  );
}

interface PieceSvgProps {
  type: PieceSymbol;
  color: Color;
  /** Mirror horizontally (used so knights face each other). */
  mirror?: boolean;
  className?: string;
}

export default function PieceSvg({ type, color, mirror, className }: PieceSvgProps) {
  const art = getPieceArt(type);
  const t = color === 'w' ? 'W' : 'B';
  const body = `url(#cwBody${t})`;
  const ball = `url(#cwBall${t})`;
  const shine = `url(#cwShine${t})`;
  const rim = color === 'w' ? 'rgba(40,46,64,0.55)' : 'rgba(0,0,0,0.75)';

  return (
    <svg
      viewBox={VIEWBOX}
      preserveAspectRatio="xMidYMax meet"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {/* pointer-events only on painted shapes, so the transparent area never blocks clicks */}
      <g
        style={{ pointerEvents: 'auto' }}
        transform={mirror ? 'translate(100 0) scale(-1 1)' : undefined}
        stroke={rim}
        strokeWidth={1.1}
        strokeLinejoin="round"
      >
        <path d={art.body} fill={body} />
        {art.head && <path d={art.head} fill={body} />}
        {art.boxes.map((b, i) => (
          <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} rx={1.2} fill={body} />
        ))}
        {art.dots.map((d, i) => (
          <circle key={i} cx={d.cx} cy={d.cy} r={d.r} fill={ball} />
        ))}

        {/* gloss overlays (no outline) */}
        <g stroke="none" style={{ pointerEvents: 'none' }}>
          <path d={art.body} fill={shine} />
          {art.head && <path d={art.head} fill={shine} />}
          {art.boxes.map((b, i) => (
            <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} rx={1.2} fill={shine} />
          ))}
        </g>

        {art.slit && (
          <line
            {...art.slit}
            stroke={color === 'w' ? '#4b5266' : '#9aa5c2'}
            strokeWidth={2.4}
            strokeLinecap="round"
            style={{ pointerEvents: 'none' }}
          />
        )}
        {art.eye && (
          <circle
            cx={art.eye.cx}
            cy={art.eye.cy}
            r={art.eye.r}
            fill={color === 'w' ? '#1b2030' : '#dbe3f5'}
            stroke="none"
            style={{ pointerEvents: 'none' }}
          />
        )}
      </g>
    </svg>
  );
}
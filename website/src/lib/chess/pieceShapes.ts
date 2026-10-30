/**
 * 2D silhouettes for the chess pieces, generated from "turned" profiles
 * (radius, height) mirrored around the centre line. Filled with a horizontal
 * metallic gradient they read as lathe-turned 3D pieces — no WebGL needed.
 */
import type { PieceSymbol } from 'chess.js';

export const VIEWBOX = '0 -45 100 145';

const S = 80; // px per profile unit
const BASE_Y = 95; // svg y of the piece's feet
const px = (x: number) => +(50 + x * S).toFixed(2);
const py = (y: number) => +(BASE_Y - y * S).toFixed(2);

export interface Box { x: number; y: number; w: number; h: number }
export interface Dot { cx: number; cy: number; r: number }
export interface Line { x1: number; y1: number; x2: number; y2: number }
export interface PieceArt {
  body: string;
  head?: string;
  boxes: Box[];
  dots: Dot[];
  slit?: Line;
  eye?: Dot;
}

const arc = (cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, n = 14) => {
  const out: number[][] = [];
  for (let i = 0; i <= n; i++) {
    const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
    out.push([Math.max(0, cx + rx * Math.cos(a)), cy + ry * Math.sin(a)]);
  }
  return out;
};

function silhouette(profile: number[][]): string {
  const right = profile.map(([r, y]) => `${px(r)} ${py(y)}`);
  const left = [...profile].reverse().map(([r, y]) => `${px(-r)} ${py(y)}`);
  return `M${right.join(' L')} L${left.join(' L')} Z`;
}

const box = (cxu: number, y0: number, y1: number, halfW: number): Box => ({
  x: px(cxu - halfW),
  y: py(y1),
  w: +(halfW * 2 * S).toFixed(2),
  h: +((y1 - y0) * S).toFixed(2),
});
const dot = (cxu: number, y: number, r: number): Dot => ({ cx: px(cxu), cy: py(y), r: +(r * S).toFixed(2) });

const BASE = [[0, 0], [0.4, 0], [0.42, 0.03], [0.42, 0.09], [0.37, 0.14], [0.32, 0.2]];

function knightHead(): string {
  const k = (x: number, y: number) => `${px(x * 0.85 - 0.07)} ${py(y * 0.85 + 0.24)}`;
  return [
    `M${k(-0.28, 0)}`,
    `L${k(0.3, 0)}`,
    `C${k(0.3, 0.25)} ${k(0.22, 0.38)} ${k(0.2, 0.5)}`,
    `C${k(0.3, 0.55)} ${k(0.42, 0.6)} ${k(0.5, 0.62)}`,
    `L${k(0.57, 0.73)}`,
    `C${k(0.5, 0.81)} ${k(0.38, 0.86)} ${k(0.28, 0.92)}`,
    `L${k(0.23, 1.1)}`,
    `L${k(0.1, 0.99)}`,
    `C${k(-0.02, 1.03)} ${k(-0.2, 0.9)} ${k(-0.26, 0.7)}`,
    `C${k(-0.34, 0.45)} ${k(-0.34, 0.2)} ${k(-0.28, 0)}`,
    'Z',
  ].join(' ');
}

const cache = new Map<PieceSymbol, PieceArt>();

export function getPieceArt(type: PieceSymbol): PieceArt {
  const hit = cache.get(type);
  if (hit) return hit;
  let art: PieceArt;
  switch (type) {
    case 'p':
      art = {
        body: silhouette([
          ...BASE, [0.22, 0.3], [0.16, 0.46], [0.15, 0.56], [0.25, 0.6], [0.25, 0.65], [0.17, 0.69],
          ...arc(0, 0.79, 0.2, 0.19, -35, 90),
        ]),
        boxes: [],
        dots: [],
      };
      break;
    case 'r':
      art = {
        body: silhouette([
          ...BASE, [0.29, 0.28], [0.24, 0.4], [0.23, 0.7], [0.31, 0.75], [0.35, 0.79],
          [0.35, 0.87], [0, 0.87],
        ]),
        boxes: [box(-0.265, 0.85, 1.03, 0.085), box(0, 0.85, 1.03, 0.085), box(0.265, 0.85, 1.03, 0.085)],
        dots: [],
      };
      break;
    case 'n':
      art = {
        body: silhouette([...BASE, [0.3, 0.22], [0.29, 0.27], [0, 0.27]]),
        head: knightHead(),
        boxes: [],
        dots: [],
        eye: dot(0.27, 0.84, 0.032),
      };
      break;
    case 'b':
      art = {
        body: silhouette([
          ...BASE, [0.26, 0.24], [0.18, 0.36], [0.14, 0.5], [0.25, 0.55], [0.25, 0.6], [0.15, 0.64],
          ...arc(0, 0.9, 0.21, 0.31, -52, 90),
        ]),
        boxes: [],
        dots: [dot(0, 1.26, 0.07)],
        slit: { x1: px(-0.07), y1: py(0.95), x2: px(0.09), y2: py(1.12) },
      };
      break;
    case 'q':
      art = {
        body: silhouette([
          ...BASE, [0.28, 0.24], [0.2, 0.4], [0.15, 0.6], [0.15, 0.82], [0.26, 0.87], [0.26, 0.93],
          [0.17, 0.97], [0.24, 1.08], [0.33, 1.22], [0.3, 1.26], [0.2, 1.22], [0, 1.2],
        ]),
        boxes: [],
        dots: [dot(-0.3, 1.28, 0.06), dot(-0.15, 1.31, 0.06), dot(0.15, 1.31, 0.06), dot(0.3, 1.28, 0.06), dot(0, 1.34, 0.09)],
      };
      break;
    case 'k':
    default:
      art = {
        body: silhouette([
          ...BASE, [0.28, 0.24], [0.2, 0.4], [0.16, 0.62], [0.16, 0.9], [0.27, 0.95], [0.27, 1.01],
          [0.19, 1.06], [0.3, 1.32], [0.28, 1.36], [0, 1.32],
        ]),
        boxes: [box(0, 1.33, 1.71, 0.055), box(0, 1.5, 1.6, 0.14)],
        dots: [],
      };
      break;
  }
  cache.set(type, art);
  return art;
}
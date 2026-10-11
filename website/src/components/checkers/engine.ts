import { Board, Color, DifficultyMode, Move, Piece, Sq } from "./types";

export function oppColor(c: Color): Color {
  return c === "red" ? "black" : "red";
}

export function inBounds(r: number, c: number): boolean {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

export function initialBoard(): Board {
  const b: Board = Array.from({ length: 8 }, () => Array(8).fill(null));
  // Red pieces at rows 0, 1, 2 (as seen in screenshots)
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 8; c++) {
      if ((r + c) % 2 === 1) {
        b[r][c] = { color: "red", type: "man" };
      }
    }
  }
  // Charcoal/black pieces at rows 5, 6, 7
  for (let r = 5; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if ((r + c) % 2 === 1) {
        b[r][c] = { color: "black", type: "man" };
      }
    }
  }
  return b;
}

export function copyBoard(b: Board): Board {
  return b.map((row) => row.map((p) => (p ? { ...p } : null)));
}

function jumpDirs(): [number, number][] {
  return [
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
  ];
}

function moveDirs(piece: Piece): [number, number][] {
  if (piece.type === "king") {
    return [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ];
  }
  // Red moves DOWN (dr = +1), Black moves UP (dr = -1)
  return piece.color === "red"
    ? [
        [1, -1],
        [1, 1],
      ]
    : [
        [-1, -1],
        [-1, 1],
      ];
}

export function exploreCaptures(
  b: Board,
  r: number,
  c: number,
  piece: Piece,
  capSoFar: Sq[],
): Move[] {
  const results: Move[] = [];
  let foundAny = false;
  const dirs = piece.type === "king" ? jumpDirs() : jumpDirs().filter(([dr]) => piece.color === "red" ? dr > 0 : dr < 0);

  for (const [dr, dc] of dirs) {
    const jr = r + dr;
    const jc = c + dc;
    const lr = r + 2 * dr;
    const lc = c + 2 * dc;

    if (!inBounds(jr, jc) || !inBounds(lr, lc)) continue;
    if (capSoFar.some(([a, b]) => a === jr && b === jc)) continue;

    const jumped = b[jr][jc];
    if (!jumped || jumped.color === piece.color || b[lr][lc] !== null) continue;

    foundAny = true;
    const newCap = [...capSoFar, [jr, jc] as Sq];

    const promotes =
      piece.type === "man" &&
      (piece.color === "red" ? lr === 7 : lr === 0);

    const nextPiece: Piece = promotes ? { color: piece.color, type: "king" } : piece;

    // Temporarily apply to explore further consecutive jumps
    const tempBoard = copyBoard(b);
    tempBoard[r][c] = null;
    tempBoard[jr][jc] = null;
    tempBoard[lr][lc] = nextPiece;

    const sub = exploreCaptures(tempBoard, lr, lc, nextPiece, newCap);
    if (sub.length > 0) {
      for (const sm of sub) {
        results.push({
          from: [r, c],
          to: sm.to,
          captured: sm.captured,
          promotes: promotes || sm.promotes,
        });
      }
    } else {
      results.push({
        from: [r, c],
        to: [lr, lc],
        captured: newCap,
        promotes,
      });
    }
  }

  return results;
}

export function normalMoves(b: Board, r: number, c: number, piece: Piece): Move[] {
  return moveDirs(piece)
    .map(([dr, dc]) => [r + dr, c + dc] as Sq)
    .filter(([nr, nc]) => inBounds(nr, nc) && b[nr][nc] === null)
    .map(([nr, nc]) => {
      const promotes =
        piece.type === "man" &&
        (piece.color === "red" ? nr === 7 : nr === 0);
      return {
        from: [r, c] as Sq,
        to: [nr, nc] as Sq,
        captured: [] as Sq[],
        promotes,
      };
    });
}

export function allCapturesFor(b: Board, color: Color): Move[] {
  const caps: Move[] = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = b[r][c];
      if (p?.color === color) {
        caps.push(...exploreCaptures(b, r, c, p, []));
      }
    }
  }
  return caps;
}

export function allMovesFor(b: Board, color: Color): Move[] {
  const caps = allCapturesFor(b, color);
  // Mandatory jumping: if any capture exists, player MUST capture
  if (caps.length > 0) return caps;

  const norms: Move[] = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = b[r][c];
      if (p?.color === color) {
        norms.push(...normalMoves(b, r, c, p));
      }
    }
  }
  return norms;
}

export function movesForPiece(b: Board, r: number, c: number): Move[] {
  const p = b[r][c];
  if (!p) return [];

  const globalCaptures = allCapturesFor(b, p.color);
  if (globalCaptures.length > 0) {
    // Only capture moves for this piece
    return globalCaptures.filter(
      (m) => m.from[0] === r && m.from[1] === c
    );
  }

  return normalMoves(b, r, c, p);
}

export function applyMove(b: Board, move: Move): Board {
  const nb = copyBoard(b);
  const p = { ...nb[move.from[0]][move.from[1]]! };
  nb[move.from[0]][move.from[1]] = null;

  for (const [cr, cc] of move.captured) {
    nb[cr][cc] = null;
  }

  if (move.promotes) {
    p.type = "king";
  }

  nb[move.to[0]][move.to[1]] = p;
  return nb;
}

export function countPieces(b: Board) {
  let redCount = 0;
  let redKings = 0;
  let blackCount = 0;
  let blackKings = 0;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = b[r][c];
      if (!p) continue;
      if (p.color === "red") {
        redCount++;
        if (p.type === "king") redKings++;
      } else {
        blackCount++;
        if (p.type === "king") blackKings++;
      }
    }
  }
  return { redCount, redKings, blackCount, blackKings };
}

// ── AI ENGINE ─────────────────────────────────────────────────────────────
function evaluateBoard(b: Board, aiColor: Color): number {
  let score = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = b[r][c];
      if (!p) continue;
      const baseValue = p.type === "king" ? 50 : 20;
      // Positional advantage for center squares
      const centerBonus = (3.5 - Math.abs(c - 3.5)) * 2;
      // Advancement advantage
      const advanceBonus = p.color === "red" ? r * 1.5 : (7 - r) * 1.5;
      const total = baseValue + centerBonus + advanceBonus;

      if (p.color === aiColor) {
        score += total;
      } else {
        score -= total;
      }
    }
  }
  return score;
}

function minimax(
  b: Board,
  depth: number,
  isMax: boolean,
  aiColor: Color,
  alpha: number,
  beta: number,
): number {
  const turnColor = isMax ? aiColor : oppColor(aiColor);
  const moves = allMovesFor(b, turnColor);

  if (depth === 0 || moves.length === 0) {
    if (moves.length === 0) {
      return isMax ? -10000 : 10000;
    }
    return evaluateBoard(b, aiColor);
  }

  if (isMax) {
    let maxEval = -Infinity;
    for (const m of moves) {
      const nextBoard = applyMove(b, m);
      const evalScore = minimax(nextBoard, depth - 1, false, aiColor, alpha, beta);
      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const m of moves) {
      const nextBoard = applyMove(b, m);
      const evalScore = minimax(nextBoard, depth - 1, true, aiColor, alpha, beta);
      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

export function computeAiMove(
  b: Board,
  aiColor: Color,
  difficulty: DifficultyMode,
): Move | null {
  const moves = allMovesFor(b, aiColor);
  if (!moves.length) return null;

  // Easy mode: prioritizes captures, otherwise chooses semi-randomly
  if (difficulty === "Easy") {
    const captures = moves.filter((m) => m.captured.length > 0);
    if (captures.length > 0) {
      return captures[Math.floor(Math.random() * captures.length)];
    }
    return moves[Math.floor(Math.random() * moves.length)];
  }

  // Medium: search depth 4
  // Hard: search depth 6
  const targetDepth = difficulty === "Hard" ? 5 : 3;

  let bestMove = moves[0];
  let bestScore = -Infinity;

  for (const m of moves) {
    const nextBoard = applyMove(b, m);
    // Give bonus for captures directly
    let moveBonus = m.captured.length * 30;
    if (m.promotes) moveBonus += 40;

    const score =
      minimax(nextBoard, targetDepth - 1, false, aiColor, -Infinity, Infinity) +
      moveBonus;

    if (score > bestScore) {
      bestScore = score;
      bestMove = m;
    }
  }

  return bestMove;
}

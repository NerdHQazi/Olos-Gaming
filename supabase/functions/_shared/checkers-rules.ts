export type CheckersColor = "red" | "black";
type CheckersPiece = { color: CheckersColor; type: "man" | "king" };
export type CheckersBoard = (CheckersPiece | null)[][];
export type Square = [number, number];
export type CheckersMove = { from: Square; to: Square; captured: Square[]; promotes: boolean };

const opposite = (color: CheckersColor): CheckersColor => color === "red" ? "black" : "red";
const inBounds = (row: number, column: number) => row >= 0 && row < 8 && column >= 0 && column < 8;

export function initialCheckersBoard(): CheckersBoard {
  const board: CheckersBoard = Array.from({ length: 8 }, () => Array(8).fill(null));
  for (let row = 0; row < 3; row += 1) for (let column = 0; column < 8; column += 1) if ((row + column) % 2 === 1) board[row][column] = { color: "black", type: "man" };
  for (let row = 5; row < 8; row += 1) for (let column = 0; column < 8; column += 1) if ((row + column) % 2 === 1) board[row][column] = { color: "red", type: "man" };
  return board;
}

export function parseCheckersBoard(value: unknown): CheckersBoard {
  if (!Array.isArray(value) || value.length !== 8 || value.some((row) => !Array.isArray(row) || row.length !== 8)) throw new Error("Invalid checkers board");
  const board = value as CheckersBoard;
  for (const row of board) for (const piece of row) if (piece !== null && (!piece || !["red", "black"].includes(piece.color) || !["man", "king"].includes(piece.type))) throw new Error("Invalid checkers piece");
  return board.map((row) => row.map((piece) => piece ? { ...piece } : null));
}

function directions(piece: CheckersPiece): Square[] {
  if (piece.type === "king") return [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  return piece.color === "red" ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]];
}

// The shipped game allows men to capture in all diagonal directions, while
// non-capturing moves remain forward-only.
function captureDirections(): Square[] {
  return [[-1, -1], [-1, 1], [1, -1], [1, 1]];
}

function captureMoves(board: CheckersBoard, row: number, column: number, piece: CheckersPiece, captured: Square[] = [], origin: Square = [row, column]): CheckersMove[] {
  const moves: CheckersMove[] = [];
  for (const [rowDelta, columnDelta] of captureDirections()) {
    const jumpedRow = row + rowDelta;
    const jumpedColumn = column + columnDelta;
    const landingRow = row + 2 * rowDelta;
    const landingColumn = column + 2 * columnDelta;
    if (!inBounds(jumpedRow, jumpedColumn) || !inBounds(landingRow, landingColumn) || captured.some(([r, c]) => r === jumpedRow && c === jumpedColumn)) continue;
    const jumped = board[jumpedRow][jumpedColumn];
    if (!jumped || jumped.color === piece.color || board[landingRow][landingColumn]) continue;
    const next = board.map((boardRow) => boardRow.map((entry) => entry ? { ...entry } : null));
    next[row][column] = null;
    next[jumpedRow][jumpedColumn] = null;
    next[landingRow][landingColumn] = { ...piece };
    const nextCaptured = [...captured, [jumpedRow, jumpedColumn] as Square];
    const continuations = captureMoves(next, landingRow, landingColumn, piece, nextCaptured, origin);
    if (continuations.length) moves.push(...continuations);
    else moves.push({ from: origin, to: [landingRow, landingColumn], captured: nextCaptured, promotes: piece.type === "man" && (piece.color === "red" ? landingRow === 0 : landingRow === 7) });
  }
  return moves;
}

function allMoves(board: CheckersBoard, color: CheckersColor): CheckersMove[] {
  const captures: CheckersMove[] = [];
  const normal: CheckersMove[] = [];
  for (let row = 0; row < 8; row += 1) for (let column = 0; column < 8; column += 1) {
    const piece = board[row][column];
    if (!piece || piece.color !== color) continue;
    captures.push(...captureMoves(board, row, column, piece));
    for (const [rowDelta, columnDelta] of directions(piece)) {
      const targetRow = row + rowDelta;
      const targetColumn = column + columnDelta;
      if (inBounds(targetRow, targetColumn) && !board[targetRow][targetColumn]) normal.push({ from: [row, column], to: [targetRow, targetColumn], captured: [], promotes: piece.type === "man" && (piece.color === "red" ? targetRow === 0 : targetRow === 7) });
    }
  }
  return captures.length ? captures : normal;
}

function applyMove(board: CheckersBoard, move: CheckersMove): CheckersBoard {
  const next = board.map((row) => row.map((piece) => piece ? { ...piece } : null));
  const piece = next[move.from[0]][move.from[1]];
  if (!piece) throw new Error("Missing checkers piece");
  next[move.from[0]][move.from[1]] = null;
  for (const [row, column] of move.captured) next[row][column] = null;
  next[move.to[0]][move.to[1]] = { color: piece.color, type: move.promotes ? "king" : piece.type };
  return next;
}

export function legalCheckersMoves(boardInput: unknown, color: CheckersColor): CheckersMove[] {
  return allMoves(parseCheckersBoard(boardInput), color);
}

export function validateCheckersMove(boardInput: unknown, color: CheckersColor, from: Square, to: Square) {
  const board = parseCheckersBoard(boardInput);
  if (!inBounds(...from) || !inBounds(...to)) throw new Error("Move is outside the board");
  if (board[from[0]][from[1]]?.color !== color) throw new Error("Selected piece does not belong to player");
  const candidates = allMoves(board, color).filter((move) => move.from[0] === from[0] && move.from[1] === from[1] && move.to[0] === to[0] && move.to[1] === to[1]);
  if (candidates.length !== 1) throw new Error("Illegal or ambiguous checkers move");
  const nextBoard = applyMove(board, candidates[0]);
  const nextColor = opposite(color);
  if (allMoves(nextBoard, nextColor).length > 0) return { board: nextBoard, nextColor, terminal: null };
  return { board: nextBoard, nextColor, terminal: { reason: "checkers_no_legal_moves", winnerColor: color } };
}
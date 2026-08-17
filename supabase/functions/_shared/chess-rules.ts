export type ChessColor = "w" | "b";
type ChessPieceType = "K" | "Q" | "R" | "B" | "N" | "P";
type ChessPiece = { type: ChessPieceType; color: ChessColor };
export type ChessBoard = (ChessPiece | null)[][];
export type Square = [number, number];
export type ChessMove = { from: Square; to: Square };

const opposite = (color: ChessColor): ChessColor => color === "w" ? "b" : "w";
const inBounds = (row: number, column: number) => row >= 0 && row < 8 && column >= 0 && column < 8;

export function initialChessBoard(): ChessBoard {
  const board: ChessBoard = Array.from({ length: 8 }, () => Array(8).fill(null));
  const backRank: ChessPieceType[] = ["R", "N", "B", "Q", "K", "B", "N", "R"];
  for (let column = 0; column < 8; column += 1) {
    board[0][column] = { type: backRank[column], color: "b" };
    board[1][column] = { type: "P", color: "b" };
    board[6][column] = { type: "P", color: "w" };
    board[7][column] = { type: backRank[column], color: "w" };
  }
  return board;
}

export function parseChessBoard(value: unknown): ChessBoard {
  if (!Array.isArray(value) || value.length !== 8 || value.some((row) => !Array.isArray(row) || row.length !== 8)) {
    throw new Error("Invalid chess board");
  }
  const board = value as ChessBoard;
  for (const row of board) {
    for (const piece of row) {
      if (piece !== null && (!piece || !["K", "Q", "R", "B", "N", "P"].includes(piece.type) || !["w", "b"].includes(piece.color))) {
        throw new Error("Invalid chess piece");
      }
    }
  }
  return board.map((row) => row.map((piece) => piece ? { ...piece } : null));
}

function rawMoves(board: ChessBoard, row: number, column: number): Square[] {
  const piece = board[row][column];
  if (!piece) return [];
  const moves: Square[] = [];
  const addStep = (rowDelta: number, columnDelta: number) => {
    const nextRow = row + rowDelta;
    const nextColumn = column + columnDelta;
    if (inBounds(nextRow, nextColumn) && board[nextRow][nextColumn]?.color !== piece.color) {
      moves.push([nextRow, nextColumn]);
    }
  };
  const addSlide = (rowDelta: number, columnDelta: number) => {
    let nextRow = row + rowDelta;
    let nextColumn = column + columnDelta;
    while (inBounds(nextRow, nextColumn)) {
      const target = board[nextRow][nextColumn];
      if (target) {
        if (target.color !== piece.color) moves.push([nextRow, nextColumn]);
        return;
      }
      moves.push([nextRow, nextColumn]);
      nextRow += rowDelta;
      nextColumn += columnDelta;
    }
  };

  switch (piece.type) {
    case "R": [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([r, c]) => addSlide(r, c)); break;
    case "B": [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([r, c]) => addSlide(r, c)); break;
    case "Q": [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([r, c]) => addSlide(r, c)); break;
    case "N": [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]].forEach(([r, c]) => addStep(r, c)); break;
    case "K": [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]].forEach(([r, c]) => addStep(r, c)); break;
    case "P": {
      const direction = piece.color === "w" ? -1 : 1;
      const startRow = piece.color === "w" ? 6 : 1;
      if (inBounds(row + direction, column) && !board[row + direction][column]) {
        moves.push([row + direction, column]);
        if (row === startRow && !board[row + 2 * direction][column]) moves.push([row + 2 * direction, column]);
      }
      for (const columnDelta of [-1, 1]) {
        const nextRow = row + direction;
        const nextColumn = column + columnDelta;
        if (inBounds(nextRow, nextColumn) && board[nextRow][nextColumn]?.color === opposite(piece.color)) moves.push([nextRow, nextColumn]);
      }
      break;
    }
  }
  return moves;
}

function attacksSquare(board: ChessBoard, attacker: ChessColor, targetRow: number, targetColumn: number): boolean {
  for (let row = 0; row < 8; row += 1) {
    for (let column = 0; column < 8; column += 1) {
      const piece = board[row][column];
      if (!piece || piece.color !== attacker) continue;
      if (piece.type === "P") {
        const direction = attacker === "w" ? -1 : 1;
        if (row + direction === targetRow && Math.abs(column - targetColumn) === 1) return true;
      } else if (rawMoves(board, row, column).some(([moveRow, moveColumn]) => moveRow === targetRow && moveColumn === targetColumn)) {
        return true;
      }
    }
  }
  return false;
}

function kingSquare(board: ChessBoard, color: ChessColor): Square | null {
  for (let row = 0; row < 8; row += 1) {
    for (let column = 0; column < 8; column += 1) {
      if (board[row][column]?.type === "K" && board[row][column]?.color === color) return [row, column];
    }
  }
  return null;
}

function isInCheck(board: ChessBoard, color: ChessColor): boolean {
  const king = kingSquare(board, color);
  return king === null || attacksSquare(board, opposite(color), king[0], king[1]);
}

function applyMove(board: ChessBoard, from: Square, to: Square): ChessBoard {
  const next = board.map((row) => row.map((piece) => piece ? { ...piece } : null));
  const piece = next[from[0]][from[1]];
  if (!piece) throw new Error("Missing chess piece");
  next[to[0]][to[1]] = piece;
  next[from[0]][from[1]] = null;
  if (piece.type === "P" && ((piece.color === "w" && to[0] === 0) || (piece.color === "b" && to[0] === 7))) {
    next[to[0]][to[1]] = { type: "Q", color: piece.color };
  }
  return next;
}

function legalMovesForPiece(board: ChessBoard, row: number, column: number, color: ChessColor): Square[] {
  return rawMoves(board, row, column).filter(([targetRow, targetColumn]) => {
    if (board[targetRow][targetColumn]?.type === "K") return false;
    return !isInCheck(applyMove(board, [row, column], [targetRow, targetColumn]), color);
  });
}

function hasLegalMove(board: ChessBoard, color: ChessColor): boolean {
  for (let row = 0; row < 8; row += 1) {
    for (let column = 0; column < 8; column += 1) {
      if (board[row][column]?.color === color && legalMovesForPiece(board, row, column, color).length > 0) return true;
    }
  }
  return false;
}

export function legalChessMoves(boardInput: unknown, color: ChessColor): ChessMove[] {
  const board = parseChessBoard(boardInput);
  const moves: ChessMove[] = [];
  for (let row = 0; row < 8; row += 1) {
    for (let column = 0; column < 8; column += 1) {
      if (board[row][column]?.color !== color) continue;
      for (const to of legalMovesForPiece(board, row, column, color)) {
        moves.push({ from: [row, column], to });
      }
    }
  }
  return moves;
}

export function validateChessMove(boardInput: unknown, color: ChessColor, from: Square, to: Square) {
  const board = parseChessBoard(boardInput);
  if (!inBounds(...from) || !inBounds(...to)) throw new Error("Move is outside the board");
  if (board[from[0]][from[1]]?.color !== color) throw new Error("Selected piece does not belong to player");
  if (!legalMovesForPiece(board, from[0], from[1], color).some(([row, column]) => row === to[0] && column === to[1])) {
    throw new Error("Illegal chess move");
  }
  const nextBoard = applyMove(board, from, to);
  const nextColor = opposite(color);
  if (hasLegalMove(nextBoard, nextColor)) return { board: nextBoard, nextColor, terminal: null };
  if (isInCheck(nextBoard, nextColor)) {
    return { board: nextBoard, nextColor, terminal: { reason: "chess_checkmate", winnerColor: color } };
  }
  return { board: nextBoard, nextColor, terminal: { reason: "chess_stalemate", winnerColor: null } };
}
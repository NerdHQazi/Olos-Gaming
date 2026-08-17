import { legalChessMoves, parseChessBoard, type ChessColor, type ChessMove } from "./chess-rules.ts";
import { legalCheckersMoves, type CheckersColor, type CheckersMove } from "./checkers-rules.ts";

export function selectChessSystemMove(boardInput: unknown, color: ChessColor): ChessMove | null {
  const board = parseChessBoard(boardInput);
  const moves = legalChessMoves(board, color);
  return moves.find(({ to }) => board[to[0]][to[1]] !== null) ?? moves[0] ?? null;
}

export function selectCheckersSystemMove(boardInput: unknown, color: CheckersColor): CheckersMove | null {
  return legalCheckersMoves(boardInput, color)[0] ?? null;
}
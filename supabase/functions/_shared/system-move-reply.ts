import { selectChessSystemMove, selectCheckersSystemMove } from "./system-move-selector.ts";
import { validateChessMove, type ChessColor, type Square as ChessSquare } from "./chess-rules.ts";
import { validateCheckersMove, type CheckersColor, type Square as CheckersSquare } from "./checkers-rules.ts";

export type SystemMoveReply = {
  from: [number, number];
  to: [number, number];
  board: unknown;
  nextColor: ChessColor | CheckersColor;
  terminal: { reason: string; winnerColor: ChessColor | CheckersColor | null } | null;
};

export function computeChessSystemReply(board: unknown, color: ChessColor): SystemMoveReply | null {
  const move = selectChessSystemMove(board, color);
  if (!move) return null;
  const validated = validateChessMove(board, color, move.from as ChessSquare, move.to as ChessSquare);
  return { ...move, ...validated };
}

export function computeCheckersSystemReply(board: unknown, color: CheckersColor): SystemMoveReply | null {
  const move = selectCheckersSystemMove(board, color);
  if (!move) return null;
  const validated = validateCheckersMove(board, color, move.from as CheckersSquare, move.to as CheckersSquare);
  return { ...move, ...validated };
}
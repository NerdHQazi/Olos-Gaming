import { initialChessBoard, validateChessMove } from "./chess-rules.ts";

Deno.test("Chess accepts a legal opening move and switches turns", () => {
  const result = validateChessMove(initialChessBoard(), "w", [6, 4], [4, 4]);
  if (result.nextColor !== "b" || result.terminal !== null) throw new Error("Expected an active black turn");
});

Deno.test("Chess rejects a move for the wrong color", () => {
  let rejected = false;
  try {
    validateChessMove(initialChessBoard(), "w", [1, 4], [3, 4]);
  } catch {
    rejected = true;
  }
  if (!rejected) throw new Error("Expected wrong-color move to be rejected");
});

Deno.test("Chess distinguishes stalemate from checkmate", () => {
  const board = Array.from({ length: 8 }, () => Array(8).fill(null));
  board[0][0] = { type: "K", color: "b" };
  board[2][2] = { type: "K", color: "w" };
  board[1][2] = { type: "Q", color: "w" };
  const result = validateChessMove(board, "w", [1, 2], [2, 1]);
  if (result.terminal?.reason !== "chess_stalemate" || result.terminal.winnerColor !== null) {
    throw new Error("Expected a stalemate draw");
  }
});

Deno.test("Chess derives checkmate and the winning color", () => {
  const board = Array.from({ length: 8 }, () => Array(8).fill(null));
  board[0][0] = { type: "K", color: "b" };
  board[2][2] = { type: "K", color: "w" };
  board[1][2] = { type: "Q", color: "w" };
  const result = validateChessMove(board, "w", [1, 2], [1, 1]);
  if (result.terminal?.reason !== "chess_checkmate" || result.terminal.winnerColor !== "w") {
    throw new Error("Expected white checkmate");
  }
});

Deno.test("Chess rejects a move that leaves its king in check", () => {
  const board = Array.from({ length: 8 }, () => Array(8).fill(null));
  board[7][4] = { type: "K", color: "w" };
  board[0][4] = { type: "R", color: "b" };
  board[0][0] = { type: "K", color: "b" };
  board[7][6] = { type: "N", color: "w" };
  let rejected = false;
  try {
    validateChessMove(board, "w", [7, 6], [5, 5]);
  } catch {
    rejected = true;
  }
  if (!rejected) throw new Error("Expected self-check move to be rejected");
});

Deno.test("Chess rejects moving a pinned piece", () => {
  const board = Array.from({ length: 8 }, () => Array(8).fill(null));
  board[7][4] = { type: "K", color: "w" };
  board[6][4] = { type: "R", color: "w" };
  board[0][4] = { type: "R", color: "b" };
  board[0][0] = { type: "K", color: "b" };
  let rejected = false;
  try {
    validateChessMove(board, "w", [6, 4], [6, 5]);
  } catch {
    rejected = true;
  }
  if (!rejected) throw new Error("Expected pinned-piece move to be rejected");
});

Deno.test("Chess rejects kings moving adjacent to each other", () => {
  const board = Array.from({ length: 8 }, () => Array(8).fill(null));
  board[7][4] = { type: "K", color: "w" };
  board[5][4] = { type: "K", color: "b" };
  let rejected = false;
  try {
    validateChessMove(board, "w", [7, 4], [6, 4]);
  } catch {
    rejected = true;
  }
  if (!rejected) throw new Error("Expected adjacent-kings move to be rejected");
});
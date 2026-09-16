import { selectCheckersSystemMove, selectChessSystemMove } from "./system-move-selector.ts";

function emptyBoard() {
  return Array.from({ length: 8 }, () => Array(8).fill(null));
}

Deno.test("Chess System selects an available capture", () => {
  const board = emptyBoard();
  board[0][0] = { type: "K", color: "b" };
  board[7][7] = { type: "K", color: "w" };
  board[6][0] = { type: "R", color: "w" };
  board[4][0] = { type: "N", color: "b" };
  const move = selectChessSystemMove(board, "w");
  if (!move || move.from[0] !== 6 || move.from[1] !== 0 || move.to[0] !== 4 || move.to[1] !== 0) {
    throw new Error("Expected the available rook capture");
  }
});

Deno.test("Chess System selects a legal move when no capture exists", () => {
  const board = emptyBoard();
  board[0][0] = { type: "K", color: "b" };
  board[7][7] = { type: "K", color: "w" };
  board[6][0] = { type: "P", color: "w" };
  const move = selectChessSystemMove(board, "w");
  if (!move || move.from[0] !== 6 || move.from[1] !== 0 || move.to[0] !== 5 || move.to[1] !== 0) {
    throw new Error("Expected the first legal pawn move");
  }
});

Deno.test("Chess System returns no move on a terminal board", () => {
  const board = emptyBoard();
  board[0][0] = { type: "K", color: "b" };
  board[2][2] = { type: "K", color: "w" };
  board[1][1] = { type: "Q", color: "w" };
  if (selectChessSystemMove(board, "b") !== null) throw new Error("Expected no legal move for checkmate");
});

Deno.test("Checkers System selects an available capture", () => {
  const board = emptyBoard();
  board[5][0] = { color: "red", type: "man" };
  board[4][1] = { color: "black", type: "man" };
  const move = selectCheckersSystemMove(board, "red");
  if (!move || move.captured.length !== 1 || move.to[0] !== 3 || move.to[1] !== 2) {
    throw new Error("Expected the available checkers capture");
  }
});

Deno.test("Checkers System selects a legal move when no capture exists", () => {
  const board = emptyBoard();
  board[5][0] = { color: "red", type: "man" };
  const move = selectCheckersSystemMove(board, "red");
  if (!move || move.captured.length !== 0 || move.to[0] !== 4 || move.to[1] !== 1) {
    throw new Error("Expected the first legal checkers move");
  }
});

Deno.test("Checkers System returns no move on a terminal board", () => {
  if (selectCheckersSystemMove(emptyBoard(), "black") !== null) {
    throw new Error("Expected no legal move with no black pieces");
  }
});
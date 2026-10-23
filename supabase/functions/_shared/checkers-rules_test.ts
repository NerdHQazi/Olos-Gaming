import { initialCheckersBoard, validateCheckersMove } from "./checkers-rules.ts";

Deno.test("Checkers accepts a legal opening move and switches turns", () => {
  const result = validateCheckersMove(initialCheckersBoard(), "red", [5, 0], [4, 1]);
  if (result.nextColor !== "black" || result.terminal !== null) throw new Error("Expected an active black turn");
});

Deno.test("Checkers rejects a move for the wrong color", () => {
  let rejected = false;
  try {
    validateCheckersMove(initialCheckersBoard(), "red", [2, 1], [3, 0]);
  } catch {
    rejected = true;
  }
  if (!rejected) throw new Error("Expected wrong-color move to be rejected");
});

Deno.test("Checkers requires a capture when one is available", () => {
  const board = Array.from({ length: 8 }, () => Array(8).fill(null));
  board[5][0] = { color: "red", type: "man" };
  board[4][1] = { color: "black", type: "man" };
  board[5][4] = { color: "red", type: "man" };
  let rejected = false;
  try {
    validateCheckersMove(board, "red", [5, 4], [4, 3]);
  } catch {
    rejected = true;
  }
  if (!rejected) throw new Error("Expected non-capture move to be rejected");
});

Deno.test("Checkers permits the existing backward capture rule for men", () => {
  const board = Array.from({ length: 8 }, () => Array(8).fill(null));
  board[2][1] = { color: "red", type: "man" };
  board[3][2] = { color: "black", type: "man" };
  const result = validateCheckersMove(board, "red", [2, 1], [4, 3]);
  if (result.board[3][2] !== null || result.board[4][3]?.color !== "red") {
    throw new Error("Expected backward capture to be applied");
  }
});

Deno.test("Checkers applies a complete multi-jump atomically", () => {
  const board = Array.from({ length: 8 }, () => Array(8).fill(null));
  board[5][0] = { color: "red", type: "man" };
  board[4][1] = { color: "black", type: "man" };
  board[2][3] = { color: "black", type: "man" };
  const result = validateCheckersMove(board, "red", [5, 0], [1, 4]);
  if (result.board[4][1] !== null || result.board[2][3] !== null || result.board[1][4]?.color !== "red") {
    throw new Error("Expected both captures and final landing square");
  }
});

Deno.test("Checkers derives a terminal win when the last opposing piece is captured", () => {
  const board = Array.from({ length: 8 }, () => Array(8).fill(null));
  board[2][1] = { color: "red", type: "man" };
  board[1][2] = { color: "black", type: "man" };
  const result = validateCheckersMove(board, "red", [2, 1], [0, 3]);
  if (result.terminal?.reason !== "checkers_no_legal_moves" || result.terminal.winnerColor !== "red") {
    throw new Error("Expected red terminal win");
  }
});
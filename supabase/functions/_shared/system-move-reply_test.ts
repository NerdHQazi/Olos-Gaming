import { initialChessBoard, validateChessMove } from "./chess-rules.ts";
import { initialCheckersBoard, validateCheckersMove } from "./checkers-rules.ts";
import { computeChessSystemReply, computeCheckersSystemReply } from "./system-move-reply.ts";

Deno.test("Chess System reply is a legal move and returns the turn to the human", () => {
  const humanMove = validateChessMove(initialChessBoard(), "w", [6, 4], [4, 4]);
  const reply = computeChessSystemReply(humanMove.board, "b");
  if (!reply || reply.nextColor !== "w" || reply.terminal !== null) {
    throw new Error("Expected a legal non-terminal black reply with white to move");
  }
  validateChessMove(humanMove.board, "b", reply.from, reply.to);
});

Deno.test("Checkers System reply is a legal move and returns the turn to the human", () => {
  const humanMove = validateCheckersMove(initialCheckersBoard(), "red", [5, 0], [4, 1]);
  const reply = computeCheckersSystemReply(humanMove.board, "black");
  if (!reply || reply.nextColor !== "red" || reply.terminal !== null) {
    throw new Error("Expected a legal non-terminal black reply with red to move");
  }
  validateCheckersMove(humanMove.board, "black", reply.from, reply.to);
});
export type Color = "red" | "black";
export type PieceType = "man" | "king";

export interface Piece {
  color: Color;
  type: PieceType;
}

export type Board = (Piece | null)[][];
export type Sq = [number, number]; // [row, col]

export interface Move {
  from: Sq;
  to: Sq;
  captured: Sq[]; // coordinates of captured pieces
  promotes: boolean;
}

export type DifficultyMode = "Easy" | "Medium" | "Hard";

export type ScreenView = "lobby" | "pvp" | "practice";

export interface SettlementRecord {
  competitor: string;
  result: "VICTORY" | "DEFEAT";
  payout: string;
  isPositive: boolean;
}

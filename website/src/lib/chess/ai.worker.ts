import { Chess } from 'chess.js';
import { getBestMove, type AiMove } from './ai';
import type { Difficulty } from '../../../Screens/Games/Chess/lib/constants';

export interface AiRequest {
  id: number;
  fen: string;
  difficulty: Difficulty;
}

export interface AiResponse {
  id: number;
  move: AiMove | null;
  error?: string;
}

self.onmessage = (e: MessageEvent<AiRequest>) => {
  const { id, fen, difficulty } = e.data;
  try {
    const game = new Chess(fen);
    const move = getBestMove(game, difficulty);
    const res: AiResponse = { id, move };
    self.postMessage(res);
  } catch (err) {
    const res: AiResponse = {
      id,
      move: null,
      error: err instanceof Error ? err.message : 'AI error',
    };
    self.postMessage(res);
  }
};
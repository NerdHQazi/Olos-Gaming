import { Chess } from 'chess.js';
import { getBestMove, type AiMove } from './ai';
import type { Difficulty } from './constants';
import type { AiResponse } from './ai.worker';

type Resolver = (move: AiMove | null) => void;

let worker: Worker | null = null;
let workerFailed = false;
let seq = 0;
const pending = new Map<number, { resolve: Resolver; fen: string; difficulty: Difficulty }>();

function runOnMainThread(fen: string, difficulty: Difficulty): AiMove | null {
  return getBestMove(new Chess(fen), difficulty);
}

function getWorker(): Worker | null {
  if (workerFailed || typeof window === 'undefined' || typeof Worker === 'undefined') return null;
  if (worker) return worker;
  try {
    worker = new Worker(new URL('./ai.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e: MessageEvent<AiResponse>) => {
      const job = pending.get(e.data.id);
      if (!job) return;
      pending.delete(e.data.id);
      if (e.data.error) {
        // Worker computed badly — compute here instead so the game never stalls.
        job.resolve(runOnMainThread(job.fen, job.difficulty));
      } else {
        job.resolve(e.data.move);
      }
    };
    worker.onerror = () => {
      workerFailed = true;
      worker?.terminate();
      worker = null;
      // Resolve everything in flight on the main thread.
      const jobs = Array.from(pending.values());
      pending.clear();
      for (const job of jobs) job.resolve(runOnMainThread(job.fen, job.difficulty));
    };
    return worker;
  } catch {
    workerFailed = true;
    return null;
  }
}

/** Ask the AI for a move. Resolves with null if the side to move has no legal moves. */
export function requestAiMove(fen: string, difficulty: Difficulty): Promise<AiMove | null> {
  return new Promise((resolve) => {
    const w = getWorker();
    if (!w) {
      // Let the browser paint "AI is thinking…" before the synchronous search.
      setTimeout(() => resolve(runOnMainThread(fen, difficulty)), 0);
      return;
    }
    const id = ++seq;
    pending.set(id, { resolve, fen, difficulty });
    w.postMessage({ id, fen, difficulty });
  });
}
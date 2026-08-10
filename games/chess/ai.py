"""
Chess AI — Simple computer opponent.

Uses only legal moves provided by python-chess.  Never generates or
validates moves manually.

Strategy (in priority order):
  1. Checkmate if possible.
  2. Capture the highest-value piece available.
  3. Play a random legal move.
"""

import chess
import random

# Piece values for capture evaluation
_PIECE_VALUE = {
    chess.PAWN:   1,
    chess.KNIGHT: 3,
    chess.BISHOP: 3,
    chess.ROOK:   5,
    chess.QUEEN:  9,
    chess.KING:   0,   # can't actually capture the king
}


def get_best_move(board):
    """Return a chess.Move for the current side to play.

    *board* is a chess.Board instance.  Returns None if no legal moves exist.
    """
    legal = list(board.legal_moves)
    if not legal:
        return None

    # 1. Check for an immediate checkmate
    for move in legal:
        board.push(move)
        is_mate = board.is_checkmate()
        board.pop()
        if is_mate:
            return move

    # 2. Prefer captures, sorted by captured piece value (highest first)
    captures = []
    for move in legal:
        victim = board.piece_at(move.to_square)
        if victim is not None:
            captures.append((move, _PIECE_VALUE.get(victim.piece_type, 0)))
        elif board.is_en_passant(move):
            captures.append((move, _PIECE_VALUE[chess.PAWN]))

    if captures:
        captures.sort(key=lambda x: x[1], reverse=True)
        # Among equally valued captures, pick randomly
        best_val = captures[0][1]
        best_captures = [m for m, v in captures if v == best_val]
        return random.choice(best_captures)

    # 3. Random legal move
    return random.choice(legal)

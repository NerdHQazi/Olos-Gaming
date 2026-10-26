"""
Chess AI — computer opponent with three difficulty levels.

  easy    mostly random; occasionally grabs a capture.
  medium  checkmate in one > best capture > random   (the original AI).
  hard    iterative-deepening alpha-beta search (up to 4 plies) with
          capture quiescence, under a small time budget so the game
          never freezes for long.

Only legal moves from python-chess are ever used.
"""

import random
import time

import chess

LEVELS = ("easy", "medium", "hard")
_current = "medium"

# Hard-mode search budget
_HARD_MAX_DEPTH = 4
_HARD_TIME_S = 1.0

_PIECE_VALUE = {            # simple values used by easy / medium
    chess.PAWN: 1, chess.KNIGHT: 3, chess.BISHOP: 3,
    chess.ROOK: 5, chess.QUEEN: 9, chess.KING: 0,
}
_CP = {                     # centipawns used by the search
    chess.PAWN: 100, chess.KNIGHT: 320, chess.BISHOP: 330,
    chess.ROOK: 500, chess.QUEEN: 900, chess.KING: 0,
}
_MATE = 100000


# ── Difficulty state ──────────────────────────────────────
def set_difficulty(level):
    global _current
    if level in LEVELS:
        _current = level


def get_difficulty():
    return _current


# ── Entry point ───────────────────────────────────────────
def get_best_move(board, difficulty=None):
    """Return a chess.Move for the side to play, or None if no legal moves."""
    legal = list(board.legal_moves)
    if not legal:
        return None
    level = difficulty or _current
    if level == "easy":
        return _easy(board, legal)
    if level == "hard":
        return _hard(board, legal)
    return _medium(board, legal)


# ── Easy ──────────────────────────────────────────────────
def _easy(board, legal):
    if random.random() < 0.25:
        caps = [m for m in legal if board.is_capture(m)]
        if caps:
            return random.choice(caps)
    return random.choice(legal)


# ── Medium (original behaviour) ───────────────────────────
def _medium(board, legal):
    for move in legal:
        board.push(move)
        is_mate = board.is_checkmate()
        board.pop()
        if is_mate:
            return move

    captures = []
    for move in legal:
        victim = board.piece_at(move.to_square)
        if victim is not None:
            captures.append((move, _PIECE_VALUE.get(victim.piece_type, 0)))
        elif board.is_en_passant(move):
            captures.append((move, _PIECE_VALUE[chess.PAWN]))

    if captures:
        best_val = max(v for _, v in captures)
        return random.choice([m for m, v in captures if v == best_val])

    return random.choice(legal)


# ── Hard ──────────────────────────────────────────────────
class _Timeout(Exception):
    pass


def _static_eval(board):
    """Material + small positional terms, from the side-to-move's view."""
    score = 0
    turn = board.turn
    for sq, piece in board.piece_map().items():
        f = chess.square_file(sq)
        r = chess.square_rank(sq)
        centre = (3.5 - abs(f - 3.5)) + (3.5 - abs(r - 3.5))   # 0..7
        val = _CP[piece.piece_type]
        pt = piece.piece_type
        if pt in (chess.KNIGHT, chess.BISHOP):
            val += centre * 5
        elif pt == chess.PAWN:
            progress = r if piece.color == chess.WHITE else 7 - r
            val += progress * 6 + centre * 2
        elif pt == chess.QUEEN:
            val += centre
        score += val if piece.color == turn else -val
    return score


def _move_key(board, move, first):
    s = 0
    if first is not None and move == first:
        s += 10 ** 6
    if board.is_capture(move):
        victim = board.piece_at(move.to_square)
        attacker = board.piece_at(move.from_square)
        v = _CP[victim.piece_type] if victim else 100
        a = _CP[attacker.piece_type] if attacker else 0
        s += 1000 + 10 * v - a // 10
    if move.promotion:
        s += 800
    return -s


def _quiesce(board, alpha, beta, deadline, qdepth):
    if time.time() > deadline:
        raise _Timeout
    stand = _static_eval(board)
    if stand >= beta:
        return stand
    if stand > alpha:
        alpha = stand
    if qdepth <= 0:
        return alpha
    caps = [m for m in board.legal_moves if board.is_capture(m)]
    caps.sort(key=lambda m: _move_key(board, m, None))
    for m in caps:
        board.push(m)
        try:
            score = -_quiesce(board, -beta, -alpha, deadline, qdepth - 1)
        finally:
            board.pop()
        if score >= beta:
            return score
        if score > alpha:
            alpha = score
    return alpha


def _negamax(board, depth, alpha, beta, ply, deadline):
    if time.time() > deadline:
        raise _Timeout
    moves = list(board.legal_moves)
    if not moves:
        return (-_MATE + ply) if board.is_check() else 0
    if board.is_insufficient_material():
        return 0
    if depth <= 0:
        return _quiesce(board, alpha, beta, deadline, 4)

    moves.sort(key=lambda m: _move_key(board, m, None))
    best = -_MATE - 1
    for m in moves:
        board.push(m)
        try:
            score = -_negamax(board, depth - 1, -beta, -alpha, ply + 1, deadline)
        finally:
            board.pop()
        if score > best:
            best = score
        if best > alpha:
            alpha = best
        if alpha >= beta:
            break
    return best


def _hard(board, legal):
    deadline = time.time() + _HARD_TIME_S
    best_move = random.choice(legal)
    first = None

    for depth in range(1, _HARD_MAX_DEPTH + 1):
        try:
            cur_move, cur_noisy, cur_real = None, -float("inf"), -_MATE - 1
            alpha, beta = -_MATE - 1, _MATE + 1
            for m in sorted(legal, key=lambda mv: _move_key(board, mv, first)):
                board.push(m)
                try:
                    score = -_negamax(board, depth - 1, -beta, -alpha, 1, deadline)
                finally:
                    board.pop()
                noisy = score + random.random() * 3      # break ties variably
                if noisy > cur_noisy:
                    cur_move, cur_noisy, cur_real = m, noisy, score
                if score > alpha:
                    alpha = score
            best_move = first = cur_move
            if cur_real > _MATE - 100:                    # forced mate found
                break
        except _Timeout:
            break
    return best_move
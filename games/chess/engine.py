"""
Chess Engine — Game-state wrapper over python-chess.

All chess rules, move validation, and game-state management are delegated
to the `chess` library.  This module adds only the game-level abstractions
the UI needs (selected square tracking, captured-piece lists, etc.).
"""

import chess
import random


class ChessEngine:
    """Thin wrapper around chess.Board for the Pygame UI."""

    def __init__(self):
        self.board = chess.Board()
        self.captured_white = []  # white pieces captured (by black)
        self.captured_black = []  # black pieces captured (by white)

    # ── Queries ────────────────────────────────────

    @property
    def turn(self):
        """Return chess.WHITE or chess.BLACK."""
        return self.board.turn

    @property
    def is_check(self):
        return self.board.is_check()

    @property
    def is_game_over(self):
        return self.board.is_game_over()

    @property
    def outcome_message(self):
        """Human-readable outcome, or None if game is still going."""
        if not self.board.is_game_over():
            return None
        outcome = self.board.outcome()
        if outcome is None:
            return "Game Over"
        if outcome.winner is None:
            # Draw — provide reason
            if self.board.is_stalemate():
                return "Stalemate — Draw!"
            if self.board.is_insufficient_material():
                return "Insufficient Material — Draw!"
            if self.board.can_claim_threefold_repetition():
                return "Threefold Repetition — Draw!"
            if self.board.can_claim_fifty_moves():
                return "50-Move Rule — Draw!"
            return "Draw!"
        winner = "White" if outcome.winner == chess.WHITE else "Black"
        return f"Checkmate — {winner} Wins!"

    def legal_moves_from(self, square):
        """Return list of chess.Move objects originating from *square*."""
        return [m for m in self.board.legal_moves if m.from_square == square]

    def legal_target_squares(self, square):
        """Return set of destination squares for moves from *square*."""
        return {m.to_square for m in self.legal_moves_from(square)}

    def piece_at(self, square):
        """Return chess.Piece at *square*, or None."""
        return self.board.piece_at(square)

    def king_square(self, color):
        """Return the square of the king for *color*, or None."""
        return self.board.king(color)

    def is_promotion_move(self, from_sq, to_sq):
        """Check if moving from from_sq to to_sq would be a pawn promotion."""
        piece = self.board.piece_at(from_sq)
        if piece is None or piece.piece_type != chess.PAWN:
            return False
        rank = chess.square_rank(to_sq)
        return (piece.color == chess.WHITE and rank == 7) or \
               (piece.color == chess.BLACK and rank == 0)

    # ── Actions ────────────────────────────────────

    def try_move(self, from_sq, to_sq, promotion=None):
        """
        Attempt a move.  Returns True on success, False if illegal.

        *promotion* should be a chess piece type (e.g. chess.QUEEN) when
        promoting a pawn, or None otherwise.
        """
        move = chess.Move(from_sq, to_sq, promotion=promotion)
        if move not in self.board.legal_moves:
            return False

        # Track captures
        captured = self.board.piece_at(to_sq)
        # En passant: captured pawn isn't on the destination square
        if captured is None and self.board.is_en_passant(move):
            captured = chess.Piece(chess.PAWN, not self.board.turn)

        if captured:
            if captured.color == chess.WHITE:
                self.captured_white.append(captured)
            else:
                self.captured_black.append(captured)

        self.board.push(move)
        return True

    def reset(self):
        """Reset to starting position."""
        self.board.reset()
        self.captured_white.clear()
        self.captured_black.clear()

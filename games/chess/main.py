"""
Chess Game — Pygame entry point and game controller.

Player (White) plays against a simple AI (Black).
All chess rules are handled by the python-chess library via engine.py.
Rendering is handled by renderer.py.

Controls:
    Mouse click  — select piece / make move
    R            — restart game
    U            — undo last move pair (player + AI)
    Q / Escape   — quit
"""

import pygame
import sys
import chess

from engine import ChessEngine
from renderer import (
    WINDOW_W, WINDOW_H, BOARD_PX, FPS, CELL_SIZE,
    init as init_renderer,
    px_to_square,
    draw_board,
    draw_last_move,
    draw_highlights,
    draw_check_indicator,
    draw_pieces,
    draw_panel,
    draw_game_over,
    draw_promotion_dialog,
)
from ai import get_best_move


class ChessGame:
    """Main game controller — handles input, game flow, and rendering."""

    def __init__(self):
        pygame.init()
        pygame.display.set_caption('Chess \u2014 Olos Gaming')
        self.screen = pygame.display.set_mode((WINDOW_W, WINDOW_H))
        self.clock  = pygame.time.Clock()

        init_renderer()

        self.engine = ChessEngine()
        self._reset_ui_state()

        # AI delay: after the player moves, wait a short time before AI responds
        self.ai_delay_ms     = 300
        self.ai_move_pending = False
        self.ai_move_time    = 0

    def _reset_ui_state(self):
        """Reset UI-only state (selection, promotion, etc.)."""
        self.selected_square  = None
        self.legal_targets    = set()
        self.promotion_pending = False
        self.promotion_from   = None
        self.promotion_to     = None
        self.promotion_rects  = []
        self.last_move        = None
        self.ai_move_pending  = False

    def reset(self):
        """Full game reset."""
        self.engine.reset()
        self._reset_ui_state()

    # ── Input handling ────────────────────────────

    def handle_click(self, mx, my):
        """Process a mouse click at pixel (mx, my)."""
        # If promotion dialog is open, handle that first
        if self.promotion_pending:
            self._handle_promotion_click(mx, my)
            return

        # Ignore clicks while AI is thinking or game is over
        if self.ai_move_pending or self.engine.is_game_over:
            return

        # Ignore clicks outside the board
        square = px_to_square(mx, my)
        if square is None:
            return

        # Only allow input on the player's turn (White)
        if self.engine.turn != chess.WHITE:
            return

        piece = self.engine.piece_at(square)

        # Clicking on own piece → select it
        if piece and piece.color == chess.WHITE:
            self.selected_square = square
            self.legal_targets = self.engine.legal_target_squares(square)
            return

        # Clicking a legal target → attempt move
        if self.selected_square is not None and square in self.legal_targets:
            self._attempt_move(self.selected_square, square)
            return

        # Clicking elsewhere → deselect
        self.selected_square = None
        self.legal_targets = set()

    def _attempt_move(self, from_sq, to_sq):
        """Try to execute a move, handling promotion if needed."""
        if self.engine.is_promotion_move(from_sq, to_sq):
            # Open promotion dialog
            self.promotion_pending = True
            self.promotion_from = from_sq
            self.promotion_to = to_sq
            return

        success = self.engine.try_move(from_sq, to_sq)
        if success:
            self.last_move = chess.Move(from_sq, to_sq)
            self._after_move()

    def _handle_promotion_click(self, mx, my):
        """Handle click within the promotion dialog."""
        for rect, piece_type in self.promotion_rects:
            if rect.collidepoint(mx, my):
                success = self.engine.try_move(
                    self.promotion_from, self.promotion_to,
                    promotion=piece_type
                )
                if success:
                    self.last_move = chess.Move(
                        self.promotion_from, self.promotion_to,
                        promotion=piece_type
                    )
                self.promotion_pending = False
                self.promotion_from = None
                self.promotion_to = None
                self.promotion_rects = []
                if success:
                    self._after_move()
                return

    def _after_move(self):
        """Called after every successful move — clear selection, schedule AI."""
        self.selected_square = None
        self.legal_targets = set()

        # If game is not over and it's Black's turn, schedule AI move
        if not self.engine.is_game_over and self.engine.turn == chess.BLACK:
            self.ai_move_pending = True
            self.ai_move_time = pygame.time.get_ticks() + self.ai_delay_ms

    def _try_ai_move(self):
        """Execute the AI's move if the delay has elapsed."""
        if not self.ai_move_pending:
            return
        if pygame.time.get_ticks() < self.ai_move_time:
            return

        self.ai_move_pending = False
        move = get_best_move(self.engine.board)
        if move is None:
            return

        # Track captures for the engine's captured lists
        self.engine.try_move(move.from_square, move.to_square,
                             promotion=move.promotion)
        self.last_move = move

    def handle_undo(self):
        """Undo the last move pair (AI + player) so it's the player's turn."""
        # Need at least 2 moves to undo a full pair
        if len(self.engine.board.move_stack) >= 2:
            self.engine.board.pop()  # undo AI move
            self.engine.board.pop()  # undo player move
            # Rebuild captured lists from scratch (simplest correct approach)
            self._rebuild_captured()
            self._reset_ui_state()
        elif len(self.engine.board.move_stack) == 1:
            self.engine.board.pop()
            self._rebuild_captured()
            self._reset_ui_state()

    def _rebuild_captured(self):
        """Rebuild captured piece lists by replaying the move stack."""
        moves = list(self.engine.board.move_stack)
        self.engine.captured_white.clear()
        self.engine.captured_black.clear()

        replay = chess.Board()
        for move in moves:
            captured = replay.piece_at(move.to_square)
            if captured is None and replay.is_en_passant(move):
                captured = chess.Piece(chess.PAWN, not replay.turn)
            if captured:
                if captured.color == chess.WHITE:
                    self.engine.captured_white.append(captured)
                else:
                    self.engine.captured_black.append(captured)
            replay.push(move)

    # ── Rendering ─────────────────────────────────

    def render(self):
        """Draw the full game frame."""
        self.screen.fill((18, 18, 30))

        draw_board(self.screen)

        # Last move highlight
        draw_last_move(self.screen, self.last_move)

        # Check indicator
        if self.engine.is_check and not self.engine.is_game_over:
            king_sq = self.engine.king_square(self.engine.turn)
            draw_check_indicator(self.screen, king_sq)

        # Selected piece and legal moves
        if self.selected_square is not None and not self.promotion_pending:
            draw_highlights(self.screen, self.legal_targets, self.selected_square)

        # Pieces
        draw_pieces(self.screen, self.engine.board)

        # Side panel
        status = None
        if self.ai_move_pending:
            status = 'AI is thinking...'
        draw_panel(self.screen, self.engine, status)

        # Overlays
        if self.promotion_pending:
            self.promotion_rects = draw_promotion_dialog(
                self.screen, chess.WHITE
            )
        elif self.engine.is_game_over:
            msg = self.engine.outcome_message or 'Game Over'
            draw_game_over(self.screen, msg)

        pygame.display.flip()

    # ── Main loop ─────────────────────────────────

    def run(self):
        """Main game loop."""
        while True:
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    pygame.quit()
                    sys.exit()

                if event.type == pygame.KEYDOWN:
                    if event.key in (pygame.K_q, pygame.K_ESCAPE):
                        pygame.quit()
                        sys.exit()
                    if event.key == pygame.K_r:
                        self.reset()
                    if event.key == pygame.K_u:
                        self.handle_undo()

                if event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
                    self.handle_click(*event.pos)

            # AI move (non-blocking with delay)
            self._try_ai_move()

            self.render()
            self.clock.tick(FPS)


# ──────────────────────────────────────────────
# Entry point
# ──────────────────────────────────────────────
def main():
    game = ChessGame()
    game.run()


if __name__ == '__main__':
    main()

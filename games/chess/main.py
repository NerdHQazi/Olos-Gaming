"""
Chess Game — Pygame entry point and game controller.

The human plays the side chosen in the panel ("Play as" White / Black); the
AI plays the other side.  White always moves first, so when the human plays
Black the AI makes the opening move.  AI strength is set with the
Easy / Medium / Hard buttons.

All chess rules are handled by the python-chess library via engine.py.
Rendering is handled by renderer.py.

Controls:
    Mouse click  — select piece / make move / use panel buttons
    R            — restart game (same side)
    U            — undo your last move (and the AI's reply)
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
    handle_panel_click,
    get_player_color,
)
from ai import get_best_move

BG_COLOR = (3, 6, 13)


class ChessGame:
    """Main game controller — handles input, game flow, and rendering."""

    def __init__(self):
        pygame.init()
        pygame.display.set_caption('Chess — Olos Gaming')
        self.screen = pygame.display.set_mode((WINDOW_W, WINDOW_H))
        self.clock  = pygame.time.Clock()

        init_renderer()

        self.engine = ChessEngine()

        # AI delay: wait a short time before the AI replies
        self.ai_delay_ms     = 300
        self.ai_move_pending = False
        self.ai_move_time    = 0

        self._reset_ui_state()
        self._maybe_schedule_ai()      # AI opens the game if the human is Black

    # ── Sides ─────────────────────────────────────

    @property
    def player_color(self):
        """The side the human controls (chosen in the panel)."""
        return get_player_color()

    @property
    def ai_color(self):
        return not self.player_color

    def _reset_ui_state(self):
        """Reset UI-only state (selection, promotion, etc.)."""
        self.selected_square   = None
        self.legal_targets     = set()
        self.promotion_pending = False
        self.promotion_from    = None
        self.promotion_to      = None
        self.promotion_rects   = []
        self.last_move         = None
        self.ai_move_pending   = False

    def _maybe_schedule_ai(self):
        """If it's the AI's turn and the game is still on, queue its move."""
        if self.engine.is_game_over:
            return
        if self.engine.turn == self.ai_color:
            self.ai_move_pending = True
            self.ai_move_time = pygame.time.get_ticks() + self.ai_delay_ms

    def reset(self):
        """Start a new game (keeps the chosen side)."""
        self.engine.reset()
        self._reset_ui_state()
        self._maybe_schedule_ai()

    # ── Input handling ────────────────────────────

    def handle_click(self, mx, my):
        """Process a mouse click at pixel (mx, my)."""
        # Panel buttons (difficulty / play-as)
        action = handle_panel_click(mx, my)
        if action is not None:
            if action == 'side':
                self.reset()           # new side => new game, White moves first
            return

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

        # Only allow input on the human's turn
        if self.engine.turn != self.player_color:
            return

        piece = self.engine.piece_at(square)

        # Clicking on own piece -> select it
        if piece and piece.color == self.player_color:
            self.selected_square = square
            self.legal_targets = self.engine.legal_target_squares(square)
            return

        # Clicking a legal target -> attempt move
        if self.selected_square is not None and square in self.legal_targets:
            self._attempt_move(self.selected_square, square)
            return

        # Clicking elsewhere -> deselect
        self.selected_square = None
        self.legal_targets = set()

    def _attempt_move(self, from_sq, to_sq):
        """Try to execute a move, handling promotion if needed."""
        if self.engine.is_promotion_move(from_sq, to_sq):
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
        """Called after every successful human move — clear selection, queue AI."""
        self.selected_square = None
        self.legal_targets = set()
        self._maybe_schedule_ai()

    def _try_ai_move(self):
        """Execute the AI's move if the delay has elapsed."""
        if not self.ai_move_pending:
            return
        if pygame.time.get_ticks() < self.ai_move_time:
            return

        self.ai_move_pending = False
        if self.engine.is_game_over or self.engine.turn != self.ai_color:
            return
        move = get_best_move(self.engine.board)
        if move is None:
            return

        self.engine.try_move(move.from_square, move.to_square,
                             promotion=move.promotion)
        self.last_move = move

    def handle_undo(self):
        """Take back the human's last move (and the AI reply, if it was made)."""
        stack = self.engine.board.move_stack
        if not stack:
            return
        # Human to move  -> AI replied last: undo AI reply + human move (2)
        # AI to move     -> human just moved, AI hasn't answered yet: undo 1
        pops = 2 if self.engine.turn == self.player_color else 1
        for _ in range(min(pops, len(stack))):
            self.engine.board.pop()
        self._rebuild_captured()
        self._reset_ui_state()
        self._maybe_schedule_ai()      # e.g. human is Black and we're back at move 0

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
        self.screen.fill(BG_COLOR)

        draw_board(self.screen)
        draw_last_move(self.screen, self.last_move)

        if self.engine.is_check and not self.engine.is_game_over:
            king_sq = self.engine.king_square(self.engine.turn)
            draw_check_indicator(self.screen, king_sq)

        if self.selected_square is not None and not self.promotion_pending:
            draw_highlights(self.screen, self.legal_targets, self.selected_square)

        draw_pieces(self.screen, self.engine.board)

        status = 'AI is thinking...' if self.ai_move_pending else None
        draw_panel(self.screen, self.engine, status)

        if self.promotion_pending:
            self.promotion_rects = draw_promotion_dialog(
                self.screen, self.player_color
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
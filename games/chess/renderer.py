"""
Chess Renderer — All Pygame drawing for the chess game.

Draws the board, pieces, highlights, side panel, promotion dialog,
and game-over overlay.  Pieces are rendered using Unicode chess symbols
with a reliable system font; a letter-based fallback is used if the font
cannot render them.
"""

import pygame
import chess

# ──────────────────────────────────────────────
# Layout constants
# ──────────────────────────────────────────────
BOARD_SIZE   = 8
CELL_SIZE    = 80
PANEL_W      = 220
BOARD_PX     = BOARD_SIZE * CELL_SIZE          # 640
WINDOW_W     = BOARD_PX + PANEL_W              # 860
WINDOW_H     = BOARD_PX                        # 640
FPS          = 60

# ──────────────────────────────────────────────
# Colors  (matching checkers game palette)
# ──────────────────────────────────────────────
C_BG          = (18,  18,  30)
C_LIGHT_SQ    = (238, 214, 175)
C_DARK_SQ     = (184, 135,  98)
C_HIGHLIGHT   = (106, 200, 100, 180)
C_SELECT      = (255, 220,  50, 200)
C_CHECK       = (220,  50,  50, 160)
C_LAST_MOVE   = (170, 162, 58, 120)
C_PANEL_BG    = (28,  28,  46)
C_TEXT        = (230, 230, 255)
C_ACCENT      = (106, 200, 100)
C_WHITE_TEXT  = (240, 240, 255)
C_BLACK_TEXT  = (130, 160, 255)
C_OVERLAY     = (10,  10,  20, 210)

# Piece colors for programmatic drawing
C_WHITE_PIECE = (255, 255, 240)
C_BLACK_PIECE = (40,  40,  40)
C_WHITE_OUTLINE = (60,  60,  60)
C_BLACK_OUTLINE = (200, 200, 200)

# ──────────────────────────────────────────────
# Unicode chess symbols
# ──────────────────────────────────────────────
UNICODE_PIECES = {
    (chess.KING,   chess.WHITE): '♔',
    (chess.QUEEN,  chess.WHITE): '♕',
    (chess.ROOK,   chess.WHITE): '♖',
    (chess.BISHOP, chess.WHITE): '♗',
    (chess.KNIGHT, chess.WHITE): '♘',
    (chess.PAWN,   chess.WHITE): '♙',
    (chess.KING,   chess.BLACK): '♚',
    (chess.QUEEN,  chess.BLACK): '♛',
    (chess.ROOK,   chess.BLACK): '♜',
    (chess.BISHOP, chess.BLACK): '♝',
    (chess.KNIGHT, chess.BLACK): '♞',
    (chess.PAWN,   chess.BLACK): '♟',
}

# Fallback letters if Unicode rendering fails
LETTER_PIECES = {
    chess.KING:   'K',
    chess.QUEEN:  'Q',
    chess.ROOK:   'R',
    chess.BISHOP: 'B',
    chess.KNIGHT: 'N',
    chess.PAWN:   'P',
}

# Piece values for display ordering
PIECE_VALUES = {
    chess.PAWN: 1, chess.KNIGHT: 3, chess.BISHOP: 3,
    chess.ROOK: 5, chess.QUEEN: 9,
}

# Promotion options
PROMOTION_PIECES = [chess.QUEEN, chess.ROOK, chess.BISHOP, chess.KNIGHT]


# ──────────────────────────────────────────────
# Font initialization
# ──────────────────────────────────────────────
_piece_font = None
_use_unicode = False
_ui_fonts = {}


def _init_fonts():
    """Initialise fonts and test whether Unicode chess symbols render."""
    global _piece_font, _use_unicode, _ui_fonts

    # UI fonts (matching checkers: consolas)
    _ui_fonts['big']   = pygame.font.SysFont('consolas', 22, bold=True)
    _ui_fonts['med']   = pygame.font.SysFont('consolas', 17)
    _ui_fonts['small'] = pygame.font.SysFont('consolas', 14)

    # Try several fonts known to support chess Unicode on Windows / Linux / Mac
    candidates = ['segoeuisymbol', 'segoe ui symbol', 'arial unicode ms',
                  'dejavusans', 'noto sans', 'symbola', None]

    for name in candidates:
        try:
            font = pygame.font.SysFont(name, 48) if name else pygame.font.Font(None, 48)
            # Render a test glyph and check it actually produces pixels
            test_surf = font.render('♞', True, (0, 0, 0))
            if test_surf.get_width() > 8 and test_surf.get_height() > 8:
                # Additional check: make sure it's not a blank/tofu box
                # by checking that pixels vary (not all one color)
                _piece_font = font
                _use_unicode = True
                return
        except Exception:
            continue

    # Fallback: use a bold consolas font with letter codes
    _piece_font = pygame.font.SysFont('consolas', 36, bold=True)
    _use_unicode = False


def init():
    """Call once after pygame.init() to set up renderer fonts."""
    _init_fonts()


# ──────────────────────────────────────────────
# Coordinate helpers
# ──────────────────────────────────────────────
def _square_to_px(square):
    """Convert a chess.Square (0-63) to pixel (x, y) of the cell top-left.

    Board is drawn with White at the bottom (rank 1 = row 7 on screen).
    """
    file = chess.square_file(square)  # 0=a .. 7=h
    rank = chess.square_rank(square)  # 0=rank1 .. 7=rank8
    x = file * CELL_SIZE
    y = (7 - rank) * CELL_SIZE
    return x, y


def px_to_square(mx, my):
    """Convert pixel (mx, my) to a chess.Square, or None if outside board."""
    if mx < 0 or mx >= BOARD_PX or my < 0 or my >= WINDOW_H:
        return None
    col = mx // CELL_SIZE
    row = my // CELL_SIZE
    rank = 7 - row
    return chess.square(col, rank)


# ──────────────────────────────────────────────
# Drawing functions
# ──────────────────────────────────────────────
def draw_board(surface):
    """Draw the 8x8 board squares."""
    for row in range(BOARD_SIZE):
        for col in range(BOARD_SIZE):
            color = C_LIGHT_SQ if (row + col) % 2 == 0 else C_DARK_SQ
            pygame.draw.rect(surface, color,
                             (col * CELL_SIZE, row * CELL_SIZE,
                              CELL_SIZE, CELL_SIZE))


def draw_last_move(surface, last_move):
    """Highlight the from/to squares of the last move."""
    if last_move is None:
        return
    hl = pygame.Surface((CELL_SIZE, CELL_SIZE), pygame.SRCALPHA)
    hl.fill(C_LAST_MOVE)
    for sq in (last_move.from_square, last_move.to_square):
        x, y = _square_to_px(sq)
        surface.blit(hl, (x, y))


def draw_highlights(surface, target_squares, selected_square):
    """Highlight the selected piece and its legal destination squares."""
    # Selected square highlight
    if selected_square is not None:
        sel = pygame.Surface((CELL_SIZE, CELL_SIZE), pygame.SRCALPHA)
        sel.fill(C_SELECT)
        x, y = _square_to_px(selected_square)
        surface.blit(sel, (x, y))

    # Legal move dots
    for sq in target_squares:
        x, y = _square_to_px(sq)
        cx = x + CELL_SIZE // 2
        cy = y + CELL_SIZE // 2
        # Semi-transparent circle
        dot_surf = pygame.Surface((CELL_SIZE, CELL_SIZE), pygame.SRCALPHA)
        pygame.draw.circle(dot_surf, C_HIGHLIGHT,
                           (CELL_SIZE // 2, CELL_SIZE // 2), 12)
        surface.blit(dot_surf, (x, y))


def draw_check_indicator(surface, king_square):
    """Draw a red highlight behind the king that is in check."""
    if king_square is None:
        return
    hl = pygame.Surface((CELL_SIZE, CELL_SIZE), pygame.SRCALPHA)
    hl.fill(C_CHECK)
    x, y = _square_to_px(king_square)
    surface.blit(hl, (x, y))


def draw_pieces(surface, board):
    """Draw all pieces on the board."""
    for square in chess.SQUARES:
        piece = board.piece_at(square)
        if piece is None:
            continue
        x, y = _square_to_px(square)
        _draw_single_piece(surface, piece, x, y)


def _draw_single_piece(surface, piece, x, y):
    """Draw a single piece at pixel position (x, y)."""
    cx = x + CELL_SIZE // 2
    cy = y + CELL_SIZE // 2

    if _use_unicode:
        symbol = UNICODE_PIECES.get((piece.piece_type, piece.color), '?')
        txt = _piece_font.render(symbol, True, C_WHITE_PIECE if piece.color == chess.WHITE
                                 else C_BLACK_PIECE)
        # Center the text in the cell
        surface.blit(txt, (cx - txt.get_width() // 2,
                           cy - txt.get_height() // 2))
    else:
        # Fallback: colored circle with letter
        radius = CELL_SIZE // 2 - 6
        fill = C_WHITE_PIECE if piece.color == chess.WHITE else C_BLACK_PIECE
        outline = C_WHITE_OUTLINE if piece.color == chess.WHITE else C_BLACK_OUTLINE
        pygame.draw.circle(surface, fill, (cx, cy), radius)
        pygame.draw.circle(surface, outline, (cx, cy), radius, 2)

        letter = LETTER_PIECES.get(piece.piece_type, '?')
        txt_color = C_BLACK_PIECE if piece.color == chess.WHITE else C_WHITE_PIECE
        txt = _piece_font.render(letter, True, txt_color)
        surface.blit(txt, (cx - txt.get_width() // 2,
                           cy - txt.get_height() // 2))


# ──────────────────────────────────────────────
# Side panel
# ──────────────────────────────────────────────
def draw_panel(surface, engine, game_status):
    """Draw the info panel on the right side of the board."""
    px = BOARD_PX
    pygame.draw.rect(surface, C_PANEL_BG, (px, 0, PANEL_W, WINDOW_H))

    def blit(text, font_key, color, y, center=True):
        font = _ui_fonts[font_key]
        surf = font.render(text, True, color)
        x = px + (PANEL_W - surf.get_width()) // 2 if center else px + 12
        surface.blit(surf, (x, y))

    # Title
    blit('CHESS', 'big', C_ACCENT, 20)
    pygame.draw.line(surface, C_ACCENT, (px + 10, 52), (px + PANEL_W - 10, 52), 1)

    # Turn indicator
    turn_label = 'White' if engine.turn == chess.WHITE else 'Black'
    turn_color = C_WHITE_TEXT if engine.turn == chess.WHITE else C_BLACK_TEXT
    blit('Current Turn', 'med', C_TEXT, 72)
    blit(f'\u25b6  {turn_label}', 'big', turn_color, 96)

    # Check warning
    if engine.is_check and not engine.is_game_over:
        blit('CHECK!', 'big', (220, 50, 50), 128)

    # Captured pieces
    pygame.draw.line(surface, (60, 60, 80), (px + 10, 158), (px + PANEL_W - 10, 158), 1)
    blit('Captured', 'med', C_TEXT, 168)

    # White pieces captured (by black)
    _draw_captured_list(surface, engine.captured_white, px + 12, 192, chess.WHITE)
    # Black pieces captured (by white)
    _draw_captured_list(surface, engine.captured_black, px + 12, 224, chess.BLACK)

    # Move count
    pygame.draw.line(surface, (60, 60, 80), (px + 10, 260), (px + PANEL_W - 10, 260), 1)
    blit('Stats', 'med', C_TEXT, 270)
    fullmove = engine.board.fullmove_number
    blit(f'Move: {fullmove}', 'small', C_TEXT, 294, center=False)

    # Game status
    if game_status:
        pygame.draw.line(surface, (60, 60, 80), (px + 10, 320), (px + PANEL_W - 10, 320), 1)
        blit(game_status, 'small', (255, 180, 50), 334)

    # Controls
    pygame.draw.line(surface, (60, 60, 80),
                     (px + 10, WINDOW_H - 90), (px + PANEL_W - 10, WINDOW_H - 90), 1)
    blit('Controls', 'med', C_TEXT, WINDOW_H - 80)
    blit('[R] Restart', 'small', (160, 160, 180), WINDOW_H - 56, center=False)
    blit('[U] Undo', 'small', (160, 160, 180), WINDOW_H - 38, center=False)
    blit('[Q] Quit', 'small', (160, 160, 180), WINDOW_H - 20, center=False)


def _draw_captured_list(surface, pieces, x, y, color):
    """Draw a row of small captured-piece symbols."""
    if not pieces:
        return
    # Sort by value descending
    sorted_pieces = sorted(pieces, key=lambda p: PIECE_VALUES.get(p.piece_type, 0),
                           reverse=True)
    small_font = pygame.font.SysFont('consolas', 14)
    symbols = []
    for p in sorted_pieces:
        if _use_unicode:
            symbols.append(UNICODE_PIECES.get((p.piece_type, p.color), '?'))
        else:
            symbols.append(LETTER_PIECES.get(p.piece_type, '?'))

    text = ' '.join(symbols)
    txt_color = (200, 200, 220) if color == chess.WHITE else (120, 140, 200)
    surf = small_font.render(text, True, txt_color)
    surface.blit(surf, (x, y))


# ──────────────────────────────────────────────
# Game-over overlay
# ──────────────────────────────────────────────
def draw_game_over(surface, message):
    """Draw a semi-transparent overlay with the game result."""
    overlay = pygame.Surface((WINDOW_W, WINDOW_H), pygame.SRCALPHA)
    overlay.fill(C_OVERLAY)
    surface.blit(overlay, (0, 0))

    f_title = pygame.font.SysFont('consolas', 36, bold=True)
    f_sub   = pygame.font.SysFont('consolas', 22)
    f_hint  = pygame.font.SysFont('consolas', 18)

    cx, cy = WINDOW_W // 2, WINDOW_H // 2

    # Result message
    t = f_title.render(message, True, C_ACCENT)
    surface.blit(t, (cx - t.get_width() // 2, cy - 70))

    s = f_sub.render('Game Over', True, C_TEXT)
    surface.blit(s, (cx - s.get_width() // 2, cy - 10))

    h1 = f_hint.render('[R] Play Again', True, C_ACCENT)
    h2 = f_hint.render('[Q] Quit', True, (180, 180, 200))
    surface.blit(h1, (cx - h1.get_width() // 2, cy + 40))
    surface.blit(h2, (cx - h2.get_width() // 2, cy + 70))


# ──────────────────────────────────────────────
# Promotion dialog
# ──────────────────────────────────────────────
def draw_promotion_dialog(surface, color):
    """Draw a piece-selection dialog for pawn promotion.

    Returns a list of (rect, piece_type) for click detection.
    """
    overlay = pygame.Surface((WINDOW_W, WINDOW_H), pygame.SRCALPHA)
    overlay.fill((0, 0, 0, 150))
    surface.blit(overlay, (0, 0))

    box_w = 320
    box_h = 120
    box_x = (BOARD_PX - box_w) // 2
    box_y = (WINDOW_H - box_h) // 2

    # Background box
    pygame.draw.rect(surface, C_PANEL_BG, (box_x, box_y, box_w, box_h),
                     border_radius=8)
    pygame.draw.rect(surface, C_ACCENT, (box_x, box_y, box_w, box_h),
                     2, border_radius=8)

    # Title
    title_font = pygame.font.SysFont('consolas', 16, bold=True)
    title = title_font.render('Promote pawn to:', True, C_TEXT)
    surface.blit(title, (box_x + (box_w - title.get_width()) // 2, box_y + 8))

    # Piece options
    option_rects = []
    cell = 60
    start_x = box_x + (box_w - len(PROMOTION_PIECES) * cell) // 2
    start_y = box_y + 40

    for i, pt in enumerate(PROMOTION_PIECES):
        rx = start_x + i * cell
        ry = start_y
        rect = pygame.Rect(rx, ry, cell, cell)
        option_rects.append((rect, pt))

        # Hover-style background
        pygame.draw.rect(surface, (50, 50, 70), rect, border_radius=4)
        pygame.draw.rect(surface, C_ACCENT, rect, 1, border_radius=4)

        # Draw the piece
        piece = chess.Piece(pt, color)
        _draw_single_piece(surface, piece,
                           rx + (cell - CELL_SIZE) // 2,
                           ry + (cell - CELL_SIZE) // 2)

    return option_rects

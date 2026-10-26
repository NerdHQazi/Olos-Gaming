"""
Chess Renderer — All Pygame drawing for the chess game.

Look matches the Olos web UI: navy board (#222a3d / #151b28), Unicode chess
glyphs drawn as text (white #ffffff, black #94a3b8, 0.65 x cell size), cyan
(#20ceee) move dots, rounded board border.

Piece font search order (first one that has all 12 chess glyphs wins):
  1. assets/fonts/pieces.ttf            <- drop any font file here (needed for web builds)
  2. Segoe UI Symbol (Windows, or /mnt/c/Windows/Fonts from WSL)  <- same look as the site
  3. Apple Symbols / DejaVu Sans / Noto Sans Symbols2 / FreeSerif (Mac / Linux)
If none is found, pieces are drawn as vector shapes so they never show as boxes.

Public API used by main.py:
  init, px_to_square, draw_board, draw_last_move, draw_highlights,
  draw_check_indicator, draw_pieces, draw_panel, draw_game_over,
  draw_promotion_dialog, handle_panel_click,
  get_player_color, set_player_color
"""

import os

import pygame
import chess

from ai import LEVELS, get_difficulty, set_difficulty

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

BOARD_RADIUS = 16
GLYPH_PX     = int(CELL_SIZE * 0.65)           # same 0.65 factor as the web canvas
VECTOR_PX    = 64                              # fallback piece size

# ──────────────────────────────────────────────
# Colors (taken from the web UI)
# ──────────────────────────────────────────────
C_BG          = (3,   6,  13)       # #03060d
C_LIGHT_SQ    = (34,  42,  61)      # #222a3d
C_DARK_SQ     = (21,  27,  40)      # #151b28
C_BORDER      = (14,  70,  84)      # #20ceee at ~30 %
C_ACCENT      = (32, 206, 238)      # #20ceee
C_HIGHLIGHT   = (32, 206, 238, 255)
C_TARGET_TINT = (32, 206, 238, 34)
C_SELECT      = (234, 179,   8, 102)
C_CHECK       = (239,  68,  68, 115)
C_LAST_MOVE   = (32, 206, 238, 36)
C_PANEL_BG    = (8,   13,  28)     # #080d1c
C_TEXT        = (226, 232, 240)
C_MUTED       = (148, 163, 184)     # #94a3b8
C_WHITE_TEXT  = (255, 255, 255)
C_BLACK_TEXT  = (148, 163, 184)
C_OVERLAY     = (3,    6,  13, 220)
C_DIVIDER     = (34,  40,  58)
C_BTN         = (21,  26,  42)
C_BTN_TEXT_ON = (0,    0,   0)

C_WHITE_PIECE = (255, 255, 255)     # glyph colors, as on the web canvas
C_BLACK_PIECE = (148, 163, 184)

# Unicode glyphs (same table as the web UI)
GLYPHS = {
    (chess.KING,   chess.WHITE): '\u2654', (chess.QUEEN,  chess.WHITE): '\u2655',
    (chess.ROOK,   chess.WHITE): '\u2656', (chess.BISHOP, chess.WHITE): '\u2657',
    (chess.KNIGHT, chess.WHITE): '\u2658', (chess.PAWN,   chess.WHITE): '\u2659',
    (chess.KING,   chess.BLACK): '\u265a', (chess.QUEEN,  chess.BLACK): '\u265b',
    (chess.ROOK,   chess.BLACK): '\u265c', (chess.BISHOP, chess.BLACK): '\u265d',
    (chess.KNIGHT, chess.BLACK): '\u265e', (chess.PAWN,   chess.BLACK): '\u265f',
}

PIECE_VALUES = {
    chess.PAWN: 1, chess.KNIGHT: 3, chess.BISHOP: 3,
    chess.ROOK: 5, chess.QUEEN: 9,
}

PROMOTION_PIECES = [chess.QUEEN, chess.ROOK, chess.BISHOP, chess.KNIGHT]

# ──────────────────────────────────────────────
# Which side the human plays (White always moves first in chess)
# ──────────────────────────────────────────────
_player_color = chess.WHITE
_flipped = False


def get_player_color():
    return _player_color


def set_player_color(color):
    """Choose the human side; the board is drawn from that side's view."""
    global _player_color, _flipped
    _player_color = color
    _flipped = (color == chess.BLACK)


# ──────────────────────────────────────────────
# Fonts
# ──────────────────────────────────────────────
_font_cache = {}


def _font(size, bold=False):
    key = (size, bold)
    if key not in _font_cache:
        f = pygame.font.Font(None, size)
        f.set_bold(bold)
        _font_cache[key] = f
    return _font_cache[key]


_UI = {'big': (30, True), 'med': (23, False), 'small': (20, False)}

_HERE = os.path.dirname(os.path.abspath(__file__))
_piece_font_path = None          # path of the glyph font in use (None => vector fallback)
_glyph_font_cache = {}

_FONT_CANDIDATES = [
    os.path.join(_HERE, 'assets', 'fonts', 'pieces.ttf'),
    'C:/Windows/Fonts/seguisym.ttf',
    '/mnt/c/Windows/Fonts/seguisym.ttf',
    '/System/Library/Fonts/Apple Symbols.ttf',
    '/System/Library/Fonts/Supplemental/Apple Symbols.ttf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    '/usr/share/fonts/dejavu/DejaVuSans.ttf',
    '/usr/share/fonts/TTF/DejaVuSans.ttf',
    '/usr/share/fonts/truetype/noto/NotoSansSymbols2-Regular.ttf',
    '/usr/share/fonts/truetype/freefont/FreeSerif.ttf',
]


def _has_all_glyphs(font):
    try:
        return all(m is not None for m in font.metrics(''.join(GLYPHS.values())))
    except Exception:
        return False


def _find_piece_font():
    paths = list(_FONT_CANDIDATES)
    for name in ('segoeuisymbol', 'applesymbols', 'dejavusans', 'notosanssymbols2'):
        try:
            p = pygame.font.match_font(name)
        except Exception:
            p = None
        if p:
            paths.append(p)
    for p in paths:
        if os.path.isfile(p):
            try:
                if _has_all_glyphs(pygame.font.Font(p, 32)):
                    return p
            except Exception:
                continue
    return None


def _glyph_font(px):
    f = _glyph_font_cache.get(px)
    if f is None:
        f = pygame.font.Font(_piece_font_path, px)
        _glyph_font_cache[px] = f
    return f


# ──────────────────────────────────────────────
# Vector fallback pieces (used only when no glyph font exists, e.g. web builds)
# ──────────────────────────────────────────────
_W_PIECE = ((26, 33, 50),    (244, 246, 255), (244, 246, 255))
_B_PIECE = ((120, 136, 164), (196, 208, 228), (38, 46, 66))
_SS = 4
_big_cache = {}
_small_cache = {}


def _poly(s, k, pts, fill, stroke, w):
    sp = [(x * k, y * k) for x, y in pts]
    pygame.draw.polygon(s, fill, sp)
    pygame.draw.lines(s, stroke, True, sp, w)
    for p in sp:
        pygame.draw.circle(s, stroke, (round(p[0]), round(p[1])), w // 2)


def _circ(s, k, cx, cy, r, fill, stroke, w):
    c = (round(cx * k), round(cy * k))
    rr = round(r * k)
    pygame.draw.circle(s, fill, c, rr)
    pygame.draw.circle(s, stroke, c, rr, w)


def _ell(s, k, x, y, ww, hh, fill, stroke, w):
    r = pygame.Rect(round(x * k), round(y * k), round(ww * k), round(hh * k))
    pygame.draw.ellipse(s, fill, r)
    pygame.draw.ellipse(s, stroke, r, w)


def _line(s, k, a, b, color, w):
    pa = (a[0] * k, a[1] * k)
    pb = (b[0] * k, b[1] * k)
    pygame.draw.line(s, color, pa, pb, w)
    for p in (pa, pb):
        pygame.draw.circle(s, color, (round(p[0]), round(p[1])), w // 2)


_BASE = [(20, 91), (80, 91), (77, 82), (23, 82)]


def _draw_piece_shape(s, k, ptype, pal):
    fill, stroke, detail = pal
    w = max(2, int(2.6 * k))
    dw = max(2, int(1.8 * k))

    if ptype == chess.PAWN:
        _poly(s, k, [(41, 54), (59, 54), (67, 82), (33, 82)], fill, stroke, w)
        _poly(s, k, [(37, 49), (63, 49), (60, 56), (40, 56)], fill, stroke, w)
        _circ(s, k, 50, 33, 12, fill, stroke, w)
        _poly(s, k, _BASE, fill, stroke, w)
    elif ptype == chess.ROOK:
        _poly(s, k, [(36, 82), (64, 82), (61, 44), (39, 44)], fill, stroke, w)
        _poly(s, k, [(30, 44), (30, 18), (40, 18), (40, 25), (46, 25), (46, 18),
                     (54, 18), (54, 25), (60, 25), (60, 18), (70, 18), (70, 44)],
              fill, stroke, w)
        _line(s, k, (32, 52), (68, 52), detail, dw)
        _poly(s, k, _BASE, fill, stroke, w)
    elif ptype == chess.KNIGHT:
        _poly(s, k, [(26, 84), (76, 84), (74, 62), (70, 42), (62, 26), (52, 16),
                     (50, 8), (44, 16), (34, 26), (22, 44), (22, 52), (30, 58),
                     (38, 52), (46, 46), (36, 64), (30, 76)], fill, stroke, w)
        _circ(s, k, 45, 29, 2.6, detail, detail, 1)
        _line(s, k, (54, 22), (66, 50), detail, dw)
        _poly(s, k, _BASE, fill, stroke, w)
    elif ptype == chess.BISHOP:
        _poly(s, k, [(41, 82), (59, 82), (57, 56), (43, 56)], fill, stroke, w)
        _ell(s, k, 38, 18, 24, 38, fill, stroke, w)
        _poly(s, k, [(36, 54), (64, 54), (62, 61), (38, 61)], fill, stroke, w)
        _circ(s, k, 50, 13, 4.5, fill, stroke, w)
        _line(s, k, (45, 43), (55, 29), detail, dw)
        _poly(s, k, _BASE, fill, stroke, w)
    elif ptype == chess.QUEEN:
        _poly(s, k, [(36, 82), (64, 82), (69, 46), (31, 46)], fill, stroke, w)
        _poly(s, k, [(29, 48), (20, 22), (35, 36), (41, 16), (50, 34), (59, 16),
                     (65, 36), (80, 22), (71, 48)], fill, stroke, w)
        for cx, cy in ((20, 19), (41, 13), (59, 13), (80, 19)):
            _circ(s, k, cx, cy, 3.8, fill, stroke, w)
        _line(s, k, (33, 58), (67, 58), detail, dw)
        _poly(s, k, _BASE, fill, stroke, w)
    elif ptype == chess.KING:
        _poly(s, k, [(36, 82), (64, 82), (69, 46), (31, 46)], fill, stroke, w)
        _poly(s, k, [(30, 48), (28, 32), (40, 38), (50, 28), (60, 38), (72, 32),
                     (70, 48)], fill, stroke, w)
        _poly(s, k, [(47, 4), (53, 4), (53, 11), (60, 11), (60, 17), (53, 17),
                     (53, 28), (47, 28), (47, 17), (40, 17), (40, 11), (47, 11)],
              fill, stroke, w)
        _line(s, k, (33, 58), (67, 58), detail, dw)
        _poly(s, k, _BASE, fill, stroke, w)


def _vector_surface(ptype, color, size):
    key = ('v', ptype, color, size)
    surf = _small_cache.get(key)
    if surf is not None:
        return surf
    big = _big_cache.get((ptype, color))
    if big is None:
        side = VECTOR_PX * _SS
        big = pygame.Surface((side, side), pygame.SRCALPHA)
        _draw_piece_shape(big, side / 100.0, ptype,
                          _W_PIECE if color == chess.WHITE else _B_PIECE)
        _big_cache[(ptype, color)] = big
    surf = pygame.transform.smoothscale(big, (size, size))
    _small_cache[key] = surf
    return surf


# ──────────────────────────────────────────────
# Piece surfaces (glyph first, vector fallback)
# ──────────────────────────────────────────────
def _piece_surface(ptype, color, px=GLYPH_PX):
    """Return a surface for a piece. *px* is the glyph size in pixels."""
    if _piece_font_path is None:
        return _vector_surface(ptype, color, int(px * 1.25))
    key = ('g', ptype, color, px)
    surf = _small_cache.get(key)
    if surf is None:
        rgb = C_WHITE_PIECE if color == chess.WHITE else C_BLACK_PIECE
        surf = _glyph_font(px).render(GLYPHS[(ptype, color)], True, rgb)
        _small_cache[key] = surf
    return surf


_frame_mask = None


def init():
    """Call once after pygame.init() / set_mode(): fonts, pieces, board frame."""
    global _piece_font_path, _frame_mask
    for key in _UI.values():
        _font(*key)
    _piece_font_path = _find_piece_font()
    for pt in chess.PIECE_TYPES:
        for col in (chess.WHITE, chess.BLACK):
            _piece_surface(pt, col)
    _frame_mask = pygame.Surface((BOARD_PX, BOARD_PX), pygame.SRCALPHA)
    _frame_mask.fill(C_BG + (255,))
    pygame.draw.rect(_frame_mask, (0, 0, 0, 0), (0, 0, BOARD_PX, BOARD_PX),
                     border_radius=BOARD_RADIUS)


# ──────────────────────────────────────────────
# Coordinate helpers (respect board orientation)
# ──────────────────────────────────────────────
def _square_to_px(square):
    f = chess.square_file(square)
    r = chess.square_rank(square)
    col = 7 - f if _flipped else f
    row = r if _flipped else 7 - r
    return col * CELL_SIZE, row * CELL_SIZE


def px_to_square(mx, my):
    if mx < 0 or mx >= BOARD_PX or my < 0 or my >= WINDOW_H:
        return None
    col = mx // CELL_SIZE
    row = my // CELL_SIZE
    f = 7 - col if _flipped else col
    r = row if _flipped else 7 - row
    return chess.square(f, r)


# ──────────────────────────────────────────────
# Board drawing
# ──────────────────────────────────────────────
def draw_board(surface):
    for sq in chess.SQUARES:
        light = (chess.square_file(sq) + chess.square_rank(sq)) % 2 == 1   # a1 is dark
        x, y = _square_to_px(sq)
        pygame.draw.rect(surface, C_LIGHT_SQ if light else C_DARK_SQ,
                         (x, y, CELL_SIZE, CELL_SIZE))


def _draw_board_frame(surface):
    if _frame_mask is not None:
        surface.blit(_frame_mask, (0, 0))
    pygame.draw.rect(surface, C_BORDER, (0, 0, BOARD_PX, BOARD_PX), 2,
                     border_radius=BOARD_RADIUS)


def draw_last_move(surface, last_move):
    if last_move is None:
        return
    hl = pygame.Surface((CELL_SIZE, CELL_SIZE), pygame.SRCALPHA)
    hl.fill(C_LAST_MOVE)
    for sq in (last_move.from_square, last_move.to_square):
        surface.blit(hl, _square_to_px(sq))


def draw_highlights(surface, target_squares, selected_square):
    if selected_square is not None:
        sel = pygame.Surface((CELL_SIZE, CELL_SIZE), pygame.SRCALPHA)
        sel.fill(C_SELECT)
        surface.blit(sel, _square_to_px(selected_square))

    tint = pygame.Surface((CELL_SIZE, CELL_SIZE), pygame.SRCALPHA)
    tint.fill(C_TARGET_TINT)
    pygame.draw.circle(tint, C_HIGHLIGHT, (CELL_SIZE // 2, CELL_SIZE // 2), 9)
    for sq in target_squares:
        surface.blit(tint, _square_to_px(sq))


def draw_check_indicator(surface, king_square):
    if king_square is None:
        return
    hl = pygame.Surface((CELL_SIZE, CELL_SIZE), pygame.SRCALPHA)
    hl.fill(C_CHECK)
    surface.blit(hl, _square_to_px(king_square))


def draw_pieces(surface, board):
    for square in chess.SQUARES:
        piece = board.piece_at(square)
        if piece is None:
            continue
        x, y = _square_to_px(square)
        _draw_single_piece(surface, piece, x, y)


def _draw_single_piece(surface, piece, x, y):
    """Draw the piece centred in the cell whose top-left is (x, y)."""
    img = _piece_surface(piece.piece_type, piece.color)
    cx = x + CELL_SIZE // 2
    cy = y + CELL_SIZE // 2
    surface.blit(img, (cx - img.get_width() // 2, cy - img.get_height() // 2))


# ──────────────────────────────────────────────
# Side panel
# ──────────────────────────────────────────────
_DIFF_Y = 392
_SIDE_Y = 458
_BTN_H = 30


def _difficulty_rects():
    gap, w = 6, 60
    x0 = BOARD_PX + (PANEL_W - (3 * w + 2 * gap)) // 2
    return [(name, pygame.Rect(x0 + i * (w + gap), _DIFF_Y, w, _BTN_H))
            for i, name in enumerate(LEVELS)]


def _side_rects():
    gap, w = 8, 92
    x0 = BOARD_PX + (PANEL_W - (2 * w + gap)) // 2
    return [(chess.WHITE, 'White', pygame.Rect(x0, _SIDE_Y, w, _BTN_H)),
            (chess.BLACK, 'Black', pygame.Rect(x0 + w + gap, _SIDE_Y, w, _BTN_H))]


def handle_panel_click(mx, my):
    """Route a click on the panel buttons.

    Returns None if nothing was hit, otherwise 'difficulty', 'side' (the human
    side changed -> caller must start a new game) or 'noop' (same side clicked).
    """
    for name, rect in _difficulty_rects():
        if rect.collidepoint(mx, my):
            set_difficulty(name)
            return 'difficulty'
    for color, _label, rect in _side_rects():
        if rect.collidepoint(mx, my):
            if color == _player_color:
                return 'noop'
            set_player_color(color)
            return 'side'
    return None


def _button(surface, rect, label, on):
    pygame.draw.rect(surface, C_ACCENT if on else C_BTN, rect, border_radius=8)
    t = _font(19, True).render(label, True, C_BTN_TEXT_ON if on else C_MUTED)
    surface.blit(t, (rect.centerx - t.get_width() // 2,
                     rect.centery - t.get_height() // 2))


def _draw_controls(surface):
    px = BOARD_PX
    pygame.draw.line(surface, C_DIVIDER, (px + 14, 362), (px + PANEL_W - 14, 362), 1)
    lab = _font(23).render('AI Difficulty', True, C_MUTED)
    surface.blit(lab, (px + (PANEL_W - lab.get_width()) // 2, 370))
    cur = get_difficulty()
    for name, rect in _difficulty_rects():
        _button(surface, rect, name.capitalize(), name == cur)

    lab = _font(23).render('Play as', True, C_MUTED)
    surface.blit(lab, (px + (PANEL_W - lab.get_width()) // 2, 436))
    for color, label, rect in _side_rects():
        _button(surface, rect, label, color == _player_color)


def draw_panel(surface, engine, game_status):
    _draw_board_frame(surface)

    px = BOARD_PX
    pygame.draw.rect(surface, C_PANEL_BG, (px, 0, PANEL_W, WINDOW_H))

    def blit(text, key, color, y, center=True):
        size, bold = _UI[key]
        surf = _font(size, bold).render(text, True, color)
        x = px + (PANEL_W - surf.get_width()) // 2 if center else px + 14
        surface.blit(surf, (x, y))

    def divider(y):
        pygame.draw.line(surface, C_DIVIDER, (px + 14, y), (px + PANEL_W - 14, y), 1)

    blit('CHESS', 'big', C_ACCENT, 20)
    pygame.draw.line(surface, C_ACCENT, (px + 14, 52), (px + PANEL_W - 14, 52), 1)

    white_turn = engine.turn == chess.WHITE
    who = 'You' if engine.turn == _player_color else 'AI'
    blit('Current Turn', 'med', C_MUTED, 72)
    blit(f"{'White' if white_turn else 'Black'} ({who})", 'big',
         C_WHITE_TEXT if white_turn else C_BLACK_TEXT, 96)

    if engine.is_check and not engine.is_game_over:
        blit('CHECK!', 'big', (239, 68, 68), 128)

    divider(158)
    blit('Captured', 'med', C_MUTED, 168)
    _draw_captured_list(surface, engine.captured_white, px + 14, 192, chess.WHITE)
    _draw_captured_list(surface, engine.captured_black, px + 14, 224, chess.BLACK)

    divider(260)
    blit('Stats', 'med', C_MUTED, 270)
    blit(f'Move: {engine.board.fullmove_number}', 'small', C_TEXT, 294, center=False)

    if game_status:
        divider(320)
        blit(game_status, 'small', (250, 204, 21), 334)

    _draw_controls(surface)

    divider(WINDOW_H - 90)
    blit('Controls', 'med', C_MUTED, WINDOW_H - 80)
    blit('[R] Restart', 'small', C_TEXT, WINDOW_H - 56, center=False)
    blit('[U] Undo', 'small', C_TEXT, WINDOW_H - 38, center=False)
    blit('[Q] Quit', 'small', C_TEXT, WINDOW_H - 20, center=False)


def _draw_captured_list(surface, pieces, x, y, color):
    """Row of small captured-piece icons (overlapping when crowded)."""
    if not pieces:
        return
    pieces = sorted(pieces, key=lambda p: PIECE_VALUES.get(p.piece_type, 0),
                    reverse=True)
    icon = 22
    avail = PANEL_W - 28 - icon
    step = 20 if len(pieces) == 1 else min(20, avail // (len(pieces) - 1))
    for i, p in enumerate(pieces):
        img = _piece_surface(p.piece_type, p.color, icon)
        surface.blit(img, (x + i * step, y))


# ──────────────────────────────────────────────
# Overlays
# ──────────────────────────────────────────────
def draw_game_over(surface, message):
    overlay = pygame.Surface((WINDOW_W, WINDOW_H), pygame.SRCALPHA)
    overlay.fill(C_OVERLAY)
    surface.blit(overlay, (0, 0))

    cx, cy = WINDOW_W // 2, WINDOW_H // 2
    t = _font(52, True).render(message, True, C_ACCENT)
    s = _font(32).render('Game Over', True, C_TEXT)
    h1 = _font(28).render('[R] Play Again', True, C_ACCENT)
    h2 = _font(28).render('[Q] Quit', True, C_MUTED)
    surface.blit(t, (cx - t.get_width() // 2, cy - 70))
    surface.blit(s, (cx - s.get_width() // 2, cy - 10))
    surface.blit(h1, (cx - h1.get_width() // 2, cy + 40))
    surface.blit(h2, (cx - h2.get_width() // 2, cy + 72))


def draw_promotion_dialog(surface, color):
    """Piece-selection dialog; returns [(rect, piece_type), ...]."""
    overlay = pygame.Surface((WINDOW_W, WINDOW_H), pygame.SRCALPHA)
    overlay.fill((0, 0, 0, 150))
    surface.blit(overlay, (0, 0))

    box_w, box_h = 320, 128
    box_x = (BOARD_PX - box_w) // 2
    box_y = (WINDOW_H - box_h) // 2

    pygame.draw.rect(surface, C_PANEL_BG, (box_x, box_y, box_w, box_h), border_radius=12)
    pygame.draw.rect(surface, C_BORDER, (box_x, box_y, box_w, box_h), 2, border_radius=12)

    title = _font(26, True).render('Promote pawn to:', True, C_TEXT)
    surface.blit(title, (box_x + (box_w - title.get_width()) // 2, box_y + 10))

    option_rects = []
    cell = 72
    start_x = box_x + (box_w - len(PROMOTION_PIECES) * cell) // 2
    start_y = box_y + 44

    for i, pt in enumerate(PROMOTION_PIECES):
        rx, ry = start_x + i * cell, start_y
        rect = pygame.Rect(rx, ry, cell, cell)
        option_rects.append((rect, pt))
        pygame.draw.rect(surface, C_LIGHT_SQ, rect, border_radius=8)
        pygame.draw.rect(surface, C_BORDER, rect, 1, border_radius=8)
        img = _piece_surface(pt, color)
        surface.blit(img, (rect.centerx - img.get_width() // 2,
                           rect.centery - img.get_height() // 2))

    return option_rects
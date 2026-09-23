"""
Checkers (Draughts) Game using Pygame
Ported from TypeScript to Python.

Features:
  - Standard 8x8 checkers board
  - Red (bottom) vs Black (top), Red goes first
  - Mandatory captures enforced
  - Multi-jump (chain capture) support
  - King promotion
  - 50-move draw rule
  - Mouse-driven UI with move highlighting
  - Game Over screen with restart / quit
"""

import pygame
import sys
from copy import deepcopy

# ──────────────────────────────────────────────
# Constants
# ──────────────────────────────────────────────
BOARD_SIZE   = 8
CELL_SIZE    = 80
PANEL_W      = 220
WINDOW_W     = BOARD_SIZE * CELL_SIZE + PANEL_W
WINDOW_H     = BOARD_SIZE * CELL_SIZE
FPS          = 60

# Colors
C_BG          = (18,  18,  30)
C_LIGHT_SQ    = (238, 214, 175)
C_DARK_SQ     = (184, 135,  98)
C_HIGHLIGHT   = (106, 200, 100, 180)   # valid-move highlight (with alpha)
C_SELECT      = (255, 220,  50, 200)   # selected piece ring
C_RED_PIECE   = (210,  40,  40)
C_RED_KING    = (240,  80,  40)
C_BLACK_PIECE = (30,   30,  30)
C_BLACK_KING  = (60,   60,  90)
C_PIECE_SHINE = (255, 255, 255, 80)
C_PANEL_BG    = (28,  28,  46)
C_TEXT        = (230, 230, 255)
C_ACCENT      = (106, 200, 100)
C_RED_TEXT    = (220,  80,  80)
C_BLK_TEXT    = (130, 160, 255)
C_OVERLAY     = (10,  10,  20, 210)

MAN  = 'man'
KING = 'king'
RED  = 'red'
BLK  = 'black'


# ──────────────────────────────────────────────
# Data helpers
# ──────────────────────────────────────────────
def opponent(color):
    return BLK if color == RED else RED


def create_board():
    """Return an 8x8 list-of-lists with Piece objects or None."""
    board = [[None] * BOARD_SIZE for _ in range(BOARD_SIZE)]
    pid = [0]

    def place(row, col, color):
        board[row][col] = {'id': f'{color}-{pid[0]}', 'color': color,
                           'type': MAN, 'row': row, 'col': col}
        pid[0] += 1

    for r in range(3):
        for c in range(BOARD_SIZE):
            if (r + c) % 2 == 1:
                place(r, c, BLK)

    pid[0] = 0
    for r in range(5, BOARD_SIZE):
        for c in range(BOARD_SIZE):
            if (r + c) % 2 == 1:
                place(r, c, RED)

    return board


def copy_board(board):
    return deepcopy(board)


def get_piece(board, r, c):
    if 0 <= r < BOARD_SIZE and 0 <= c < BOARD_SIZE:
        return board[r][c]
    return None


def pieces_of(board, color):
    return [(r, c) for r in range(BOARD_SIZE)
            for c in range(BOARD_SIZE)
            if board[r][c] and board[r][c]['color'] == color]


# ──────────────────────────────────────────────
# Move logic
# ──────────────────────────────────────────────
def _move_dirs(piece):
    """Movement directions (non-capture) for a piece."""
    if piece['type'] == KING:
        return [(-1, -1), (-1, 1), (1, -1), (1, 1)]
    return [(-1, -1), (-1, 1)] if piece['color'] == RED else [(1, -1), (1, 1)]


def _jump_dirs(_piece):
    return [(-1, -1), (-1, 1), (1, -1), (1, 1)]


def _will_promote(piece, r):
    if piece['type'] == KING:
        return False
    return r == 0 if piece['color'] == RED else r == BOARD_SIZE - 1


def normal_moves(board, r, c):
    piece = board[r][c]
    if not piece:
        return []
    moves = []
    for dr, dc in _move_dirs(piece):
        nr, nc = r + dr, c + dc
        if 0 <= nr < BOARD_SIZE and 0 <= nc < BOARD_SIZE and not board[nr][nc]:
            moves.append({'from': (r, c), 'to': (nr, nc),
                          'captured': [], 'is_capture': False,
                          'promotes': _will_promote(piece, nr)})
    return moves


def _explore_captures(board, r, c, piece, captured_so_far, origin=None):
    """Recursively yield all capture chains starting from (r, c).
    `origin` is the true starting square of the piece so that every generated
    move object has the correct 'from' field even during multi-jump chains.
    """
    if origin is None:
        origin = (r, c)
    found = False
    results = []
    for dr, dc in _jump_dirs(piece):
        jr, jc = r + dr, c + dc
        lr, lc = r + 2 * dr, c + 2 * dc
        if not (0 <= jr < BOARD_SIZE and 0 <= jc < BOARD_SIZE):
            continue
        if not (0 <= lr < BOARD_SIZE and 0 <= lc < BOARD_SIZE):
            continue
        jumped = board[jr][jc]
        landing = board[lr][lc]
        if (jumped and jumped['color'] != piece['color']
                and not landing
                and (jr, jc) not in captured_so_far):
            found = True
            new_cap = captured_so_far + [(jr, jc)]
            sub = _explore_captures(board, lr, lc, piece, new_cap, origin)
            if sub:
                results.extend(sub)
            else:
                results.append({'from': origin, 'to': (lr, lc),
                                'captured': new_cap, 'is_capture': True,
                                'promotes': _will_promote(piece, lr)})
    if not found and captured_so_far:
        return None   # signal up the chain
    return results if results else None


def capture_moves(board, r, c):
    piece = board[r][c]
    if not piece:
        return []
    result = _explore_captures(board, r, c, piece, [])
    return result or []


def legal_moves_for(board, r, c):
    caps = capture_moves(board, r, c)
    if caps:
        return caps
    return normal_moves(board, r, c)


def all_legal_moves(board, color):
    caps = []
    norms = []
    for r, c in pieces_of(board, color):
        caps.extend(capture_moves(board, r, c))
        norms.extend(normal_moves(board, r, c))
    return caps if caps else norms


def apply_move(board, move):
    nb = copy_board(board)
    r0, c0 = move['from']
    r1, c1 = move['to']
    piece = nb[r0][c0]
    nb[r0][c0] = None
    for jr, jc in move['captured']:
        nb[jr][jc] = None
    piece = dict(piece)
    piece['row'], piece['col'] = r1, c1
    if move['promotes']:
        piece['type'] = KING
    nb[r1][c1] = piece
    return nb


# ──────────────────────────────────────────────
# Game-over check
# ──────────────────────────────────────────────
def check_game_over(board, current_player, moves_no_cap):
    if moves_no_cap >= 50:
        return True, 'draw'
    legal = all_legal_moves(board, current_player)
    if not legal:
        opp_legal = all_legal_moves(board, opponent(current_player))
        if not opp_legal:
            return True, 'draw'
        return True, f'{opponent(current_player)}-wins'
    if not pieces_of(board, current_player):
        return True, f'{opponent(current_player)}-wins'
    return False, None


# ──────────────────────────────────────────────
# Rendering helpers
# ──────────────────────────────────────────────
def board_to_px(r, c):
    return c * CELL_SIZE, r * CELL_SIZE


def draw_board(surface):
    for r in range(BOARD_SIZE):
        for c in range(BOARD_SIZE):
            color = C_LIGHT_SQ if (r + c) % 2 == 0 else C_DARK_SQ
            pygame.draw.rect(surface, color,
                             (c * CELL_SIZE, r * CELL_SIZE, CELL_SIZE, CELL_SIZE))


def draw_highlights(surface, moves, selected):
    hl = pygame.Surface((CELL_SIZE, CELL_SIZE), pygame.SRCALPHA)
    for move in moves:
        r1, c1 = move['to']
        x, y = board_to_px(r1, c1)
        hl.fill(C_HIGHLIGHT)
        surface.blit(hl, (x, y))
        pygame.draw.circle(surface, (50, 200, 50),
                           (x + CELL_SIZE // 2, y + CELL_SIZE // 2), 10)

    if selected:
        sr, sc = selected
        sx, sy = board_to_px(sr, sc)
        sel = pygame.Surface((CELL_SIZE, CELL_SIZE), pygame.SRCALPHA)
        sel.fill(C_SELECT)
        surface.blit(sel, (sx, sy))


def draw_piece(surface, piece, r, c, wobble=0):
    x = c * CELL_SIZE + CELL_SIZE // 2
    y = r * CELL_SIZE + CELL_SIZE // 2 + wobble
    radius = CELL_SIZE // 2 - 8
    is_king = piece['type'] == KING

    # Shadow
    pygame.draw.circle(surface, (0, 0, 0, 80), (x + 3, y + 3), radius)

    # Body
    base_col = C_RED_KING if (piece['color'] == RED and is_king) else \
               C_RED_PIECE if piece['color'] == RED else \
               C_BLACK_KING if is_king else C_BLACK_PIECE
    pygame.draw.circle(surface, base_col, (x, y), radius)

    # Rim
    rim = (255, 120, 80) if piece['color'] == RED else (90, 90, 140)
    pygame.draw.circle(surface, rim, (x, y), radius, 3)

    # King crown indicator
    if is_king:
        crown_col = (255, 215, 0)
        font = pygame.font.SysFont('segoeuisymbol', 22, bold=True)
        txt = font.render('♛', True, crown_col)
        surface.blit(txt, (x - txt.get_width() // 2, y - txt.get_height() // 2))


def draw_panel(surface, state):
    px = BOARD_SIZE * CELL_SIZE
    pygame.draw.rect(surface, C_PANEL_BG, (px, 0, PANEL_W, WINDOW_H))

    f_big   = pygame.font.SysFont('consolas', 22, bold=True)
    f_med   = pygame.font.SysFont('consolas', 17)
    f_small = pygame.font.SysFont('consolas', 14)

    def blit(text, font, color, y, center=True):
        surf = font.render(text, True, color)
        x = px + (PANEL_W - surf.get_width()) // 2 if center else px + 12
        surface.blit(surf, (x, y))

    # Title
    blit('CHECKERS', f_big, C_ACCENT, 20)
    pygame.draw.line(surface, C_ACCENT, (px + 10, 52), (px + PANEL_W - 10, 52), 1)

    # Turn
    turn_col = C_RED_TEXT if state['current_player'] == RED else C_BLK_TEXT
    turn_lbl = 'Red' if state['current_player'] == RED else 'Black'
    blit('Current Turn', f_med, C_TEXT, 72)
    blit(f'▶  {turn_lbl}', f_big, turn_col, 96)

    # Piece counts
    red_count = len(pieces_of(state['board'], RED))
    blk_count = len(pieces_of(state['board'], BLK))
    pygame.draw.line(surface, (60, 60, 80), (px + 10, 138), (px + PANEL_W - 10, 138), 1)
    blit('Pieces', f_med, C_TEXT, 148)
    blit(f'Red   : {red_count:>2}', f_med, C_RED_TEXT, 172, center=False)
    blit(f'Black : {blk_count:>2}', f_med, C_BLK_TEXT, 196, center=False)

    # Move stats
    pygame.draw.line(surface, (60, 60, 80), (px + 10, 228), (px + PANEL_W - 10, 228), 1)
    blit('Stats', f_med, C_TEXT, 240)
    blit(f'Total moves : {state["move_count"]:>3}', f_small, C_TEXT, 264, center=False)
    blit(f'No-cap moves: {state["moves_no_cap"]:>3}', f_small, C_TEXT, 284, center=False)
    blit(f'(Draw @ 50)', f_small, (120, 120, 140), 304, center=False)

    # Capture chain notice
    if state['must_continue']:
        pygame.draw.line(surface, (60, 60, 80),
                         (px + 10, 330), (px + PANEL_W - 10, 330), 1)
        blit('Must continue', f_small, (255, 180, 50), 344)
        blit('capture chain!', f_small, (255, 180, 50), 362)

    # Controls
    pygame.draw.line(surface, (60, 60, 80),
                     (px + 10, WINDOW_H - 110), (px + PANEL_W - 10, WINDOW_H - 110), 1)
    blit('Controls', f_med, C_TEXT, WINDOW_H - 100)
    blit('Click to select', f_small, (160, 160, 180), WINDOW_H - 78, center=False)
    blit('& move pieces', f_small, (160, 160, 180), WINDOW_H - 62, center=False)
    blit('[R] Restart', f_small, (160, 160, 180), WINDOW_H - 42, center=False)
    blit('[Q] Quit', f_small, (160, 160, 180), WINDOW_H - 26, center=False)


def draw_game_over(surface, result):
    overlay = pygame.Surface((WINDOW_W, WINDOW_H), pygame.SRCALPHA)
    overlay.fill(C_OVERLAY)
    surface.blit(overlay, (0, 0))

    f_title = pygame.font.SysFont('consolas', 52, bold=True)
    f_sub   = pygame.font.SysFont('consolas', 26)
    f_hint  = pygame.font.SysFont('consolas', 20)

    cx, cy = WINDOW_W // 2, WINDOW_H // 2

    if result == 'draw':
        msg, col = "IT'S A DRAW!", C_TEXT
    elif result == 'red-wins':
        msg, col = 'RED WINS!', C_RED_TEXT
    else:
        msg, col = 'BLACK WINS!', C_BLK_TEXT

    t = f_title.render(msg, True, col)
    surface.blit(t, (cx - t.get_width() // 2, cy - 80))

    s = f_sub.render('Game Over', True, C_TEXT)
    surface.blit(s, (cx - s.get_width() // 2, cy - 10))

    h1 = f_hint.render('[R] Play Again', True, C_ACCENT)
    h2 = f_hint.render('[Q] Quit', True, (180, 180, 200))
    surface.blit(h1, (cx - h1.get_width() // 2, cy + 50))
    surface.blit(h2, (cx - h2.get_width() // 2, cy + 84))


# ──────────────────────────────────────────────
# Main Game class
# ──────────────────────────────────────────────
class CheckersGame:
    def __init__(self):
        pygame.init()
        pygame.display.set_caption('Checkers — Olos Gaming')
        self.screen = pygame.display.set_mode((WINDOW_W, WINDOW_H))
        self.clock  = pygame.time.Clock()
        self.reset()

    def reset(self):
        self.state = {
            'board':          create_board(),
            'current_player': RED,
            'status':         'playing',
            'result':         None,
            'move_count':     0,
            'moves_no_cap':   0,
            'selected':       None,       # (row, col) or None
            'legal_moves':    [],
            'must_continue':  False,
            'chain_piece':    None,
        }

    # ── Input ──────────────────────────────────
    def handle_click(self, mx, my):
        s = self.state
        if s['status'] != 'playing':
            return

        # Click is outside the board area
        if mx >= BOARD_SIZE * CELL_SIZE:
            return

        c, r = mx // CELL_SIZE, my // CELL_SIZE

        # If must continue capture chain, only the chain piece can be used
        if s['must_continue']:
            cr, cc = s['chain_piece']
            if (r, c) == (cr, cc):
                return   # clicked same piece, already selected — do nothing
            # Try to move to the clicked square
            self._try_move(r, c)
            return

        piece = get_piece(s['board'], r, c)

        # Clicking own piece → select it
        if piece and piece['color'] == s['current_player']:
            s['selected'] = (r, c)
            moves = legal_moves_for(s['board'], r, c)
            # Enforce mandatory capture: if any capture exists globally,
            # only show this piece's captures
            all_moves = all_legal_moves(s['board'], s['current_player'])
            has_global_cap = any(m['is_capture'] for m in all_moves)
            if has_global_cap:
                moves = [m for m in moves if m['is_capture']]
            s['legal_moves'] = moves
            return

        # Clicking empty / opponent square → try moving selected piece
        if s['selected']:
            self._try_move(r, c)

    def _try_move(self, r, c):
        s = self.state
        move = next((m for m in s['legal_moves'] if m['to'] == (r, c)), None)
        if not move:
            # Deselect if not in a chain
            if not s['must_continue']:
                s['selected'] = None
                s['legal_moves'] = []
            return

        # Apply the move (captures are fully pre-computed by _explore_captures,
        # so a single click on the final landing square completes all jumps)
        s['board'] = apply_move(s['board'], move)
        s['move_count'] += 1
        if move['is_capture']:
            s['moves_no_cap'] = 0
        else:
            s['moves_no_cap'] += 1

        # Since _explore_captures already embeds the full chain in one move,
        # there are never true follow-up captures to handle here.
        # Always end the turn after applying the move.
        s['must_continue'] = False
        s['chain_piece']   = None
        s['selected']      = None
        s['legal_moves']   = []
        # Switch player
        s['current_player'] = opponent(s['current_player'])
        # Check game over
        over, result = check_game_over(s['board'], s['current_player'],
                                       s['moves_no_cap'])
        if over:
            s['status'] = 'finished'
            s['result'] = result

    # ── Render ─────────────────────────────────
    def render(self):
        s = self.state
        self.screen.fill(C_BG)

        draw_board(self.screen)

        if s['selected'] and s['legal_moves']:
            draw_highlights(self.screen, s['legal_moves'], s['selected'])

        for r in range(BOARD_SIZE):
            for c in range(BOARD_SIZE):
                piece = s['board'][r][c]
                if piece:
                    draw_piece(self.screen, piece, r, c)

        draw_panel(self.screen, s)

        if s['status'] == 'finished':
            draw_game_over(self.screen, s['result'])

        pygame.display.flip()

    # ── Main loop ───────────────────────────────
    def run(self):
        while True:
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    pygame.quit(); sys.exit()

                if event.type == pygame.KEYDOWN:
                    if event.key in (pygame.K_q, pygame.K_ESCAPE):
                        pygame.quit(); sys.exit()
                    if event.key == pygame.K_r:
                        self.reset()

                if event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
                    self.handle_click(*event.pos)

            self.render()
            self.clock.tick(FPS)


# ──────────────────────────────────────────────
# Entry point
# ──────────────────────────────────────────────
def main():
    game = CheckersGame()
    game.run()


if __name__ == '__main__':
    main()

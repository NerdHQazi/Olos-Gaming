import asyncio
import json
import math
import random
import sys

import pygame

IS_WEB = sys.platform == "emscripten"

# --------------------------------------------------------------------------- #
#  Look: matches the surrounding OLOS match screen
# --------------------------------------------------------------------------- #
BG = (4, 7, 15)
GRID = (17, 21, 31)

# Index = figure type + 1 (0 means "empty cell" in the field)
colors = [
    BG,
    (0, 210, 255),   # I  cyan
    (244, 63, 94),   # Z  rose
    (34, 197, 94),   # S  green
    (59, 130, 246),  # J  blue
    (251, 146, 60),  # L  orange
    (124, 58, 237),  # T  purple
    (255, 184, 0),   # O  amber
]

CELL = 40  # drawn large so it stays sharp when the page scales it down on hi-dpi screens
COLS, ROWS = 10, 20
SIZE = (COLS * CELL, ROWS * CELL)  # 400 x 800, same 1:2 ratio as the frame

# Touch gestures (distances are in canvas pixels, so they scale with CELL)
TAP_MAX_MS = 280          # a quick touch that barely moves rotates the piece
TAP_MAX_MOVE = CELL * 0.35
SOFT_DROP_DY = CELL * 1.2  # dragging down this far starts a soft drop
FLICK_MIN_DY = CELL * 3    # a fast downward flick hard-drops
FLICK_MAX_MS = 260


# --------------------------------------------------------------------------- #
#  Talking to the page that embeds the game
# --------------------------------------------------------------------------- #
def host_post(message):
    """Send a message to the parent page. Does nothing on desktop."""
    if not IS_WEB:
        return
    try:
        import platform
        platform.window.parent.postMessage(json.dumps(message), "*")
    except Exception:
        pass  # never let a bridge problem crash the game


def hex_color(rgb):
    return "#%02X%02X%02X" % rgb


def shape_matrix(figure_type):
    """Cropped 0/1 matrix of a figure, in the wide orientation, for the next-piece card."""
    best = None
    for cells in Figure.figures[figure_type]:
        rows = sorted({c // 4 for c in cells})
        cols = sorted({c % 4 for c in cells})
        h, w = rows[-1] - rows[0] + 1, cols[-1] - cols[0] + 1
        if best is None or (h, w) < best[0]:
            best = ((h, w), cells, rows[0], cols[0])
    (h, w), cells, r0, c0 = best
    matrix = [[0] * w for _ in range(h)]
    for c in cells:
        matrix[c // 4 - r0][c % 4 - c0] = 1
    return matrix


def report_state(game):
    host_post({
        "source": "olos-tetris",
        "type": "state",
        "score": game.score,
        "lines": game.lines_cleared,
        "level": game.level,
        "multiplier": round(game.multiplier(), 1),
        "next": {
            "shape": shape_matrix(game.next_type),
            "color": hex_color(colors[game.next_type + 1]),
        },
    })


def report_end(outcome="lose"):
    host_post({"source": "olos-tetris", "type": "end", "outcome": outcome})


# --------------------------------------------------------------------------- #
#  Game
# --------------------------------------------------------------------------- #
class Figure:
    figures = [
        [[1, 5, 9, 13], [4, 5, 6, 7]],
        [[4, 5, 9, 10], [2, 6, 5, 9]],
        [[6, 7, 9, 10], [1, 5, 6, 10]],
        [[1, 2, 5, 9], [0, 4, 5, 6], [1, 5, 9, 8], [4, 5, 6, 10]],
        [[1, 2, 6, 10], [5, 6, 7, 9], [2, 6, 10, 11], [3, 5, 6, 7]],
        [[1, 4, 5, 6], [1, 4, 5, 9], [4, 5, 6, 9], [1, 5, 6, 9]],
        [[1, 2, 5, 6]],
    ]

    def __init__(self, x, y, kind=None):
        self.x = x
        self.y = y
        self.type = kind if kind is not None else random.randint(0, len(self.figures) - 1)
        self.color = self.type + 1  # one colour per piece type
        self.rotation = 0

    def image(self):
        return self.figures[self.type][self.rotation]

    def rotate(self):
        self.rotation = (self.rotation + 1) % len(self.figures[self.type])


class Tetris:
    def __init__(self, height, width):
        self.level = 1
        self.score = 0
        self.state = "start"
        self.field = [[0] * width for _ in range(height)]
        self.height = height
        self.width = width
        self.zoom = CELL
        self.x = 0
        self.y = 0
        self.figure = None
        self.next_type = random.randint(0, len(Figure.figures) - 1)
        self.lines_cleared = 0  # real line count, shown in the header
        self.broken_lines = 0   # weighted count (lines ** 2) that drives the level

    def multiplier(self):
        return 1 + (self.level - 1) * 0.2

    def new_figure(self):
        self.figure = Figure(3, 0, self.next_type)
        self.next_type = random.randint(0, len(Figure.figures) - 1)

    def intersects(self):
        for i in range(4):
            for j in range(4):
                if i * 4 + j in self.figure.image():
                    if (
                        i + self.figure.y > self.height - 1
                        or j + self.figure.x > self.width - 1
                        or j + self.figure.x < 0
                        or self.field[i + self.figure.y][j + self.figure.x] > 0
                    ):
                        return True
        return False

    def break_lines(self):
        lines = 0
        for i in range(self.height):
            if all(cell > 0 for cell in self.field[i]):
                lines += 1
                del self.field[i]
                self.field.insert(0, [0] * self.width)
        if lines:
            self.score += int(lines * 100 * self.multiplier())
            self.lines_cleared += lines
            self.broken_lines += lines ** 2
            # Level goes up every 5 weighted lines. Level 12 is the framerate limit.
            self.level = min(12, self.broken_lines // 5 + 1)

    def ghost_y(self):
        start = self.figure.y
        while not self.intersects():
            self.figure.y += 1
        landing = self.figure.y - 1
        self.figure.y = start
        return landing

    def go_space(self):
        while not self.intersects():
            self.figure.y += 1
        self.figure.y -= 1
        self.freeze()

    def go_down(self):
        self.figure.y += 1
        if self.intersects():
            self.figure.y -= 1
            self.freeze()

    def freeze(self):
        for i in range(4):
            for j in range(4):
                if i * 4 + j in self.figure.image():
                    self.field[i + self.figure.y][j + self.figure.x] = self.figure.color
        self.break_lines()
        self.new_figure()
        if self.intersects():
            self.state = "gameover"

    def go_side(self, dx):
        old_x = self.figure.x
        self.figure.x += dx
        if self.intersects():
            self.figure.x = old_x

    def rotate(self):
        old_rotation = self.figure.rotation
        self.figure.rotate()
        if self.intersects():
            self.figure.rotation = old_rotation


# --------------------------------------------------------------------------- #
#  Drawing
# --------------------------------------------------------------------------- #
def dim(color, amount=0.22):
    return tuple(int(c * amount + b * (1 - amount)) for c, b in zip(color, BG))


def draw_cell(screen, game, col, row, color):
    rect = pygame.Rect(game.x + game.zoom * col, game.y + game.zoom * row, game.zoom, game.zoom)
    pygame.draw.rect(screen, color, rect.inflate(-4, -4), border_radius=5)


def draw(screen, game):
    screen.fill(BG)

    for i in range(game.height):
        for j in range(game.width):
            rect = pygame.Rect(game.x + game.zoom * j, game.y + game.zoom * i, game.zoom, game.zoom)
            pygame.draw.rect(screen, GRID, rect, 1)
            if game.field[i][j] > 0:
                draw_cell(screen, game, j, i, colors[game.field[i][j]])

    if game.figure is not None and game.state == "start":
        ghost = game.ghost_y()
        if ghost != game.figure.y:
            for p in game.figure.image():
                i, j = divmod(p, 4)
                draw_cell(screen, game, j + game.figure.x, i + ghost, dim(colors[game.figure.color]))
        for p in game.figure.image():
            i, j = divmod(p, 4)
            draw_cell(screen, game, j + game.figure.x, i + game.figure.y, colors[game.figure.color])


# --------------------------------------------------------------------------- #
#  Main loop (async, as pygbag requires)
# --------------------------------------------------------------------------- #
async def main():
    pygame.init()
    screen = pygame.display.set_mode(SIZE)
    pygame.display.set_caption("Tetris")
    clock = pygame.time.Clock()
    fps = 25

    game = Tetris(ROWS, COLS)
    game.new_figure()

    counter = 0
    key_down = False    # down arrow held
    touch_down = False  # finger dragged downward
    g_active = False    # a touch / mouse gesture is in progress
    g_x0 = g_y0 = g_anchor = g_t0 = 0
    g_moved = False
    last_sent = None
    end_sent = False
    running = True

    while running:
        counter += 1
        if counter > 100000:
            counter = 0

        if game.state == "start":
            interval = max(1, fps // game.level // 2)
            if counter % interval == 0 or key_down or touch_down:
                game.go_down()

        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False

            if event.type == pygame.KEYDOWN:
                if game.state == "start":
                    if event.key == pygame.K_UP:
                        game.rotate()
                    elif event.key == pygame.K_DOWN:
                        key_down = True
                    elif event.key == pygame.K_LEFT:
                        game.go_side(-1)
                    elif event.key == pygame.K_RIGHT:
                        game.go_side(1)
                    elif event.key == pygame.K_SPACE:
                        game.go_space()
                # Restart is for local testing only. In a staked match the page reloads the game.
                if event.key == pygame.K_ESCAPE and not IS_WEB:
                    game = Tetris(ROWS, COLS)
                    game.new_figure()
                    last_sent = None
                    end_sent = False

            if event.type == pygame.KEYUP and event.key == pygame.K_DOWN:
                key_down = False

            # Touch gestures. Browsers deliver touches to pygame as mouse events.
            #   tap = rotate, drag sideways = slide, drag down = soft drop, flick down = hard drop
            if event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
                g_active = True
                g_x0, g_y0 = event.pos
                g_anchor = g_x0
                g_t0 = pygame.time.get_ticks()
                g_moved = False

            elif event.type == pygame.MOUSEMOTION and g_active and game.state == "start":
                x, y = event.pos
                while x - g_anchor >= CELL:  # one cell per cell-width of finger travel
                    game.go_side(1)
                    g_anchor += CELL
                    g_moved = True
                while g_anchor - x >= CELL:
                    game.go_side(-1)
                    g_anchor -= CELL
                    g_moved = True
                touch_down = (y - g_y0) > SOFT_DROP_DY
                if touch_down:
                    g_moved = True

            elif event.type == pygame.MOUSEBUTTONUP and event.button == 1 and g_active:
                g_active = False
                touch_down = False
                if game.state == "start":
                    x, y = event.pos
                    dx, dy = x - g_x0, y - g_y0
                    elapsed = pygame.time.get_ticks() - g_t0
                    if dy > FLICK_MIN_DY and elapsed < FLICK_MAX_MS and abs(dx) < dy:
                        game.go_space()
                    elif not g_moved and elapsed < TAP_MAX_MS and math.hypot(dx, dy) < TAP_MAX_MOVE:
                        game.rotate()

        draw(screen, game)

        # Tell the page whenever something it displays has changed.
        snapshot = (game.score, game.lines_cleared, game.level, game.next_type)
        if snapshot != last_sent:
            last_sent = snapshot
            report_state(game)

        if game.state == "gameover" and not end_sent:
            end_sent = True
            report_end("lose")

        pygame.display.flip()
        clock.tick(fps)
        await asyncio.sleep(0)  # hands control back to the browser every frame

    pygame.quit()


asyncio.run(main())
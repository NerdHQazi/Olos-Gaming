import asyncio
import json
import math
import os
import random
import sys
import time

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

# Frame pacing. Gravity is time-based, so the framerate no longer limits the speed.
FPS = 60
MAX_DT = 0.1  # clamp a long frame (tab in background) so pieces don't tunnel

# Gravity: seconds per row at level 1, shrinking by FALL_DECAY every level.
BASE_FALL = 0.5
FALL_DECAY = 0.82
MIN_FALL = 0.05
MAX_LEVEL = 12
SOFT_DROP_INTERVAL = 0.04  # seconds per row while soft dropping

# Points for dropping a piece yourself (per row, not multiplied). Set to 0 to disable.
SOFT_DROP_POINTS = 1
HARD_DROP_POINTS = 2

# Horizontal nudges tried, in order, when a rotation collides (wall / stack kicks).
ROTATE_KICKS = (0, -1, 1, -2, 2)

# Touch gestures (distances are in canvas pixels, so they scale with CELL)
TAP_MAX_MS = 280          # a quick touch that barely moves rotates the piece
TAP_MAX_MOVE = CELL * 0.35
SOFT_DROP_DY = CELL * 1.2  # dragging down this far starts a soft drop
FLICK_MIN_DY = CELL * 3    # a fast downward flick hard-drops
FLICK_MAX_MS = 260


def fall_interval(level):
    """Seconds a piece waits before falling one row at this level."""
    return max(MIN_FALL, BASE_FALL * FALL_DECAY ** (level - 1))


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


def shape_matrix(figure):
    """Cropped 0/1 matrix of a figure in the exact orientation it will spawn in."""
    cells = figure.image()
    rows = [c // 4 for c in cells]
    cols = [c % 4 for c in cells]
    r0, c0 = min(rows), min(cols)
    matrix = [[0] * (max(cols) - c0 + 1) for _ in range(max(rows) - r0 + 1)]
    for c in cells:
        matrix[c // 4 - r0][c % 4 - c0] = 1
    return matrix


def report_state(game, time_left=None):
    host_post({
        "source": "olos-tetris",
        "type": "state",
        "score": game.score,
        "lines": game.lines_cleared,
        "level": game.level,
        "multiplier": round(game.multiplier(), 1),
        "timeLeft": time_left,  # whole seconds, or null when the match has no time limit
        "next": {
            "shape": shape_matrix(game.next_figure),
            "color": hex_color(colors[game.next_figure.color]),
        },
    })


def report_end(game, outcome="lose"):
    """outcome is "lose" (stacked out), "timeout" (time limit reached) or "win" (target score reached)."""
    host_post({
        "source": "olos-tetris",
        "type": "end",
        "outcome": outcome,
        "score": game.score,
        "lines": game.lines_cleared,
        "level": game.level,
    })


# --------------------------------------------------------------------------- #
#  Game
# --------------------------------------------------------------------------- #
# Difficulty settings. "medium" is the default for real matches.
#   start     = level the game begins at
#   per_level = weighted lines (see broken_lines) needed for each level-up
#   chaos     = how far each piece's fall speed can stray from normal (0.3 = +/-30%)
#   surge     = chance that a piece drops at 1.8x speed on top of that
DIFFICULTY = {
    "easy":   {"start": 1, "per_level": 8, "chaos": 0.15, "surge": 0.05},
    "medium": {"start": 1, "per_level": 5, "chaos": 0.30, "surge": 0.10},
    "hard":   {"start": 4, "per_level": 3, "chaos": 0.45, "surge": 0.15},
}


def read_param(name, argv_index=None):
    """Value of ?name=... on the page URL (web), or sys.argv[argv_index] on desktop. Else None."""
    if IS_WEB:
        try:
            import platform
            query = str(platform.window.location.search).lstrip("?")
            for part in query.split("&"):
                key, _, val = part.partition("=")
                if key == name:
                    return val
        except Exception:
            pass
    elif argv_index is not None and len(sys.argv) > argv_index:
        return sys.argv[argv_index]
    return None


def read_positive(name, argv_index=None):
    """A positive finite number from read_param, or None if missing / invalid."""
    try:
        value = float(read_param(name, argv_index))
    except (TypeError, ValueError):
        return None
    return value if value > 0 and math.isfinite(value) else None


def read_difficulty():
    value = read_param("difficulty", 1)
    return value if value in DIFFICULTY else "medium"


def make_rng():
    """Every game gets its own random stream, freshly seeded from system entropy.

    Pass ?seed=abc123 (desktop: argv[2]) to replay an exact game. A match server
    can hand both players the same seed so they face identical pieces.
    """
    seed = read_param("seed", 2)
    if seed:
        return random.Random(seed)
    try:
        entropy = int.from_bytes(os.urandom(8), "big")
    except Exception:
        entropy = 0
    return random.Random(entropy ^ time.time_ns())


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

    def __init__(self, x, y, kind, rotation=0):
        self.x = x
        self.y = y
        self.type = kind
        self.color = self.type + 1  # one colour per piece type
        self.rotation = rotation
        self.speed = 1.0  # fall-speed multiplier for this piece

    def image(self):
        return self.figures[self.type][self.rotation]

    def rotate(self):
        self.rotation = (self.rotation + 1) % len(self.figures[self.type])


class Tetris:
    def __init__(self, height, width, difficulty="medium", rng=None):
        settings = DIFFICULTY[difficulty]
        self.rng = rng or random.Random()
        self.start_level = settings["start"]
        self.per_level = settings["per_level"]
        self.chaos = settings["chaos"]
        self.surge = settings["surge"]
        self.level = self.start_level
        self.score = 0
        self.state = "start"
        self.field = [[0] * width for _ in range(height)]
        self.height = height
        self.width = width
        self.zoom = CELL
        self.x = 0
        self.y = 0
        self.figure = None
        self.next_figure = None  # rolled in full (type, rotation, column, speed) ahead of time
        self.spawns = 0          # counts spawned pieces so the loop can reset its fall timer
        self.lines_cleared = 0  # real line count, shown in the header
        self.broken_lines = 0   # weighted count (lines ** 2) that drives the level

    def multiplier(self):
        return 1 + (self.level - 1) * 0.2

    def make_figure(self):
        """A piece with a random type, orientation, column and fall speed."""
        kind = self.rng.randrange(len(Figure.figures))
        rotation = self.rng.randrange(len(Figure.figures[kind]))
        cols = [c % 4 for c in Figure.figures[kind][rotation]]
        x = self.rng.randint(-min(cols), self.width - 1 - max(cols))  # anywhere it fits
        piece = Figure(x, 0, kind, rotation)
        piece.speed = 1 + self.rng.uniform(-self.chaos, self.chaos)
        if self.rng.random() < self.surge:
            piece.speed *= 1.8
        return piece

    def new_figure(self):
        # The previewed piece is the piece that spawns: same orientation, column and speed.
        if self.next_figure is None:
            self.next_figure = self.make_figure()
        self.figure = self.next_figure
        self.next_figure = self.make_figure()
        self.spawns += 1

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
        # Rebuild the field from the rows that survive. Unlike deleting rows while
        # walking down the field, this clears adjacent full rows in the same lock.
        remaining = [row for row in self.field if not all(cell > 0 for cell in row)]
        lines = self.height - len(remaining)
        if lines:
            self.field = [[0] * self.width for _ in range(lines)] + remaining
            self.score += int(lines * 100 * self.multiplier())
            self.lines_cleared += lines
            self.broken_lines += lines ** 2
            # Level goes up every `per_level` weighted lines, capped at MAX_LEVEL.
            self.level = min(MAX_LEVEL, self.start_level + self.broken_lines // self.per_level)

    def ghost_y(self):
        start = self.figure.y
        while not self.intersects():
            self.figure.y += 1
        landing = self.figure.y - 1
        self.figure.y = start
        return landing

    def go_space(self):
        """Hard drop: slam to the bottom, lock, and score HARD_DROP_POINTS per row."""
        dropped = 0
        while True:
            self.figure.y += 1
            if self.intersects():
                self.figure.y -= 1
                break
            dropped += 1
        self.score += dropped * HARD_DROP_POINTS
        self.freeze()

    def go_down(self, soft=False):
        """Move down one row. Returns False if the piece locked instead."""
        self.figure.y += 1
        if self.intersects():
            self.figure.y -= 1
            self.freeze()
            return False
        if soft:
            self.score += SOFT_DROP_POINTS
        return True

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
        """Rotate, nudging sideways (ROTATE_KICKS) if the turn would hit a wall or the stack."""
        old_rotation = self.figure.rotation
        old_x = self.figure.x
        self.figure.rotate()
        for dx in ROTATE_KICKS:
            self.figure.x = old_x + dx
            if not self.intersects():
                return True
        self.figure.rotation = old_rotation
        self.figure.x = old_x
        return False


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
    difficulty = read_difficulty()

    # Optional match rules, all off by default:
    #   ?time=120    -> the game ends with outcome "timeout" after 120 seconds of play
    #   ?target=5000 -> the game ends with outcome "win" once the score reaches 5000
    # Desktop: argv[3] = time limit, argv[4] = target score.
    time_limit = read_positive("time", 3)
    target_score = read_positive("target", 4)

    game = Tetris(ROWS, COLS, difficulty, make_rng())
    game.new_figure()

    dt = 0.0
    play_time = 0.0
    fall_timer = 0.0
    soft_timer = 0.0
    seen_spawns = 0
    key_down = False    # down arrow held
    touch_down = False  # finger dragged downward
    g_active = False    # a touch / mouse gesture is in progress
    g_x0 = g_y0 = g_anchor = g_t0 = 0
    g_moved = False
    last_sent = None
    end_outcome = "lose"
    end_sent = False
    running = True

    while running:
        if game.state == "start":
            play_time += dt

            if game.spawns != seen_spawns:  # a new piece appeared: start its fall fresh
                seen_spawns = game.spawns
                fall_timer = 0.0

            # Gravity: smooth, time-based, and each piece falls at its own pace.
            interval = max(0.02, fall_interval(game.level) / game.figure.speed)
            fall_timer += dt
            while fall_timer >= interval and game.state == "start":
                fall_timer -= interval
                spawned_before = game.spawns
                game.go_down()
                if game.spawns != spawned_before:  # it locked: the next piece starts fresh
                    fall_timer = 0.0
                    break

            # Soft drop (down arrow or dragging down). Only matters when it beats gravity.
            if (key_down or touch_down) and game.state == "start" and SOFT_DROP_INTERVAL < interval:
                soft_timer += dt
                while soft_timer >= SOFT_DROP_INTERVAL and game.state == "start":
                    soft_timer -= SOFT_DROP_INTERVAL
                    spawned_before = game.spawns
                    game.go_down(soft=True)
                    if game.spawns != spawned_before:
                        soft_timer = 0.0
                        break
            else:
                soft_timer = 0.0

            # Optional match rules.
            if game.state == "start":
                if target_score is not None and game.score >= target_score:
                    game.state = "gameover"
                    end_outcome = "win"
                elif time_limit is not None and play_time >= time_limit:
                    game.state = "gameover"
                    end_outcome = "timeout"

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
                    game = Tetris(ROWS, COLS, difficulty, make_rng())
                    game.new_figure()
                    seen_spawns = -1
                    play_time = 0.0
                    fall_timer = 0.0
                    soft_timer = 0.0
                    last_sent = None
                    end_outcome = "lose"
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
        time_left = None
        if time_limit is not None:
            time_left = max(0, int(math.ceil(time_limit - play_time)))
        snapshot = (game.score, game.lines_cleared, game.level,
                    game.next_figure.type, game.next_figure.rotation, time_left)
        if snapshot != last_sent:
            last_sent = snapshot
            report_state(game, time_left)

        if game.state == "gameover" and not end_sent:
            end_sent = True
            report_end(game, end_outcome)

        pygame.display.flip()
        dt = min(clock.tick(FPS) / 1000.0, MAX_DT)
        await asyncio.sleep(0)  # hands control back to the browser every frame

    pygame.quit()


asyncio.run(main())
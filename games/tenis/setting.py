# setting.py
import pygame

# Screen
WIDTH = 1200
HEIGHT = 700
FPS = 60

# Colours
BACKGROUND = (20, 30, 40)
COURT_GREEN = (40, 140, 80)
COURT_LINE = (255, 255, 255)
PLAYER_1_COLOR = (50, 120, 255)
PLAYER_2_COLOR = (255, 80, 80)
BALL_COLOR = (255, 220, 50)
NET_COLOR = (230, 230, 230)
MENU_BG = (30, 30, 50)
BUTTON_COLOR = (100, 100, 180)
BUTTON_HOVER = (140, 140, 220)
TEXT_COLOR = (255, 255, 255)

# Court
COURT = pygame.Rect(100, 100, WIDTH - 200, HEIGHT - 180)
GROUND_Y = COURT.bottom   # kept for compatibility, but no gravity

# Players
PLAYER_WIDTH = 45
PLAYER_HEIGHT = 90
PLAYER_SPEED = 7

# Ball
BALL_RADIUS = 20
BALL_SPEED_X = 5
BALL_SPEED_Y = 0
# Wall bounce factor (replaces old ground bounce)
WALL_BOUNCE_FACTOR = 0.9

# Ball physics
BALL_DECAY = 0.998          # per-frame velocity multiplier (air resistance)
BALL_HIT_SPEED_X = 7        # horizontal speed after hitting a player
BALL_HIT_SPEED_Y = 7        # vertical speed after hitting a player

# Score
WIN_SCORE = 5

# History file
HISTORY_FILE = "history.json"
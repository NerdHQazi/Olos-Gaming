import pygame
from pygame import event, Vector2

MAX_FPS = 60
SCREEN_WIDTH = 1920
SCREEN_HEIGHT = 1080
SCREEN_CENTER = Vector2(SCREEN_WIDTH, SCREEN_HEIGHT) / 2
DISPLAY_FLAGS = pygame.FULLSCREEN | pygame.SCALED

# Both COLUMNS and ROWS should always be odd so that CENTER_COLUMN and CENTER_ROW will be correct.
COLUMNS = 21  # Should always be odd.
ROWS = 19
CENTER_COLUMN = COLUMNS // 2
CENTER_ROW = ROWS // 2

# Evenly spaced out points along the screen from top left to bottom right for positioning assets.
POINTS = [[None for x in range(COLUMNS)] for y in range(ROWS)]
for y in range(ROWS):
    for x in range(COLUMNS):
        POINTS[y][x] = Vector2(SCREEN_WIDTH * (x / (COLUMNS - 1)), SCREEN_HEIGHT * (y / (ROWS - 1)))

# Custom events for pygame's event queue.
BUTTON_PRESSED = event.custom_type()
NULL_EVENT = event.custom_type()
TEXTBOX_ENTRY = event.custom_type()
TRANSITION_START = event.custom_type()
TRANSITION_END = event.custom_type()
TRANSITION_PAUSED = event.custom_type()
GAME_OVER = event.custom_type()
PLAYER_QUIT = event.custom_type()

TURN_STARTED = event.custom_type()
TURN_CANCELED = event.custom_type()
TURN_ENDED = event.custom_type()
CPU_TURN = event.custom_type()
FRAME_TIMER = event.custom_type()

BLACK_WINS = event.custom_type()
RED_WINS = event.custom_type()
NETWORK_ERROR = event.custom_type()
MESSAGE_RECEIVED = event.custom_type()
START_ATTEMPT = event.custom_type()

# Constants for the game board modes.
LOCAL_HUMAN = 0
LOCAL_CPU = 1
LAN_HOST = 2
LAN_JOIN = 3

# Network constants.
START_MESSAGE = "START"
BOARD_STATE_MESSAGE = "BOARD"
BOARD_SPECIFICATION_MESSAGE = "SPECS"
CLIENT_LEFT_MESSAGE = "CLIENT LEFT"

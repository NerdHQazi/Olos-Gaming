from pygame import Vector2, Rect, draw, Surface
from pygame.event import Event
from config import FRAME_TIMER, SCREEN_HEIGHT, SCREEN_WIDTH
from asset import Asset
from colors import *


class CheckeredBackground(Asset):
    """
    Asset for the moving background show in the menus for checkers.

    Parameters:
        None.

    Attributes:
        velocity: The speed and direction of the backgrounds movement as a Vector2.
        square_size: The size of the individual checkered squares in the background.
    """

    SQUARE_SIZE = 80
    VELOCITY = Vector2(20, 20)

    def __init__(self) -> object:
        super().__init__(Vector2(0, 0))
        self.velocity = CheckeredBackground.VELOCITY
        self.square_size = CheckeredBackground.SQUARE_SIZE

    def process(self, events: list[Event]) -> None:
        """Moves the position point accordingly based on the time between frames and velocity."""
        dt = 0
        for e in events:
            if e.type == FRAME_TIMER:
                dt = e.dt
        self.position += self.velocity * dt

        # Keep the position's horizontal displacement within bounds.
        while abs(self.position.x) > self.square_size:
            self.position += (1 if self.velocity.x < 0 else -1) * Vector2(self.square_size, 0)

        # Keep the position's vertical displacement within bounds.
        while abs(self.position.y) > self.square_size:
            self.position += (1 if self.velocity.y < 0 else -1) * Vector2(0, self.square_size)

    def draw(self, screen: Surface) -> None:
        """Draws the background on the screen."""
        for y in range(-1, int(SCREEN_HEIGHT / self.square_size) + 2):
            for x in range(-1, int(SCREEN_WIDTH / self.square_size) + 2):
                color = RED if (x + y) % 2 else BLACK
                square_position = self.position + (x * self.square_size, y * self.square_size)
                square = Rect(square_position, (self.square_size, self.square_size))
                draw.rect(screen, color, square)

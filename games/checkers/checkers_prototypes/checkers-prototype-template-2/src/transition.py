from pygame import draw, Surface
from pygame.event import Event, post

from asset import Asset
from colors import *
from config import *


class Transition(Asset):
    """
    Transition animation of a growing black circle for seamless transitions between scenes.

    Arguments:
        assets: A list of Assets to swap to when the screen is black (i.e. the transition is "paused".)

    Keyword Arguments:
        color: The color of the transition circle.
        speed: The speed at which the circle radius grows.
    """
    COLOR = BLACK
    SPEED = 2500

    def __init__(self,
                 assets: list[Asset],
                 color: tuple[int, int, int] = COLOR,
                 speed: int = SPEED
                 ) -> object:

        super().__init__(SCREEN_CENTER)
        self.color = color
        self.velocity = abs(speed)
        self.radius = 0
        self.assets = assets

    def process(self, events: list[Event]) -> None:
        """Extracts dt from the event queue to update the size of the transition circle and checks if it finished."""
        dt = 0
        for e in events:
            if e.type == FRAME_TIMER:
                dt = e.dt

        self.radius += self.velocity * dt
        if self.radius > (SCREEN_WIDTH + SCREEN_HEIGHT):  # Check if the transition is paused.
            self.radius = SCREEN_WIDTH + SCREEN_HEIGHT
            self.velocity *= -1
            post(Event(TRANSITION_PAUSED, assets=self.assets))
        elif self.radius < 0:  # Check if the transition ended.
            post(Event(TRANSITION_END))

    def draw(self, screen: Surface) -> None:
        """Draws the textbox on the screen."""
        draw.circle(screen, self.color, SCREEN_CENTER, self.radius)

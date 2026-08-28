from label import Label
from colors import *  # import color constants (RGB)
from pygame import Surface, Vector2, MOUSEBUTTONDOWN, font, mouse
from config import BUTTON_PRESSED
from pygame.event import Event, post


class Button(Label):
    """
    Class that represents a button that places an event on pygame's event queue when clicked on.

    Parameters:
        text: Text displayed on the button.

    Keyword Arguments:
        event_type: Integer corresponding to the event to place on the queue when clicked on.
        highlight_color: Color of the highlight for the button when the mouse is hovering over it.
        highlight_transparency: Transparency of the highlight for the button.
    """

    HIGHLIGHT_COLOR = WHITE
    HIGHLIGHT_TRANSPARENCY = 0.5

    def __init__(self,
                 text: str,
                 event_type: int = BUTTON_PRESSED,
                 highlight_color: tuple = HIGHLIGHT_COLOR,
                 highlight_transparency: float = HIGHLIGHT_TRANSPARENCY,
                 **kwargs,
                 ) -> object:

        super().__init__(text, **kwargs)

        self.normal_surface = self.icon
        self.event_on_press = Event(event_type, text=text, identifier=id(self))

        # Create a copy of the button surface and add a highlight filter over it for user feedback.
        highlight = Surface((self.normal_surface.get_width(), self.normal_surface.get_height()))
        highlight.fill(highlight_color)
        highlight.set_alpha(255 * highlight_transparency)

        self.highlight_surface = self.normal_surface.copy()
        self.highlight_surface.blit(highlight, (0, 0))

        # Create a rect for checking if the cursor is over the button.
        self.hitbox = self.normal_surface.get_rect(topleft=self.position)
        self.enabled = True

    def set_pos(self, position: Vector2) -> None:
        """Sets the position of the button's top-left corner."""
        self.position = position
        self.hitbox = self.normal_surface.get_rect(topleft=position)

    def disable(self):
        self.enabled = False
        self.icon = self.normal_surface

    def process(self, events: list[Event]) -> None:
        """Updates the button's state depending on the mouse position and checks for clicks."""
        if self.hitbox.collidepoint(Vector2(mouse.get_pos())):
            self.icon = self.highlight_surface
            for e in events:  # Check if user left-clicked while hovering over the button.
                if e.type == MOUSEBUTTONDOWN and mouse.get_pressed(3)[0]:
                    post(self.event_on_press)
        else:  # Otherwise, the normal button surface is displayed.
            self.icon = self.normal_surface

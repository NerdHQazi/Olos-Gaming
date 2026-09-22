from pygame import MOUSEBUTTONDOWN, Rect, KEYDOWN, K_BACKSPACE, K_RETURN
from pygame.event import Event, post

from asset import Asset
from colors import *
from config import *
from label import Label


class TextBox(Asset):
    """
    A textbox for entering character data while in the application.

    Keyword Arguments:
        position: The position of the top-left corner of the textbox.
        font_size: Vertical height of the text characters in pixels.
        initial_text: Starting text displayed on the screen in the textbox.
        alignment: The positioning of the text inside the textbox.
        active_color: Color of the border when the textbox is active.
        inactive_color: Color of the border when the textbox is inactive.
        min_width: Minimum width of the textbox when it is empty.
        character_limit: Maximum number of characters that can be entered in the textbox.
        enabled_characters: The characters that are considered valid input for the textbox.
    """

    ACTIVE_COLOR = LIGHT_BLUE
    INACTIVE_COLOR = WHITE
    BORDER_THICK = 5
    H_PADDING = 5
    V_PADDING = 5
    FILL_COLOR = GREY
    MIN_WIDTH = 200
    FONT_SIZE = 50
    CHAR_LIMIT = 0

    NUMBERS = "0123456789"
    LOWER_LETTERS = "abcdefghijklmnopqrstuvwxyz"
    UPPER_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    SYMBOLS = " ,./;'[]-="
    ALPHABET = LOWER_LETTERS + UPPER_LETTERS
    ALL_CHARS = NUMBERS + LOWER_LETTERS + UPPER_LETTERS + SYMBOLS

    def __init__(self,
                 position: Vector2 = Vector2(0, 0),
                 font_size: int = FONT_SIZE,
                 initial_text: str = '',
                 alignment: str = "left",
                 active_color: tuple = ACTIVE_COLOR,
                 inactive_color: tuple = INACTIVE_COLOR,
                 min_width: int = MIN_WIDTH,
                 character_limit: int = CHAR_LIMIT,
                 enabled_characters: str = ALL_CHARS,
                 **kwargs
                 ) -> object:

        super().__init__(position)
        self.font_size = font_size
        self.text = initial_text
        self.alignment = alignment
        self.active_color = active_color
        self.inactive_color = inactive_color
        self.min_width = min_width
        self.char_limit = character_limit
        self.enabled_chars = enabled_characters
        self.kwargs = kwargs
        self.color = inactive_color
        self.active = False

        self.text_label: Label = None
        self.hitbox = None
        self.width = 0
        self.height = 0
        self.create_label()

        self.enabled = True

    def create_label(self):
        """Internally creates the label surface for displaying the text and adjusts the hitbox accordingly."""
        self.text_label = Label(text=self.text,
                                position=self.position,
                                font_size=self.font_size,
                                min_width=self.min_width,
                                alignment=self.alignment,
                                border_color=self.color,
                                **self.kwargs)
        self.hitbox = Rect(self.position, self.text_label.get_dimensions())
        self.width = self.text_label.get_width()
        self.height = self.text_label.get_height()

    def set_value(self, text: str) -> None:
        """Sets the value of the textbox (self.text)."""
        self.text = text

    def get_value(self) -> str:
        """Returns the value of the textbox (self.text)."""
        return self.text

    def set_pos(self, position: Vector2) -> None:
        """Sets the position of the top-left corner of the textbox."""
        self.position = position
        self.text_label.set_pos(position)
        self.hitbox = Rect(self.position, self.text_label.get_dimensions())

    def center(self, position: Vector2) -> None:
        """Centers the textbox around the specified position."""
        self.position = position - (Vector2(self.width, self.height) / 2)
        self.set_pos(position)

    def process(self, events: list[Event]) -> None:
        """Checks for user input and key presses to update the textbox via the event queue."""
        if not self.enabled:
            self.active = False

        altered = False
        for e in events:
            if e.type == MOUSEBUTTONDOWN and self.enabled:
                # Check if the user clicked on the textbox.
                if self.hitbox.collidepoint(e.pos):
                    self.active = not self.active  # Toggling the textbox.
                    altered = True
                else:  # Otherwise, deactivate the box.
                    if self.active:
                        altered = True
                    self.active = False
                    self.color = self.inactive_color

            elif e.type == KEYDOWN:
                if self.active:
                    altered = True
                    if e.key == K_BACKSPACE:  # Remove the last character from the text.
                        self.text = self.text[:-1]
                    elif e.unicode in self.enabled_chars:
                        self.text += e.unicode
                    elif e.key == K_RETURN:
                        post(Event(TEXTBOX_ENTRY, identifier=id(self), value=self.text))
                        self.text = ''
                    if self.char_limit > 0:
                        self.text = self.text[:self.char_limit]

            if altered:  # Render the new text and recalculate the hitbox.
                self.color = self.active_color if self.active else self.inactive_color
                self.create_label()

    def draw(self, screen) -> None:
        """Draws the textbox with current text on the screen."""
        self.text_label.draw(screen)

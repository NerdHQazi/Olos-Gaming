from pygame import Vector2
from pygame.event import Event

from asset import Asset
from button import Button
from label import Label


class Notification(Asset):

    V_PADDING = 40
    H_PADDING = 40

    def __init__(self,
                 text: str,
                 options: list[str],
                 position: Vector2 = Vector2(0, 0),
                 option_width: int = 0,
                 **kwargs):

        super().__init__(position)
        self.options: list[Button] = []
        for option in options:
            self.options.append(Button(option, **kwargs, min_width=option_width))

        self.message = Label(text, min_width=option_width, border_thickness=0, **kwargs)

        self.icon_num = len(options) + 1  # Number of icons to be displayed on the notification (options and message).
        width = self.message.get_width() + (Notification.H_PADDING + Label.BORDER_THICK) * 2
        height = (Label.BORDER_THICK * 2) + self.message.get_height()
        height += (Notification.V_PADDING * 2)
        for option in self.options:
            height += Notification.V_PADDING + option.get_height()

        self.backdrop = Label(text='', min_width=width, min_height=height, **kwargs)
        self.width = self.backdrop.get_width()
        self.height = self.backdrop.get_height()
        self.position = position
        self.set_pos(self.position)
        self.enabled = True

    def set_pos(self, position: Vector2) -> None:
        """Sets the position of the top-left corner of the notification."""
        self.backdrop.set_pos(position)
        center_x = position.x + (self.width / 2)
        y = position.y + Label.BORDER_THICK + Notification.V_PADDING

        for icon in [self.message] + self.options:
            x = center_x - (icon.get_width() / 2)
            icon.set_pos(Vector2(x, y))
            y += icon.get_height() + Notification.V_PADDING

    def center(self, position: Vector2):
        """Centers the notification's position around the given Vector2."""
        self.set_pos(position - Vector2(self.width, self.height) / 2)

    def process(self, events: list[Event]) -> None:
        """Updates each asset that needs to be updated in self.options."""
        for option in self.options:
            option.update(events)

    def get_width(self) -> int:
        """Returns the width of the notification backdrop, including the border thickness."""
        return self.width

    def get_height(self) -> int:
        """Returns the height of the notification backdrop, including the border thickness."""
        return self.height

    def get_dimensions(self) -> Vector2:
        """Returns the width and height of the notification backdrop as a Vector2."""
        return Vector2(self.width, self.height)

    def draw(self, screen) -> None:
        """Draws the entire notification menu to the screen."""
        self.backdrop.draw(screen)
        self.message.draw(screen)
        for option in self.options:
            option.draw(screen)

from pygame import Surface, Vector2, transform
from pygame.event import Event

from asset import Asset
from button import Button
from config import BUTTON_PRESSED
from filepaths import ARROW_ICON


class RadioButtonGroup(Asset):
    """
    Radio button asset ("selector" options) to toggle between a set number of options.

    Arguments:
        buttons: Dictionary of strings for the text of each button and their corresponding values.

    Keyword Arguments:
        position: The top-left corner of the area the asset occupies.
        icon_scale: The scale factor for the arrow icon that indicates which radio button in the group is selected.
        vertical_separation: Vertical separation in pixels between the radio buttons within the group.
        horizontal_separation: Horizontal separation in pixels between the radio buttons and the arrow icon.
    """

    VERTICAL_SEPARATION: int = 10
    HORIZONTAL_SEPARATION: int = 10

    def __init__(self,
                 buttons: dict[str, str],
                 position: Vector2 = Vector2(0, 0),
                 icon_scale: float = 1,
                 vertical_separation: int = VERTICAL_SEPARATION,
                 horizontal_separation: int = HORIZONTAL_SEPARATION,
                 **kwargs
                 ) -> object:

        super().__init__(position)

        self.buttons: list[RadioButton] = []
        self.vertical_separation = vertical_separation
        self.horizontal_separation = horizontal_separation

        for text, value in buttons.items():
            self.buttons.append(RadioButton(position=(0, 0), text=text, value=value, **kwargs))

        self.width = max(list(map(lambda b: b.get_width(), self.buttons)))  # Largest width out of self.buttons.
        self.button_height = self.buttons[0].get_height()  # Every button in the group is the same height.
        self.height = self.button_height * len(self.buttons) + (vertical_separation * (len(self.buttons) - 1))

        # Reposition all the buttons to the correct position based on their order in the group and position of self.
        for index, button in enumerate(self.buttons):
            x = self.position.x + (self.width - button.get_width()) / 2
            y = self.position.y + (button.get_height() + self.vertical_separation) * index
            button.set_pos(Vector2(x, y))

        self.selected_button = self.buttons[0]  # The default and initially selected Button is the first created Button.

        # Scale the arrow icon so that the height of the icon is equal to the button height.
        resolution = (int(ARROW_ICON.get_width() * icon_scale), int(ARROW_ICON.get_height() * icon_scale))
        self.arrow_icon = transform.scale(ARROW_ICON.copy(), resolution)
        self.enabled = True

    def get_value(self):
        """Returns the value of the selected button in the group, i.e. the overall value of the group."""
        return self.selected_button.get_value()

    def get_width(self):
        """Returns the largest width out of the buttons within the group."""
        return self.width

    def set_pos(self, position: Vector2):
        """Sets the position of the top-left corner of the button group."""
        dx = self.position - position  # Calculate the change in position.
        self.position = position

        # Apply the change in position to each button.
        for button in self.buttons:
            button.set_pos(button.get_pos() - dx)

    def center(self, position: Vector2) -> None:
        """Centers the label's position around the specified position."""
        x = position.x - (self.width / 2)
        y = position.y - (self.height / 2)
        self.set_pos(Vector2(x, y))

    def process(self, events: list[Event]) -> None:
        """Updates each button within the button group."""
        identifier = None
        for e in events:  # Get the id of any button that was clicked on last frame (can only be one per frame).
            if e.type == BUTTON_PRESSED:
                identifier = e.identifier

        for button in self.buttons:  # Check if one of the buttons in the group was selected.
            if identifier == id(button):
                self.selected_button = button
            button.update(events)

    def draw(self, screen: Surface):
        """Draws the each button in the button group on the screen."""
        for button in self.buttons:
            if button == self.selected_button:  # Draw the arrow icon for the selected button.
                button_position = button.get_pos()
                x = button_position.x - (self.arrow_icon.get_width() + self.horizontal_separation)
                y = button_position.y - (self.arrow_icon.get_height() - self.button_height) / 2
                screen.blit(self.arrow_icon, Vector2(x, y))

            button.draw(screen)


class RadioButton(Button):
    """Internal class used privately by RadioButtonGroup for the individual buttons."""
    def __init__(self,
                 position: Vector2,
                 text: str,
                 value: str,
                 **kwargs,
                 ) -> object:

        super().__init__(position=position, text=text, **kwargs)

        self.value = value

    def get_value(self) -> str:
        """Returns the value of the radio button."""
        return self.value


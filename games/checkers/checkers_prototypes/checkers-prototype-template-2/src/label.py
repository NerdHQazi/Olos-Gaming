from os.path import join

from pygame import Surface, Vector2, font

from asset import Asset
from colors import *


class Label(Asset):

    """
    Class for a box icon that displays text.

    Parameters:
        text: The text to display on the label, newline characters are not rendered.

    Keyword Arguments:
        position: The position of the label.
        font_size: The vertical length of the font in pixels
        font_color: The color of the text.
        font_file: The filename for the font.
        background_color: The background color of the label. This is the area immediately surrounding the text.
        border_color: The color of the border surrounding the label.
        border_thickness: The thickness of the border surrounding the text.
        padding_x_left:  The amount of space from the text and the border on the left side the label.
        padding_x_right: The amount of space from the text and the border on the right side the label.
        padding_y_up: The amount of space from the text and the border on the top side the label.
        padding_y_down: The amount of space from the text and the border on the bottom side the label.
        alignment: Dictates which side of the text is padded when the label is less than the minimum height or width.
        min_width: The minimum width of the label in pixels , including the border thickness.
        min_height: The minimum height of the label in pixels, including the border thickness.
    """

    FONT_FILE = 'ancient.woff'
    FONT_COLOR = WHITE
    FONT_SIZE = 20
    FILL_COLOR = BLACK
    BORDER_COLOR = WHITE
    BORDER_THICK = 5
    PADDING = 10

    font.init()

    def __init__(self,
                 text: str,
                 position: Vector2 = Vector2(0, 0),
                 font_size: int = FONT_SIZE,
                 font_color: tuple = FONT_COLOR,
                 font_file: str = FONT_FILE,
                 background_color: tuple = FILL_COLOR,
                 border_color: tuple = BORDER_COLOR,
                 border_thickness: int = BORDER_THICK,
                 padding_x_left: int = (PADDING / 2),
                 padding_x_right: int = (PADDING / 2),
                 padding_y_up: int = (PADDING / 2),
                 padding_y_down: int = (PADDING / 2),
                 alignment: str = "center",
                 min_width: int = 0,
                 min_height: int = 0
                 ) -> object:

        super().__init__(position)
        self.text = text

        font_object = font.Font(join('../assets/fonts', font_file), font_size)
        font_surface = font_object.render(text, True, font_color)
        font_surface_width = font_surface.get_width()
        font_surface_height = font_surface.get_height()
        padding_x = padding_x_left + padding_x_right
        padding_y = padding_y_down + padding_y_up

        # Pad the text if the label is narrower than the minimum width.
        if font_surface_width + padding_x + (border_thickness * 2) < min_width:
            padding = min_width - (font_surface_width + border_thickness * 2)
            if alignment == "left":  # The text will be padded to the right.
                padding_x_right += padding
            elif alignment == "center":  # The text will be padded on both sides.
                padding_x_left += padding / 2
                padding_x_right += padding / 2
            else:  # The label is right aligned.
                padding_x_left += padding

        # Pad the text if the label is narrower than the minimum height.
        if font_surface_height + padding_y + (border_thickness * 2) < min_height:
            padding = min_height - (font_surface_height + border_thickness * 2)
            padding_y_down += padding / 2
            padding_y_up += padding / 2

        # Recalculate the total padding on both axes.
        padding_x = padding_x_left + padding_x_right
        padding_y = padding_y_down + padding_y_up
        background_width = font_surface_width + padding_x
        background_height = font_surface_height + padding_y
        label_surface = Surface((background_width, background_height))
        label_surface.fill(background_color)
        label_surface.blit(font_surface, (padding_x_left, padding_y_up))

        # If there is a border, create a new surface and blit the label on top.
        if border_thickness:
            border_width = background_width + (border_thickness * 2)
            border_height = background_height + (border_thickness * 2)

            border_surface = Surface((border_width, border_height))
            border_surface.fill(border_color)

            # Draw the button face of the button on the border surface.
            border_surface.blit(label_surface, (border_thickness, border_thickness))
            label_surface = border_surface

        self.icon = label_surface  # self.icon is the final surface that will be drawn on the screen each frame.
        self.width = label_surface.get_width()
        self.height = label_surface.get_height()
        self.enabled = False  # Label object does not have a update method and therefore does not need to be updated.

    def center(self, position: Vector2) -> None:
        """Centers the label's position around the specified position."""
        x = position.x - (self.width / 2)
        y = position.y - (self.height / 2)
        self.set_pos(Vector2(x, y))

    def get_width(self) -> int:
        """Returns the width of the label, including the border thickness."""
        return self.width

    def get_height(self) -> int:
        """Returns the height of the label, including the border thickness."""
        return self.height

    def get_dimensions(self) -> Vector2:
        """Returns the width and height of the label as a Vector2."""
        return Vector2(self.width, self.height)

    def draw(self, screen: Surface) -> None:
        """Draws the label on the screen."""
        screen.blit(self.icon, self.position)

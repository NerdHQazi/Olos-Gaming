from pygame.event import Event
from pygame import Vector2, Surface


class Asset:
    """
    A abstract class to represent a drawable, visual data to use with the pygame graphics library.

    Parameters:
        position: The top-left corner of the asset as a pygame Vector2.

    Attributes:
        enabled: Boolean value that determines whether or not the asset is updated when update method is called.

    """

    def __init__(self,
                 position: Vector2
                 ) -> object:

        self.position = position
        self.enabled = True

    def get_pos(self):
        """Gets the current position of the asset."""
        return self.position

    def set_pos(self, position: Vector2):
        """Sets the position of the asset."""
        self.position = position

    def enable(self):
        """Enables the asset's update function."""
        self.enabled = True

    def disable(self):
        """Disables the asset's update function."""
        self.enabled = False

    def update(self, events: list[Event]) -> None:
        """Updates the asset's state with pygame's event queue if the asset is enabled by calling self.process()."""
        if self.enabled:
            self.process(events)

    def process(self, events: list[Event]) -> None:
        """Function that is not meant to be directly called by the client, internally called by self.update()."""
        pass

    def draw(self, screen: Surface):
        """Draws the asset on the screen surface."""
        pass

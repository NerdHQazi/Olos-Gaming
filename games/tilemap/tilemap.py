import pygame

class TileMap:
    """
    A class responsible for rendering a 2D tilemap grid.
    """
    def __init__(self, grid: list[list[int]], tile_images: dict[int, pygame.Surface], tile_size: int = 32):
        """
        Initializes the TileMap.
        
        Args:
            grid (list[list[int]]): A 2D list representing the map layout with tile IDs.
            tile_images (dict[int, pygame.Surface]): A mapping from tile ID to a pygame Surface.
            tile_size (int): The pixel size of each tile (assumes square tiles). Defaults to 32.
        """
        self.grid = grid
        self.tile_images = tile_images
        self.tile_size = tile_size

    def draw(self, surface: pygame.Surface):
        """
        Draws the tilemap onto the given surface.
        
        Args:
            surface (pygame.Surface): The main Pygame display surface to draw on.
        """
        # Iterate over the grid rows and columns
        for row_index, row in enumerate(self.grid):
            for col_index, tile_id in enumerate(row):
                
                # Check if the tile_id exists in our tile_images dictionary
                if tile_id in self.tile_images:
                    tile_image = self.tile_images[tile_id]
                    
                    # Calculate the (x, y) pixel position based on grid indices
                    x_pos = col_index * self.tile_size
                    y_pos = row_index * self.tile_size
                    
                    # Blit (draw) the tile image onto the main surface
                    surface.blit(tile_image, (x_pos, y_pos))
                else:
                    # Graceful handling of invalid IDs:
                    # We simply skip drawing unknown tile IDs. 
                    # This prevents crashes without complicating the logic.
                    pass

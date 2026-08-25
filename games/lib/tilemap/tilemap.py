import pygame

class imageTileMap: #Fetches an image tilemap instead of a colour tilemap based on the provided file
    def __init__(self, tileset, width = 10, height = 10, rect = None):
        self.size = (height, width)
        self.tileset = tileset #some image reference
        self.map = np.zeros(size, dtype=int)
        
        h, w = self.size
        self.image = pygame.Surface((32*w, 32*h)) #32 because of the size of the tiles being tested. however, in full deployment, 32 becomes itself a variable.
        if rect:
            self.rect = pygame.Rect(rect)
        else:
            self.rect = self.image.get_rect()
        
    def render(self): #Show the tilemap as-is from file
        m, n = self.map.shape
        for i in range(m):
            for j in range(n):
                tile = self.tileset.tiles[self.map[i, j]]
                self.image.blit(tile, (j*32, i*32))

    def set_zero(self): #Fill the tilemap with the 0th tile
        self.map = np.zeros(self.size, dtype=int)
        print(self.map)
        print(self.map.shape)
        self.render()
    
    def __str__(self):
        return f'{self.__class__.__name__} {self.size}' 

    def set_random(self): #Fill the tilemap with random tiles
        n = len(self.tileset.tiles)
        self.map = np.random.randint(n, size=self.size)
        print(self.map)
        self.render()

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

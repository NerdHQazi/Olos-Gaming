import pygame
import sys
import os

# Ensure Python can find the local modules if this script is run from the root directory
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from csv_loader import load_csv_map
from tilemap import TileMap

def create_color_surface(width, height, color):
    """
    Helper function to create a solid colored Pygame Surface.
    This simulates loading actual image assets (.png) for our demonstration.
    """
    surface = pygame.Surface((width, height))
    surface.fill(color)
    return surface

def main():
    # Initialize Pygame
    pygame.init()
    
    # Configuration
    TILE_SIZE = 40
    # Our sample map.csv is 10 columns by 5 rows
    WINDOW_WIDTH = 10 * TILE_SIZE 
    WINDOW_HEIGHT = 5 * TILE_SIZE 
    FPS = 60
    
    # Set up the display
    screen = pygame.display.set_mode((WINDOW_WIDTH, WINDOW_HEIGHT))
    pygame.display.set_caption("Tilemap CSV Demonstration")
    clock = pygame.time.Clock()
    
    # Define some basic colors
    COLOR_GRASS = (34, 139, 34)   # ID 0
    COLOR_WALL = (128, 128, 128)  # ID 1
    COLOR_WATER = (30, 144, 255)  # ID 2
    
    # Create the tile images dictionary mapping tile IDs to Surfaces
    tile_images = {
        0: create_color_surface(TILE_SIZE, TILE_SIZE, COLOR_GRASS),
        1: create_color_surface(TILE_SIZE, TILE_SIZE, COLOR_WALL),
        2: create_color_surface(TILE_SIZE, TILE_SIZE, COLOR_WATER)
    }
    
    # Get the absolute path to map.csv to avoid relative path issues when running from different directories
    current_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(current_dir, 'map.csv')
    
    # Load the map grid from the CSV file
    map_grid = load_csv_map(csv_path)
    
    # Initialize the TileMap
    tile_map = TileMap(grid=map_grid, tile_images=tile_images, tile_size=TILE_SIZE)
    
    # Main game loop
    running = True
    while running:
        # 1. Event Handling
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE:
                    running = False
                    
        # 2. Rendering
        # Fill the background with black to clear the previous frame
        screen.fill((0, 0, 0))
        
        # Draw the tilemap
        tile_map.draw(screen)
        
        # Update the display
        pygame.display.flip()
        
        # 3. Frame Rate Control
        clock.tick(FPS)
        
    # Quit Pygame cleanly
    pygame.quit()
    sys.exit()

if __name__ == "__main__":
    main()

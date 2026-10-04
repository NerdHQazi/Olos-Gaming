"""
Classic Snake Game using Pygame
Features: Snake movement, food spawning, collision detection, scoring, game over screen
"""

import pygame
import random
import sys

# Initialize Pygame
pygame.init()

# Constants
WINDOW_WIDTH = 600
WINDOW_HEIGHT = 400
GRID_SIZE = 20
GRID_WIDTH = WINDOW_WIDTH // GRID_SIZE
GRID_HEIGHT = WINDOW_HEIGHT // GRID_SIZE

# Colors
BLACK = (0, 0, 0)
WHITE = (255, 255, 255)
GREEN = (0, 255, 0)
DARK_GREEN = (0, 200, 0)
RED = (255, 0, 0)
YELLOW = (255, 255, 0)
GRAY = (100, 100, 100)

# Direction constants
UP = (0, -1)
DOWN = (0, 1)
LEFT = (-1, 0)
RIGHT = (1, 0)

class Snake:
    """Snake class to handle snake logic and rendering"""
    
    def __init__(self):
        """Initialize the snake at the center of the screen"""
        self.length = 3
        start_x = GRID_WIDTH // 2
        start_y = GRID_HEIGHT // 2
        self.positions = [(start_x, start_y), (start_x - 1, start_y), (start_x - 2, start_y)]
        self.direction = RIGHT
        self.grow_pending = False
    
    def get_head_position(self):
        """Return the position of the snake's head"""
        return self.positions[0]
    
    def update(self):
        """Update snake position based on current direction"""
        current_head = self.get_head_position()
        x, y = self.direction
        new_head = (current_head[0] + x, current_head[1] + y)
        
        # Check if snake hits itself. The tail vacates its cell this frame
        # unless the snake is growing, so only exclude it when it moves away.
        body = self.positions[1:] if self.grow_pending else self.positions[1:-1]
        if new_head in body:
            return False
        
        # Check if snake hits wall
        if (new_head[0] < 0 or new_head[0] >= GRID_WIDTH or 
            new_head[1] < 0 or new_head[1] >= GRID_HEIGHT):
            return False
        
        # Add new head
        self.positions.insert(0, new_head)
        
        # Remove tail unless growing
        if not self.grow_pending:
            self.positions.pop()
        else:
            self.grow_pending = False
            self.length += 1
        
        return True
    
    def change_direction(self, new_direction):
        """Change direction if not opposite to current direction"""
        # Prevent moving in opposite direction
        if (new_direction[0] * -1, new_direction[1] * -1) != self.direction:
            self.direction = new_direction
    
    def grow(self):
        """Mark snake to grow on next update"""
        self.grow_pending = True
    
    def draw(self, surface):
        """Draw the snake on the surface"""
        for i, position in enumerate(self.positions):
            rect = pygame.Rect(position[0] * GRID_SIZE, position[1] * GRID_SIZE, 
                             GRID_SIZE - 1, GRID_SIZE - 1)
            
            # Draw head differently
            if i == 0:
                pygame.draw.rect(surface, DARK_GREEN, rect)
                pygame.draw.rect(surface, GREEN, rect, 2)
            else:
                pygame.draw.rect(surface, GREEN, rect)

class Food:
    """Food class to handle food spawning and rendering"""
    
    def __init__(self):
        """Initialize food at a random position"""
        self.position = (0, 0)
        self.randomize_position()
    
    def randomize_position(self, snake_positions=None):
        """Spawn food at a random position not occupied by snake"""
        if snake_positions is None:
            snake_positions = []
        
        while True:
            self.position = (random.randint(0, GRID_WIDTH - 1), 
                           random.randint(0, GRID_HEIGHT - 1))
            if self.position not in snake_positions:
                break
    
    def draw(self, surface):
        """Draw the food on the surface"""
        rect = pygame.Rect(self.position[0] * GRID_SIZE, self.position[1] * GRID_SIZE,
                         GRID_SIZE - 1, GRID_SIZE - 1)
        pygame.draw.rect(surface, RED, rect)
        # Add a small highlight for visual appeal
        highlight = pygame.Rect(self.position[0] * GRID_SIZE + 2, 
                               self.position[1] * GRID_SIZE + 2, 
                               GRID_SIZE // 3, GRID_SIZE // 3)
        pygame.draw.rect(surface, YELLOW, highlight)

class Game:
    """Main game class to handle game logic and rendering"""
    
    def __init__(self):
        """Initialize game window and game objects"""
        self.screen = pygame.display.set_mode((WINDOW_WIDTH, WINDOW_HEIGHT))
        pygame.display.set_caption("Snake Game")
        self.clock = pygame.time.Clock()
        self.font = pygame.font.Font(None, 36)
        self.small_font = pygame.font.Font(None, 24)
        
        # Game state
        self.reset_game()
        
        # Generate simple beep sounds using pygame
        self.generate_sounds()
    
    def generate_sounds(self):
        """Generate simple sound effects"""
        try:
            # Create simple beep sounds
            self.eat_sound = pygame.mixer.Sound(buffer=self.create_beep(440, 100))
            self.game_over_sound = pygame.mixer.Sound(buffer=self.create_beep(220, 300))
            self.eat_sound.set_volume(0.3)
            self.game_over_sound.set_volume(0.3)
        except:
            # If sound fails, set to None
            self.eat_sound = None
            self.game_over_sound = None
    
    def create_beep(self, frequency, duration):
        """Create a simple beep sound"""
        sample_rate = 22050
        n_samples = int(duration * sample_rate / 1000)
        buf = []
        
        for i in range(n_samples):
            value = int(4096 * ((i % (sample_rate // frequency)) < (sample_rate // frequency // 2)))
            buf.append([value, value])
        
        return pygame.sndarray.make_sound(buf)
    
    def reset_game(self):
        """Reset game to initial state"""
        self.snake = Snake()
        self.food = Food()
        self.food.randomize_position(self.snake.positions)
        self.score = 0
        self.game_over = False
        self.base_speed = 10
        self.speed = self.base_speed
    
    def handle_input(self):
        """Handle keyboard input"""
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                return False
            
            if event.type == pygame.KEYDOWN:
                if self.game_over:
                    # Game over screen controls
                    if event.key == pygame.K_SPACE or event.key == pygame.K_RETURN:
                        self.reset_game()
                    elif event.key == pygame.K_ESCAPE or event.key == pygame.K_q:
                        return False
                else:
                    # Arrow keys
                    if event.key == pygame.K_UP:
                        self.snake.change_direction(UP)
                    elif event.key == pygame.K_DOWN:
                        self.snake.change_direction(DOWN)
                    elif event.key == pygame.K_LEFT:
                        self.snake.change_direction(LEFT)
                    elif event.key == pygame.K_RIGHT:
                        self.snake.change_direction(RIGHT)
                    
                    # WASD keys
                    elif event.key == pygame.K_w:
                        self.snake.change_direction(UP)
                    elif event.key == pygame.K_s:
                        self.snake.change_direction(DOWN)
                    elif event.key == pygame.K_a:
                        self.snake.change_direction(LEFT)
                    elif event.key == pygame.K_d:
                        self.snake.change_direction(RIGHT)
                    
                    # Pause/Quit
                    elif event.key == pygame.K_ESCAPE or event.key == pygame.K_q:
                        return False
        
        return True
    
    def update(self):
        """Update game state"""
        if not self.game_over:
            # Move snake
            if not self.snake.update():
                self.game_over = True
                if self.game_over_sound:
                    self.game_over_sound.play()
                return
            
            # Check if snake ate food
            if self.snake.get_head_position() == self.food.position:
                self.snake.grow()
                self.score += 10
                self.food.randomize_position(self.snake.positions)
                
                # Play eat sound
                if self.eat_sound:
                    self.eat_sound.play()
                
                # Increase difficulty - speed up slightly every 5 foods
                if self.score % 50 == 0:
                    self.speed = min(self.speed + 1, 20)
    
    def draw(self):
        """Draw game state to screen"""
        # Clear screen
        self.screen.fill(BLACK)
        
        if not self.game_over:
            # Draw grid (optional, for visual appeal)
            for x in range(0, WINDOW_WIDTH, GRID_SIZE):
                pygame.draw.line(self.screen, GRAY, (x, 0), (x, WINDOW_HEIGHT), 1)
            for y in range(0, WINDOW_HEIGHT, GRID_SIZE):
                pygame.draw.line(self.screen, GRAY, (0, y), (WINDOW_WIDTH, y), 1)
            
            # Draw game objects
            self.food.draw(self.screen)
            self.snake.draw(self.screen)
            
            # Draw score
            score_text = self.small_font.render(f"Score: {self.score}", True, WHITE)
            self.screen.blit(score_text, (10, 10))
            
            # Draw length
            length_text = self.small_font.render(f"Length: {self.snake.length}", True, WHITE)
            self.screen.blit(length_text, (10, 35))
            
            # Draw speed indicator
            speed_text = self.small_font.render(f"Speed: {self.speed}", True, WHITE)
            self.screen.blit(speed_text, (WINDOW_WIDTH - 120, 10))
        else:
            # Game over screen
            game_over_text = self.font.render("GAME OVER", True, RED)
            score_text = self.font.render(f"Final Score: {self.score}", True, WHITE)
            length_text = self.small_font.render(f"Snake Length: {self.snake.length}", True, WHITE)
            restart_text = self.small_font.render("Press SPACE to Restart", True, YELLOW)
            quit_text = self.small_font.render("Press Q or ESC to Quit", True, YELLOW)
            
            # Center the text
            self.screen.blit(game_over_text, 
                           (WINDOW_WIDTH // 2 - game_over_text.get_width() // 2, 100))
            self.screen.blit(score_text, 
                           (WINDOW_WIDTH // 2 - score_text.get_width() // 2, 160))
            self.screen.blit(length_text, 
                           (WINDOW_WIDTH // 2 - length_text.get_width() // 2, 200))
            self.screen.blit(restart_text, 
                           (WINDOW_WIDTH // 2 - restart_text.get_width() // 2, 260))
            self.screen.blit(quit_text, 
                           (WINDOW_WIDTH // 2 - quit_text.get_width() // 2, 290))
        
        # Update display
        pygame.display.flip()
    
    def run(self):
        """Main game loop"""
        running = True
        
        while running:
            # Handle input
            running = self.handle_input()
            
            # Update game state
            self.update()
            
            # Draw
            self.draw()
            
            # Control frame rate
            self.clock.tick(self.speed)
        
        pygame.quit()
        sys.exit()

def main():
    """Entry point for the game"""
    game = Game()
    game.run()

if __name__ == "__main__":
    main()

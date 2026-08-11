import pygame
import pygame.sprite
import random, time, sys
from dictionary import Dictionary

# Color Constants
RED = (220, 53, 69)
DARK_RED = (180, 40, 50)
GREEN = (40, 167, 69)
DARK_GREEN = (28, 116, 48)
BLUE = (13, 110, 253)
LIGHT_BLUE = (135, 206, 250)
CYAN = (0, 188, 212)
WHITE = (255, 255, 255)
BLACK = (20, 20, 20)
DARK_GRAY = (45, 52, 54)
LIGHT_GRAY = (220, 220, 220)
SPACE_COLOR = (240, 230, 210)
PINK = (255, 182, 193)
ROSE = (240, 128, 128)
GOLD = (255, 193, 7)
YELLOW = (255, 235, 59)
WOOD = (222, 184, 135)
DARK_WOOD = (184, 134, 11)
PURPLE = (156, 39, 176)


def RANDOM_COLOR():
    return (random.randint(0, 255), random.randint(0, 255), random.randint(0, 255))


class Text:
    def __init__(self, text, font_size, color, position, align="center"):
        self.text = text
        self.font_size = font_size
        self.color = color
        self.position = position
        self.align = align
        self.font = pygame.font.Font(None, self.font_size)
        self.rendered_text = None

    def update(self, new_text, color=None):
        self.text = new_text
        if color:
            self.color = color
        self.rendered_text = None

    def render(self, screen):
        if self.rendered_text is None:
            self.rendered_text = self.font.render(self.text, True, self.color)
        text_width, text_height = self.rendered_text.get_size()
        if self.align == "center":
            x = self.position[0] - text_width // 2
        elif self.align == "right":
            x = self.position[0] - text_width
        else:  # left
            x = self.position[0]
        y = self.position[1]
        screen.blit(self.rendered_text, (x, y))


class WrapText:
    def __init__(self, text, font_size, color, position, max_width):
        self.text = text
        self.font_size = font_size
        self.max_width = max_width
        self.font = pygame.font.Font(None, self.font_size)
        self.color = color
        self.position = position
        self.lines = self.wrap_text()

    def wrap_text(self):
        words = self.text.split()
        lines = []
        current_line = []
        for word in words:
            if self.font.size(' '.join(current_line + [word]))[0] <= self.max_width:
                current_line.append(word)
            else:
                lines.append(' '.join(current_line))
                current_line = [word]
        if current_line:
            lines.append(' '.join(current_line))
        return lines

    def update_text(self, new_text, color=None):
        self.text = new_text
        if color:
            self.color = color
        self.lines = self.wrap_text()

    def render(self, screen):
        for i, line in enumerate(self.lines):
            text_surface = self.font.render(line, True, self.color)
            screen.blit(text_surface, (self.position[0], self.position[1] + i * self.font.get_linesize()))


class BordButton:
    """Represents a single cell square on the 15x15 Scrabble grid."""
    def __init__(self, x, y, width, height, active_color, inactive_color, outline_color, text=None):
        self.x = x
        self.y = y
        self.width = width
        self.height = height
        self.active_color = active_color
        self.inactive_color = inactive_color
        self.outline_color = outline_color
        self.rect = pygame.Rect(x, y, width, height)
        self.color = self.inactive_color
        self.text = text
        self.original_text = text
        self.textColor = BLACK
        self.font = pygame.font.Font(None, 20)
        self.sub_font = pygame.font.Font(None, 14)
        self.clicked = False
        self.is_draft = False
        self.is_locked = False
        self.points_val = 0

    def draw(self, surface):
        # Background
        pygame.draw.rect(surface, self.color, self.rect)
        
        # Border
        border_color = BLACK if (self.is_draft or self.is_locked) else self.outline_color
        border_width = 2 if self.is_draft else 1
        pygame.draw.rect(surface, border_color, self.rect, border_width)

        if self.text:
            if self.is_locked or self.is_draft:
                # Render letter tile (main letter centered slightly left-up, points in bottom-right)
                text_surf = self.font.render(self.text, True, self.textColor)
                text_rect = text_surf.get_rect(center=(self.rect.centerx - 2, self.rect.centery - 1))
                surface.blit(text_surf, text_rect)

                if self.points_val > 0 or self.text != '':
                    sub_surf = self.sub_font.render(str(self.points_val), True, BLACK)
                    sub_rect = sub_surf.get_rect(bottomright=(self.rect.right - 2, self.rect.bottom - 1))
                    surface.blit(sub_surf, sub_rect)
            else:
                # Render multiplier text label (e.g. 3W, 2L, S)
                text_surface = self.font.render(self.text, True, self.textColor)
                text_rect = text_surface.get_rect(center=self.rect.center)
                surface.blit(text_surface, text_rect)

    def handle_event(self, event):
        mouse_pos = getattr(event, 'pos', pygame.mouse.get_pos())
        if self.rect.collidepoint(mouse_pos):
            if not (self.is_locked or self.is_draft):
                self.color = self.active_color
            if event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
                self.clicked = True
        else:
            if not (self.is_locked or self.is_draft):
                self.color = self.inactive_color

    def reset(self):
        self.clicked = False


class Button:
    """Standard UI Action Button and Rack Tile representation."""
    def __init__(self, x, y, width, height, text, active_color, inactive_color, outlineSize=1, font_size=None, text_color=BLACK):
        self.x = x
        self.y = y
        self.width = width
        self.height = height
        self.text = text
        self.active_color = active_color
        self.inactive_color = inactive_color
        self.color = self.inactive_color
        self.textColor = text_color
        self.outlineSize = outlineSize
        self.selected = False
        self.clicked = False
        self.points_val = 0

        if font_size is None:
            self.font_size = max(14, min(self.width // max(1, len(self.text)) + 4, self.height - 10))
        else:
            self.font_size = font_size

        self.font = pygame.font.Font(None, self.font_size)
        self.sub_font = pygame.font.Font(None, 14)

    def draw(self, screen):
        fill_color = self.active_color if self.selected else self.color
        pygame.draw.rect(screen, fill_color, (self.x, self.y, self.width, self.height))
        if self.outlineSize > 0:
            border_col = BLACK if self.selected else DARK_GRAY
            pygame.draw.rect(screen, border_col, (self.x, self.y, self.width, self.height), self.outlineSize)

        text_surface = self.font.render(self.text, True, self.textColor)
        if self.points_val > 0 or self.text == '_':
            # Tile render with subscript points
            text_rect = text_surface.get_rect(center=(self.x + self.width // 2 - 3, self.y + self.height // 2 - 2))
            screen.blit(text_surface, text_rect)

            sub_surf = self.sub_font.render(str(self.points_val), True, self.textColor)
            sub_rect = sub_surf.get_rect(bottomright=(self.x + self.width - 3, self.y + self.height - 2))
            screen.blit(sub_surf, sub_rect)
        else:
            # Action button render
            text_rect = text_surface.get_rect(center=(self.x + self.width // 2, self.y + self.height // 2))
            screen.blit(text_surface, text_rect)

    def handle_event(self, event):
        mouse_pos = getattr(event, 'pos', pygame.mouse.get_pos())
        if self.x <= mouse_pos[0] <= self.x + self.width and self.y <= mouse_pos[1] <= self.y + self.height:
            if not self.selected:
                self.color = self.active_color
            if event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
                self.clicked = True
        else:
            if not self.selected:
                self.color = self.inactive_color

    def reset(self):
        self.clicked = False
        self.color = self.inactive_color


class BlankTileModal:
    """Modal dialog to select a letter A-Z when placing a Blank tile '_'."""
    def __init__(self, screen_width, screen_height):
        self.active = False
        self.screen_width = screen_width
        self.screen_height = screen_height
        self.selected_letter = None

        self.rect = pygame.Rect(screen_width // 2 - 200, screen_height // 2 - 120, 400, 240)
        self.buttons = []
        
        # Grid of A-Z buttons
        import string
        letters = string.ascii_uppercase
        btn_w, btn_h = 32, 32
        cols = 9
        start_x = self.rect.x + 20
        start_y = self.rect.y + 60

        for i, letter in enumerate(letters):
            row = i // cols
            col = i % cols
            bx = start_x + col * (btn_w + 6)
            by = start_y + row * (btn_h + 6)
            btn = Button(bx, by, btn_w, btn_h, letter, GOLD, WHITE, outlineSize=1, font_size=20)
            self.buttons.append((letter, btn))

    def show(self):
        self.active = True
        self.selected_letter = None

    def handle_event(self, event):
        if not self.active:
            return None

        for letter, btn in self.buttons:
            btn.handle_event(event)
            if btn.clicked:
                btn.reset()
                self.selected_letter = letter
                self.active = False
                return letter
        return None

    def draw(self, screen):
        if not self.active:
            return

        # Dim background
        overlay = pygame.Surface((self.screen_width, self.screen_height), pygame.SRCALPHA)
        overlay.fill((0, 0, 0, 150))
        screen.blit(overlay, (0, 0))

        # Dialog Box
        pygame.draw.rect(screen, SPACE_COLOR, self.rect)
        pygame.draw.rect(screen, BLACK, self.rect, 3)

        title = Text("Assign Blank Tile Letter (A-Z)", 24, BLACK, (self.rect.centerx, self.rect.y + 20))
        title.render(screen)

        for _, btn in self.buttons:
            btn.draw(screen)

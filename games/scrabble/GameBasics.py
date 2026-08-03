import pygame
import pygame.sprite
# ---------------
import nltk
import string
import random, time, sys
from nltk.corpus import wordnet
nltk.download('wordnet')
# color
def RANDOM_COLOR():
    return (random.randint(0,255),random.randint(0,255),random.randint(0,255))
RED = (255, 0, 0)
GREEN = (0, 255, 0)
BLUE = (0, 0, 255)
WHITE = (255, 255, 255)
BLACK = (0,0,0)
DARK_GRAY = (169,169,169)
SPACE_COLOR = (220,205,173,255)
PINK = (255,192,203)
LIGHT_BLUE = (173,216,230)
GOLD = (255,215,0)
YELLOW = (255,255,0)
# text
class Text:
    def __init__(self, text, font_size, color, position):
        self.text = text
        self.font_size = font_size
        self.color = color
        self.position = position
        self.font = pygame.font.Font(None, self.font_size)  # You can specify a font file or use None for default font
        self.rendered_text = None

    def update(self, new_text):
        self.text = new_text
        self.rendered_text = None  # Clear the rendered text to update it

    def render(self, screen):
        if self.rendered_text is None:
            self.rendered_text = self.font.render(self.text, True, self.color)
        text_width, text_height = self.rendered_text.get_size()
        x = self.position[0] - text_width // 2
        y = self.position[1]
        screen.blit(self.rendered_text, (x, y))
# wrap text
class WrapText:
    def __init__(self, text, font_size, color, position, max_width):
        self.text = text
        self.font_size = font_size
        self.max_width = max_width
        self.font = pygame.font.Font(None, self.font_size)
        self.lines = self.wrap_text()
        self.color = color
        self.position = position

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
        lines.append(' '.join(current_line))
        return lines

    def update_text(self, new_text):
        self.text = new_text
        self.lines = self.wrap_text()

    def render(self, screen):
        for i, line in enumerate(self.lines):
            text_surface = self.font.render(line, True, self.color)
            screen.blit(text_surface, (self.position[0], self.position[1] + i * self.font.get_linesize()))
# bord buttons
class BordButton:
    def __init__(self, x, y, width, height, active_color, inactive_color, outline_color, text=None):
        self.x = x
        self.y = y
        self.width = width
        self.height = height
        self.active_color = active_color
        self.inactive_color = inactive_color
        self.rect = pygame.Rect(x, y, width, height)
        self.color = self.inactive_color
        self.outline_color = outline_color
        self.hovered = False
        self.wordSpace = False
        self.text = text
        self.origional_text = text
        self.textColor = BLACK
        self.font = pygame.font.Font(None, 24)
        if self.text is not None:
            self.textColor = BLACK
            self.font_size = min(self.width // len(self.text) - 10, self.height)
            self.font = pygame.font.Font(None, self.font_size)
        self.clicked = False

    def draw(self, surface):
        pygame.draw.rect(surface, self.color, self.rect)
        pygame.draw.rect(surface, self.outline_color, self.rect, 2)

        if self.text:
            text_surface = self.font.render(self.text, True, self.textColor)
            text_rect = text_surface.get_rect(center=self.rect.center)
            surface.blit(text_surface, text_rect)

    def handle_event(self, event):
        mouse_pos = pygame.mouse.get_pos()
        if self.x < mouse_pos[0] < self.x + self.width and self.y < mouse_pos[1] < self.y + self.height:
            self.color = self.active_color
            if event.type == pygame.MOUSEBUTTONDOWN:
                if event.button == 1:
                    self.clicked = True
                    self.color = self.active_color
        else:
            self.color = self.inactive_color
                
    def reset(self):
        self.clicked = False
        self.color = self.color
# button
class Button:
    def __init__(self, x, y, width, height, text, active_color, inactive_color, outlineSize):
        self.x = x
        self.y = y
        self.width = width
        self.height = height
        self.text = text
        self.active_color = active_color
        self.inactive_color = inactive_color
        self.color = self.inactive_color
        self.ready = False
        self.textColor = BLACK
        self.font_size = min(self.width // len(self.text) - 10, self.height)
        self.font = pygame.font.Font(None, self.font_size)
        self.clicked = False
        self.outlineSize = outlineSize

    def draw(self, screen):
        pygame.draw.rect(screen, self.color, (self.x, self.y, self.width, self.height), self.outlineSize)
        text_surface = self.font.render(self.text, True, self.textColor)
        text_rect = text_surface.get_rect(center=(self.x + self.width // 2, self.y + self.height // 2))
        screen.blit(text_surface, text_rect)
    
    def handle_event(self, event):
        mouse_pos = pygame.mouse.get_pos()
        if self.x < mouse_pos[0] < self.x + self.width and self.y < mouse_pos[1] < self.y + self.height:
            self.color = self.active_color
            if event.type == pygame.MOUSEBUTTONDOWN:
                if event.button == 1:
                    self.clicked = True
                    self.color = self.active_color
        else:
            self.color = self.inactive_color

    def reset(self):
        self.clicked = False
        self.color = self.inactive_color
# define words
def get_word_definition(word):
    synsets = wordnet.synsets(word)
    if synsets:
        synset = synsets[0]
        definition = synset.definition()
        return definition
    else:
        return "None"

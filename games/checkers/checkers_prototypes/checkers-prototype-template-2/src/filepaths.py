"""Preloads all the sounds and images used in the checkers game."""
from pygame import image, mixer
import os

mixer.init()  # The pygame mixer needs to be initialized before loading sounds.

# Image objects:
RED_PAWN_ICON = image.load(os.path.join('../assets/images', 'red_pawn.png'))
BLACK_PAWN_ICON = image.load(os.path.join('../assets/images', 'grey_pawn.png'))
RED_KING_ICON = image.load(os.path.join('../assets/images', 'red_king.png'))
BLACK_KING_ICON = image.load(os.path.join('../assets/images', 'grey_king.png'))
ARROW_ICON = image.load(os.path.join('../assets/images', 'arrow.png'))

# Sound objects:
SOUND_BUTTON_FOCUS = mixer.Sound(os.path.join('../assets/sounds', 'button_focus.wav'))
SOUND_BUTTON_SELECT = mixer.Sound(os.path.join('../assets/sounds', 'button_select.wav'))
MAIN_THEME = os.path.join('../assets/sounds', 'test.mp3')

#Global libraries
import sys
import pygame
from pygame.locals import *
import os

#Make the sibling `lib` package importable no matter where this is run from.
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
GAMES_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, ".."))
if GAMES_DIR not in sys.path:
    sys.path.insert(0, GAMES_DIR)

from lib import tilemap
from lib.bounce_engine import Player, platform
from lib.tilemap.tilemap import Tileset, imageTileMap, TileMap

#Make sure to import all classes to be used individually

#Tile stuff
tileset = Tileset(os.path.join(GAMES_DIR, "assets", "tmw_desert_spacing.webp")) #Default tile size of 32*32 pixels and default margin and spacing of 1 pixel
tilemap = imageTileMap(tileset, 30, 20) #Tilemap width of 30 and height of 20
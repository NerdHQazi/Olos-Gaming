#Global libraries
import sys
import pygame
from pygame.locals import *
import os

#Replace path with local path. These are for non-environmental libraries
#sys.path.insert(0,"C:/Users/benon/OneDrive/Desktop/Olos-Gaming/games/")
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from lib import tilemap
from lib.bounce_engine import Player, platform
from lib.tilemap.tilemap import Tileset, imageTileMap, TileMap

#Make sure to import all classes to be used individually

#Tile stuff
tileset = Tileset("C:/Users/benon/OneDrive/Desktop/Olos-Gaming/games/assets/tmw_desert_spacing.webp") #Default tile size of 32*32 pixels and default margin and spacing of 1 pixel
tilemap = imageTileMap(tileset, 30, 20) #Tilemap width of 30 and height of 20
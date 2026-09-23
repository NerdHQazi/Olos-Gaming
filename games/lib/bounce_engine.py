import pygame
from pygame.locals import *
import sys
import random

pygame.init()
vec = pygame.math.Vector2 #2 for two dimensional

HEIGHT = 450
WIDTH = 400
ACC = 0.5
FRIC = -0.12
FPS = 60

FramePerSec = pygame.time.Clock()

displaysurface = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("Game")

class Player(pygame.sprite.Sprite):
    def __init__(self, file):
        super().__init__() 
        #self.image = pygame.image.load(file)
        self.surf = pygame.Surface((30, 30))
        self.surf.fill((128,255,40))
        self.rect = self.surf.get_rect()
  
        self.pos = vec((10, 360))
        self.vel = vec(0,0)
        self.acc = vec(0,0)

    def move(self):
        self.acc = vec(0,0.5)
   
        pressed_keys = pygame.key.get_pressed()
               
        if pressed_keys[K_LEFT]:
            self.acc.x = -ACC
        if pressed_keys[K_RIGHT]:
            self.acc.x = ACC
                
        self.acc.x += self.vel.x * FRIC
        self.vel += self.acc
        self.pos += self.vel + 0.5 * self.acc
        
        if self.pos.x > WIDTH:
            self.pos.x = 0
        if self.pos.x < 0:
            self.pos.x = WIDTH
            
        self.rect.midbottom = self.pos

    def jump(self):
        hits = pygame.sprite.spritecollide(self, platforms, False)
        if hits:
           self.vel.y = -15


    def update(self):
        hits = pygame.sprite.spritecollide(P1 ,platforms, False)
        if P1.vel.y > 0:        
            if hits:
                self.vel.y = 0
                self.pos.y = hits[0].rect.top + 1


class platform(pygame.sprite.Sprite):
    def __init__(self):
        super().__init__()
        self.surf = pygame.Surface((WIDTH, 20))
        self.surf.fill((255,0,0))
        self.rect = self.surf.get_rect(center = (WIDTH/2, HEIGHT - 10))

    def move(self):
        pass


class Projectile(pygame.sprite.Sprite):
    """A projectile that travels in a straight line until it leaves the world.

    Follows the existing engine sprite convention (surf / rect / pos / vel).
    It stays `active` while flying; leave the screen or call `deactivate()`
    and it becomes inactive / ready for removal.
    """
    def __init__(self, pos, vel=vec(0, 0), size=(10, 10),
                 color=(255, 255, 0), damage=1):
        super().__init__()
        self.surf = pygame.Surface(size)
        self.surf.fill(color)
        self.rect = self.surf.get_rect(center=pos)
        self.pos = vec(pos)
        self.vel = vec(vel)
        self.damage = damage
        self.active = True

    def update(self):
        if not self.active:
            return
        self.pos += self.vel
        self.rect.center = self.pos
        if (self.rect.right < 0 or self.rect.left > WIDTH or
                self.rect.bottom < 0 or self.rect.top > HEIGHT):
            self.active = False

    def draw(self, surface):
        if self.active:
            surface.blit(self.surf, self.rect)

    def deactivate(self):
        self.active = False


class Enemy(pygame.sprite.Sprite):
    """A simple patrolling enemy that walks back and forth.

    Basic lifecycle only: it stays `alive` until its health runs out (e.g.
    after being hit by a Projectile), at which point it stops updating.
    """
    def __init__(self, pos, speed=1.5, patrol_range=60, size=(30, 30),
                 color=(200, 60, 60), health=1):
        super().__init__()
        self.surf = pygame.Surface(size)
        self.surf.fill(color)
        self.rect = self.surf.get_rect(center=pos)
        self.pos = vec(pos)
        self.speed = speed
        self.direction = 1
        self.start_x = self.pos.x
        self.patrol_range = patrol_range
        self.health = health
        self.alive = True

    def update(self):
        if not self.alive:
            return
        self.pos.x += self.speed * self.direction
        if abs(self.pos.x - self.start_x) >= self.patrol_range:
            self.direction *= -1
        self.rect.center = self.pos

    def draw(self, surface):
        if self.alive:
            surface.blit(self.surf, self.rect)

    def take_damage(self, amount=1):
        self.health -= amount
        if self.health <= 0:
            self.alive = False
        return self.alive


'''
PT1 = platform()
P1 = Player()

all_sprites = pygame.sprite.Group()
all_sprites.add(PT1)
all_sprites.add(P1)

platforms = pygame.sprite.Group()
platforms.add(PT1)
'''

if __name__ == '__main__':
    while True: 
        for event in pygame.event.get():
            if event.type == QUIT:
                pygame.quit()
                sys.exit()
        '''
            if event.type == pygame.KEYDOWN:    
                if event.key == pygame.K_SPACE:
                    P1.jump()
        '''
        '''    
        displaysurface.fill((0,0,0))
        P1.update()

        for entity in all_sprites:
            displaysurface.blit(entity.surf, entity.rect)
            entity.move()
        '''

        pygame.display.update()
        FramePerSec.tick(FPS)
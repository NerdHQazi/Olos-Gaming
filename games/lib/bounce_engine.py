import pygame
from pygame.locals import *
import sys
import random

vec = pygame.math.Vector2 #2 for two dimensional

HEIGHT = 450
WIDTH = 400
ACC = 0.5
FRIC = -0.12
FPS = 60
BACKGROUND_COLOR = (18, 18, 32)
WINDOW_TITLE = "Olos Platformer"

# Player physics tuning, expressed per second so that behaviour does not depend
# on frame rate. These defaults reproduce the original frame-based feel at
# 60 fps: gravity 0.5 px/frame^2 -> 1800 px/s^2, jump 15 px/frame -> 900 px/s.
GRAVITY = 1800.0
JUMP_SPEED = 900.0
MOVE_ACCEL = 1800.0
GROUND_FRICTION = 0.85
MAX_FALL_SPEED = 900.0

# One physics step. `update()` defaults to this so a plain
# `pygame.sprite.Group.update()` still advances the player correctly.
FIXED_DT = 1.0 / 60.0

# `pygame.init()` and `display.set_mode()` deliberately do not run on import:
# importing this module must not pop open a window or require a display. The
# game loop in `main()` owns that setup instead.

class Player(pygame.sprite.Sprite):
    """A gravity-driven platformer character.

    The Player owns all of its state and reads nothing from module-level
    globals, so any number of independent players can exist in one level. The
    collection it collides against is supplied through the constructor.

    `update()` is the only per-frame entry point, which means driving the player
    from a `pygame.sprite.Group` works and cannot silently skip the physics
    step. Physics is integrated against `dt` (seconds) rather than a raw frame
    count, so the same elapsed time produces the same motion at any frame rate.
    """

    def __init__(self, platforms=None, pos=(10, 360), size=(30, 30),
                 color=(128, 255, 40), gravity=GRAVITY, jump_speed=JUMP_SPEED,
                 move_accel=MOVE_ACCEL, friction=GROUND_FRICTION,
                 max_fall_speed=MAX_FALL_SPEED):
        super().__init__()
        if platforms is None:
            platforms = pygame.sprite.Group()
        self.platforms = platforms

        self.gravity = gravity
        self.jump_speed = jump_speed
        self.move_accel = move_accel
        self.friction = friction
        self.max_fall_speed = max_fall_speed

        self.size = size
        self.surf = pygame.Surface(size)
        self.surf.fill(color)

        self.pos = vec(pos)
        self.vel = vec(0, 0)
        self.on_ground = False
        self._jump_queued = False

        self.rect = self.surf.get_rect(midbottom=self.pos)

    def press_jump(self):
        """Queue a jump for the next `update()`.

        Call this once per KEYDOWN event. Because the request is consumed by a
        single update, a held key can never launch a new jump every frame.
        """
        self._jump_queued = True

    def jump(self):
        """Jump if the player is standing on something.

        Returns True when the jump was applied, False when ignored because the
        player is airborne.
        """
        if not self.on_ground:
            return False
        self.vel.y = -self.jump_speed
        self.on_ground = False
        return True

    def update(self, dt=FIXED_DT):
        """Advance the player by `dt` seconds. Safe to call with no arguments."""
        if dt <= 0:
            return

        jump_queued = self._jump_queued
        self._jump_queued = False
        previous_feet = self.pos.y

        self._apply_input(dt)
        if jump_queued:
            self.jump()

        self.vel.y = min(self.vel.y + self.gravity * dt, self.max_fall_speed)
        self.pos += self.vel * dt

        # Vertical is resolved first: landing or a head bump changes which
        # platforms the body overlaps. Resolving the horizontal axis afterwards
        # means a player standing on a platform is never mistaken for one that
        # has got stuck inside it.
        self.rect.midbottom = self.pos
        self._resolve_vertical(previous_feet)
        self.rect.midbottom = self.pos
        self._resolve_horizontal()
        self.rect.midbottom = self.pos

    def move(self, dt=FIXED_DT):
        """Alias for `update()`, kept for the original engine loop."""
        self.update(dt)

    def draw(self, surface):
        surface.blit(self.surf, self.rect)

    def _apply_input(self, dt):
        pressed_keys = pygame.key.get_pressed()
        direction = 0
        if pressed_keys[K_LEFT]:
            direction -= 1
        if pressed_keys[K_RIGHT]:
            direction += 1

        if direction:
            self.vel.x += direction * self.move_accel * dt
        else:
            self.vel.x *= self.friction
            if abs(self.vel.x) < 1.0:
                self.vel.x = 0.0

    def _overlaps_x(self, other):
        return self.rect.left < other.right and self.rect.right > other.left

    def _overlaps(self, other):
        return (self._overlaps_x(other)
                and self.rect.top < other.bottom
                and self.rect.bottom > other.top)

    def _resolve_vertical(self, previous_feet):
        if self.vel.y < 0:
            self._resolve_head_bump(previous_feet)
            return

        self.on_ground = False
        for sprite in self.platforms:
            other = sprite.rect
            if not self._overlaps_x(other):
                continue
            # Land only when the feet crossed this platform's top edge during
            # this step. Testing the crossing (rather than plain overlap) keeps
            # the platforms one-way, so a player underneath is never pulled up
            # through them.
            if previous_feet <= other.top <= self.pos.y:
                self.pos.y = other.top
                self.vel.y = 0.0
                self.on_ground = True
                return

    def _resolve_head_bump(self, previous_feet):
        previous_top = previous_feet - self.size[1]
        for sprite in self.platforms:
            other = sprite.rect
            if not self._overlaps_x(other):
                continue
            # Only a platform the rising body actually reaches may stop the
            # jump. Merely being above the player is not enough, otherwise
            # jumping under any overhead ledge would cancel the jump and
            # teleport the player up to that ledge's underside.
            if previous_top >= other.bottom > self.rect.top:
                self.pos.y = other.bottom + self.size[1]
                self.vel.y = 0.0
                return

    def _resolve_horizontal(self):
        """Push the player back out of any platform it has moved into.

        This is what makes platforms solid: the player is stopped by the side
        of a block instead of walking straight through it.
        """
        for sprite in self.platforms:
            other = sprite.rect
            if not self._overlaps(other):
                continue

            if self.vel.x > 0:
                self.pos.x = other.left - self.size[0]
            elif self.vel.x < 0:
                self.pos.x = other.right
            else:
                # No horizontal motion (e.g. spawned inside geometry): eject
                # through whichever side is nearest.
                left_depth = self.rect.right - other.left
                right_depth = other.right - self.rect.left
                if left_depth <= right_depth:
                    self.pos.x = other.left - self.size[0]
                else:
                    self.pos.x = other.right
            self.vel.x = 0.0
            return


class platform(pygame.sprite.Sprite):
    """A static surface the player can stand on.

    Called with no arguments it is the original full-width floor at the bottom
    of the screen. Pass a `pygame.Rect` to place a ledge anywhere instead.
    Platforms are one-way: the player lands on top of them but is not blocked
    horizontally, and passes upward through them.
    """

    def __init__(self, rect=None, color=(255, 0, 0)):
        super().__init__()
        if rect is None:
            rect = pygame.Rect(0, HEIGHT - 20, WIDTH, 20)
        rect = pygame.Rect(rect)
        self.surf = pygame.Surface(rect.size)
        self.surf.fill(color)
        self.rect = self.surf.get_rect(topleft=rect.topleft)

    def update(self):
        """No-op, so platforms can share a sprite group with moving entities."""

    def move(self):
        pass

    def draw(self, surface):
        surface.blit(self.surf, self.rect)


class Projectile(pygame.sprite.Sprite):
    """A projectile that travels in a straight line until it leaves the world.

    Follows the existing engine sprite convention (surf / rect / pos / vel).
    It stays `active` while flying; leave the screen or call `deactivate()`
    and it becomes inactive / ready for removal.

    `vel` is in pixels per **second**, so the projectile travels the same
    distance in the same time regardless of frame rate.
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

    def update(self, dt=FIXED_DT):
        if not self.active or dt <= 0:
            return
        self.pos += self.vel * dt
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

    `speed` is in pixels per **second**, so the patrol covers the same ground
    in the same time regardless of frame rate.
    """
    def __init__(self, pos, speed=90.0, patrol_range=60, size=(30, 30),
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

    def update(self, dt=FIXED_DT):
        if not self.alive or dt <= 0:
            return
        self.pos.x += self.speed * self.direction * dt
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


class GameClock:
    """Turns real elapsed time into a whole number of fixed physics steps.

    A renderer can run at any speed, but the simulation must advance in
    identical `FIXED_DT` slices or the game would behave differently on a fast
    machine than on a slow one. Leftover time is carried over instead of being
    discarded, so the simulation does not slowly drift behind real time.

    After a long stall (a debugger pause, a dragged window) the accumulated time
    is clamped, otherwise the loop would try to catch up by running hundreds of
    steps in one frame and appear to freeze.
    """

    MAX_FRAME_TIME = 0.25

    def __init__(self, step=FIXED_DT):
        self.step = step
        self._accumulator = 0.0
        self.consumed_steps = 0

    def steps(self, elapsed):
        """Return how many fixed `update()` calls to run for `elapsed` seconds."""
        if elapsed <= 0:
            return 0
        self._accumulator += min(elapsed, self.MAX_FRAME_TIME)
        count = int(self._accumulator / self.step)
        self._accumulator -= count * self.step
        self.consumed_steps += count
        return count


class World:
    """Everything needed to simulate and draw one level.

    The player is stepped on fixed timesteps; the remaining actors are still
    frame-based (see `Projectile` / `Enemy`) and are stepped once per call, so
    they keep their original speed.
    """

    def __init__(self, platforms, player, actors=None, step=FIXED_DT,
                 background_color=BACKGROUND_COLOR):
        self.platforms = platforms
        self.player = player
        self.actors = actors if actors is not None else pygame.sprite.Group()
        self.background = pygame.Surface((WIDTH, HEIGHT))
        self.background.fill(background_color)
        self.clock = GameClock(step)
        self.frames = 0
        self.start_pos = vec(player.pos)

    def update(self, elapsed):
        """Advance the level by `elapsed` seconds of real time.

        Every actor is stepped on the same fixed `FIXED_DT` slices, so the whole
        level - not just the player - behaves identically at any frame rate.
        """
        step = self.clock.step
        for _ in range(self.clock.steps(elapsed)):
            self.player.update(step)
            for actor in self.actors:
                actor.update(step)
        self.frames += 1

    def draw(self, surface):
        surface.blit(self.background, (0, 0))
        for sprite in self.platforms:
            sprite.draw(surface)
        self.player.draw(surface)
        for actor in self.actors:
            actor.draw(surface)


def build_demo_level():
    """Assemble a small playable level and return it as a `World`."""
    floor = platform()
    ledges = [
        platform(pygame.Rect(110, 330, 110, 16)),
        platform(pygame.Rect(250, 250, 110, 16)),
    ]

    platforms = pygame.sprite.Group()
    platforms.add(floor, *ledges)

    player = Player(platforms, pos=(40, 380))

    actors = pygame.sprite.Group()
    actors.add(
        Enemy((300, HEIGHT - 35), speed=90.0, patrol_range=70),
        Projectile((20, 300), vel=vec(240, 0)),
    )

    return World(platforms, player, actors)


def main(max_frames=None, fps=FPS, world=None, clock=None):
    """Run the game. Returns the `World` once the loop exits.

    `max_frames` bounds the loop, which lets the smoke test drive a real
    window-and-event-loop cycle without a human closing it. It caps the
    world's cumulative `frames` counter, not the number of frames this call
    adds. `clock` and `world` are injection points for that test; by default
    the loop uses a real `pygame.time.Clock` and builds the demo level.
    """
    pygame.init()
    screen = pygame.display.set_mode((WIDTH, HEIGHT))
    pygame.display.set_caption(WINDOW_TITLE)
    if clock is None:
        clock = pygame.time.Clock()

    if world is None:
        world = build_demo_level()

    running = True
    while running:
        for event in pygame.event.get():
            if event.type == QUIT:
                running = False
            elif event.type == pygame.KEYDOWN:
                if event.key == K_SPACE:
                    world.player.press_jump()
                elif event.key == K_ESCAPE:
                    running = False

        world.update(clock.tick(fps) / 1000.0)
        world.draw(screen)
        pygame.display.flip()

        if max_frames is not None and world.frames >= max_frames:
            running = False

    return world


if __name__ == '__main__':
    main()
    pygame.quit()
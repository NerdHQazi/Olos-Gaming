"""Unit tests for the Platformer engine entities (Player, Projectile, Enemy).

Run with:
    python games/bounce/bounce_engine_test.py
"""

import contextlib
import dis
import inspect
import os
import sys
import unittest

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
GAMES_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, ".."))
if GAMES_DIR not in sys.path:
    sys.path.insert(0, GAMES_DIR)

os.environ.setdefault('SDL_VIDEODRIVER', 'dummy')
os.environ.setdefault('SDL_AUDIODRIVER', 'dummy')

import pygame
import lib.bounce_engine as engine
from lib.bounce_engine import (
    FIXED_DT,
    GRAVITY,
    HEIGHT,
    JUMP_SPEED,
    WIDTH,
    Enemy,
    GameClock,
    Player,
    Projectile,
    World,
    build_demo_level,
    main,
    platform,
    vec,
)

# The engine deliberately does not call `pygame.init()` on import, because a
# module should not pop open a window as a side effect. The test harness
# therefore brings up its own dummy video system, which `pygame.key.get_pressed()`
# requires in order to report a (empty) keyboard state.
pygame.init()
pygame.display.set_mode((WIDTH, HEIGHT))


@contextlib.contextmanager
def no_keys_pressed():
    """Run a block as if no keyboard key is held.

    Player movement polls the keyboard, so tests must not depend on the real
    (headless) keyboard state.
    """
    sentinel = pygame.key.get_pressed()

    class _NoKeys:
        def __getitem__(self, key):
            return False

    pygame.key.get_pressed = lambda: _NoKeys()
    try:
        yield
    finally:
        pygame.key.get_pressed = lambda: sentinel


def key_held(key):
    """Run a block as if exactly one key is held down."""
    return keys_held(key)


@contextlib.contextmanager
def keys_held(*keys):
    """Run a block as if exactly the given keys are held down."""
    sentinel = pygame.key.get_pressed()

    class _HeldKeys:
        def __getitem__(self, probed):
            return probed in keys

    pygame.key.get_pressed = lambda: _HeldKeys()
    try:
        yield
    finally:
        pygame.key.get_pressed = lambda: sentinel


@contextlib.contextmanager
def module_global_removed(name):
    """Temporarily delete a module-level global from lib.bounce_engine.

    Used to prove that engine code no longer reaches into module globals.
    """
    had_it = hasattr(engine, name)
    saved = getattr(engine, name, None)
    if had_it:
        delattr(engine, name)
    try:
        yield
    finally:
        if had_it:
            setattr(engine, name, saved)


def global_names_referenced(func):
    """Names a function resolves through the module globals / locals scope."""
    return {
        instruction.argval
        for instruction in dis.get_instructions(func)
        if instruction.opname in ("LOAD_GLOBAL", "LOAD_NAME")
    }


class TestPlayerConstruction(unittest.TestCase):
    """Requirement: the Player owns its state and needs no external wiring."""

    def test_player_can_be_constructed_without_arguments(self):
        p = Player()
        self.assertIsInstance(p, pygame.sprite.Sprite)
        self.assertEqual(tuple(p.pos), (10, 360))
        self.assertEqual(tuple(p.vel), (0, 0))

    def test_player_takes_no_required_positional_arguments(self):
        # The old signature was __init__(self, file) and raised
        # TypeError: missing 1 required positional argument: 'file'
        parameters = list(inspect.signature(Player.__init__).parameters.values())
        required = [p.name for p in parameters
                    if p.default is inspect.Parameter.empty
                    and p.kind in (p.POSITIONAL_ONLY, p.POSITIONAL_OR_KEYWORD)]
        self.assertEqual(required, ['self'])
        self.assertNotIn('file', [p.name for p in parameters])

    def test_player_owns_its_collision_collection(self):
        p = Player()
        self.assertIsInstance(p.platforms, pygame.sprite.Group)

    def test_platform_collection_can_be_injected_via_constructor(self):
        group = pygame.sprite.Group()
        group.add(platform())
        p = Player(group)
        self.assertIs(p.platforms, group)

    def test_player_starts_airborne(self):
        self.assertFalse(Player().on_ground)


class TestPlayerGlobalIndependence(unittest.TestCase):
    """Requirements: Player never depends on a global P1 or platforms."""

    def test_update_does_not_reference_global_P1(self):
        p = Player()
        with no_keys_pressed(), module_global_removed('P1'):
            for _ in range(10):
                p.update()   # used to raise NameError: name 'P1' is not defined
        self.assertNotEqual(p.pos.y, 360)

    def test_update_does_not_reference_global_platforms(self):
        group = pygame.sprite.Group()
        group.add(platform())
        p = Player(group)
        with no_keys_pressed(), module_global_removed('platforms'):
            for _ in range(120):
                p.update()   # used to raise NameError: name 'platforms' is not defined
        self.assertTrue(p.on_ground)

    def test_jump_does_not_reference_global_platforms(self):
        group = pygame.sprite.Group()
        group.add(platform())
        p = Player(group, pos=(200, 100))
        with no_keys_pressed():
            for _ in range(600):
                p.update()
                if p.on_ground:
                    break
        self.assertTrue(p.on_ground)
        with module_global_removed('platforms'):
            p.jump()        # used to raise NameError
            self.assertLess(p.vel.y, 0)

    def test_player_code_never_loads_P1_or_platforms_as_globals(self):
        for func in (Player.__init__, Player.update, Player.jump):
            loaded = global_names_referenced(func)
            self.assertNotIn('P1', loaded, f"{func.__qualname__} loads global P1")
            self.assertNotIn('platforms', loaded, f"{func.__qualname__} loads global platforms")


class TestPlayerGravityAndLanding(unittest.TestCase):
    """Requirements: falls under gravity, lands, becomes grounded."""

    def setUp(self):
        self.platforms = pygame.sprite.Group()
        self.platforms.add(platform())
        self.floor_top = self.platforms.sprites()[0].rect.top
        self.player = Player(self.platforms, pos=(200, 100))

    def test_player_falls_under_gravity(self):
        with no_keys_pressed():
            for _ in range(10):
                self.player.update()
        self.assertGreater(self.player.pos.y, 100)
        self.assertGreater(self.player.vel.y, 0)

    def test_player_lands_on_platform(self):
        with no_keys_pressed():
            for _ in range(600):
                self.player.update()
                if self.player.on_ground:
                    break
        self.assertAlmostEqual(self.player.pos.y, self.floor_top, places=5)

    def test_player_becomes_grounded_after_landing(self):
        with no_keys_pressed():
            for _ in range(600):
                self.player.update()
        self.assertTrue(self.player.on_ground)

    def test_grounded_player_does_not_sink_through_platform(self):
        with no_keys_pressed():
            for _ in range(300):
                self.player.update()
        self.assertAlmostEqual(self.player.pos.y, self.floor_top, places=5)
        self.assertAlmostEqual(self.player.vel.y, 0.0, places=5)

    def test_player_is_not_grounded_while_falling(self):
        with no_keys_pressed():
            for _ in range(5):
                self.player.update()
        self.assertFalse(self.player.on_ground)

    def test_gravity_uses_named_constant_not_a_literal(self):
        self.assertEqual(Player().gravity, GRAVITY)
        self.assertIsInstance(GRAVITY, float)
        self.assertGreater(GRAVITY, 0)

    def test_gravity_can_be_configured_per_player(self):
        weak = Player(self.platforms, pos=(200, 100), gravity=180.0)
        with no_keys_pressed():
            for _ in range(30):
                weak.update()
                self.player.update()
        self.assertLess(weak.pos.y, self.player.pos.y)


class TestPlayerRunSpeed(unittest.TestCase):
    """Requirements: holding a direction must not accelerate without bound."""

    def setUp(self):
        self.platforms = pygame.sprite.Group()
        self.platforms.add(platform())

    def test_holding_right_never_exceeds_max_run_speed(self):
        p = Player(self.platforms, pos=(200, 380))
        with key_held(pygame.K_RIGHT):
            for _ in range(600):
                p.update()
                self.assertLessEqual(p.vel.x, engine.MAX_RUN_SPEED)
        self.assertAlmostEqual(p.vel.x, engine.MAX_RUN_SPEED, places=5)

    def test_holding_left_never_goes_below_max_run_speed(self):
        p = Player(self.platforms, pos=(200, 380))
        with key_held(pygame.K_LEFT):
            for _ in range(600):
                p.update()
                self.assertGreaterEqual(p.vel.x, -engine.MAX_RUN_SPEED)
        self.assertAlmostEqual(p.vel.x, -engine.MAX_RUN_SPEED, places=5)

    def test_run_speed_is_capped_before_the_player_can_leave_the_world(self):
        p = Player(self.platforms, pos=(200, 380))
        with key_held(pygame.K_RIGHT):
            for _ in range(600):
                p.update()
        # 10 s of held input at the cap stays near the level instead of
        # rocketing far outside it, which is what an uncapped velocity did.
        self.assertLess(p.pos.x, WIDTH * 100)

    def test_sustained_input_settles_at_the_cap_and_reverses_symmetrically(self):
        right = Player(self.platforms, pos=(200, 380))
        left = Player(self.platforms, pos=(200, 380))
        with key_held(pygame.K_RIGHT):
            for _ in range(120):
                right.update()
        with key_held(pygame.K_LEFT):
            for _ in range(240):
                left.update()
        self.assertAlmostEqual(right.vel.x, -left.vel.x, places=5)
        self.assertAlmostEqual(abs(right.vel.x), engine.MAX_RUN_SPEED, places=5)

    def test_short_taps_are_unchanged_by_the_cap(self):
        # Below the cap the acceleration must be untouched, so a brief tap
        # still produces exactly MOVE_ACCEL * FIXED_DT on the first frame.
        p = Player(self.platforms, pos=(200, 380))
        with key_held(pygame.K_RIGHT):
            p.update()
        self.assertAlmostEqual(p.vel.x, engine.MOVE_ACCEL * FIXED_DT, places=5)

    def test_friction_still_brings_the_player_to_rest(self):
        p = Player(self.platforms, pos=(200, 380))
        with key_held(pygame.K_RIGHT):
            for _ in range(60):
                p.update()
        with no_keys_pressed():
            for _ in range(600):
                p.update()
        self.assertEqual(p.vel.x, 0.0)


class TestPlayerJumping(unittest.TestCase):
    """Requirements: jump when grounded, not when airborne, no held-key repeat."""

    def setUp(self):
        self.platforms = pygame.sprite.Group()
        self.platforms.add(platform())
        self.floor_top = self.platforms.sprites()[0].rect.top
        self.player = Player(self.platforms, pos=(200, 100))

    def land(self):
        with no_keys_pressed():
            for _ in range(600):
                self.player.update()
                if self.player.on_ground:
                    return

    def test_player_can_jump_while_grounded(self):
        self.land()
        self.assertTrue(self.player.on_ground)
        self.assertTrue(self.player.jump())
        self.assertAlmostEqual(self.player.vel.y, -JUMP_SPEED, places=5)
        self.assertFalse(self.player.on_ground)

    def test_player_cannot_jump_while_airborne(self):
        self.land()
        self.player.jump()
        with no_keys_pressed():
            for _ in range(40):
                self.player.update()
        self.assertFalse(self.player.on_ground)
        self.assertGreater(self.player.vel.y, 0)      # already descending

        velocity_before = self.player.vel.y
        height_before = self.player.pos.y
        self.assertFalse(self.player.jump())
        self.assertEqual(self.player.vel.y, velocity_before)
        self.assertEqual(self.player.pos.y, height_before)

        with no_keys_pressed():
            self.player.update()
        self.assertGreater(self.player.pos.y, height_before)

    def test_jump_returns_false_when_not_grounded(self):
        self.assertFalse(self.player.jump())
        self.assertEqual(self.player.vel.y, 0)

    def test_held_jump_input_does_not_retrigger_every_frame(self):
        self.land()
        ground = self.player.pos.y
        self.player.press_jump()
        with no_keys_pressed():
            self.player.update()      # the single queued jump is consumed here
            first_launch = self.player.vel.y
            self.assertLess(first_launch, 0)
            lowest = self.player.pos.y
            for _ in range(600):     # key still held; no new KEYDOWN events
                self.player.update()
                lowest = min(lowest, self.player.pos.y)
        # Exactly one launch: the player rises once, then lands again. A
        # re-triggering jump would keep re-launching and never settle.
        self.assertLess(lowest, ground - 100)
        self.assertTrue(self.player.on_ground)
        self.assertAlmostEqual(self.player.pos.y, ground, places=5)

    def test_single_press_produces_exactly_one_jump(self):
        self.land()
        ground = self.player.pos.y
        self.player.press_jump()
        launches = 0
        with no_keys_pressed():
            previous_velocity = self.player.vel.y
            self.player.update()
            lowest = self.player.pos.y
            for _ in range(600):
                self.player.update()
                if previous_velocity >= 0 > self.player.vel.y:
                    launches += 1
                previous_velocity = self.player.vel.y
                lowest = min(lowest, self.player.pos.y)
        self.assertEqual(launches, 1)
        self.assertLess(lowest, ground - 100)

    def test_queued_jump_is_consumed_by_the_next_update(self):
        self.land()
        self.player.press_jump()
        with no_keys_pressed():
            self.player.update()
            first_launch = self.player.vel.y
            self.assertLess(first_launch, 0)
            # The queue was consumed, so the next step is plain gravity only
            # rather than a second full-strength launch.
            self.player.update()
        self.assertAlmostEqual(
            self.player.vel.y, first_launch + GRAVITY * FIXED_DT, places=5)

    def test_jump_while_airborne_is_ignored_even_if_queued(self):
        self.land()
        self.player.jump()
        with no_keys_pressed():
            for _ in range(40):       # airborne again and now descending
                self.player.update()
        self.assertFalse(self.player.on_ground)
        velocity_before = self.player.vel.y
        self.assertGreater(velocity_before, 0)

        self.player.press_jump()
        with no_keys_pressed():
            self.player.update()
        # The queued request was consumed, but it could not launch a second
        # jump, so gravity is all that acted on the velocity.
        self.assertGreater(self.player.vel.y, velocity_before)
        self.assertGreater(self.player.vel.y, -JUMP_SPEED / 2)


class TestPlayerSpriteGroupIntegration(unittest.TestCase):
    """Requirement: pygame.sprite.Group.update() actually drives the Player."""

    def test_group_update_moves_the_player(self):
        p = Player(pos=(200, 100))
        group = pygame.sprite.Group()
        group.add(p)
        with no_keys_pressed():
            for _ in range(30):
                group.update()
        self.assertGreater(p.pos.y, 100)
        self.assertGreater(p.vel.y, 0)

    def test_group_update_lands_the_player(self):
        platforms = pygame.sprite.Group()
        platforms.add(platform())
        p = Player(platforms, pos=(200, 100))
        group = pygame.sprite.Group()
        group.add(p)
        with no_keys_pressed():
            for _ in range(600):
                group.update()
        self.assertTrue(p.on_ground)

    def test_two_players_are_independent(self):
        platforms = pygame.sprite.Group()
        platforms.add(platform())
        one = Player(platforms, pos=(100, 100))
        two = Player(platforms, pos=(300, 100))
        group = pygame.sprite.Group()
        group.add(one, two)
        with no_keys_pressed():
            for _ in range(30):
                group.update()
        self.assertAlmostEqual(one.pos.y, two.pos.y, places=5)
        self.assertIsNot(one.pos, two.pos)
        self.assertIsNot(one.vel, two.vel)


class TestPlayerRectSync(unittest.TestCase):
    """Requirement: rect and pos never drift apart."""

    def setUp(self):
        self.platforms = pygame.sprite.Group()
        self.platforms.add(platform())
        self.player = Player(self.platforms, pos=(200, 100))

    def assert_rect_tracks_pos(self, player=None):
        """`rect` must follow `pos` to within the pixel grid.

        `pygame.Rect` stores integers, so a float position is rounded. The
        requirement is that the two never drift apart beyond that sub-pixel
        rounding, i.e. the rect is re-derived from pos on every update.
        """
        player = player or self.player
        rect_midbottom = player.rect.midbottom
        self.assertAlmostEqual(rect_midbottom[0], player.pos.x, delta=1.0)
        self.assertAlmostEqual(rect_midbottom[1], player.pos.y, delta=1.0)

    def test_rect_stays_synced_with_pos_while_falling_and_landing(self):
        with no_keys_pressed():
            for _ in range(400):
                self.player.update()
                self.assert_rect_tracks_pos()
        self.assertTrue(self.player.on_ground)

    def test_rect_stays_synced_after_landing(self):
        with no_keys_pressed():
            for _ in range(600):
                self.player.update()
        self.assert_rect_tracks_pos()
        self.assertEqual(self.player.pos.y, self.platforms.sprites()[0].rect.top)

    def test_rect_stays_synced_after_jumping(self):
        with no_keys_pressed():
            for _ in range(600):
                self.player.update()
            self.player.jump()
            for _ in range(600):
                self.player.update()
                self.assert_rect_tracks_pos()

    def test_rect_stays_synced_during_sideways_movement(self):
        with key_held(pygame.K_RIGHT):
            for _ in range(200):
                self.player.update()
                self.assert_rect_tracks_pos()
        self.assertGreater(self.player.pos.x, 200)

    def test_rect_geometry_follows_position_immediately_after_construction(self):
        p = Player(pos=(120, 200))
        self.assertEqual(p.rect.midbottom, (120, 200))


class TestPlayerTimestep(unittest.TestCase):
    """Requirement: physics uses a timestep rather than raw frame count."""

    def test_update_defaults_to_the_fixed_timestep(self):
        self.assertAlmostEqual(FIXED_DT, 1.0 / 60.0, places=9)

    def test_fixed_timestep_is_deterministic(self):
        one = Player(pos=(200, 100))
        two = Player(pos=(200, 100))
        with no_keys_pressed():
            for _ in range(120):
                one.update()
                two.update()
        self.assertEqual(tuple(one.pos), tuple(two.pos))
        self.assertEqual(tuple(one.vel), tuple(two.vel))

    def test_same_simulated_time_is_frame_rate_independent(self):
        slow = Player(pos=(200, 0))
        fast = Player(pos=(200, 0))
        with no_keys_pressed():
            for _ in range(30):            # 30 fps  for 1 second
                slow.update(1.0 / 30.0)
            for _ in range(120):           # 120 fps for 1 second
                fast.update(1.0 / 120.0)
        # Same wall-clock time must give nearly the same result. A frame-count
        # based integrator would differ by 4x here.
        self.assertAlmostEqual(slow.pos.y, fast.pos.y, delta=abs(fast.pos.y) * 0.05)
        self.assertAlmostEqual(slow.vel.y, fast.vel.y, delta=abs(fast.vel.y) * 0.05)

    def test_slow_frame_does_not_tunnel_through_platform(self):
        platforms = pygame.sprite.Group()
        platforms.add(platform())
        floor_top = platforms.sprites()[0].rect.top
        # Start close enough above the platform that one oversized step
        # definitely carries the feet past its top edge.
        p = Player(platforms, pos=(200, floor_top - 10))
        with no_keys_pressed():
            p.update(0.25)                # a 250 ms stall
        self.assertTrue(p.on_ground)
        self.assertEqual(p.pos.y, floor_top)

    def test_fall_speed_is_capped(self):
        p = Player(pos=(200, 0))
        with no_keys_pressed():
            for _ in range(600):
                p.update()
        self.assertLessEqual(p.vel.y, engine.MAX_FALL_SPEED)

    def test_zero_or_negative_dt_is_ignored(self):
        p = Player(pos=(200, 100))
        with no_keys_pressed():
            p.update(0.0)
            p.update(-1.0)
        self.assertEqual(tuple(p.pos), (200, 100))


class TestProjectile(unittest.TestCase):
    """`vel` is in pixels per SECOND, so one FIXED_DT step at 60 fps covers
    1/60 s. The expectations below are the old px/frame numbers multiplied by
    60, so the on-screen behaviour at 60 fps is unchanged."""

    def test_moves_along_velocity(self):
        p = Projectile(vec(200, 200), vel=vec(300, 0))
        p.update()
        self.assertAlmostEqual(p.pos.x, 205, places=5)
        self.assertAlmostEqual(p.pos.y, 200, places=5)

    def test_rect_tracks_position(self):
        p = Projectile(vec(100, 100), vel=vec(180, -240))
        p.update()
        self.assertEqual(p.rect.center, (103, 96))
        self.assertEqual(p.rect.center, (round(p.pos.x), round(p.pos.y)))

    def test_deactivates_when_leaving_right_side(self):
        p = Projectile(vec(WIDTH - 30, 100), vel=vec(1200, 0))
        self.assertTrue(p.active)
        for _ in range(5):
            p.update()
        self.assertFalse(p.active)

    def test_deactivates_when_leaving_left_side(self):
        p = Projectile(vec(30, 100), vel=vec(-1200, 0))
        for _ in range(5):
            p.update()
        self.assertFalse(p.active)

    def test_deactivated_projectile_only_moves_on_update_call(self):
        p = Projectile(vec(200, 200), vel=vec(300, 0))
        p.deactivate()
        p.update()
        self.assertEqual(p.pos.x, 200)
        self.assertFalse(p.active)

    def test_draw_blits_active_projectile(self):
        surface = pygame.Surface((WIDTH, HEIGHT))
        p = Projectile(vec(200, 200), vel=vec(300, 0))
        p.draw(surface)   # no error; surface blitted
        p.deactivate()
        p.draw(surface)   # inactive -> skip, no error


class TestEnemy(unittest.TestCase):
    """`speed` is in pixels per SECOND (old px/frame values multiplied by 60)."""

    def test_patrol_moves_forward(self):
        e = Enemy(vec(200, 100), speed=120.0)
        e.update()
        self.assertAlmostEqual(e.pos.x, 202, places=5)

    def test_patrol_turns_back_at_range_edge(self):
        e = Enemy(vec(200, 100), speed=120.0, patrol_range=20)
        for _ in range(10):
            e.update()
        # After reaching the right edge it must have turned around.
        per_step = e.speed * FIXED_DT
        self.assertLessEqual(e.pos.x, 200 + 20 + per_step + 1e-9)
        width = e.pos.x - 200
        self.assertLessEqual(abs(width), 30)

    def test_patrol_stays_within_range(self):
        e = Enemy(vec(200, 100), speed=60.0, patrol_range=15)
        for _ in range(500):
            e.update()
            self.assertLessEqual(abs(e.pos.x - 200), 17)

    def test_rect_tracks_position(self):
        e = Enemy(vec(200, 100), speed=60.0, patrol_range=10)
        e.update()
        self.assertEqual(e.rect.center, (201, 100))

    def test_take_damage_reduces_health(self):
        e = Enemy(vec(200, 100), speed=60.0, health=2)
        self.assertEqual(e.health, 2)
        self.assertTrue(e.take_damage(1))
        self.assertEqual(e.health, 1)
        self.assertTrue(e.alive)

    def test_enemy_dies_when_health_reaches_zero(self):
        e = Enemy(vec(200, 100), speed=60.0, health=1)
        self.assertFalse(e.take_damage())
        self.assertEqual(e.health, 0)
        self.assertFalse(e.alive)

    def test_dead_enemy_no_longer_moves(self):
        e = Enemy(vec(200, 100), speed=120.0, health=1)
        e.take_damage()
        e.update()
        self.assertEqual(e.pos.x, 200)

    def test_draw_blits_active_enemy(self):
        surface = pygame.Surface((WIDTH, HEIGHT))
        e = Enemy(vec(200, 100))
        e.draw(surface)   # no error
        e.take_damage()
        e.draw(surface)   # dead -> skip, no error


class TestActorTimestep(unittest.TestCase):
    """Projectile and Enemy must be frame-rate independent like the Player."""

    def test_projectile_moves_proportionally_to_dt(self):
        p = Projectile(vec(0, 0), vel=vec(600, 0))
        p.update(0.25)
        self.assertAlmostEqual(p.pos.x, 150, places=5)

    def test_projectile_is_frame_rate_independent(self):
        # Slow enough to stay on screen for the whole second, so the comparison
        # measures integration rather than the off-screen deactivation.
        slow = Projectile(vec(10, 200), vel=vec(60, 0))
        fast = Projectile(vec(10, 200), vel=vec(60, 0))
        for _ in range(30):
            slow.update(1.0 / 30.0)
        for _ in range(120):
            fast.update(1.0 / 120.0)
        self.assertAlmostEqual(slow.pos.x, fast.pos.x, delta=abs(fast.pos.x) * 0.01)

    def test_projectile_ignores_zero_or_negative_dt(self):
        p = Projectile(vec(100, 100), vel=vec(600, 0))
        p.update(0.0)
        p.update(-0.5)
        self.assertEqual(p.pos.x, 100)

    def test_enemy_moves_proportionally_to_dt(self):
        e = Enemy(vec(0, 0), speed=240.0, patrol_range=10000)
        e.update(0.25)
        self.assertAlmostEqual(e.pos.x, 60, places=5)

    def test_enemy_is_frame_rate_independent(self):
        slow = Enemy(vec(0, 0), speed=240.0, patrol_range=10000)
        fast = Enemy(vec(0, 0), speed=240.0, patrol_range=10000)
        for _ in range(30):
            slow.update(1.0 / 30.0)
        for _ in range(120):
            fast.update(1.0 / 120.0)
        self.assertAlmostEqual(slow.pos.x, fast.pos.x, delta=abs(fast.pos.x) * 0.01)

    def test_dead_enemy_ignores_dt(self):
        e = Enemy(vec(0, 0), speed=240.0, patrol_range=10000, health=1)
        e.take_damage()
        e.update(0.5)
        self.assertEqual(e.pos.x, 0)

    def test_world_steps_actors_on_the_same_fixed_steps_as_the_player(self):
        platforms = pygame.sprite.Group(platform())
        player = Player(platforms, pos=(40, 100))
        shot = Projectile((10, 10), vel=vec(600, 0))
        world = World(platforms, player, pygame.sprite.Group(shot))
        with no_keys_pressed():
            for _ in range(3):
                world.update(FIXED_DT)
        self.assertAlmostEqual(shot.pos.x, 40, places=5)
        self.assertAlmostEqual(player.vel.y, 3 * GRAVITY * FIXED_DT, places=5)


class TestEnemyProjectileInteraction(unittest.TestCase):

    def test_projectile_hit_kills_enemy(self):
        e = Enemy(vec(200, 100), health=1)
        p = Projectile(e.pos, vel=vec(0, 0), damage=1)

        # Simple hit resolution: projectile deactivates, enemy takes damage.
        e.take_damage(p.damage)
        p.deactivate()

        self.assertFalse(e.alive)
        self.assertFalse(p.active)

    def test_entities_work_in_sprite_groups(self):
        # The engine manages entities through sprite groups; both new classes
        # must integrate with pygame.sprite.Group.update().
        e = Enemy(vec(200, 100), speed=120.0, health=1)
        p = Projectile(vec(200, 100), vel=vec(180, 0))

        group = pygame.sprite.Group()
        group.add(e, p)
        group.update()

        self.assertAlmostEqual(e.pos.x, 202, places=5)
        self.assertAlmostEqual(p.pos.x, 203, places=5)


class TestPlayerSolidPlatforms(unittest.TestCase):
    """Platforms are solid: the player must not be able to walk through them."""

    def build(self, *extra, pos=(100, 430)):
        group = pygame.sprite.Group(platform())
        group.add(*extra)
        return Player(group, pos=pos)

    def land(self, player, frames=300):
        with no_keys_pressed():
            for _ in range(frames):
                player.update()
                if player.on_ground:
                    return player.pos.y
        self.fail('player never landed')

    def test_walking_into_a_platform_stops_the_player(self):
        wall = platform(pygame.Rect(150, 350, 60, 80))
        player = self.build(wall)
        self.land(player)
        with key_held(pygame.K_RIGHT):
            for _ in range(120):
                player.update()
        self.assertLessEqual(player.rect.right, wall.rect.left)

    def test_player_cannot_walk_through_a_platform(self):
        wall = platform(pygame.Rect(150, 350, 60, 80))
        player = self.build(wall)
        self.land(player)
        with key_held(pygame.K_RIGHT):
            for _ in range(400):
                player.update()
        self.assertLess(player.pos.x, wall.rect.left)

    def test_player_can_walk_back_away_after_being_blocked(self):
        wall = platform(pygame.Rect(150, 350, 60, 80))
        player = self.build(wall)
        self.land(player)
        with key_held(pygame.K_RIGHT):
            for _ in range(120):
                player.update()
        blocked_at = player.pos.x
        with key_held(pygame.K_LEFT):
            for _ in range(120):
                player.update()
        self.assertLess(player.pos.x, blocked_at)

    def test_player_walks_under_a_platform_above_their_head(self):
        ledge = platform(pygame.Rect(150, 300, 60, 16))
        player = self.build(ledge)
        self.land(player)
        with key_held(pygame.K_RIGHT):
            for _ in range(400):
                player.update()
        self.assertGreater(player.pos.x, ledge.rect.right)

    def test_player_lands_on_top_of_a_platform(self):
        wall = platform(pygame.Rect(150, 350, 60, 80))
        player = self.build(wall, pos=(180, 100))
        self.land(player)
        self.assertEqual(player.pos.y, wall.rect.top)

    def test_player_is_pushed_out_of_a_platform_it_overlaps(self):
        # Spawning inside geometry must not leave the player stuck in it.
        wall = platform(pygame.Rect(150, 350, 60, 80))
        player = self.build(wall, pos=(180, 390))
        self.land(player)
        self.assertFalse(wall.rect.colliderect(player.rect),
                         'player is still inside the platform')

    def test_very_fast_sideways_movement_cannot_pass_through_a_platform(self):
        wall = platform(pygame.Rect(150, 350, 60, 80))
        player = self.build(wall)
        self.land(player)
        # Far faster than the terminal speed the player can actually reach,
        # but still far slower than the platform is wide, so it must be blocked
        # rather than skipped over.
        player.vel.x = 2000.0
        with no_keys_pressed():
            for _ in range(60):
                player.update()
        self.assertLessEqual(player.rect.right, wall.rect.left)
        self.assertFalse(wall.rect.colliderect(player.rect))


class TestPlayerHeadBump(unittest.TestCase):
    """Jumping must only be interrupted by a platform the head actually hits.

    The player has to be horizontally *under* the platform for any of this to
    apply, so each test places it directly beneath the ledge.
    """

    UNREACHABLE = pygame.Rect(110, 100, 110, 16)   # bottom 116, far above the apex
    WITHIN_REACH = pygame.Rect(150, 300, 60, 16)    # bottom 316, inside the jump

    def build(self, ledge_rect):
        group = pygame.sprite.Group(platform(), platform(ledge_rect))
        # x = 165..195 puts the body directly beneath either ledge.
        return Player(group, pos=(180, HEIGHT - 20))

    def land(self, player):
        with no_keys_pressed():
            for _ in range(300):
                player.update()
                if player.on_ground:
                    return player.pos.y
        self.fail('player never landed')

    def test_jumping_under_an_unreachable_platform_is_not_cancelled(self):
        # Regression: the head-bump check ignored the platform's bottom edge, so
        # ANY platform above the player cancelled the jump and teleported the
        # player up to that platform's underside.
        player = self.build(self.UNREACHABLE)
        self.assertEqual(self.land(player), HEIGHT - 20)

        player.press_jump()
        with no_keys_pressed():
            for _ in range(10):
                player.update()

        # The full jump peaks around y=205, so the player must still be rising
        # and must not have been snapped up to the ledge's underside (y=146).
        self.assertLess(player.vel.y, 0)
        self.assertGreater(player.pos.y, 250)

    def test_player_head_bumps_the_underside_of_a_platform(self):
        player = self.build(self.WITHIN_REACH)
        self.land(player)
        player.press_jump()
        blocked_at = self.WITHIN_REACH.bottom + player.size[1]
        reached = False
        with no_keys_pressed():
            for _ in range(60):
                player.update()
                if player.vel.y == 0 and player.pos.y == blocked_at:
                    reached = True
                    break
        self.assertTrue(reached, 'head never stopped under the platform')

    def test_player_falls_back_down_after_a_head_bump(self):
        player = self.build(self.WITHIN_REACH)
        self.land(player)
        player.press_jump()
        with no_keys_pressed():
            for _ in range(300):
                player.update()
                if player.on_ground and player.pos.y == HEIGHT - 20:
                    break
        self.assertTrue(player.on_ground)
        self.assertEqual(player.pos.y, HEIGHT - 20)


class TestGameClock(unittest.TestCase):
    """The loop must advance physics in whole fixed steps, not raw frames."""

    def test_one_second_of_real_time_yields_sixty_steps_at_every_frame_rate(self):
        # A 30 fps frame covers 1/30 s, which is two 1/60 s physics steps, so
        # every frame rate must consume the same total number of steps.
        for fps in (24, 30, 60, 120, 144):
            clock = GameClock()
            total = sum(clock.steps(1.0 / fps) for _ in range(fps))
            self.assertAlmostEqual(total, int(1.0 / FIXED_DT), delta=1,
                                   msg=f"{fps} fps produced {total} steps")

    def test_sixty_fps_runs_exactly_one_step_per_frame(self):
        clock = GameClock()
        self.assertEqual([clock.steps(1.0 / 60.0) for _ in range(5)], [1] * 5)

    def test_step_count_is_independent_of_frame_rate(self):
        slow = GameClock()
        fast = GameClock()
        for _ in range(30):
            slow.steps(1.0 / 30.0)
        for _ in range(120):
            fast.steps(1.0 / 120.0)
        self.assertEqual(slow.consumed_steps, fast.consumed_steps)

    def test_leftover_time_carries_into_the_next_frame(self):
        # Half a step must not be thrown away every frame, or the simulation
        # would slowly drift behind real time.
        clock = GameClock(step=0.1)
        self.assertEqual(clock.steps(0.04), 0)
        self.assertEqual(clock.steps(0.04), 0)
        self.assertEqual(clock.steps(0.04), 1)

    def test_long_stall_is_clamped_instead_of_spiralling(self):
        clock = GameClock()
        steps = clock.steps(10.0)
        self.assertLessEqual(steps, int(GameClock.MAX_FRAME_TIME / FIXED_DT) + 1)

    def test_zero_or_negative_elapsed_yields_no_steps(self):
        clock = GameClock()
        self.assertEqual(clock.steps(0.0), 0)
        self.assertEqual(clock.steps(-0.5), 0)

    def test_step_size_is_configurable(self):
        clock = GameClock(step=0.25)
        self.assertEqual(clock.steps(0.25), 1)
        self.assertEqual(clock.steps(0.1), 0)


class TestPlatformSprite(unittest.TestCase):
    """Platforms must be placeable, drawable and safe inside a sprite group."""

    def test_default_platform_is_still_the_full_width_floor(self):
        floor = platform()
        self.assertEqual(floor.rect, pygame.Rect(0, HEIGHT - 20, WIDTH, 20))

    def test_platform_can_be_positioned_and_resized(self):
        ledge = platform(pygame.Rect(120, 330, 100, 16))
        self.assertEqual(ledge.rect.topleft, (120, 330))
        self.assertEqual(ledge.rect.size, (100, 16))

    def test_platform_rect_matches_its_surface_size(self):
        ledge = platform(pygame.Rect(120, 330, 100, 16))
        self.assertEqual(ledge.surf.get_size(), ledge.rect.size)

    def test_platform_update_is_a_noop(self):
        # Platforms live in the same sprite group as everything else, so
        # Group.update() must not blow up on them.
        ledge = platform(pygame.Rect(120, 330, 100, 16))
        before = pygame.Rect(ledge.rect)
        group = pygame.sprite.Group()
        group.add(ledge)
        group.update()
        self.assertEqual(ledge.rect, before)

    def test_platform_draw_blits_itself(self):
        ledge = platform(pygame.Rect(10, 20, 40, 12))
        surface = pygame.Surface((WIDTH, HEIGHT))
        surface.fill((0, 0, 0))
        ledge.draw(surface)
        self.assertEqual(surface.get_at((20, 25)), ledge.surf.get_at((10, 5)))


class TestWorld(unittest.TestCase):
    """A built level must be updatable and drawable without a window."""

    def setUp(self):
        self.world = build_demo_level()

    def test_demo_level_has_a_player_platforms_and_actors(self):
        self.assertIsInstance(self.world, World)
        self.assertIsInstance(self.world.player, Player)
        self.assertGreater(len(self.world.platforms), 0)
        self.assertGreater(len(self.world.actors), 0)

    def test_player_collides_with_the_level_platforms(self):
        self.assertIs(self.world.player.platforms, self.world.platforms)

    def test_every_level_sprite_supports_update_and_draw(self):
        for sprite in list(self.world.platforms) + list(self.world.actors):
            self.assertTrue(hasattr(sprite, 'update'), sprite)
            self.assertTrue(hasattr(sprite, 'draw'), sprite)
            sprite.update()
            sprite.draw(pygame.Surface((WIDTH, HEIGHT)))

    def test_player_falls_onto_the_level_floor(self):
        with no_keys_pressed():
            for _ in range(600):
                self.world.update(FIXED_DT)
                if self.world.player.on_ground:
                    break
        self.assertTrue(self.world.player.on_ground)
        self.assertLessEqual(self.world.player.pos.y, HEIGHT)

    def test_world_update_steps_the_player_on_fixed_steps(self):
        with no_keys_pressed():
            self.world.update(FIXED_DT)
            self.world.update(FIXED_DT)
            self.assertAlmostEqual(
                self.world.player.vel.y, 2 * GRAVITY * FIXED_DT, places=5)

    def test_world_update_is_frame_rate_independent(self):
        slow = build_demo_level()
        fast = build_demo_level()
        with no_keys_pressed():
            for _ in range(30):
                slow.update(1.0 / 30.0)
            for _ in range(120):
                fast.update(1.0 / 120.0)
        self.assertAlmostEqual(slow.player.pos.y, fast.player.pos.y,
                               delta=abs(fast.player.pos.y) * 0.05)

    def test_world_draw_paints_the_background_and_sprites(self):
        surface = pygame.Surface((WIDTH, HEIGHT))
        surface.fill((0, 0, 0))
        self.world.draw(surface)
        self.assertNotEqual(surface.get_at((0, 0)), (0, 0, 0))
        self.assertEqual(surface.get_size(), (WIDTH, HEIGHT))


@contextlib.contextmanager
def scripted_events(events):
    """Feed the game loop a scripted batch of events on its first poll.

    `main()` calls `pygame.event.get()` once per frame. Replacing it keeps the
    test deterministic and leaves the real event queue untouched.
    """
    remaining = list(events)
    sentinel = pygame.event.get

    def fake_get(*args, **kwargs):
        if remaining:
            batch = remaining[:]
            del remaining[:]
            return batch
        return []

    pygame.event.get = fake_get
    try:
        yield
    finally:
        pygame.event.get = sentinel


class FixedElapsedClock:
    """Stand-in for `pygame.time.Clock` that always reports the same elapsed time.

    Lets the smoke test drive `main()` a known number of physics steps without
    depending on how fast the test machine happens to be.
    """

    def __init__(self, elapsed_ms=1000.0 / 60.0):
        self.elapsed_ms = elapsed_ms
        self.calls = 0

    def tick(self, fps=None):
        self.calls += 1
        return self.elapsed_ms


def keydown(key):
    return pygame.event.Event(pygame.KEYDOWN, key=key)


class TestMainEntryPoint(unittest.TestCase):
    """`python games/lib/bounce_engine.py` must actually run the game."""

    def run_loop(self, frames, elapsed_ms=1000.0 / 60.0, world=None, clock=None):
        if clock is None:
            clock = FixedElapsedClock(elapsed_ms)
        with no_keys_pressed():
            return main(max_frames=frames, world=world, clock=clock)

    def land_player(self, world):
        """Let the player settle on the floor before testing input."""
        with no_keys_pressed():
            for _ in range(120):
                world.update(FIXED_DT)
                if world.player.on_ground:
                    return
        raise AssertionError("player never landed")

    def test_main_runs_a_bounded_number_of_frames(self):
        world = self.run_loop(3)
        self.assertIsInstance(world, World)
        self.assertEqual(world.frames, 3)

    def test_main_advances_the_player_by_one_fixed_step_per_frame(self):
        world = self.run_loop(3)
        self.assertAlmostEqual(
            world.player.vel.y, 3 * GRAVITY * FIXED_DT, places=5)

    def test_main_leaves_the_player_standing_on_the_level_floor(self):
        world = self.run_loop(120)
        self.assertTrue(world.player.on_ground)
        self.assertLessEqual(world.player.pos.y, HEIGHT)

    def test_space_keydown_makes_the_player_jump(self):
        world = build_demo_level()
        self.land_player(world)
        ground = world.player.pos.y

        with no_keys_pressed(), scripted_events([keydown(pygame.K_SPACE)]):
            main(max_frames=1, world=world, clock=FixedElapsedClock())

        self.assertFalse(world.player.on_ground)
        self.assertGreater(world.player.vel.y, -JUMP_SPEED + 1)

        self.run_loop(10, world=world)
        self.assertLess(world.player.pos.y, ground)

    def test_quit_event_stops_the_loop(self):
        with no_keys_pressed(), scripted_events([pygame.event.Event(pygame.QUIT)]):
            world = main(world=build_demo_level(), clock=FixedElapsedClock())
        self.assertEqual(world.frames, 1)

    def test_escape_key_stops_the_loop(self):
        with no_keys_pressed(), scripted_events([keydown(pygame.K_ESCAPE)]):
            world = main(world=build_demo_level(), clock=FixedElapsedClock())
        self.assertEqual(world.frames, 1)

    def test_main_creates_the_display_window(self):
        self.run_loop(2)
        surface = pygame.display.get_surface()
        self.assertIsNotNone(surface)
        self.assertEqual(surface.get_size(), (WIDTH, HEIGHT))

    def test_main_leaves_pygame_running_for_later_tests(self):
        self.run_loop(2)
        self.assertTrue(pygame.get_init())

    def test_main_survives_a_long_frame_stall(self):
        # A huge elapsed time must be clamped, not replayed as hundreds of
        # physics steps, or the game would lock up after a debugger pause.
        world = self.run_loop(1, elapsed_ms=10000.0)
        self.assertLessEqual(world.clock.consumed_steps,
                             int(GameClock.MAX_FRAME_TIME / FIXED_DT) + 1)


if __name__ == '__main__':
    unittest.main()
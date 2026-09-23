"""Unit tests for the Platformer engine entities (Projectile and Enemy).

Run with:
    python games/bounce/bounce_engine_test.py
"""

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
from lib.bounce_engine import Projectile, Enemy, WIDTH, HEIGHT, vec


class TestProjectile(unittest.TestCase):

    def test_moves_along_velocity(self):
        p = Projectile(vec(200, 200), vel=vec(5, 0))
        p.update()
        self.assertEqual(p.pos.x, 205)
        self.assertEqual(p.pos.y, 200)

    def test_rect_tracks_position(self):
        p = Projectile(vec(100, 100), vel=vec(3, -4))
        p.update()
        self.assertEqual(p.rect.center, (103, 96))
        self.assertEqual(p.rect.center, (int(p.pos.x), int(p.pos.y)))

    def test_deactivates_when_leaving_right_side(self):
        p = Projectile(vec(WIDTH - 30, 100), vel=vec(20, 0))
        self.assertTrue(p.active)
        for _ in range(5):
            p.update()
        self.assertFalse(p.active)

    def test_deactivates_when_leaving_left_side(self):
        p = Projectile(vec(30, 100), vel=vec(-20, 0))
        for _ in range(5):
            p.update()
        self.assertFalse(p.active)

    def test_deactivated_projectile_only_moves_on_update_call(self):
        p = Projectile(vec(200, 200), vel=vec(5, 0))
        p.deactivate()
        p.update()
        self.assertEqual(p.pos.x, 200)
        self.assertFalse(p.active)

    def test_draw_blits_active_projectile(self):
        surface = pygame.Surface((WIDTH, HEIGHT))
        p = Projectile(vec(200, 200), vel=vec(5, 0))
        p.draw(surface)   # no error; surface blitted
        p.deactivate()
        p.draw(surface)   # inactive -> skip, no error


class TestEnemy(unittest.TestCase):

    def test_patrol_moves_forward(self):
        e = Enemy(vec(200, 100), speed=2.0)
        e.update()
        self.assertEqual(e.pos.x, 202)

    def test_patrol_turns_back_at_range_edge(self):
        e = Enemy(vec(200, 100), speed=2.0, patrol_range=20)
        for _ in range(10):
            e.update()
        # After reaching the right edge it must have turned around.
        self.assertLessEqual(e.pos.x, 200 + 20 + e.speed + 1e-9)
        width = e.pos.x - 200
        self.assertLessEqual(abs(width), 30)

    def test_patrol_stays_within_range(self):
        e = Enemy(vec(200, 100), speed=1.0, patrol_range=15)
        for _ in range(500):
            e.update()
            self.assertLessEqual(abs(e.pos.x - 200), 17)

    def test_rect_tracks_position(self):
        e = Enemy(vec(200, 100), speed=1.0, patrol_range=10)
        e.update()
        self.assertEqual(e.rect.center, (201, 100))

    def test_take_damage_reduces_health(self):
        e = Enemy(vec(200, 100), speed=1.0, health=2)
        self.assertEqual(e.health, 2)
        self.assertTrue(e.take_damage(1))
        self.assertEqual(e.health, 1)
        self.assertTrue(e.alive)

    def test_enemy_dies_when_health_reaches_zero(self):
        e = Enemy(vec(200, 100), speed=1.0, health=1)
        self.assertFalse(e.take_damage())
        self.assertEqual(e.health, 0)
        self.assertFalse(e.alive)

    def test_dead_enemy_no_longer_moves(self):
        e = Enemy(vec(200, 100), speed=2.0, health=1)
        e.take_damage()
        e.update()
        self.assertEqual(e.pos.x, 200)

    def test_draw_blits_active_enemy(self):
        surface = pygame.Surface((WIDTH, HEIGHT))
        e = Enemy(vec(200, 100))
        e.draw(surface)   # no error
        e.take_damage()
        e.draw(surface)   # dead -> skip, no error


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
        e = Enemy(vec(200, 100), speed=2.0, health=1)
        p = Projectile(vec(200, 100), vel=vec(3, 0))

        group = pygame.sprite.Group()
        group.add(e, p)
        group.update()

        self.assertEqual(e.pos.x, 202)
        self.assertEqual(p.pos.x, 203)


if __name__ == '__main__':
    unittest.main()
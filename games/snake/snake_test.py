"""Unit tests for the Snake game tail-collision fix.

Run with:
    python games/snake/snake_test.py
"""

import os
import unittest

os.environ.setdefault('SDL_VIDEODRIVER', 'dummy')
os.environ.setdefault('SDL_AUDIODRIVER', 'dummy')

from snake_game import (GRID_WIDTH, GRID_HEIGHT, UP, DOWN, LEFT, RIGHT,
                        Snake, Food)


class TestSnakeTailCollision(unittest.TestCase):

    def test_moving_into_vacating_tail_cell_is_allowed(self):
        # Regression test: the head may enter the cell currently occupied by
        # the tail, because the tail is removed in the same update.
        snake = Snake()
        snake.positions = [(5, 5), (4, 5), (4, 4), (5, 4)]
        snake.direction = UP
        snake.grow_pending = False

        self.assertTrue(snake.update())
        self.assertEqual(snake.get_head_position(), (5, 4))
        # Tail vacated, body shifted along.
        self.assertEqual(len(snake.positions), 4)
        self.assertEqual(snake.positions[-1], (4, 4))

    def test_moving_into_body_segment_is_still_a_collision(self):
        # A genuine self-collision must still end the game. Here the head
        # turns back into its own neck segment at (6,5).
        snake = Snake()
        snake.positions = [(5, 5), (6, 5), (6, 6), (5, 6), (4, 6), (4, 5)]
        snake.direction = RIGHT
        snake.grow_pending = False

        self.assertFalse(snake.update())

    def test_moving_into_middle_segment_is_still_a_collision(self):
        # Coiled snake: the head at (5,5) moves left into (4,5), which is a
        # middle body segment rather than the vacating tail at (4,4).
        snake = Snake()
        snake.positions = [(5, 5), (6, 5), (6, 6), (5, 6),
                            (4, 6), (4, 5), (4, 4)]
        snake.direction = LEFT
        snake.grow_pending = False

        self.assertFalse(snake.update())

    def test_moving_into_free_cell_survives(self):
        snake = Snake()
        snake.positions = [(5, 5), (5, 6), (4, 6), (4, 5)]
        snake.direction = UP
        snake.grow_pending = False

        self.assertTrue(snake.update())
        self.assertEqual(snake.get_head_position(), (5, 4))

    def test_tail_cell_is_a_collision_while_growing(self):
        # When growing, the tail does NOT vacate, so it must stay lethal.
        snake = Snake()
        snake.positions = [(5, 5), (4, 5), (4, 4), (5, 4)]
        snake.direction = UP
        snake.grow_pending = True

        self.assertFalse(snake.update())


class TestSnakeMovement(unittest.TestCase):

    def test_reverse_direction_is_rejected(self):
        snake = Snake()
        snake.direction = RIGHT
        snake.change_direction(LEFT)
        self.assertEqual(snake.direction, RIGHT)

        snake.direction = UP
        snake.change_direction(DOWN)
        self.assertEqual(snake.direction, UP)

    def test_perpendicular_direction_is_allowed(self):
        snake = Snake()
        snake.direction = RIGHT
        snake.change_direction(UP)
        self.assertEqual(snake.direction, UP)

    def test_wall_collision_left(self):
        snake = Snake()
        snake.positions = [(0, 5), (1, 5), (2, 5)]
        snake.direction = LEFT
        self.assertFalse(snake.update())

    def test_wall_collision_right(self):
        snake = Snake()
        snake.positions = [(GRID_WIDTH - 1, 5), (GRID_WIDTH - 2, 5)]
        snake.direction = RIGHT
        self.assertFalse(snake.update())

    def test_wall_collision_top(self):
        snake = Snake()
        snake.positions = [(5, 0), (5, 1), (5, 2)]
        snake.direction = UP
        self.assertFalse(snake.update())

    def test_wall_collision_bottom(self):
        snake = Snake()
        snake.positions = [(5, GRID_HEIGHT - 1), (5, GRID_HEIGHT - 2)]
        snake.direction = DOWN
        self.assertFalse(snake.update())

    def test_normal_move_advances_head(self):
        snake = Snake()
        snake.direction = RIGHT
        head = snake.get_head_position()
        self.assertTrue(snake.update())
        self.assertEqual(snake.get_head_position(), (head[0] + 1, head[1]))
        self.assertEqual(len(snake.positions), 3)

    def test_growth_adds_a_segment_and_syncs_length(self):
        snake = Snake()
        before = len(snake.positions)
        snake.grow()
        self.assertTrue(snake.update())
        self.assertEqual(len(snake.positions), before + 1)
        self.assertEqual(snake.length, 4)
        # Growth is consumed, so the next move must not grow again.
        self.assertFalse(snake.grow_pending)
        self.assertTrue(snake.update())
        self.assertEqual(len(snake.positions), before + 1)


class TestSnakeFood(unittest.TestCase):

    def test_food_spawns_in_bounds_and_off_the_snake(self):
        snake = Snake()
        food = Food()
        occupied = set(snake.positions)
        for _ in range(200):
            food.randomize_position(snake.positions)
            self.assertNotIn(food.position, occupied)
            self.assertTrue(0 <= food.position[0] < GRID_WIDTH)
            self.assertTrue(0 <= food.position[1] < GRID_HEIGHT)


if __name__ == '__main__':
    unittest.main()

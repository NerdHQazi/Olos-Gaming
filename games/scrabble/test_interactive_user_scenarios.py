import os
import sys
import unittest

os.environ["SDL_VIDEODRIVER"] = "dummy"

import pygame
from dictionary import Dictionary
from scrabble_engine import Game, Tile, LETTER_VALUES
import GameBasics
from GameBasics import (
    RED, GREEN, BLUE, LIGHT_BLUE, WHITE, BLACK, DARK_GRAY, LIGHT_GRAY,
    SPACE_COLOR, PINK, GOLD, YELLOW, WOOD, DARK_WOOD, PURPLE,
    Text, WrapText, BordButton, Button, BlankTileModal
)

class TestInteractiveUserScenarios(unittest.TestCase):

    def setUp(self):
        pygame.init()
        self.screen_width = 860
        self.screen_height = 860
        self.screen = pygame.Surface((self.screen_width, self.screen_height))
        self.dictionary = Dictionary()
        self.game = Game(player_names=["Player 1", "Player 2"], dictionary=self.dictionary)

    def tearDown(self):
        pygame.quit()

    def test_scenario_tile_selection_placement_and_removal(self):
        """Simulates user selecting rack tiles, placing on board, and removing them by clicking."""
        p1 = self.game.players[0]
        t1 = p1.rack[0]
        
        # 1. Place draft tile at (7,7)
        self.assertTrue(self.game.board.place_draft_tile(7, 7, t1))
        self.assertIsNotNone(self.game.board.draft_tiles[7][7])

        # 2. Click draft tile on board -> remove back to rack
        removed = self.game.board.remove_draft_tile(7, 7)
        self.assertEqual(removed, t1)
        self.assertIsNone(self.game.board.draft_tiles[7][7])

        # 3. Place 3 draft tiles and test Recall
        self.game.board.place_draft_tile(7, 6, p1.rack[0])
        self.game.board.place_draft_tile(7, 7, p1.rack[1])
        self.game.board.place_draft_tile(7, 8, p1.rack[2])
        self.assertEqual(len(self.game.board.get_draft_positions()), 3)

        recalled_count = self.game.recall_draft()
        self.assertEqual(recalled_count, 3)
        self.assertEqual(len(self.game.board.get_draft_positions()), 0)

    def test_scenario_blank_tile_modal_flow(self):
        """Simulates user picking a blank tile '_', triggering modal, and assigning a letter."""
        modal = BlankTileModal(self.screen_width, self.screen_height)
        modal.show()
        self.assertTrue(modal.active)

        # Simulate user clicking button for letter 'E'
        letter_btn = None
        for letter, btn in modal.buttons:
            if letter == 'E':
                letter_btn = btn
                break
        self.assertIsNotNone(letter_btn)

        # Simulate MOUSEBUTTONDOWN at button coordinates
        event = pygame.event.Event(pygame.MOUSEBUTTONDOWN, {'button': 1, 'pos': (letter_btn.x + 5, letter_btn.y + 5)})
        chosen = modal.handle_event(event)
        self.assertEqual(chosen, 'E')
        self.assertFalse(modal.active)

        # Place blank tile with assigned letter 'E'
        blank_tile = Tile('_')
        self.game.board.place_draft_tile(7, 7, blank_tile, assigned_letter=chosen)
        placed = self.game.board.draft_tiles[7][7]
        self.assertEqual(placed.get_char(), 'E')
        self.assertEqual(placed.points, 0)

    def test_scenario_invalid_moves_rejection(self):
        """Simulates user making all types of invalid move attempts."""
        p1 = self.game.current_player

        # 1. No tiles placed -> Submit
        success, msg, score = self.game.submit_move()
        self.assertFalse(success)
        self.assertIn("No tiles placed", msg)

        # 2. First move NOT covering center (7,7)
        self.game.board.place_draft_tile(0, 0, Tile('C'))
        self.game.board.place_draft_tile(0, 1, Tile('A'))
        self.game.board.place_draft_tile(0, 2, Tile('T'))
        success, msg, score = self.game.submit_move()
        self.assertFalse(success)
        self.assertIn("center", msg.lower())
        self.game.recall_draft()

        # 3. Diagonal placement
        self.game.board.place_draft_tile(7, 7, Tile('C'))
        self.game.board.place_draft_tile(8, 8, Tile('A'))
        success, msg, score = self.game.submit_move()
        self.assertFalse(success)
        self.assertIn("straight line", msg.lower())
        self.game.recall_draft()

        # 4. Invalid dictionary word "XZQ" over center
        self.game.board.place_draft_tile(7, 6, Tile('X'))
        self.game.board.place_draft_tile(7, 7, Tile('Z'))
        self.game.board.place_draft_tile(7, 8, Tile('Q'))
        success, msg, score = self.game.submit_move()
        self.assertFalse(success)
        self.assertIn("Invalid word", msg)
        self.game.recall_draft()

    def test_scenario_valid_plays_multipliers_and_crosswords(self):
        """Simulates valid plays by Player 1 and Player 2 with multiplier scoring."""
        p1 = self.game.players[0]
        p2 = self.game.players[1]

        # Player 1 plays "F I S H" horizontally over center (7,7)
        p1.rack = [Tile('F'), Tile('I'), Tile('S'), Tile('H'), Tile('A'), Tile('B'), Tile('C')]
        self.game.board.place_draft_tile(7, 5, p1.rack[0])  # F = 4
        self.game.board.place_draft_tile(7, 6, p1.rack[1])  # I = 1
        self.game.board.place_draft_tile(7, 7, p1.rack[2])  # S = 1 (Center Star 2W)
        self.game.board.place_draft_tile(7, 8, p1.rack[3])  # H = 4

        success, msg, score1 = self.game.submit_move()
        self.assertTrue(success, msg)
        # Score calculation: (4 + 1 + 1 + 4) * 2 = 20 pts
        self.assertEqual(score1, 20)
        self.assertEqual(p1.score, 20)
        self.assertEqual(self.game.current_player, p2)

        # Player 2 plays "H O M E" vertically using 'H' at (7,8) -> (8,8) 'O', (9,8) 'M', (10,8) 'E'
        p2.rack = [Tile('O'), Tile('M'), Tile('E'), Tile('X'), Tile('Y'), Tile('Z'), Tile('W')]
        self.game.board.place_draft_tile(8, 8, p2.rack[0])   # O = 1
        self.game.board.place_draft_tile(9, 8, p2.rack[1])   # M = 3
        self.game.board.place_draft_tile(10, 8, p2.rack[2])  # E = 1
        
        success, msg, score2 = self.game.submit_move()
        self.assertTrue(success, msg)
        self.assertGreater(score2, 0)
        self.assertEqual(p2.score, score2)
        self.assertEqual(self.game.current_player, p1)

    def test_scenario_exchange_and_pass_turn(self):
        """Simulates tile exchange and pass turn mechanics."""
        p1 = self.game.current_player
        p2 = self.game.players[1]

        # 1. Exchange 2 tiles
        p1_orig_tiles = list(p1.rack)
        success, msg = self.game.exchange_tiles([0, 1])
        self.assertTrue(success, msg)
        self.assertEqual(self.game.current_player, p2)

        # 2. Player 2 passes turn
        msg2 = self.game.pass_turn()
        self.assertIn("passed", msg2)
        self.assertEqual(self.game.current_player, p1)

    def test_scenario_consecutive_passes_trigger_game_over(self):
        """Simulates 6 consecutive passes triggering game over modal."""
        for i in range(6):
            msg = self.game.pass_turn()

        self.assertTrue(self.game.game_over)
        self.assertIsNotNone(self.game.winner)
        self.assertIn("Game Over", self.game.last_move_msg)

if __name__ == "__main__":
    unittest.main()

import os
import sys
import unittest

# Ensure SDL runs headless for automated testing if display is absent
os.environ["SDL_VIDEODRIVER"] = "dummy"

import pygame
from dictionary import Dictionary
from scrabble_engine import Game, Tile, MoveValidator, Scorer
import GameBasics
from GameBasics import Text, WrapText, BordButton, Button, BlankTileModal

class TestSimulatedGameplay(unittest.TestCase):

    def setUp(self):
        self.dictionary = Dictionary()
        self.game = Game(player_names=["Alice", "Bob"], dictionary=self.dictionary)

    def test_full_simulated_gameplay(self):
        # 1. Check initial state
        p1 = self.game.players[0]
        p2 = self.game.players[1]
        self.assertEqual(self.game.current_player, p1)
        self.assertEqual(len(p1.rack), 7)
        self.assertEqual(len(p2.rack), 7)
        self.assertEqual(self.game.tile_bag.remaining_count(), 86)

        # 2. Player 1 plays "C A T" horizontally on row 7, cols 6, 7, 8 (covering center 7,7)
        p1.rack = [Tile('C'), Tile('A'), Tile('T'), Tile('X'), Tile('Y'), Tile('Z'), Tile('Q')]
        self.assertTrue(self.game.board.place_draft_tile(7, 6, p1.rack[0]))
        self.assertTrue(self.game.board.place_draft_tile(7, 7, p1.rack[1]))
        self.assertTrue(self.game.board.place_draft_tile(7, 8, p1.rack[2]))

        success, msg, score = self.game.submit_move()
        self.assertTrue(success, f"Failed submit: {msg}")
        self.assertEqual(p1.score, score)
        self.assertGreater(p1.score, 0)
        self.assertEqual(self.game.current_player, p2)

        # Verify board locked tiles
        self.assertIsNotNone(self.game.board.get_locked_tile(7, 6))
        self.assertEqual(self.game.board.get_locked_tile(7, 6).letter, 'C')
        self.assertEqual(self.game.board.get_locked_tile(7, 7).letter, 'A')
        self.assertEqual(self.game.board.get_locked_tile(7, 8).letter, 'T')

        # 3. Player 2 plays "T A B L E" vertically starting from 'T' at (7,8) -> (8,8) 'A', (9,8) 'B', (10,8) 'L', (11,8) 'E'
        p2.rack = [Tile('A'), Tile('B'), Tile('L'), Tile('E'), Tile('R'), Tile('S'), Tile('M')]
        self.assertTrue(self.game.board.place_draft_tile(8, 8, p2.rack[0]))
        self.assertTrue(self.game.board.place_draft_tile(9, 8, p2.rack[1]))
        self.assertTrue(self.game.board.place_draft_tile(10, 8, p2.rack[2]))
        self.assertTrue(self.game.board.place_draft_tile(11, 8, p2.rack[3]))

        success, msg, score2 = self.game.submit_move()
        self.assertTrue(success, f"Failed P2 move: {msg}")
        self.assertGreater(p2.score, 0)
        self.assertEqual(self.game.current_player, p1)

        # 4. Player 1 tests recall functionality
        p1.rack.append(Tile('D'))
        self.game.board.place_draft_tile(0, 0, p1.rack[-1])
        self.assertEqual(len(self.game.board.get_draft_positions()), 1)
        recalled_count = self.game.recall_draft()
        self.assertEqual(recalled_count, 1)
        self.assertEqual(len(self.game.board.get_draft_positions()), 0)

        # 5. Player 1 exchanges 2 tiles
        prev_bag_count = self.game.tile_bag.remaining_count()
        success, msg = self.game.exchange_tiles([0, 1])
        self.assertTrue(success, msg)
        self.assertEqual(self.game.tile_bag.remaining_count(), prev_bag_count)
        self.assertEqual(self.game.current_player, p2)

        # 6. Player 2 passes turn
        msg = self.game.pass_turn()
        self.assertIn("passed", msg)
        self.assertEqual(self.game.current_player, p1)

    def test_pygame_ui_rendering(self):
        """Tests that Pygame UI classes initialize and render onto a surface without errors."""
        pygame.init()
        screen = pygame.Surface((860, 860))

        # Test Text & WrapText
        t = Text("Scrabble Test", 30, (0, 0, 0), (100, 100))
        t.render(screen)

        wt = WrapText("Definition: Long test definition string for checking text wrapping functionality.", 18, (0, 0, 0), (50, 50), 300)
        wt.render(screen)

        # Test BordButton & Button
        bb = BordButton(10, 10, 40, 40, (0, 255, 0), (200, 200, 200), (255, 255, 255), "3W")
        bb.draw(screen)

        btn = Button(50, 50, 100, 40, "Submit", (0, 255, 0), (255, 255, 255), outlineSize=1)
        btn.draw(screen)

        # Test BlankTileModal
        modal = BlankTileModal(860, 860)
        modal.show()
        self.assertTrue(modal.active)
        modal.draw(screen)

        pygame.quit()

if __name__ == "__main__":
    unittest.main()

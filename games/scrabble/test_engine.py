import unittest
import os
from dictionary import Dictionary
from scrabble_engine import Tile, TileBag, Board, MoveValidator, Scorer, Player, Game, STANDARD_TILE_DISTRIBUTION

class TestScrabbleEngine(unittest.TestCase):

    def setUp(self):
        self.dict = Dictionary()
        self.game = Game(player_names=["Player 1", "Player 2"], dictionary=self.dict)

    def test_100_tile_distribution(self):
        bag = TileBag()
        total_count = bag.remaining_count()
        self.assertEqual(total_count, 100, f"Expected 100 tiles, got {total_count}")
        
        counts = {}
        for t in bag.tiles:
            counts[t.letter] = counts.get(t.letter, 0) + 1
            
        for letter, expected in STANDARD_TILE_DISTRIBUTION.items():
            self.assertEqual(counts.get(letter, 0), expected, f"Tile count mismatch for '{letter}'")

    def test_rack_refill(self):
        player = self.game.current_player
        self.assertEqual(len(player.rack), 7)
        initial_bag_count = self.game.tile_bag.remaining_count()
        self.assertEqual(initial_bag_count, 100 - 14)  # 100 - 7*2

    def test_first_move_center_rule(self):
        # Placing OFF center (e.g. at 0,0)
        self.game.board.place_draft_tile(0, 0, Tile('C'))
        self.game.board.place_draft_tile(0, 1, Tile('A'))
        self.game.board.place_draft_tile(0, 2, Tile('T'))
        
        valid, msg, _, _ = MoveValidator.validate_move(self.game.board, self.dict)
        self.assertFalse(valid)
        self.assertIn("center", msg.lower())

        self.game.board.clear_draft()

        # Placing ON center (7,7)
        self.game.board.place_draft_tile(7, 6, Tile('C'))
        self.game.board.place_draft_tile(7, 7, Tile('A'))
        self.game.board.place_draft_tile(7, 8, Tile('T'))

        valid, msg, words_info, score = MoveValidator.validate_move(self.game.board, self.dict)
        self.assertTrue(valid, msg)
        self.assertEqual(words_info[0][0], "CAT")

    def test_horizontal_and_vertical_placement(self):
        # Horizontal "DOG" over center (7,7)
        self.game.board.place_draft_tile(7, 6, Tile('D'))
        self.game.board.place_draft_tile(7, 7, Tile('O'))
        self.game.board.place_draft_tile(7, 8, Tile('G'))
        
        valid, msg, _, score = MoveValidator.validate_move(self.game.board, self.dict)
        self.assertTrue(valid)
        self.game.board.commit_draft()

        # Vertical "GOAT" starting from existing 'G' at (7,8)
        self.game.board.place_draft_tile(8, 8, Tile('O'))
        self.game.board.place_draft_tile(9, 8, Tile('A'))
        self.game.board.place_draft_tile(10, 8, Tile('T'))
        
        valid, msg, words, score = MoveValidator.validate_move(self.game.board, self.dict)
        self.assertTrue(valid, msg)
        self.assertEqual(words[0][0], "GOAT")

    def test_disconnected_move_rejection(self):
        # First move valid
        self.game.board.place_draft_tile(7, 6, Tile('C'))
        self.game.board.place_draft_tile(7, 7, Tile('A'))
        self.game.board.place_draft_tile(7, 8, Tile('T'))
        self.game.board.commit_draft()

        # Second move disconnected at top left corner (0,0)
        self.game.board.place_draft_tile(0, 0, Tile('D'))
        self.game.board.place_draft_tile(0, 1, Tile('O'))
        self.game.board.place_draft_tile(0, 2, Tile('G'))

        valid, msg, _, _ = MoveValidator.validate_move(self.game.board, self.dict)
        self.assertFalse(valid)
        self.assertIn("connect", msg.lower())

    def test_gaps_in_placement(self):
        self.game.board.place_draft_tile(7, 5, Tile('C'))
        # Gap at (7,6)
        self.game.board.place_draft_tile(7, 7, Tile('T'))

        valid, msg, _, _ = MoveValidator.validate_move(self.game.board, self.dict)
        self.assertFalse(valid)
        self.assertIn("empty spaces", msg.lower())

    def test_invalid_words(self):
        self.game.board.place_draft_tile(7, 6, Tile('X'))
        self.game.board.place_draft_tile(7, 7, Tile('Q'))
        self.game.board.place_draft_tile(7, 8, Tile('Z'))

        valid, msg, _, _ = MoveValidator.validate_move(self.game.board, self.dict)
        self.assertFalse(valid)
        self.assertIn("invalid word", msg.lower())

    def test_letter_and_word_multipliers(self):
        # (7,7) is Center Star 'S' (acts as 2W double word)
        # Place "HI" at (7,6) and (7,7)
        self.game.board.place_draft_tile(7, 6, Tile('H'))  # H=4
        self.game.board.place_draft_tile(7, 7, Tile('I'))  # I=1
        # Letter score = 4 + 1 = 5. Center star 2W double word multiplier = 5 * 2 = 10.
        valid, msg, words, score = MoveValidator.validate_move(self.game.board, self.dict)
        self.assertTrue(valid)
        self.assertEqual(score, 10)

    def test_bingo_bonus(self):
        # Force current player rack to specific letters forming 7-letter word "RETAIN" + 'S' -> "RETAINS"
        p = self.game.current_player
        p.rack = [Tile('R'), Tile('E'), Tile('T'), Tile('A'), Tile('I'), Tile('N'), Tile('S')]
        
        # Place all 7 tiles starting at (7,4) through (7,10) covering center (7,7)
        letters = ['R', 'E', 'T', 'A', 'I', 'N', 'S']
        for i, l in enumerate(letters):
            self.game.board.place_draft_tile(7, 4 + i, Tile(l))

        valid, msg, words_info, score = MoveValidator.validate_move(self.game.board, self.dict)
        self.assertTrue(valid)
        # Should include BINGO BONUS (+50)
        self.assertTrue(any("BINGO" in w[0] for w in words_info))
        self.assertGreaterEqual(score, 50)

    def test_blank_tiles(self):
        blank_tile = Tile('_')
        self.assertTrue(blank_tile.is_blank)
        self.assertEqual(blank_tile.points, 0)

        # Place "C A [T]" where T is blank assigned 'T'
        self.game.board.place_draft_tile(7, 6, Tile('C'))
        self.game.board.place_draft_tile(7, 7, Tile('A'))
        self.game.board.place_draft_tile(7, 8, blank_tile, assigned_letter='T')

        valid, msg, words, score = MoveValidator.validate_move(self.game.board, self.dict)
        self.assertTrue(valid, msg)
        self.assertEqual(words[0][0], "CAT")
        # 'C'(3) + 'A'(1) + '_'(0) = 4. 2W at (7,7) => 4 * 2 = 8 pts.
        self.assertEqual(score, 8)

    def test_turn_switching_and_pass(self):
        p1 = self.game.players[0]
        p2 = self.game.players[1]

        self.assertEqual(self.game.current_player, p1)

        # Pass turn
        self.game.pass_turn()
        self.assertEqual(self.game.current_player, p2)

        self.game.pass_turn()
        self.assertEqual(self.game.current_player, p1)

    def test_game_end_scoring(self):
        # Perform 6 consecutive passes to trigger end game
        for _ in range(6):
            self.game.pass_turn()

        self.assertTrue(self.game.game_over)
        self.assertIsNotNone(self.game.winner)

if __name__ == "__main__":
    unittest.main()

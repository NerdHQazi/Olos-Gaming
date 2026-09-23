"""Unit tests for the Checkers game double-capture fix.

Run with:
    python games/checkers/checkers_test.py
"""

import os
import unittest

os.environ.setdefault('SDL_VIDEODRIVER', 'dummy')
os.environ.setdefault('SDL_AUDIODRIVER', 'dummy')

from checkers_game import (BOARD_SIZE, CELL_SIZE, RED, BLK, MAN,
                           capture_moves, normal_moves, legal_moves_for,
                           apply_move, CheckersGame)


def make_board():
    return [[None] * BOARD_SIZE for _ in range(BOARD_SIZE)]


def place(board, r, c, color, ptype=MAN):
    board[r][c] = {'id': f'{color}-{r}-{c}', 'color': color,
                   'type': ptype, 'row': r, 'col': c}


def piece_at(board, r, c):
    return board[r][c]


class TestCheckersCaptureLogic(unittest.TestCase):

    def test_double_capture_has_origin_as_from(self):
        # Regression test for the double-capture bug: the move object for a
        # multi-jump chain must use the ORIGINAL starting square as 'from',
        # not the intermediate landing square.
        board = make_board()
        place(board, 5, 2, RED)          # moving piece
        place(board, 4, 3, BLK)          # first captured piece
        place(board, 2, 5, BLK)          # second captured piece

        moves = capture_moves(board, 5, 2)
        self.assertEqual(len(moves), 1)
        move = moves[0]
        self.assertEqual(move['from'], (5, 2))
        self.assertEqual(move['to'], (1, 6))
        self.assertEqual(move['captured'], [(4, 3), (2, 5)])
        self.assertTrue(move['is_capture'])

    def test_double_capture_applies_full_chain(self):
        board = make_board()
        place(board, 5, 2, RED)
        place(board, 4, 3, BLK)
        place(board, 2, 5, BLK)

        moves = capture_moves(board, 5, 2)
        nb = apply_move(board, moves[0])

        # Piece lands on the final square of the chain.
        final = piece_at(nb, 1, 6)
        self.assertIsNotNone(final)
        self.assertEqual(final['color'], RED)
        # Origin and both captured squares are empty.
        self.assertIsNone(piece_at(nb, 5, 2))
        self.assertIsNone(piece_at(nb, 4, 3))
        self.assertIsNone(piece_at(nb, 2, 5))

    def test_triple_capture_chain_supported(self):
        # Longer chains (3+ captures) must keep working.
        board = make_board()
        place(board, 7, 0, RED)
        place(board, 6, 1, BLK)
        place(board, 4, 3, BLK)
        place(board, 2, 5, BLK)

        moves = capture_moves(board, 7, 0)
        self.assertEqual(len(moves), 1)
        move = moves[0]
        self.assertEqual(move['from'], (7, 0))
        self.assertEqual(move['to'], (1, 6))
        self.assertEqual(move['captured'], [(6, 1), (4, 3), (2, 5)])

        nb = apply_move(board, move)
        self.assertIsNone(piece_at(nb, 7, 0))
        self.assertIsNone(piece_at(nb, 6, 1))
        self.assertIsNone(piece_at(nb, 4, 3))
        self.assertIsNone(piece_at(nb, 2, 5))
        self.assertIsNotNone(piece_at(nb, 1, 6))

    def test_single_capture_works(self):
        board = make_board()
        place(board, 5, 2, RED)
        place(board, 4, 3, BLK)

        moves = capture_moves(board, 5, 2)
        self.assertEqual(len(moves), 1)
        move = moves[0]
        self.assertEqual(move['from'], (5, 2))
        self.assertEqual(move['to'], (3, 4))
        self.assertEqual(move['captured'], [(4, 3)])

        nb = apply_move(board, move)
        self.assertIsNone(piece_at(nb, 5, 2))
        self.assertIsNone(piece_at(nb, 4, 3))
        self.assertIsNotNone(piece_at(nb, 3, 4))

    def test_chain_stops_when_no_more_captures(self):
        # The chain must terminate: enemy pieces that cannot be reached by a
        # jump from the landing square must not extend the capture chain.
        board = make_board()
        place(board, 5, 2, RED)
        place(board, 4, 3, BLK)   # only capturable piece
        place(board, 2, 1, BLK)   # enemy nearby but not jumpable from (3,4)
        place(board, 3, 6, BLK)   # enemy nearby but not jumpable from (3,4)

        moves = capture_moves(board, 5, 2)
        self.assertEqual(len(moves), 1)
        self.assertEqual(moves[0]['captured'], [(4, 3)])
        self.assertEqual(moves[0]['to'], (3, 4))

    def test_multiple_capture_options_present(self):
        # A piece that can take either a single capture or a longer chain
        # must offer both as legal moves, both carrying the true origin.
        board = make_board()
        place(board, 5, 2, RED)
        place(board, 4, 3, BLK)   # chain start: 2-capture route
        place(board, 2, 5, BLK)
        place(board, 6, 1, BLK)   # single-capture route

        moves = capture_moves(board, 5, 2)
        self.assertEqual(len(moves), 2)
        targets = {(m['to'], tuple(m['captured'])) for m in moves}
        self.assertIn(((1, 6), ((4, 3), (2, 5))), targets)
        self.assertIn(((7, 0), ((6, 1),)), targets)
        for m in moves:
            self.assertEqual(m['from'], (5, 2))

    def test_normal_move_works(self):
        board = make_board()
        place(board, 5, 2, RED)
        moves = normal_moves(board, 5, 2)
        self.assertEqual(len(moves), 2)   # up-left and up-right
        for move in moves:
            self.assertEqual(move['from'], (5, 2))
            self.assertFalse(move['is_capture'])
            self.assertEqual(move['captured'], [])

        nb = apply_move(board, moves[0])
        to = moves[0]['to']
        self.assertIsNone(piece_at(nb, 5, 2))
        self.assertIsNotNone(piece_at(nb, to[0], to[1]))

    def test_captures_are_mandatory_over_normal_moves(self):
        # When a capture is available, only capture moves should be offered.
        board = make_board()
        place(board, 5, 2, RED)
        place(board, 4, 3, BLK)
        moves = legal_moves_for(board, 5, 2)
        self.assertTrue(moves)
        self.assertTrue(all(m['is_capture'] for m in moves))


class TestCheckersGameFlow(unittest.TestCase):

    def setUp(self):
        self.game = CheckersGame()

    def click(self, r, c):
        self.game.handle_click(c * CELL_SIZE + CELL_SIZE // 2,
                               r * CELL_SIZE + CELL_SIZE // 2)

    def reset_board(self, board):
        self.game.state['board'] = board

    def test_single_capture_switches_turn(self):
        board = make_board()
        place(board, 5, 2, RED)
        place(board, 4, 3, BLK)
        place(board, 0, 1, BLK)
        place(board, 0, 3, BLK)
        self.reset_board(board)
        self.game.state['current_player'] = RED

        self.click(5, 2)   # select RED piece
        self.click(3, 4)   # jump over BLK

        s = self.game.state
        self.assertEqual(s['current_player'], BLK)
        self.assertFalse(s['must_continue'])
        self.assertEqual(s['selected'], None)
        self.assertEqual(s['legal_moves'], [])
        self.assertIsNone(piece_at(s['board'], 5, 2))
        self.assertIsNone(piece_at(s['board'], 4, 3))
        self.assertIsNotNone(piece_at(s['board'], 3, 4))

    def test_double_capture_completes_chain_without_mid_turn_switch(self):
        board = make_board()
        place(board, 5, 2, RED)
        place(board, 4, 3, BLK)
        place(board, 2, 5, BLK)
        place(board, 0, 1, BLK)   # surviving piece keeps the game going
        self.reset_board(board)
        self.game.state['current_player'] = RED

        self.click(5, 2)   # select RED piece
        self.click(1, 6)   # final landing of the chain

        s = self.game.state
        # Whole chain executed in the same turn: both enemy pieces removed,
        # RED piece on the final square.
        self.assertIsNone(piece_at(s['board'], 5, 2))
        self.assertIsNone(piece_at(s['board'], 4, 3))
        self.assertIsNone(piece_at(s['board'], 2, 5))
        piece = piece_at(s['board'], 1, 6)
        self.assertIsNotNone(piece)
        self.assertEqual(piece['color'], RED)
        # Turn switched exactly once (to the opponent) after the chain.
        self.assertEqual(s['current_player'], BLK)
        self.assertEqual(s['move_count'], 1)
        self.assertEqual(s['moves_no_cap'], 0)
        self.assertFalse(s['must_continue'])
        self.assertEqual(s['status'], 'playing')

    def test_no_second_capture_available_ends_turn(self):
        # A capture with no follow-up jump must terminate the chain and hand
        # the turn over normally; the game must not get stuck.
        board = make_board()
        place(board, 5, 2, RED)
        place(board, 4, 3, BLK)     # single capture available
        place(board, 2, 1, BLK)     # enemy not reachable by a follow-up jump
        self.reset_board(board)
        self.game.state['current_player'] = RED

        self.click(5, 2)
        self.click(3, 4)

        s = self.game.state
        self.assertEqual(s['current_player'], BLK)
        self.assertFalse(s['must_continue'])
        self.assertIsNone(s['chain_piece'])
        self.assertEqual(s['status'], 'playing')
        # BLK (the new current player) still has legal moves.
        self.assertIsNotNone(piece_at(s['board'], 2, 1))

    def test_next_player_can_move_after_double_capture(self):
        # After a double capture the opponent must be able to play.
        board = make_board()
        place(board, 5, 2, RED)
        place(board, 4, 3, BLK)
        place(board, 2, 5, BLK)
        place(board, 0, 1, BLK)
        place(board, 0, 3, BLK)
        self.reset_board(board)
        self.game.state['current_player'] = RED

        self.click(5, 2)
        self.click(1, 6)

        self.assertEqual(self.game.state['current_player'], BLK)
        # Opponent's piece can be selected with legal moves available.
        self.click(0, 1)
        self.assertTrue(self.game.state['legal_moves'])


if __name__ == '__main__':
    unittest.main()
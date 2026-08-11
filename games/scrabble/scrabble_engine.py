import random
from typing import List, Tuple, Dict, Optional, Set
from dictionary import Dictionary

# Standard Scrabble Letter Point Values
LETTER_VALUES: Dict[str, int] = {
    'A': 1, 'B': 3, 'C': 3, 'D': 2, 'E': 1, 'F': 4, 'G': 2, 'H': 4,
    'I': 1, 'J': 8, 'K': 5, 'L': 1, 'M': 3, 'N': 1, 'O': 1, 'P': 3,
    'Q': 10, 'R': 1, 'S': 1, 'T': 1, 'U': 1, 'V': 4, 'W': 4, 'X': 8,
    'Y': 4, 'Z': 10, '_': 0
}

# Standard 100 Tile Distribution
STANDARD_TILE_DISTRIBUTION: Dict[str, int] = {
    'A': 9, 'B': 2, 'C': 2, 'D': 4, 'E': 12, 'F': 2, 'G': 3, 'H': 2,
    'I': 9, 'J': 1, 'K': 1, 'L': 4, 'M': 2, 'N': 6, 'O': 8, 'P': 2,
    'Q': 1, 'R': 6, 'S': 4, 'T': 6, 'U': 4, 'V': 2, 'W': 2, 'X': 1,
    'Y': 2, 'Z': 1, '_': 2
}


class Tile:
    """Represents a Scrabble tile."""
    def __init__(self, letter: str):
        self.letter = letter.upper()
        self.points = LETTER_VALUES.get(self.letter, 0)
        self.is_blank = (self.letter == '_')
        self.assigned_letter: Optional[str] = None  # Letter assigned if blank tile

    def get_char(self) -> str:
        """Returns the active letter character for word validation."""
        if self.is_blank:
            return self.assigned_letter if self.assigned_letter else '_'
        return self.letter

    def __repr__(self):
        if self.is_blank and self.assigned_letter:
            return f"Tile(_{self.assigned_letter}:{self.points}pt)"
        return f"Tile({self.letter}:{self.points}pt)"


class TileBag:
    """Manages the 100-tile Scrabble bag."""
    def __init__(self, distribution: Optional[Dict[str, int]] = None):
        if distribution is None:
            distribution = STANDARD_TILE_DISTRIBUTION
        self.tiles: List[Tile] = []
        for letter, count in distribution.items():
            for _ in range(count):
                self.tiles.append(Tile(letter))
        self.shuffle()

    def shuffle(self):
        random.shuffle(self.tiles)

    def draw(self, n: int = 1) -> List[Tile]:
        drawn = []
        for _ in range(min(n, len(self.tiles))):
            drawn.append(self.tiles.pop())
        return drawn

    def exchange(self, tiles_to_return: List[Tile]) -> List[Tile]:
        """Exchanges tiles back into bag and draws equal count."""
        count = len(tiles_to_return)
        if len(self.tiles) < count:
            raise ValueError("Not enough tiles in bag to exchange.")
        drawn = self.draw(count)
        # Reset blank assignment when returned
        for t in tiles_to_return:
            t.assigned_letter = None
        self.tiles.extend(tiles_to_return)
        self.shuffle()
        return drawn

    def remaining_count(self) -> int:
        return len(self.tiles)


class Board:
    """15x15 Scrabble Board state with multipliers, locked tiles, and draft tiles."""
    SIZE = 15

    def __init__(self):
        # Multipliers: '3W', '2W', '3L', '2L', 'S', or None
        self.multipliers: List[List[Optional[str]]] = [[None for _ in range(self.SIZE)] for _ in range(self.SIZE)]
        self._init_multipliers()

        self.locked_tiles: List[List[Optional[Tile]]] = [[None for _ in range(self.SIZE)] for _ in range(self.SIZE)]
        self.draft_tiles: List[List[Optional[Tile]]] = [[None for _ in range(self.SIZE)] for _ in range(self.SIZE)]

    def _init_multipliers(self):
        # 3W Triple Word
        for r, c in [(0, 0), (0, 7), (0, 14), (7, 0), (7, 14), (14, 0), (14, 7), (14, 14)]:
            self.multipliers[r][c] = "3W"

        # 2W Double Word (including diagonals and Center star 7,7)
        for i in range(1, 5):
            self.multipliers[i][i] = "2W"
            self.multipliers[i][14 - i] = "2W"
            self.multipliers[14 - i][i] = "2W"
            self.multipliers[14 - i][14 - i] = "2W"
        self.multipliers[7][7] = "S"  # Center Star acts as 2W on first move

        # 3L Triple Letter
        for r, c in [(1, 5), (1, 9), (5, 1), (5, 5), (5, 9), (5, 13),
                    (9, 1), (9, 5), (9, 9), (9, 13), (13, 5), (13, 9)]:
            self.multipliers[r][c] = "3L"

        # 2L Double Letter
        for r, c in [(0, 3), (0, 11), (2, 6), (2, 8), (3, 0), (3, 7), (3, 14),
                    (6, 2), (6, 6), (6, 8), (6, 12), (7, 3), (7, 11),
                    (8, 2), (8, 6), (8, 8), (8, 12), (11, 0), (11, 7), (11, 14),
                    (12, 6), (12, 8), (14, 3), (14, 11)]:
            self.multipliers[r][c] = "2L"

    def is_empty(self) -> bool:
        """Returns True if no locked tiles exist on the board."""
        for r in range(self.SIZE):
            for c in range(self.SIZE):
                if self.locked_tiles[r][c] is not None:
                    return False
        return True

    def get_tile(self, r: int, c: int) -> Optional[Tile]:
        if not (0 <= r < self.SIZE and 0 <= c < self.SIZE):
            return None
        return self.draft_tiles[r][c] if self.draft_tiles[r][c] is not None else self.locked_tiles[r][c]

    def get_locked_tile(self, r: int, c: int) -> Optional[Tile]:
        if not (0 <= r < self.SIZE and 0 <= c < self.SIZE):
            return None
        return self.locked_tiles[r][c]

    def place_draft_tile(self, r: int, c: int, tile: Tile, assigned_letter: Optional[str] = None) -> bool:
        if not (0 <= r < self.SIZE and 0 <= c < self.SIZE):
            return False
        if self.locked_tiles[r][c] is not None or self.draft_tiles[r][c] is not None:
            return False
        if tile.is_blank and assigned_letter:
            tile.assigned_letter = assigned_letter.upper()
        self.draft_tiles[r][c] = tile
        return True

    def remove_draft_tile(self, r: int, c: int) -> Optional[Tile]:
        if 0 <= r < self.SIZE and 0 <= c < self.SIZE:
            tile = self.draft_tiles[r][c]
            self.draft_tiles[r][c] = None
            return tile
        return None

    def get_draft_positions(self) -> List[Tuple[int, int]]:
        positions = []
        for r in range(self.SIZE):
            for c in range(self.SIZE):
                if self.draft_tiles[r][c] is not None:
                    positions.append((r, c))
        return positions

    def clear_draft(self) -> List[Tile]:
        recalled = []
        for r in range(self.SIZE):
            for c in range(self.SIZE):
                if self.draft_tiles[r][c] is not None:
                    t = self.draft_tiles[r][c]
                    self.draft_tiles[r][c] = None
                    recalled.append(t)
        return recalled

    def commit_draft(self):
        for r in range(self.SIZE):
            for c in range(self.SIZE):
                if self.draft_tiles[r][c] is not None:
                    self.locked_tiles[r][c] = self.draft_tiles[r][c]
                    self.draft_tiles[r][c] = None


class MoveValidator:
    """Validates word placement logic according to standard Scrabble rules."""

    @staticmethod
    def validate_move(board: Board, dictionary: Dictionary) -> Tuple[bool, str, List[Tuple[str, int]], int]:
        draft_pos = board.get_draft_positions()
        if not draft_pos:
            return False, "No tiles placed on the board.", [], 0

        # Check single line (horizontal or vertical)
        rows = [r for r, c in draft_pos]
        cols = [c for r, c in draft_pos]
        is_horizontal = len(set(rows)) == 1
        is_vertical = len(set(cols)) == 1

        if not (is_horizontal or is_vertical):
            return False, "Placed tiles must be in a single straight line.", [], 0

        # Determine line orientation
        if is_horizontal:
            r = rows[0]
            min_c, max_c = min(cols), max(cols)
            # Check gaps along horizontal line
            for c in range(min_c, max_c + 1):
                if board.get_tile(r, c) is None:
                    return False, "Placed tiles cannot have empty spaces between them.", [], 0
            main_direction = "H"
        else:
            c = cols[0]
            min_r, max_r = min(rows), max(rows)
            # Check gaps along vertical line
            for r in range(min_r, max_r + 1):
                if board.get_tile(r, c) is None:
                    return False, "Placed tiles cannot have empty spaces between them.", [], 0
            main_direction = "V"

        # Check First Move rule (must cover center tile 7,7)
        if board.is_empty():
            if (7, 7) not in draft_pos:
                return False, "First move must cover the center star (7, 7).", [], 0
        else:
            # Check connection rule (must connect to at least one locked tile)
            connected = False
            for r, c in draft_pos:
                for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                    adj_r, adj_c = r + dr, c + dc
                    if board.get_locked_tile(adj_r, adj_c) is not None:
                        connected = True
                        break
                if connected:
                    break

            # Also connected if main line extends into existing locked tiles before min or after max
            if not connected:
                if main_direction == "H":
                    if board.get_locked_tile(r, min_c - 1) is not None or board.get_locked_tile(r, max_c + 1) is not None:
                        connected = True
                else:
                    if board.get_locked_tile(min_r - 1, c) is not None or board.get_locked_tile(max_r + 1, c) is not None:
                        connected = True

            if not connected:
                return False, "Move must connect to existing tiles on the board.", [], 0

        # Extract words (Primary word + Cross words)
        words_to_score = []  # List of tuples: (positions, is_primary)
        
        # 1. Primary Word
        if main_direction == "H":
            r = rows[0]
            start_c = min_c
            while start_c > 0 and board.get_tile(r, start_c - 1) is not None:
                start_c -= 1
            end_c = max_c
            while end_c < Board.SIZE - 1 and board.get_tile(r, end_c + 1) is not None:
                end_c += 1
            primary_positions = [(r, c) for c in range(start_c, end_c + 1)]
        else:
            c = cols[0]
            start_r = min_r
            while start_r > 0 and board.get_tile(start_r - 1, c) is not None:
                start_r -= 1
            end_r = max_r
            while end_r < Board.SIZE - 1 and board.get_tile(end_r + 1, c) is not None:
                end_r += 1
            primary_positions = [(r, c) for r in range(start_r, end_r + 1)]

        if len(primary_positions) > 1:
            words_to_score.append(primary_positions)

        # 2. Cross Words for each draft tile
        for r, c in draft_pos:
            if main_direction == "H":
                # Perpendicular direction is Vertical
                start_r = r
                while start_r > 0 and board.get_tile(start_r - 1, c) is not None:
                    start_r -= 1
                end_r = r
                while end_r < Board.SIZE - 1 and board.get_tile(end_r + 1, c) is not None:
                    end_r += 1
                cross_pos = [(row, c) for row in range(start_r, end_r + 1)]
            else:
                # Perpendicular direction is Horizontal
                start_c = c
                while start_c > 0 and board.get_tile(r, start_c - 1) is not None:
                    start_c -= 1
                end_c = c
                while end_c < Board.SIZE - 1 and board.get_tile(r, end_c + 1) is not None:
                    end_c += 1
                cross_pos = [(r, col) for col in range(start_c, end_c + 1)]

            if len(cross_pos) > 1:
                words_to_score.append(cross_pos)

        if not words_to_score:
            return False, "Move must form a word of at least 2 letters.", [], 0

        # Validate words in dictionary and calculate score
        words_info = []
        total_score = 0

        for pos_list in words_to_score:
            word_str = "".join([board.get_tile(r, c).get_char() for r, c in pos_list])
            if not dictionary.is_valid_word(word_str):
                return False, f"Invalid word: '{word_str}'", [], 0
            
            # Score word
            word_score = Scorer.score_word(board, pos_list)
            words_info.append((word_str, word_score))
            total_score += word_score

        # Check Bingo Bonus (+50 pts for playing all 7 tiles)
        if len(draft_pos) == 7:
            total_score += 50
            words_info.append(("BINGO BONUS! (Used all 7 tiles)", 50))

        return True, "Valid move!", words_info, total_score


class Scorer:
    """Calculates points for individual words and total turn score."""

    @staticmethod
    def score_word(board: Board, positions: List[Tuple[int, int]]) -> int:
        word_multiplier = 1
        letter_score_sum = 0

        for r, c in positions:
            tile = board.get_tile(r, c)
            if tile is None:
                continue

            pts = tile.points  # Blank tile has 0 points

            # Multipliers ONLY apply if tile is newly placed draft tile
            is_draft = (board.draft_tiles[r][c] is not None)
            if is_draft:
                mult = board.multipliers[r][c]
                if mult == "2L":
                    pts *= 2
                elif mult == "3L":
                    pts *= 3
                elif mult in ("2W", "S"):
                    word_multiplier *= 2
                elif mult == "3W":
                    word_multiplier *= 3

            letter_score_sum += pts

        return letter_score_sum * word_multiplier


class Player:
    """Represents a Scrabble player."""
    def __init__(self, name: str):
        self.name = name
        self.rack: List[Tile] = []
        self.score: int = 0
        self.consecutive_passes: int = 0

    def remove_tiles(self, tiles_to_remove: List[Tile]):
        for t in tiles_to_remove:
            if t in self.rack:
                self.rack.remove(t)

    def remaining_rack_points(self) -> int:
        return sum(t.points for t in self.rack)


class Game:
    """Main Scrabble Game Orchestrator."""
    def __init__(self, player_names: List[str] = None, dictionary: Optional[Dictionary] = None):
        if player_names is None:
            player_names = ["Player 1", "Player 2"]
        if dictionary is None:
            dictionary = Dictionary()

        self.dictionary = dictionary
        self.board = Board()
        self.tile_bag = TileBag()
        self.players = [Player(name) for name in player_names]
        self.current_player_idx = 0
        self.game_over = False
        self.winner: Optional[Player] = None
        self.last_move_msg = "Game started. Pass & Play mode."

        # Initial rack distribution (7 tiles each)
        for player in self.players:
            player.rack = self.tile_bag.draw(7)

    @property
    def current_player(self) -> Player:
        return self.players[self.current_player_idx]

    def switch_turn(self):
        self.current_player_idx = (self.current_player_idx + 1) % len(self.players)

    def submit_move(self) -> Tuple[bool, str, int]:
        """Submits current draft tiles on board as a move."""
        if self.game_over:
            return False, "Game is already over.", 0

        draft_pos = self.board.get_draft_positions()
        if not draft_pos:
            return False, "No tiles placed on board to submit.", 0

        # Check all blank tiles have assigned letters
        for r, c in draft_pos:
            t = self.board.draft_tiles[r][c]
            if t and t.is_blank and not t.assigned_letter:
                return False, "Blank tile placed without assigning a letter.", 0

        is_valid, msg, words_info, total_score = MoveValidator.validate_move(self.board, self.dictionary)
        if not is_valid:
            return False, msg, 0

        # Apply move
        player = self.current_player
        player.score += total_score
        player.consecutive_passes = 0

        # Remove used draft tiles from player's rack
        draft_tiles = [self.board.draft_tiles[r][c] for r, c in draft_pos]
        player.remove_tiles(draft_tiles)

        # Lock tiles on board
        self.board.commit_draft()

        # Refill player rack
        drawn = self.tile_bag.draw(len(draft_tiles))
        player.rack.extend(drawn)

        # Check end of game condition (bag empty + player rack empty)
        if self.tile_bag.remaining_count() == 0 and len(player.rack) == 0:
            self._end_game(reason=f"{player.name} used all tiles.")
            return True, f"Valid move! Scored {total_score} pts. Game Over!", total_score

        summary_str = ", ".join([f"{w}: {s}pts" for w, s in words_info])
        self.last_move_msg = f"{player.name} played {summary_str} (+{total_score} pts)"

        self.switch_turn()
        return True, self.last_move_msg, total_score

    def recall_draft(self) -> int:
        """Recalls all draft tiles from board back to current player's rack."""
        recalled = self.board.clear_draft()
        # Reset blank assignment on recalled tiles
        for t in recalled:
            t.assigned_letter = None
        return len(recalled)

    def pass_turn(self) -> str:
        """Passes the current player's turn."""
        if self.game_over:
            return "Game is over."

        self.recall_draft()
        player = self.current_player
        player.consecutive_passes += 1
        msg = f"{player.name} passed their turn."

        # Check if 6 consecutive passes overall (3 passes per player in 2-player)
        total_passes = sum(p.consecutive_passes for p in self.players)
        if total_passes >= 6:
            self._end_game(reason="6 consecutive passes.")
            return f"{msg} Game Over!"

        self.last_move_msg = msg
        self.switch_turn()
        return msg

    def exchange_tiles(self, tile_indices: List[int]) -> Tuple[bool, str]:
        """Exchanges selected tiles from current player's rack with the tile bag."""
        if self.game_over:
            return False, "Game is over."

        if self.tile_bag.remaining_count() < 7:
            return False, "Cannot exchange tiles when tile bag has fewer than 7 tiles."

        if not tile_indices:
            return False, "No tiles selected for exchange."

        self.recall_draft()
        player = self.current_player
        
        # Select tiles from rack
        tiles_to_swap = [player.rack[i] for i in tile_indices if i < len(player.rack)]
        if len(tiles_to_swap) != len(tile_indices):
            return False, "Invalid tile selection."

        # Remove from rack
        for t in tiles_to_swap:
            player.rack.remove(t)

        # Exchange with bag
        new_tiles = self.tile_bag.exchange(tiles_to_swap)
        player.rack.extend(new_tiles)
        player.consecutive_passes = 0

        msg = f"{player.name} exchanged {len(tiles_to_swap)} tiles."
        self.last_move_msg = msg
        self.switch_turn()
        return True, msg

    def shuffle_rack(self):
        """Shuffles current player's rack tiles."""
        random.shuffle(self.current_player.rack)

    def _end_game(self, reason: str = ""):
        self.game_over = True
        
        # Deduct remaining rack tile values
        for p in self.players:
            p.score -= p.remaining_rack_points()

        # Find winner
        sorted_players = sorted(self.players, key=lambda p: p.score, reverse=True)
        self.winner = sorted_players[0]
        self.last_move_msg = f"Game Over ({reason}). Winner: {self.winner.name} ({self.winner.score} pts)"

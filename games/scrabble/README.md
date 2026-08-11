# Scrabble Game

A complete, feature-rich, playable implementation of standard Scrabble built in Python with Pygame.

## Features & Mechanics

- **Standard 15x15 Scrabble Board**: Correct multiplier placement for Triple Word (`3W`), Double Word (`2W`), Triple Letter (`3L`), Double Letter (`2L`), and Center Star (`★`) start square.
- **100-Tile Bag Distribution**: Standard letter frequency (including 2 Blank `_` wildcard tiles) and letter point values.
- **Draft vs Locked Board States**: Placed draft tiles are visually distinct (bright yellow) from locked tiles (wooden). Draft tiles can be moved, recalled, or submitted.
- **Move Validation Engine**:
  - Checks straight line continuity (horizontal or vertical).
  - First move must cover the center star (`7, 7`).
  - Subsequent moves must connect to existing locked tiles on the board.
  - Validates primary words and all perpendicular cross-words formed.
- **Scrabble Scoring System**:
  - Letter multipliers (`2L`, `3L`) and word multipliers (`2W`, `3W`) applied only to newly placed tiles.
  - Scores all secondary cross-words created during the turn.
  - 50-point **Bingo Bonus** awarded for placing all 7 rack tiles in a single turn.
- **Blank Tile Wildcards**: When placing a blank tile (`_`), an interactive modal dialog allows assigning its letter (A-Z). The blank tile scores 0 points while enabling word formation.
- **Local Pass-and-Play**: 2-player local pass-and-play turn switching with score tracking, rack refilling, tile exchange, turn passing, rack shuffling, and game-end score deductions.
- **Offline Word Validation**: Bundled with a standard ENABLE1 public-domain English dictionary (`dictionary.txt`) for instant, offline $O(1)$ set lookups without network dependencies or mandatory third-party packages.
- **Word Definitions**: Integrates optional NLTK WordNet definition lookups when available, displaying definitions for played words.

## Architecture

- `scrabble_engine.py`: Core decoupled Scrabble game engine containing `Tile`, `TileBag`, `Board`, `MoveValidator`, `Scorer`, `Player`, and `Game` state logic.
- `dictionary.py`: Fast set-based dictionary validator loading from `dictionary.txt` with graceful definition lookups.
- `dictionary.txt`: Legally usable, public domain ENABLE1 English word list (~83,600+ words).
- `GameBasics.py`: Pygame UI components (`Text`, `WrapText`, `BordButton`, `Button`, `BlankTileModal`, and color constants).
- `ScrabbleBord.py`: Main interactive Pygame game launcher and event loop.
- `test_engine.py`: Comprehensive unit test suite covering tile distributions, rules, validation, multipliers, cross-words, bingo bonus, blank tiles, turns, and game end.

## How to Run Unit Tests

```bash
python games/scrabble/test_engine.py
```

## How to Play the Game

```bash
python games/scrabble/ScrabbleBord.py
```

### Controls:
- **Place Tile**: Click a tile on your rack, then click an empty square on the board.
- **Remove Draft Tile**: Click a draft tile on the board to return it to your rack.
- **Submit**: Submits placed tiles, validates words, adds score, and advances turn.
- **Recall**: Returns all draft tiles from the board to your rack.
- **Exchange**: Select rack tiles, then click Exchange to swap them with the tile bag.
- **Pass**: Passes your turn.
- **Shuffle**: Randomizes your rack tiles.
- **Restart / Quit**: Top right action buttons to start a new game or exit.

# Games Directory — Olos Gaming

Welcome to the **Games** directory of Olos Gaming. This directory contains a collection of standalone 2D arcade, board, and utility engine demonstrations implemented in Python using Pygame.

---

## 1. Games Directory Overview

The `games/` directory serves as the core playground for playable games and game utility engines within the Olos Gaming repository. Each subfolder is a self-contained game module complete with its own entry points, rendering pipeline, and rules engine.

---

## 2. Technologies Used

* **Python 3.x**: Primary programming language used across all games.
* **Pygame / `pygame-ce`**: Core multimedia library used for window creation, event loop handling, 2D sprite/shape rendering, and audio sound synthesis.
* **python-chess**: Pure Python chess library used by the Chess engine (`games/chess/`) for rule validation, board state representation, move generation, and checkmate/stalemate detection.
* **Python Standard Library**: Standard modules used across games, including `csv` (for tilemap parsing), `unittest` (for Scrabble test suite), `random`, `json`, `urllib`, `copy`, `sys`, and `os`.

> **Note on Server/Backend Packages**: `games/chess/requirements.txt` includes web/server packages (`fastapi`, `uvicorn`, `python-socketio`) which support external backend infrastructure in the project. Running the local standalone Pygame chess application only requires `pygame` (or `pygame-ce`) and `python-chess`.

---

## 3. Requirements & Environment

### Recommended Python Version
* **Python 3.8+** (Tested up to Python 3.14)

### Virtual Environment (Recommended)

It is recommended to use a Python virtual environment to manage dependencies:

```bash
# Create a virtual environment
python -m venv venv

# Activate on Windows (PowerShell)
.\venv\Scripts\Activate.ps1

# Activate on Linux / macOS
source venv/bin/activate
```

### Dependency Installation

Install the required core game dependencies:

```bash
pip install pygame python-chess
```

Or install using the requirements file in the chess directory:

```bash
pip install -r games/chess/requirements.txt
```

---

## 4. Project Structure

Below is the actual directory structure of the `games/` directory:

```text
games/
├── .gitignore
├── README.md
├── checkers/
│   └── checkers_game.py
├── chess/
│   ├── README.md
│   ├── ai.py
│   ├── engine.py
│   ├── main.py
│   ├── renderer.py
│   └── requirements.txt
├── scrabble/
│   ├── GameBasics.py
│   ├── README.md
│   ├── ScrabbleBord.py
│   ├── dictionary.py
│   ├── dictionary.txt
│   ├── scrabble_engine.py
│   ├── test_dynamic_dictionary.py
│   ├── test_engine.py
│   ├── test_interactive_user_scenarios.py
│   └── test_simulated_gameplay.py
├── snake/
│   ├── README.md
│   └── snake_game.py
├── tetris/
│   └── tetris.py
└── tilemap/
    ├── csv_loader.py
    ├── main.py
    ├── map.csv
    └── tilemap.py
```

### Folder Explanations

* `checkers/`: Single-file implementation of standard 8x8 Draughts / Checkers.
* `chess/`: Modular Pygame Chess implementation with `python-chess` backend integration and a heuristic computer opponent.
* `scrabble/`: Complete 15x15 Scrabble game engine, UI components, local ENABLE1 dictionary, dynamic API lookup, and `unittest` test suite.
* `snake/`: Grid-based Snake game with food spawning, progressive speed scaling, and synthetic sound effects.
* `tetris/`: Classic Tetris piece rotation, collision detection, soft/hard drop, line clearing, and score tracking.
* `tilemap/`: Utility engine demonstrating how to parse 2D CSV map files (`map.csv`) and render tilemaps.

---

## 5. Available Games

### 1. Checkers (Draughts)
* **Description**: Standard 8x8 checkers game featuring Red vs Black local gameplay.
* **Features**: Mandatory captures, multi-jump (chain capture) support, king promotion, 50-move draw rule, move highlighting, game over screen.
* **Entry Point**: `games/checkers/checkers_game.py`
* **Technologies**: Python, Pygame
* **Run Command**:
  ```bash
  python games/checkers/checkers_game.py
  ```

### 2. Chess
* **Description**: Complete Chess game allowing a human player (White) to play against a computer AI opponent (Black).
* **Features**: Move generation and validation via `python-chess` (captures, castling, en passant, pawn promotion dialog), check/checkmate/stalemate detection, heuristic AI opponent (prioritizes checkmate > highest capture value > random move), move highlighting, side panel UI, move undo (`U`), restart (`R`).
* **Entry Point**: `games/chess/main.py`
* **Technologies**: Python, Pygame, `python-chess`
* **Run Command**:
  ```bash
  python games/chess/main.py
  ```

### 3. Scrabble
* **Description**: Feature-rich standard 15x15 Scrabble implementation supporting 2-player local pass-and-play.
* **Features**: Standard 15x15 board with multiplier squares (`3W`, `2W`, `3L`, `2L`, center star), 100-tile bag distribution, draft vs locked board states, move validator (center start rule, connectivity, perpendicular cross-words), scoring system with 50-point Bingo bonus, interactive blank wildcard (`_`) letter assignment modal, offline ENABLE1 dictionary (`dictionary.txt`), optional dynamic web dictionary API fallback.
* **Entry Point**: `games/scrabble/ScrabbleBord.py`
* **Technologies**: Python, Pygame, Standard Library (`urllib`, `json`, `unittest`)
* **Run Command**:
  ```bash
  python games/scrabble/ScrabbleBord.py
  ```

### 4. Snake
* **Description**: Classic grid-based Snake arcade game with smooth controls and sound effects.
* **Features**: Snake movement, food spawning, self/wall collision detection, progressive speed increases every 50 points, dual arrow key / WASD controls, clean score panel, restart screen.
* **Entry Point**: `games/snake/snake_game.py`
* **Technologies**: Python, Pygame
* **Run Command**:
  ```bash
  python games/snake/snake_game.py
  ```

### 5. Tetris
* **Description**: Classic 20x10 grid Tetris game.
* **Features**: 7 standard tetromino shapes and colors, piece rotation (`UP`), left/right movement (`LEFT`/`RIGHT`), soft drop (`DOWN`), hard drop (`SPACE`), line clearing, score accumulation, restart option (`ESCAPE`).
* **Entry Point**: `games/tetris/tetris.py`
* **Technologies**: Python, Pygame
* **Run Command**:
  ```bash
  python games/tetris/tetris.py
  ```

### 6. Tilemap CSV Demonstration
* **Description**: Utility engine showing how to parse external CSV grid files and blit corresponding tile surfaces.
* **Features**: Modular `TileMap` class (`tilemap.py`), CSV file parser (`csv_loader.py`), sample 10x5 map layout (`map.csv`), fallback handling for unknown tile IDs.
* **Entry Point**: `games/tilemap/main.py`
* **Technologies**: Python, Pygame, Standard `csv` library
* **Run Command**:
  ```bash
  python games/tilemap/main.py
  ```

---

## 6. Installation

1. Clone the repository and navigate to the project root:
   ```bash
   cd Olos-Gaming
   ```
2. Set up and activate a virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On Linux/macOS:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install pygame python-chess
   ```

---

## 7. Running the Games

You can launch any game directly from the root of the repository:

```bash
# Checkers
python games/checkers/checkers_game.py

# Chess
python games/chess/main.py

# Scrabble
python games/scrabble/ScrabbleBord.py

# Snake
python games/snake/snake_game.py

# Tetris
python games/tetris/tetris.py

# Tilemap Demo
python games/tilemap/main.py
```

Alternatively, navigate into the specific game directory first:

```bash
cd games/chess
python main.py
```

---

## 8. Development Guidelines

When contributing or extending games in this directory, adhere to the following project conventions:

1. **Standard Pygame Loop**: Structure entry points with a clear game loop pattern:
   * **Input Processing**: Process `pygame.event.get()` events.
   * **State Update**: Update game state, timer, or physics.
   * **Rendering**: Clear background, draw game components/board, render UI text.
   * **Display & Clock**: Call `pygame.display.flip()` and `clock.tick(FPS)`.
2. **Decouple Logic & Rendering**: Separate game engine rule evaluation (e.g. `engine.py`, `scrabble_engine.py`) from rendering code (e.g. `renderer.py`, `GameBasics.py`).
3. **Safe File Path Resolution**: Always compute relative resource file paths (such as `dictionary.txt` or `map.csv`) using `os.path.dirname(os.path.abspath(__file__))` to ensure execution succeeds regardless of the user's working directory.
4. **Clean Exit & Cleanup**: Handle `pygame.QUIT` and quit keyboard events (`ESC` / `Q`) gracefully by calling `pygame.quit()` and `sys.exit()`.

---

## 9. Adding a New Game

To add a new game to the `games/` directory:

1. **Create Directory**: Create a new folder under `games/` named after your game (e.g. `games/pong/`).
2. **Implement Entry Point**: Create a main executable file (e.g. `main.py` or `pong_game.py`) implementing the Pygame initialization and game loop.
3. **Decouple Components**: For complex games, split logic (`engine.py`) and drawing (`renderer.py`).
4. **Resource Management**: Place any game-specific assets, text files, or helper scripts inside your game directory.
5. **Update Documentation**: Add your new game details, entry point, controls, and run command to this `games/README.md`.

---

## 10. Testing

### Automated Unit Tests (`games/scrabble/`)
The Scrabble implementation includes an automated test suite built using Python's standard `unittest` framework:

* `test_engine.py`: 12 unit tests covering tile bag distribution (100 tiles), rack refilling, center tile requirement, move validation, word multipliers, bingo bonus (50 pts), blank tile mechanics, turn passing, and end-game score calculation.

To run the offline engine unit tests:

```bash
python games/scrabble/test_engine.py
```

*Note: Additional test files in Scrabble (`test_dynamic_dictionary.py`, `test_interactive_user_scenarios.py`, `test_simulated_gameplay.py`) test dictionary API calls and interactive UI flows.*

### Manual Testing
For `checkers`, `chess`, `snake`, `tetris`, and `tilemap`, formal automated unit test suites are currently not implemented. Testing for these games is conducted manually by launching the respective entry point and verifying visual rendering, controls, and game logic rules.

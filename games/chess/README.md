# Python Chess Game

A complete chess game built with Pygame and the `python-chess` library.

## Features
- Full chess rules (via `python-chess`): captures, castling, en passant, promotion
- Check, checkmate, and stalemate detection
- Simple AI opponent (plays Black)
- Legal move highlighting
- Last-move highlighting and check indicator
- Side panel with turn info, captured pieces, and move count
- Undo, restart, and quit controls

## Setup
1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Running
```bash
python main.py
```

## Controls
| Key / Action | Effect |
|---|---|
| Mouse click | Select piece / make move |
| `R` | Restart game |
| `U` | Undo last move pair |
| `Q` / `Escape` | Quit |

## Structure
- `main.py` — Entry point, game controller, event loop
- `engine.py` — Game-state wrapper over `python-chess`
- `renderer.py` — All Pygame rendering (board, pieces, UI)
- `ai.py` — Simple AI opponent (checkmate > captures > random)

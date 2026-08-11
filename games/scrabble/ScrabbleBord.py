import pygame
import sys
import os

# Import Engine & UI Basics
from scrabble_engine import Game, Tile, LETTER_VALUES
import GameBasics
from GameBasics import (
    RED, GREEN, BLUE, LIGHT_BLUE, WHITE, BLACK, DARK_GRAY, LIGHT_GRAY,
    SPACE_COLOR, PINK, GOLD, YELLOW, WOOD, DARK_WOOD, PURPLE,
    Text, WrapText, BordButton, Button, BlankTileModal
)

def main():
    pygame.init()
    screenWidth, screenHeight = 860, 860
    screen = pygame.display.set_mode((screenWidth, screenHeight), pygame.RESIZABLE)
    pygame.display.set_caption("Scrabble - Olos Gaming")
    clock = pygame.time.Clock()

    # Initialize Engine
    game = Game(player_names=["Player 1", "Player 2"])

    # Board layout dimensions
    grid_size = 15
    cell_size = 40
    board_px = grid_size * cell_size  # 600px
    start_x = (screenWidth - board_px) // 2  # centered (130px)
    start_y = 70

    # Create 15x15 Board Cells
    board_cells = []
    for r in range(grid_size):
        row_cells = []
        for c in range(grid_size):
            cx = start_x + (c * cell_size)
            cy = start_y + (r * cell_size)
            btn = BordButton(cx, cy, cell_size, cell_size, GREEN, SPACE_COLOR, WHITE)
            
            # Bonus color & label initialization
            mult = game.board.multipliers[r][c]
            if mult == "3W":
                btn.inactive_color = RED
                btn.text = "3W"
                btn.textColor = WHITE
            elif mult == "2W":
                btn.inactive_color = PINK
                btn.text = "2W"
                btn.textColor = BLACK
            elif mult == "3L":
                btn.inactive_color = BLUE
                btn.text = "3L"
                btn.textColor = WHITE
            elif mult == "2L":
                btn.inactive_color = LIGHT_BLUE
                btn.text = "2L"
                btn.textColor = BLACK
            elif mult == "S":
                btn.inactive_color = GOLD
                btn.text = "★"
                btn.textColor = BLACK

            btn.original_text = btn.text
            row_cells.append(btn)
        board_cells.append(row_cells)

    # Blank Tile Selection Modal
    blank_modal = BlankTileModal(screenWidth, screenHeight)
    pending_blank_target = None  # (row, col, rack_index)

    # UI Controls
    rack_buttons = []
    selected_rack_index = None
    selected_exchange_indices = set()
    exchange_mode = False

    # Action Buttons (Row 1 under rack)
    btn_y = start_y + board_px + 75
    btn_w, btn_h = 100, 40
    spacing = 15
    
    btn_submit = Button(start_x, btn_y, btn_w, btn_h, "Submit", GREEN, WHITE, outlineSize=2, font_size=20, text_color=WHITE)
    btn_submit.color = GREEN
    
    btn_clear = Button(start_x + (btn_w + spacing), btn_y, btn_w, btn_h, "Recall", DARK_GRAY, WHITE, outlineSize=1, font_size=20, text_color=WHITE)
    btn_clear.color = DARK_GRAY
    
    btn_exchange = Button(start_x + 2 * (btn_w + spacing), btn_y, btn_w, btn_h, "Exchange", PURPLE, WHITE, outlineSize=1, font_size=20, text_color=WHITE)
    btn_exchange.color = PURPLE

    btn_pass = Button(start_x + 3 * (btn_w + spacing), btn_y, btn_w, btn_h, "Pass", RED, WHITE, outlineSize=1, font_size=20, text_color=WHITE)
    btn_pass.color = RED

    btn_shuffle = Button(start_x + 4 * (btn_w + spacing), btn_y, btn_w, btn_h, "Shuffle", BLUE, WHITE, outlineSize=1, font_size=20, text_color=WHITE)
    btn_shuffle.color = BLUE

    # Action Buttons (Top Bar)
    btn_restart = Button(screenWidth - 190, 15, 80, 35, "Restart", GOLD, WHITE, outlineSize=1, font_size=18, text_color=BLACK)
    btn_quit = Button(screenWidth - 100, 15, 80, 35, "Quit", RED, WHITE, outlineSize=1, font_size=18, text_color=WHITE)

    # Header & Status Text Elements
    title_text = Text("SCRABBLE", 36, BLACK, (screenWidth // 2, 15), align="center")
    turn_text = Text("Turn: Player 1", 22, BLACK, (start_x, 50), align="left")
    score_text = Text("Player 1: 0  |  Player 2: 0", 22, BLACK, (screenWidth // 2, 50), align="center")
    bag_text = Text("Bag: 86", 22, BLACK, (start_x + board_px, 50), align="right")

    feedback_text = Text("Game started. Place tiles and click Submit!", 20, BLUE, (screenWidth // 2, start_y + board_px + 125), align="center")
    def_text = WrapText("Definition: ", 18, BLACK, (start_x, start_y + board_px + 150), board_px)

    running = True

    def sync_board_cells():
        """Syncs engine board state (locked/draft tiles) with visual BordButtons."""
        for r in range(grid_size):
            for c in range(grid_size):
                btn = board_cells[r][c]
                locked = game.board.get_locked_tile(r, c)
                draft = game.board.draft_tiles[r][c]

                if locked:
                    btn.is_locked = True
                    btn.is_draft = False
                    btn.text = locked.get_char()
                    btn.color = WOOD
                    btn.textColor = BLACK
                    btn.points_val = locked.points
                elif draft:
                    btn.is_locked = False
                    btn.is_draft = True
                    btn.text = draft.get_char()
                    btn.color = YELLOW
                    btn.textColor = BLACK
                    btn.points_val = draft.points
                else:
                    btn.is_locked = False
                    btn.is_draft = False
                    btn.text = btn.original_text
                    btn.color = btn.inactive_color
                    btn.points_val = 0

    def sync_rack_buttons():
        """Syncs current player's rack with clickable rack buttons."""
        nonlocal rack_buttons
        rack_buttons = []
        player = game.current_player
        rack_len = len(player.rack)
        tile_w, tile_h = 45, 45
        rack_total_w = rack_len * tile_w + (rack_len - 1) * 10
        rx_start = (screenWidth - rack_total_w) // 2
        ry = start_y + board_px + 20

        for i, tile in enumerate(player.rack):
            bx = rx_start + i * (tile_w + 10)
            btn = Button(bx, ry, tile_w, tile_h, tile.letter, GOLD, WOOD, outlineSize=2, font_size=24, text_color=BLACK)
            btn.points_val = tile.points
            if selected_rack_index == i or i in selected_exchange_indices:
                btn.selected = True
                btn.color = GOLD
            else:
                btn.selected = False
                btn.color = WOOD
            rack_buttons.append(btn)

    def update_definition(move_msg):
        """Updates definition display if a valid word move message is produced."""
        words = [w.strip() for w in move_msg.split() if w.isalpha() and len(w) >= 2]
        if words:
            word = words[0]
            defn = game.dictionary.get_definition(word)
            def_text.update_text(f"Definition ({word}): {defn}")

    while running:
        sync_board_cells()
        sync_rack_buttons()

        # Update Header Strings
        turn_text.update(f"Current: {game.current_player.name}")
        p1_score = game.players[0].score
        p2_score = game.players[1].score
        score_text.update(f"Player 1: {p1_score} pts   |   Player 2: {p2_score} pts")
        bag_text.update(f"Tiles in Bag: {game.tile_bag.remaining_count()}")

        events = pygame.event.get()
        for event in events:
            if event.type == pygame.QUIT:
                running = False
                sys.exit()

            # Handle Modal Dialog if active
            if blank_modal.active:
                chosen_letter = blank_modal.handle_event(event)
                if chosen_letter and pending_blank_target:
                    r, c, idx = pending_blank_target
                    player = game.current_player
                    if idx < len(player.rack):
                        tile = player.rack[idx]
                        if game.board.place_draft_tile(r, c, tile, assigned_letter=chosen_letter):
                            feedback_text.update(f"Placed Blank tile as '{chosen_letter}'", BLUE)
                    pending_blank_target = None
                    selected_rack_index = None
                continue

            # Restart & Quit Buttons
            btn_restart.handle_event(event)
            if btn_restart.clicked:
                btn_restart.reset()
                game = Game(player_names=["Player 1", "Player 2"])
                selected_rack_index = None
                selected_exchange_indices.clear()
                exchange_mode = False
                feedback_text.update("New game started!", GREEN)
                def_text.update_text("Definition: ")
                continue

            btn_quit.handle_event(event)
            if btn_quit.clicked:
                running = False
                sys.exit()

            if game.game_over:
                continue

            # Action Buttons
            btn_submit.handle_event(event)
            if btn_submit.clicked:
                btn_submit.reset()
                success, msg, score = game.submit_move()
                color = GREEN if success else RED
                feedback_text.update(msg, color)
                if success:
                    update_definition(msg)
                    selected_rack_index = None
                    selected_exchange_indices.clear()
                    exchange_mode = False
                continue

            btn_clear.handle_event(event)
            if btn_clear.clicked:
                btn_clear.reset()
                count = game.recall_draft()
                selected_rack_index = None
                feedback_text.update(f"Recalled {count} draft tiles to rack.", BLUE)
                continue

            btn_exchange.handle_event(event)
            if btn_exchange.clicked:
                btn_exchange.reset()
                if exchange_mode:
                    # Perform exchange
                    if selected_exchange_indices:
                        success, msg = game.exchange_tiles(list(selected_exchange_indices))
                        color = GREEN if success else RED
                        feedback_text.update(msg, color)
                        selected_exchange_indices.clear()
                        exchange_mode = False
                        selected_rack_index = None
                    else:
                        exchange_mode = False
                        feedback_text.update("Exchange cancelled.", BLUE)
                else:
                    exchange_mode = True
                    selected_rack_index = None
                    selected_exchange_indices.clear()
                    feedback_text.update("Select rack tiles to exchange, then click Exchange again.", PURPLE)
                continue

            btn_pass.handle_event(event)
            if btn_pass.clicked:
                btn_pass.reset()
                msg = game.pass_turn()
                selected_rack_index = None
                selected_exchange_indices.clear()
                exchange_mode = False
                feedback_text.update(msg, RED)
                continue

            btn_shuffle.handle_event(event)
            if btn_shuffle.clicked:
                btn_shuffle.reset()
                game.shuffle_rack()
                feedback_text.update("Shuffled rack tiles.", BLUE)
                continue

            # Rack Tile Selection Handling
            for i, r_btn in enumerate(rack_buttons):
                r_btn.handle_event(event)
                if r_btn.clicked:
                    r_btn.reset()
                    if exchange_mode:
                        if i in selected_exchange_indices:
                            selected_exchange_indices.remove(i)
                        else:
                            selected_exchange_indices.add(i)
                    else:
                        if selected_rack_index == i:
                            selected_rack_index = None  # Deselect
                        else:
                            selected_rack_index = i

            # Board Cell Click Handling
            for r in range(grid_size):
                for c in range(grid_size):
                    cell_btn = board_cells[r][c]
                    cell_btn.handle_event(event)
                    if cell_btn.clicked:
                        cell_btn.reset()
                        # If cell has a draft tile, click returns it to rack!
                        if game.board.draft_tiles[r][c] is not None:
                            recalled_tile = game.board.remove_draft_tile(r, c)
                            recalled_tile.assigned_letter = None
                            feedback_text.update(f"Returned {recalled_tile.letter} to rack.", BLUE)
                        elif selected_rack_index is not None and not exchange_mode:
                            player = game.current_player
                            if selected_rack_index < len(player.rack):
                                tile = player.rack[selected_rack_index]

                                # If tile is blank, open Blank Modal prompt
                                if tile.is_blank:
                                    pending_blank_target = (r, c, selected_rack_index)
                                    blank_modal.show()
                                else:
                                    if game.board.place_draft_tile(r, c, tile):
                                        selected_rack_index = None
                                        feedback_text.update(f"Placed '{tile.letter}' at ({r},{c}).", BLUE)

        # RENDER SCREEN
        screen.fill(SPACE_COLOR)

        # Render Header
        title_text.render(screen)
        turn_text.render(screen)
        score_text.render(screen)
        bag_text.render(screen)

        # Render Board Grid
        for r in range(grid_size):
            for c in range(grid_size):
                board_cells[r][c].draw(screen)

        # Render Player Rack Tiles
        for r_btn in rack_buttons:
            r_btn.draw(screen)

        # Render Action Buttons
        btn_submit.draw(screen)
        btn_clear.draw(screen)
        btn_exchange.draw(screen)
        btn_pass.draw(screen)
        btn_shuffle.draw(screen)

        btn_restart.draw(screen)
        btn_quit.draw(screen)

        # Render Feedback Banner & Word Definition
        feedback_text.render(screen)
        def_text.render(screen)

        # Render Game Over Overlay if ended
        if game.game_over:
            overlay = pygame.Surface((screenWidth, screenHeight), pygame.SRCALPHA)
            overlay.fill((0, 0, 0, 180))
            screen.blit(overlay, (0, 0))

            go_box = pygame.Rect(screenWidth // 2 - 250, screenHeight // 2 - 120, 500, 240)
            pygame.draw.rect(screen, SPACE_COLOR, go_box)
            pygame.draw.rect(screen, GOLD, go_box, 4)

            go_title = Text("GAME OVER!", 40, RED, (screenWidth // 2, go_box.y + 20))
            winner_str = f"Winner: {game.winner.name} ({game.winner.score} pts)" if game.winner else "Game Tied!"
            go_winner = Text(winner_str, 28, GREEN, (screenWidth // 2, go_box.y + 70))
            go_scores = Text(f"P1: {game.players[0].score} pts  |  P2: {game.players[1].score} pts", 22, BLACK, (screenWidth // 2, go_box.y + 115))

            go_title.render(screen)
            go_winner.render(screen)
            go_scores.render(screen)

            btn_restart.x = screenWidth // 2 - 50
            btn_restart.y = go_box.y + 165
            btn_restart.draw(screen)

        # Render Blank Selection Modal if open
        blank_modal.draw(screen)

        pygame.display.flip()
        clock.tick(60)

    pygame.quit()

if __name__ == "__main__":
    main()

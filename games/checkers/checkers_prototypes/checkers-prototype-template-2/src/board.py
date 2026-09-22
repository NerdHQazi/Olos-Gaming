from copy import deepcopy
from math import floor
from random import seed, choice, shuffle

from pygame import Surface, draw, Rect, transform, MOUSEBUTTONDOWN, mouse
from pygame.event import Event, post

from asset import Asset
from colors import *
from config import *
from filepaths import RED_PAWN_ICON, BLACK_PAWN_ICON, RED_KING_ICON, BLACK_KING_ICON
from instances import end_turn_button
from network import Client


class CheckeredBoard(Asset):
    """
    Game board that handles the bulk of the game logic.

    Parameters:
        board_dimensions: Length and width of the board in spaces.
        rows: Number of rows of pawns.
        mode: Constant representing the state of type of game being played.

    Keyword Arguments:
        position: Position of the top-left corner of the game board.
        vertical_padding: Distance between the top of the screen and the start of the border of the board.
    """

    # Constants for board visuals.
    BORDER_THICK = 10
    BORDER_COLOR = BLACK
    PAWN_SCALE_FACTOR: float = 0.9

    # Constants for the pawn identifiers.
    EMPTY = 0
    RED_PAWN = 1
    BLACK_PAWN = 2
    RED_KING = 3
    BLACK_KING = 4

    # Constants for tracking the player's turns.
    BLACK_TURN = 0
    RED_TURN = 1

    # Constants for tracking who wins the game.
    BLACK_WIN = 1
    RED_WIN = 2
    NO_WIN = 0

    def __init__(self, board_dimensions: int,
                 rows: int,
                 mode: int,
                 client: Client = None,
                 position: Vector2 = Vector2(0, 0),
                 vertical_padding: int = 10):

        super().__init__(position)
        self.square_size = (SCREEN_HEIGHT - (vertical_padding + CheckeredBoard.BORDER_THICK * 2)) / board_dimensions
        self.dimensions = board_dimensions
        self.selected_pawn: Vector2 = CheckeredBoard.EMPTY
        self.jumped = False
        self.mode = mode
        self.client = client

        self.pawns = [[CheckeredBoard.EMPTY for x in range(board_dimensions)] for y in range(board_dimensions)]
        for col in range(self.dimensions // 2):
            for row in range(rows):
                self.pawns[row][(col * 2) + (row % 2)] = CheckeredBoard.RED_PAWN
                row = self.dimensions - (row + 1)
                self.pawns[row][(col * 2) + (row % 2)] = CheckeredBoard.BLACK_PAWN

        self.pawn_size = int(self.square_size * CheckeredBoard.PAWN_SCALE_FACTOR)
        self.empty_icon = Surface((0, 0))

        self.icons = {
            CheckeredBoard.EMPTY: Surface((0, 0)),
            CheckeredBoard.RED_PAWN: transform.scale(RED_PAWN_ICON, (self.pawn_size, self.pawn_size)),
            CheckeredBoard.BLACK_PAWN: transform.scale(BLACK_PAWN_ICON, (self.pawn_size, self.pawn_size)),
            CheckeredBoard.RED_KING: transform.scale(RED_KING_ICON, (self.pawn_size, self.pawn_size)),
            CheckeredBoard.BLACK_KING: transform.scale(BLACK_KING_ICON, (self.pawn_size, self.pawn_size)),
        }

        self.board_size_pixels = int(board_dimensions * self.square_size + (CheckeredBoard.BORDER_THICK * 2))
        self.background = Surface((self.board_size_pixels, self.board_size_pixels))
        self.background.fill(CheckeredBoard.BORDER_COLOR)
        self.width = self.background.get_width()
        self.height = self.background.get_height()
        self.moves = None
        self.moved = False
        self.moved_pawn = None
        self.turn = CheckeredBoard.BLACK_TURN
        self.saved_state: list[list[int]] = deepcopy(self.pawns)
        self.square_anchor = self.position + Vector2(CheckeredBoard.BORDER_THICK, CheckeredBoard.BORDER_THICK)

        self.processing = not (mode == LAN_JOIN)

        if mode == LOCAL_CPU:
            seed()  # Seed the random number generator if playing against a CPU.

    def process(self, events: list[Event]) -> None:
        """Updates the checkered board's state with the event queue."""
        for e in events:

            if e.type == NETWORK_ERROR:
                self.processing = False

            elif e.type == MESSAGE_RECEIVED:
                if e.message == CLIENT_LEFT_MESSAGE:
                    if self.mode == LAN_HOST:
                        post(Event(BLACK_WINS))
                    else:
                        post(Event(RED_WINS))
                elif BOARD_STATE_MESSAGE in e.message:
                    board_state = e.message.split(',')[1]
                    post(Event(TURN_ENDED, board_state=board_state))

            elif e.type == TURN_CANCELED:
                self.selected_pawn = CheckeredBoard.EMPTY
                self.moves = None
                self.moved = False
                self.jumped = False
                self.pawns = deepcopy(self.saved_state)

            elif e.type == TURN_ENDED:
                self.selected_pawn = CheckeredBoard.EMPTY
                self.moves = None
                self.moved = False
                self.jumped = False
                self.saved_state = deepcopy(self.pawns)
                self.turn = (self.turn + 1) % 2  # Swap the turn counter.

                # User just finished their turn against the local CPU.
                if self.turn == CheckeredBoard.RED_TURN and self.mode == LOCAL_CPU:
                    event.post(event.Event(CPU_TURN))
                    self.processing = False

                # Local CPU just finished its turn, time for the users turn.
                elif self.turn == CheckeredBoard.BLACK_TURN and self.mode == LOCAL_CPU:
                    self.processing = True

                # The game is online and the user just finished their turn.
                elif (self.mode == LAN_HOST and self.turn == CheckeredBoard.RED_TURN) or \
                        (self.mode == LAN_JOIN and self.turn == CheckeredBoard.BLACK_TURN):
                    self.processing = False
                    message = f'{BOARD_STATE_MESSAGE},'
                    for row in range(self.dimensions):
                        for col in range(self.dimensions):
                            message += str(self.pawns[row][col])
                    try:
                        self.client.send(message)  # Send the board state over to the other person.
                    except Exception:
                        post(Event(NETWORK_ERROR, message="Error while sending the board state."))

                # The game is online and the opponent just finished their turn.
                elif (self.mode == LAN_HOST and self.turn == CheckeredBoard.BLACK_TURN) or \
                        (self.mode == LAN_JOIN and self.turn == CheckeredBoard.RED_TURN):
                    # Set the board using the board state of the event's message.
                    for row in range(self.dimensions):
                        for col in range(self.dimensions):
                            self.pawns[row][col] = int(e.board_state[int(col) + (int(row) * self.dimensions)])

                    self.processing = True  # It is now the user's turn.

                self.check_for_win()

            elif e.type == BUTTON_PRESSED:
                if e.text == "End Turn":
                    post(Event(TURN_ENDED))
                elif e.text == "Forfeit":
                    if self.mode == LAN_HOST:
                        post(Event(RED_WINS))
                        try:
                            self.client.send('')
                        except Exception:
                            pass
                    elif self.mode == LAN_JOIN:
                        post(Event(RED_WINS))
                        try:
                            self.client.send('')
                        except Exception:
                            pass
                    elif self.turn == CheckeredBoard.RED_TURN:
                        post(Event(BLACK_WINS))
                    else:
                        post(Event(RED_WINS))

            elif e.type == MOUSEBUTTONDOWN and self.processing:
                mouse_pos = Vector2(mouse.get_pos())
                mouse_row = floor((mouse_pos.y - self.square_anchor.y) / self.square_size)
                mouse_col = floor((mouse_pos.x - self.square_anchor.x) / self.square_size)

                if 0 <= mouse_row < self.dimensions and 0 <= mouse_col < self.dimensions:
                    if mouse.get_pressed(3)[2]:  # If the user right clicks, cancel the move and reset the turn.
                        event.post(event.Event(TURN_CANCELED))
                    elif self.selected_pawn:  # User already has a pawn selected and attempts to move it.
                        if Vector2(mouse_row, mouse_col) in self.moves:  # The move is valid, move the pawn.
                            # Save the state of the board before the initial move in case the turn is canceled.
                            if not self.moved:
                                self.saved_state = deepcopy(self.pawns)

                            self.move_pawn((mouse_row, mouse_col))

                        # Return the selected pawn if the same location was selected (no attempted movement).
                        elif Vector2(mouse_row, mouse_col) == self.selected_pawn:
                            self.selected_pawn = CheckeredBoard.EMPTY

                        else:  # Otherwise, invalid move, cancel the turn.
                            event.post(event.Event(TURN_CANCELED))

                    # Check if the user selects a pawn they control (black pawns are even ints while red are odds).
                    elif self.pawns[mouse_row][mouse_col] and self.pawns[mouse_row][mouse_col] % 2 == self.turn:
                        #  Make sure the user is not selecting a different pawn if a move is in progress (double jump).
                        if not self.moved or (self.moved and (mouse_row, mouse_col) == self.moved_pawn):
                            self.selected_pawn = (mouse_row, mouse_col)
                            self.moves = self.calculate_moves()

            # CPU makes a move in place of a human player.
            elif e.type == CPU_TURN:
                open_moves = []
                # Iterate through all the pawns on the board to look for a good move.
                for row in range(self.dimensions):
                    for col in range(self.dimensions):
                        self.selected_pawn = (row, col)
                        pawn_id = self.get_sel_pawn_id()
                        if pawn_id == CheckeredBoard.RED_PAWN or pawn_id == CheckeredBoard.RED_KING:
                            for move in self.calculate_moves():
                                score = 0
                                if move[0] == (self.dimensions - 1) and pawn_id == CheckeredBoard.RED_PAWN:
                                    score += 1
                                if abs(self.selected_pawn[0] - move[0]) == 2:
                                    score += 1
                                open_moves.append([self.selected_pawn, move, score])

                if len(open_moves) == 0:  # CPU cannot move, user wins the game.
                    post(Event(BLACK_WINS))
                else:  # Otherwise, make a move.
                    shuffle(open_moves)  # Randomize the move list for variation.
                    # Select the best move (highest score) to make.
                    best_move = open_moves[0]
                    for move in open_moves:
                        if move[2] > best_move[2]:  # Compare the scores of each move.
                            best_move = move

                    self.selected_pawn = best_move[0]
                    self.move_pawn(best_move[1])
                    self.selected_pawn = best_move[1]

                    # Continue to double jump while the CPU has the option to do so.
                    open_moves = self.calculate_moves()
                    while len(open_moves) > 0:
                        position = choice(open_moves)
                        self.move_pawn(position)
                        self.selected_pawn = position
                        open_moves = self.calculate_moves()
                    post(Event(TURN_ENDED))

                self.selected_pawn = CheckeredBoard.EMPTY

        # Update the button to end the player's turn if a move is in progress.
        if self.moved:
            end_turn_button.update(events)

    def get_sel_pawn_id(self) -> int:
        """Returns the ID of the pawn type for the pawn specified by self.selected_pawn in self.pawns."""
        return self.pawns[int(self.selected_pawn[0])][int(self.selected_pawn[1])]

    def get_pawn_id(self, row: int, col: int) -> int:
        """Returns the ID of the pawn type for the pawn specified by (row, col) in self.pawns."""
        return self.pawns[row][col]

    def set_pos(self, position: Vector2) -> None:
        """Sets the position of the checkered board's top-left corner to position."""
        self.position = position
        self.square_anchor = self.position + Vector2(CheckeredBoard.BORDER_THICK, CheckeredBoard.BORDER_THICK)

    def center(self, position: Vector2) -> None:
        """Centers the board around position."""
        position = position - (Vector2(self.width, self.height) / 2)
        self.set_pos(position)

    def move_pawn(self, position: tuple[int, int]) -> None:
        """Function moves self.selected_pawn's position in self.pawns to the location specified its arguments."""
        row = int(position[0])
        col = int(position[1])

        if abs(row - self.selected_pawn[0]) > 1:  # Check if a jump is occurring.
            # Calculate the location of the pawn that is being jumped.
            y = int((row + self.selected_pawn[0]) / 2)
            x = int((col + self.selected_pawn[1]) / 2)
            self.pawns[y][x] = CheckeredBoard.EMPTY  # Remove the pawn being jumped.
            self.jumped = True

        # Promote the pawn if it isn't already a king and it is moving to the end of the board.
        if row % (self.dimensions - 1) == 0 and self.get_sel_pawn_id() < 3:
            self.pawns[self.selected_pawn[0]][self.selected_pawn[1]] += 2

        # Move the pawn to its new location.
        self.pawns[row][col] = self.get_sel_pawn_id()
        # Set old location to empty.
        self.pawns[self.selected_pawn[0]][self.selected_pawn[1]] = CheckeredBoard.EMPTY
        self.selected_pawn = CheckeredBoard.EMPTY
        self.moved_pawn = (row, col)  # Save the moved pawn for potential double jump.
        self.moved = True

    def calculate_moves(self) -> list[tuple[int, int]]:
        """Returns a list of int tuples that represent the possible ending positions of self.selected_pawn."""
        forwards = [Vector2(-1, -1), Vector2(-1, 1)]  # Forwards direction vectors from the perspective of black.
        backwards = [Vector2(1, 1), Vector2(1, -1)]  # Backwards direction vectors from the perspective of black.

        pawn_id = self.get_sel_pawn_id()
        if pawn_id > 2:  # Check if the piece is a king as direction does not limit their movement.
            directions = forwards + backwards
        elif pawn_id == CheckeredBoard.BLACK_PAWN:  # Check if black is moving.
            directions = forwards
        else:  # Otherwise, it is red's turn (reversed forward direction).
            directions = backwards

        open_adj_spaces = []
        open_jump_spaces = []
        for direction in directions:
            # Calculate the row and column of the space to check.
            row = int(self.selected_pawn[0] + direction[0])
            col = int(self.selected_pawn[1] + direction[1])

            # Check if the space is empty first.
            if 0 <= row < self.dimensions and 0 <= col < self.dimensions:  # Check if the space is on the board.
                pawn_id = self.get_pawn_id(row, col)
                if pawn_id == CheckeredBoard.EMPTY:
                    open_adj_spaces.append(Vector2(row, col))

                elif self.get_sel_pawn_id() != pawn_id != (self.get_sel_pawn_id() + 2):
                    row += int(direction[0])
                    col += int(direction[1])
                    if 0 <= row < self.dimensions and 0 <= col < self.dimensions:  # Check if the space is on the board.
                        pawn_id = self.get_pawn_id(row, col)
                        if pawn_id == CheckeredBoard.EMPTY:
                            open_jump_spaces.append((int(row), int(col)))

        if self.jumped:  # If the pawn has already jumped this turn, they can only make more jumps during this turn.
            open_moves = open_jump_spaces
        elif not self.moved:  # Otherwise, if this is the initial move, both types of moves are open.
            open_moves = open_jump_spaces + open_adj_spaces
        else:  # Otherwise, the pawn has already moved to an adjacent space and cannot move anymore.
            open_moves = []
        return open_moves

    def check_for_win(self) -> None:
        """Checks the board to see if either player has won the game. Wins are signaled with posting an event on
        the event queue."""
        black_exists = False
        red_exists = False

        for row in range(self.dimensions):
            for col in range(self.dimensions):
                pawn_id = self.get_pawn_id(row, col)
                if pawn_id == CheckeredBoard.BLACK_PAWN or pawn_id == CheckeredBoard.BLACK_KING:
                    black_exists = True
                elif pawn_id == CheckeredBoard.RED_PAWN or pawn_id == CheckeredBoard.RED_KING:
                    red_exists = True

        # Post the appropriate event if a player won the game.
        if not black_exists:
            post(Event(RED_WINS))
        elif not red_exists:
            post(Event(BLACK_WINS))

    def draw(self, screen: Surface) -> None:
        """Draws the Checkers background and the still pawns on the background, not including the pawn being jumped."""
        # Draw the background.
        screen.blit(self.background, self.position)
        for row in range(self.dimensions):
            for col in range(self.dimensions):
                color = RED if (col + row) % 2 else BLACK
                position = self.square_anchor + Vector2(col * self.square_size, row * self.square_size)
                square = Rect(position, (self.square_size, self.square_size))
                draw.rect(screen, color, square)
                icon = self.icons[self.pawns[row][col]]
                # Position the icon in the center of the checker square
                position += Vector2(self.square_size - icon.get_width(), self.square_size - icon.get_height()) / 2
                if (row, col) != self.selected_pawn:  # Draw the selected pawn at the mouse cursor.
                    screen.blit(icon, position)

                if self.selected_pawn and self.moves and Vector2(row, col) in self.moves:
                    draw.circle(screen, LIGHT_BLUE, position, 15)

        # Draw the pawn at the mouse cursor if one is selected.
        if self.selected_pawn:
            mouse_pos = Vector2(mouse.get_pos())
            icon = self.icons[self.get_sel_pawn_id()]
            screen.blit(icon, mouse_pos - Vector2(self.square_size, self.square_size) / 2)

        # Only draw the end turn button after the player and not the CPU has made a valid move.
        if self.moved and not (self.mode == LOCAL_CPU and self.turn == CheckeredBoard.RED_TURN):
            end_turn_button.draw(screen)

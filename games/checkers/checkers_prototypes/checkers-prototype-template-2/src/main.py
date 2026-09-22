import sys

from pygame import key, K_F4, K_LALT
from pygame.event import post, Event

from asset import Asset
from board import CheckeredBoard
from instances import *
from network import Client, Server
from transition import Transition


def main():
    """This application processes a peer to peer game of checkers over a local network."""
    # Initialize pygame's modules
    pygame.init()
    pygame.font.init()
    clock = pygame.time.Clock()

    screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT), DISPLAY_FLAGS)
    pygame.display.set_caption("Online Checkers")

    client = None  # Client object for joining online games.
    server = None  # Server object for hosting online games.
    running = True
    assets = main_menu_assets  # assets tracks the current assets in scope to draw on the screen.
    while running:
        post(Event(FRAME_TIMER, {'dt': (clock.tick(MAX_FPS) / 1000)}))  # Update and record internal clock.

        # Check for ALT + F4 to quit game.
        keyboard_input = key.get_pressed()
        if keyboard_input[K_F4] and keyboard_input[K_LALT]:
            pygame.event.post(pygame.QUIT)  # Post a quit event to exit on the next frame.

        events = pygame.event.get()
        for e in events:

            # Selecting buttons.
            if e.type == BUTTON_PRESSED:
                if e.text == "Local":
                    assets = local_menu_assets
                elif e.text == "Host":
                    assets = host_menu_assets
                elif e.text == "Join":
                    assets = join_menu_assets
                elif e.text == "Start":  # Local game of checkers is starting.
                    board_dimensions = int(board_dimensions_button_group.get_value())
                    rows = int(row_number_group.get_value())
                    mode = int(opponent_type_group.get_value())
                    board = CheckeredBoard(board_dimensions=board_dimensions, rows=rows, mode=mode)
                    board.center(SCREEN_CENTER)
                    post(Event(TRANSITION_START, assets=game_assets + [board]))
                elif e.text == "Cancel":
                    toggle_assets(assets, True)
                    assets.pop()
                    client, server = cleanup(client, server)

                elif e.text == "Back":
                    assets = main_menu_assets
                elif e.text == "Return":
                    assets.pop()
                    post(Event(TRANSITION_START, assets=main_menu_assets))
                elif e.text == "Quit":
                    post(Event(pygame.QUIT))
                elif e.text == "Begin":  # Start hosting an online game.
                    toggle_assets(assets, False, CheckeredBackground)
                    assets.append(waiting_notification)
                    try:
                        server = Server()
                        client = Client()
                    except Exception:
                        post(Event(NETWORK_ERROR, error="Error while hosting the game."))

            # User inputs an IP to join an online game of checkers.
            elif e.type == TEXTBOX_ENTRY:
                toggle_assets(assets, False, CheckeredBackground)
                assets.append(joining_notification)
                # Give the client time to create and start the threads before sending the start message.
                pygame.time.set_timer(START_ATTEMPT, millis=1500, loops=1)
                try:
                    client = Client(ip_textbox.get_value())
                except Exception:
                    post(Event(NETWORK_ERROR, error="Couldn't join the game."))

            # User is joining game, send a start message to the host.
            elif e.type == START_ATTEMPT:
                try:
                    client.send(START_MESSAGE)
                except Exception:
                    post(Event(NETWORK_ERROR, error="Couldn't join the game."))

            # Transition events.
            elif e.type == TRANSITION_START:
                toggle_assets(assets, False, CheckeredBackground)
                assets.append(Transition(assets=e.assets))
            elif e.type == TRANSITION_PAUSED:  # Swap over the assets when the screen is black.
                toggle_assets(assets, True)
                transition = assets.pop()
                assets = e.assets
                toggle_assets(assets, False, CheckeredBackground)
                assets.append(transition)
            elif e.type == TRANSITION_END:  # The user can now interact with the application again.
                toggle_assets(assets, True)
                assets.pop()

            # Game over events.
            elif e.type == BLACK_WINS:
                assets.append(black_wins_notification)
            elif e.type == RED_WINS:
                assets.append(red_wins_notification)

            # Network messages.
            elif e.type == MESSAGE_RECEIVED:
                if e.message == START_MESSAGE:  # Another user joined, start the game and message the other client.
                    try:
                        board_dimensions = int(board_dimensions_button_group.get_value())
                        rows = int(row_number_group.get_value())
                        client.send(f'{BOARD_SPECIFICATION_MESSAGE},{board_dimensions},{rows}')
                        board = CheckeredBoard(board_dimensions=board_dimensions, rows=rows,
                                               mode=LAN_HOST, client=client)
                        board.center(SCREEN_CENTER)
                        post(Event(TRANSITION_START, assets=game_assets + [board]))
                    except Exception:
                        post(Event(NETWORK_ERROR, error="Error sending message."))

                elif BOARD_SPECIFICATION_MESSAGE in e.message:  # Host sent the board specifications.
                    board_specifications = e.message.split(',')
                    board_dimensions = int(board_specifications[1])
                    rows = int(board_specifications[2])
                    board = CheckeredBoard(board_dimensions=board_dimensions, rows=rows, mode=LAN_JOIN, client=client)
                    board.center(SCREEN_CENTER)
                    post(Event(TRANSITION_START, assets=game_assets + [board]))

            elif e.type == NETWORK_ERROR:  # Clean up the network resources and notify user.
                client, server = cleanup(client, server)
                toggle_assets(assets, True, CheckeredBackground)

                # Cleanup any notifications in the asset list.
                if waiting_notification in assets:
                    assets.remove(waiting_notification)
                if joining_notification in assets:
                    assets.remove(joining_notification)

                for lyst in all_assets:
                    for asset in lyst:
                        asset.enable()
                if network_error_notification not in assets:  # Ensure multiple notifications aren't added to assets.
                    assets.append(network_error_notification)

            # Quitting the game.
            elif e.type == pygame.QUIT:
                running = False

        # Drawing the screen.
        screen.fill(BLACK)
        for asset in assets:
            asset.update(events)
            asset.draw(screen)

        pygame.display.update()

    # Exiting the application.
    cleanup(client, server)
    sys.exit()


def toggle_assets(assets: list[Asset], enabled: bool, classes: list = None):
    """Enables or disables the process function of assets besides types specified by classes."""
    if enabled:
        for asset in assets:
            if not classes or not isinstance(asset, classes):
                asset.enable()
    else:
        for asset in assets:
            if not classes or not isinstance(asset, classes):
                asset.disable()


def cleanup(client: Client, server: Server) -> tuple[None, None]:
    """Deconstructs server and client and returns a tuple to reassign them to none (mainly to cleanup the ports)."""
    if client:
        del client
    if server:
        del server
    return None, None


if __name__ == '__main__':
    main()

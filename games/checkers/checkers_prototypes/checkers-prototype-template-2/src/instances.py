"""Module instances every asset instance used in the game."""
from background import CheckeredBackground
from button import Button
from colors import *
from config import *
from label import Label
from notification import Notification
from radio import RadioButtonGroup
from textbox import TextBox


# Formatting variables.
font_size = 50
margin = 50
min_icon_width = 350
y_padding = 20
x_padding = 20
vertical_separation = 20


"""========================= MAIN MENU ========================="""
min_width = 300
RETURN_BUTTONS_LOCATION = POINTS[ROWS - 4][1]

background = CheckeredBackground()

title = Label(text="Checkers",
              font_size=200,
              border_thickness=15,
              padding_x_left=x_padding * 1.5,
              padding_x_right=x_padding,
              padding_y_up=y_padding * 2)
title.center(POINTS[4][CENTER_COLUMN])

local_button = Button(text="Local",
                      font_size=100,
                      padding_x_left=x_padding,
                      padding_x_right=x_padding * 0.8,
                      padding_y_up=y_padding,
                      border_thickness=10,
                      min_width=min_width)
local_button.center(POINTS[9][CENTER_COLUMN])

host_button = Button(text="Host",
                     font_size=100,
                     padding_x_left=x_padding,
                     padding_x_right=x_padding * 0.8,
                     padding_y_up=y_padding,
                     border_thickness=10,
                     min_width=min_width)
host_button.center(POINTS[12][CENTER_COLUMN])

join_button = Button(text="Join",
                     font_size=100,
                     padding_x_left=x_padding,
                     padding_x_right=x_padding * 0.8,
                     padding_y_up=y_padding,
                     border_thickness=10,
                     min_width=min_width)
join_button.center(POINTS[15][CENTER_COLUMN])

quit_button = Button(text="Quit",
                     font_size=80,
                     min_width=200,
                     padding_y_up=y_padding * 0.5)
quit_button.set_pos(RETURN_BUTTONS_LOCATION)

main_menu_assets = [background, title, local_button, host_button, join_button, quit_button]

"""========================= LOCAL MENU ========================="""
label_row = 3
button_group_row = 7
board_dimensions_column = 4
row_number_column = CENTER_COLUMN
opponent_type_column = 16

back_button = Button(text="Back",
                     font_size=80,
                     min_width=200,
                     padding_y_up=y_padding * 0.5)
back_button.set_pos(RETURN_BUTTONS_LOCATION)

board_dimensions_label = Label(text="Board Dimensions: ",
                               font_size=font_size,
                               font_color=LIGHT_BLUE,
                               border_color=LIGHT_BLUE,
                               padding_y_up=y_padding / 2,
                               padding_y_down=y_padding / 2,
                               min_width=min_icon_width)
board_dimensions_label.center(POINTS[label_row][board_dimensions_column])

board_dimensions_button_group = RadioButtonGroup(vertical_separation=vertical_separation,
                                                 font_size=font_size,
                                                 min_width=min_icon_width,
                                                 padding_y_up=y_padding / 2,
                                                 padding_y_down=y_padding / 2,
                                                 buttons={
                                                     "8 x 8": 8,
                                                     "10 x 10": 10,
                                                     "12 x 12": 12
                                                 })
board_dimensions_button_group.center(POINTS[button_group_row][board_dimensions_column])

backdrop = Label(text="",
                 position=POINTS[1][1],
                 min_width=(POINTS[0][COLUMNS - 2] - POINTS[0][1]).x,
                 min_height=(POINTS[ROWS - 3][0] - POINTS[3][0]).y)

row_number_label = Label(text="Number of Rows:",
                         font_size=font_size,
                         font_color=LIGHT_BLUE,
                         border_color=LIGHT_BLUE,
                         padding_y_up=y_padding / 2,
                         padding_y_down=y_padding / 2,
                         min_width=min_icon_width)
row_number_label.center(POINTS[label_row][row_number_column])

row_number_group = RadioButtonGroup(vertical_separation=vertical_separation,
                                    font_size=font_size,
                                    min_width=min_icon_width,
                                    padding_y_up=y_padding / 2,
                                    padding_y_down=y_padding / 2,
                                    buttons={
                                        "3": 3,
                                        "2": 2,
                                        "1": 1
                                    })
row_number_group.center(POINTS[button_group_row][row_number_column])

opponent_type_label = Label(text="Opponent Type:",
                            font_size=font_size,
                            font_color=LIGHT_BLUE,
                            border_color=LIGHT_BLUE,
                            padding_y_up=y_padding / 2,
                            padding_y_down=y_padding / 2,
                            min_width=min_icon_width)
opponent_type_label.center(POINTS[label_row][opponent_type_column])

opponent_type_group = RadioButtonGroup(vertical_separation=vertical_separation,
                                       font_size=font_size,
                                       min_width=min_icon_width,
                                       padding_y_up=y_padding / 2,
                                       padding_y_down=y_padding / 2,
                                       buttons={
                                           "CPU": LOCAL_CPU,
                                           "Human Player": LOCAL_HUMAN
                                       })
opponent_type_group.center(POINTS[button_group_row][opponent_type_column])

start_button = Button(text="Start",
                      font_size=100,
                      padding_x_left=x_padding,
                      padding_x_right=x_padding * 0.8,
                      padding_y_up=y_padding,
                      border_thickness=10,
                      min_width=min_width)
start_button.center(POINTS[12][CENTER_COLUMN])

local_menu_assets = [background, backdrop, back_button, board_dimensions_label, board_dimensions_button_group,
                     row_number_label, row_number_group, opponent_type_label, opponent_type_group, start_button]

"""========================= HOST MENU ========================="""

begin_button = Button(text="Begin",
                      font_size=100,
                      padding_x_left=x_padding,
                      padding_x_right=x_padding * 0.8,
                      padding_y_up=y_padding,
                      border_thickness=10,
                      min_width=min_width)
begin_button.center(POINTS[12][CENTER_COLUMN])

waiting_notification = Notification(text="Waiting...",
                                    options=['Cancel'],
                                    option_width=400,
                                    font_size=90)
waiting_notification.center(POINTS[CENTER_ROW][CENTER_COLUMN])

host_menu_assets = [background, backdrop, back_button, board_dimensions_label, board_dimensions_button_group,
                    row_number_label, row_number_group, begin_button]

"""========================= JOIN MENU ========================="""
ip_textbox_row = 6
ip_textbox = TextBox(font_size=100,
                     enabled_characters=TextBox.NUMBERS + '.',
                     padding_x_left=x_padding,
                     padding_x_right=x_padding * 0.8,
                     padding_y_up=y_padding,
                     border_thickness=10,
                     min_width=min_width)
ip_textbox.set_pos(POINTS[ip_textbox_row][CENTER_COLUMN])

ip_textbox_label = Label(text="IPv4:",
                         font_size=100,
                         padding_x_left=x_padding,
                         padding_x_right=x_padding * 0.8,
                         padding_y_up=y_padding,
                         border_thickness=10)
ip_textbox_label.set_pos(POINTS[ip_textbox_row][CENTER_COLUMN - 3])

joining_notification = Notification(text="Joining...",
                                    options=['Cancel'],
                                    option_width=400,
                                    font_size=90)
joining_notification.center(POINTS[CENTER_ROW][CENTER_COLUMN])

join_menu_assets = [background, backdrop, back_button, ip_textbox, ip_textbox_label]


"""========================= IN-GAME ASSETS ========================="""

end_turn_button = Button(text="End Turn",
                         font_size=80)
end_turn_button.set_pos(POINTS[CENTER_ROW][1])

forfeit_button = Button(text="Forfeit",
                        font_size=80,
                        padding_y_up=y_padding * 0.5,
                        padding_x_left=10,
                        padding_x_right=10)
forfeit_button.set_pos(RETURN_BUTTONS_LOCATION)

game_assets = [background, forfeit_button]

red_wins_notification = Notification(text="Red wins!",
                                     options=['Return'],
                                     option_width=400,
                                     font_size=90)
red_wins_notification.center(POINTS[CENTER_ROW][CENTER_COLUMN])

black_wins_notification = Notification(text="Black wins!",
                                       options=['Return'],
                                       option_width=400,
                                       font_size=90)
black_wins_notification.center(POINTS[CENTER_ROW][CENTER_COLUMN])

network_error_notification = Notification(text="A Network Error Occurred.",
                                          options=['Return'],
                                          option_width=400,
                                          font_size=90)
network_error_notification.center(POINTS[CENTER_ROW][CENTER_COLUMN])


all_assets = [game_assets, join_menu_assets, local_menu_assets, host_menu_assets, main_menu_assets]

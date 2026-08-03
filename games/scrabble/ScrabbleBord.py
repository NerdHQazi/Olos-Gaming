import pygame
import pygame.sprite
# ---------------
import nltk
import string
import random, time, sys
from nltk.corpus import wordnet
nltk.download('wordnet')
# hand made files
import GameBasics
# screen
pygame.init()
screenWidth, screenHeight = 766, 784
screen = pygame.display.set_mode((screenWidth, screenHeight))
pygame.display.set_caption("Scrabble")
clock = pygame.time.Clock()
pygame.display.flip()
# color
def RANDOM_COLOR():
    return (random.randint(0,255),random.randint(0,255),random.randint(0,255))
RED = (255, 0, 0)
GREEN = (0, 255, 0)
BLUE = (0, 0, 255)
WHITE = (255, 255, 255)
BLACK = (0,0,0)
DARK_GRAY = (169,169,169)
SPACE_COLOR = (220,205,173,255)
PINK = (255,192,203)
LIGHT_BLUE = (173,216,230)
GOLD = (255,215,0)
YELLOW = (255,255,0)
# text
Title = GameBasics.Text("Scrabble",40,BLACK,((screenWidth // 2), 10))
letters = []
letter_values = {
    'A': 1, 'B': 3, 'C': 3, 'D': 2, 'E': 1, 'F': 4, 'G': 2, 'H': 4,
    'I': 1, 'J': 8, 'K': 5, 'L': 1, 'M': 3, 'N': 1, 'O': 1, 'P': 3,
    'Q': 10, 'R': 1, 'S': 1, 'T': 1, 'U': 1, 'V': 4, 'W': 4, 'X': 8,
    'Y': 4, 'Z': 10, "_": 2
}
letter_list = string.ascii_uppercase + "_"
for y, letter in enumerate(letter_list):
    value = letter_values.get(letter, 0)
    text = GameBasics.Text(f"{letter}: {value}", 20, BLACK, (20, (y * 15) + 10))
    letters.append(text)
spellWord = GameBasics.Text("Current Word:",20,BLACK,(screenWidth / 2, screenHeight - 125))
points = GameBasics.Text("Points: ", 20, WHITE, (screenWidth - 100, screenHeight - 125))
# wrap text
definitionText = GameBasics.WrapText("Definition: ",17,BLACK,(10, screenHeight - 105), screenWidth - 10)
# color space
def ColorSpace(x, y):
    if (x == 0 or x == 14) and (y == 0 or y == 14):
        return "3_W"
    if (x == 0 or x == 14) and (y == 14 / 2):
        return "3_W"
    if (x == 14 / 2) and (y == 0 or y == 14):
        return "3_W"
    if (x, y) in [(13, 1), (12, 2), (11, 3), (10, 4)] or (x, y) in [(1, 1), (2, 2), (3, 3), (4, 4)]:
        return "2_W"
    if (x, y) in [(1, 13), (2, 12), (3, 11), (4, 10)] or (x, y) in [(13, 13), (12, 12), (11, 11), (10, 10)]:
        return "2_W"
    if (x, y) in [(5, 5), (9, 5), (5, 9), (9, 9)] or (x, y) in [(1, 9), (1, 5), (5, 13), (9, 13)] or (x, y) in [(13, 9), (13, 5), (5, 1), (9, 1)]:
        return "3_L"
    if (x, y) in [(0, 3), (0, 11), (2, 6), (2, 8), (3, 7), (6, 6)] or (x, y) in [(3, 14), (11, 14), (6, 12), (8, 12), (7, 11), (6, 8)]:
        return "2_L"
    if (x, y) in [(14, 3), (14, 11), (12, 6), (12, 8), (11, 7)] or (x, y) in [(3, 0), (11, 0), (6, 2), (8, 2), (7, 3), (8, 6), (8, 8)]:
        return "2_L"
    if (x == 14 / 2) and (y == 14 / 2):
        return "S"
    return False
# space
bord_list = []
button_width = 40
button_height = 40
board_width = 15 * button_width
start_x = (screenWidth - board_width) // 2
for x in range(15):
    for y in range(15):
        bordbutton = GameBasics.BordButton(start_x + (x * button_width), (y * button_height) + 40, button_width, button_height, GREEN, SPACE_COLOR, WHITE)
        if ColorSpace(x, y) == "3_W":
            bordbutton.inactive_color = RED
            bordbutton.text = "3W"
        if ColorSpace(x, y) == "2_W":
            bordbutton.inactive_color = PINK
            bordbutton.text = "2W"
        if ColorSpace(x, y) == "3_L":
            bordbutton.inactive_color = BLUE
            bordbutton.text = "3L"
        if ColorSpace(x, y) == "2_L":
            bordbutton.inactive_color = LIGHT_BLUE
            bordbutton.text = "2L"
        if ColorSpace(x, y) == "S":
            bordbutton.inactive_color = GOLD
            bordbutton.text = "S"
        bord_list.append(bordbutton)
# button
skip_turn = GameBasics.Button(screenWidth - 150, screenHeight - 60, 100, 50, "Skip", RED, WHITE, 0)
# letter in hand
items_to_remove = [] 
letter_list = []
for x in range(7):
    lestters = GameBasics.Button((x * 60) + 155, screenHeight - 60, 50, 50, random.choice(string.ascii_uppercase + "_"), GREEN, BLACK, 1)
    letter_list.append(lestters)
# define words
def get_word_definition(word):
    synsets = wordnet.synsets(word)
    if synsets:
        synset = synsets[0]
        definition = synset.definition()
        return definition
    else:
        return "None"
# loop
currentWord = "Current Word: "
checkWord = ""
currentDef = "Definition: "
wordIndex = 0
skippedTurns = 0
totalPoints = 0
currentValue = 0
running = True
while running:
    events = pygame.event.get()
    for event in events:
        if event.type == pygame.QUIT:
            running = False
            sys.exit()
        elif event.type == pygame.VIDEORESIZE:
            screenWidth, screenHeight = event.size
        # handle skip button
        if skippedTurns < 3:
            skip_turn.handle_event(event)
            if skip_turn.clicked:
                skippedTurns += 1
                skip_turn.reset()
                for index, item in enumerate(letter_list):
                    new_letter = GameBasics.Button(item.x, screenHeight - 60, 50, 50, random.choice(string.ascii_uppercase), GREEN, BLACK, 1)
                    letter_list[index] = new_letter
                    new_letter.reset()
            # handle hand letters
            for handLetter in letter_list:
                handLetter.handle_event(event)
                if handLetter.color == handLetter.active_color:
                    handLetter.textColor = handLetter.active_color
                else:
                    handLetter.textColor = handLetter.inactive_color
                if handLetter.clicked:
                    if handLetter.y == screenHeight - 60:
                        handLetter.y -= 10
                        checkWord += handLetter.text
                        handLetter.ready = True
                    else:
                        handLetter.y = screenHeight - 60
                        index = checkWord.find(handLetter.text)
                        if index != -1:
                            checkWord = checkWord[:index] + checkWord[index+1:]
                        handLetter.ready = False
                    currentWord = "Current Word: " + checkWord
                    handLetter.reset()
    # handle board events
    if skippedTurns < 3:
        for bordbutton in bord_list:
            bordbutton.handle_event(event)
            if bordbutton.clicked and not bordbutton.wordSpace:
                bordbutton.clicked = False
                if wordIndex < len(checkWord) > 1 and wordnet.synsets(checkWord.lower()):
                    bordbutton.wordSpace = True
                    bordbutton.inactive_color = YELLOW
                    currentValue = letter_values.get(checkWord[wordIndex], 1)
                    if bordbutton.text == "2L":
                        currentValue *= 2
                    if bordbutton.text == "3L":
                        currentValue *= 3
                    totalPoints += currentValue
                    bordbutton.text = checkWord[wordIndex]
                    points.update("Points: " + str(totalPoints))
                    wordIndex += 1
                else:
                    if wordnet.synsets(checkWord.lower()):
                        for index, item in enumerate(letter_list):
                            if item.ready:
                                new_letter = GameBasics.Button(item.x, screenHeight - 60, 50, 50, random.choice(string.ascii_uppercase), GREEN, BLACK, 1)
                                letter_list[index] = new_letter
                                new_letter.reset()
                    else:
                        for item in letter_list:
                            if item.ready:
                                item.y = screenHeight - 60
                                item.ready = False
                    checkWord = ""
                    currentWord = "Current Word: " + checkWord
                    wordIndex = 0
                    currentValue = 0
    screen.fill(DARK_GRAY)
    # show letters
    Title.render(screen)
    for letter in letters:
        letter.render(screen)
    # show bord
    for bordbutton in bord_list:
        bordbutton.draw(screen)
    # show letters in hand 
    for handLetter in letter_list:
        handLetter.draw(screen)
    if len(checkWord.lower()) > 1 and wordnet.synsets(checkWord.lower()):
        spellWord.color = WHITE
        definitionText.update_text(currentDef + get_word_definition(checkWord.lower()))
    else:
        spellWord.color = BLACK
        currentDef = "Definition: "
        definitionText.update_text(currentDef)
    # text
    spellWord.update(currentWord)
    spellWord.render(screen)
    definitionText.render(screen)
    points.render(screen)
    if skippedTurns == 3:
        Title.update("End Game")
    # skip
    skip_turn.draw(screen)
    # update
    pygame.display.flip()
    pygame.display.update()
    clock.tick(64)

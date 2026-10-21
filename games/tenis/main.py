# main.py
import pygame
import sys
import json
import os
from setting import *
from entity.players import Player
from entity.ball import Ball

pygame.init()
screen = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("Modern Tennis")
clock = pygame.time.Clock()
font = pygame.font.Font(None, 36)


class Game:
    def __init__(self):
        self.state = "menu"   # "menu", "playing", "history", "game_over"
        self.mode = "pvp"     # "pvp" or "ai"
        self.ai_difficulty = "medium"
        self.winner = None
        self.player1 = None
        self.player2 = None
        self.ball = None
        self.history = self.load_history()
        self.menu_buttons = [
            {"text": "Play PvP", "rect": pygame.Rect(WIDTH//2-100, 200, 200, 50), "action": "play_pvp"},
            {"text": "Easy vs AI", "rect": pygame.Rect(WIDTH//2-100, 260, 200, 50), "action": "play_ai_easy"},
            {"text": "Medium vs AI", "rect": pygame.Rect(WIDTH//2-100, 320, 200, 50), "action": "play_ai_medium"},
            {"text": "Hard vs AI", "rect": pygame.Rect(WIDTH//2-100, 380, 200, 50), "action": "play_ai_hard"},
            {"text": "AI vs AI", "rect": pygame.Rect(WIDTH//2-100, 440, 200, 50), "action": "play_aivai"},
            {"text": "History", "rect": pygame.Rect(WIDTH//2-100, 500, 200, 50), "action": "history"},
            {"text": "Quit", "rect": pygame.Rect(WIDTH//2-100, 560, 200, 50), "action": "quit"},
        ]
        self.history_back_button = pygame.Rect(WIDTH//2-100, HEIGHT-150, 200, 50)

    def reset_match_state(self):
        self.winner = None
        self.player1 = None
        self.player2 = None
        self.ball = None

    def load_history(self):
        if os.path.exists(HISTORY_FILE):
            with open(HISTORY_FILE, "r") as f:
                return json.load(f)
        return []

    def save_history(self, winner_name):
        entry = {
            "winner": winner_name,
            "score": f"{self.player1.score} - {self.player2.score}",
            "mode": self.mode,
        }
        self.history.append(entry)
        with open(HISTORY_FILE, "w") as f:
            json.dump(self.history, f, indent=2)

    def start_game(self, mode, difficulty="medium"):
        self.mode = mode
        self.ai_difficulty = difficulty
        self.winner = None
        self.state = "playing"

        p1_controls = {"left": pygame.K_a, "right": pygame.K_d, "up": pygame.K_w, "down": pygame.K_s}

        if mode == "pvp":
            p2_controls = {"left": pygame.K_LEFT, "right": pygame.K_RIGHT, "up": pygame.K_UP, "down": pygame.K_DOWN}
            self.player1 = Player(COURT.left + 100, GROUND_Y - PLAYER_HEIGHT,
                                  PLAYER_1_COLOR, p1_controls, is_ai=False, side="left")
            self.player2 = Player(COURT.right - 145, GROUND_Y - PLAYER_HEIGHT,
                                  PLAYER_2_COLOR, p2_controls, is_ai=False, side="right")
        elif mode == "ai":
            self.player1 = Player(COURT.left + 100, GROUND_Y - PLAYER_HEIGHT,
                                  PLAYER_1_COLOR, p1_controls, is_ai=False, side="left")
            self.player2 = Player(COURT.right - 145, GROUND_Y - PLAYER_HEIGHT,
                                  PLAYER_2_COLOR, None, is_ai=True, side="right")
            self.player2.set_difficulty(difficulty)
        elif mode == "aivai":
            self.player1 = Player(COURT.left + 100, GROUND_Y - PLAYER_HEIGHT,
                                  PLAYER_1_COLOR, None, is_ai=True, side="left")
            self.player2 = Player(COURT.right - 145, GROUND_Y - PLAYER_HEIGHT,
                                  PLAYER_2_COLOR, None, is_ai=True, side="right")
            self.player1.set_difficulty("medium")
            self.player2.set_difficulty("medium")
        else:
            raise ValueError(f"Unsupported mode: {mode}")

        self.player1.score = 0
        self.player2.score = 0
        self.ball = Ball()

    def handle_menu_click(self, pos):
        for btn in self.menu_buttons:
            if btn["rect"].collidepoint(pos):
                action = btn["action"]
                if action == "play_pvp":
                    self.start_game("pvp")
                elif action == "play_ai_easy":
                    self.start_game("ai", "easy")
                elif action == "play_ai_medium":
                    self.start_game("ai", "medium")
                elif action == "play_ai_hard":
                    self.start_game("ai", "hard")
                elif action == "play_aivai":
                    self.start_game("aivai")
                elif action == "history":
                    self.state = "history"
                elif action == "quit":
                    pygame.quit()
                    sys.exit()

    def handle_playing_events(self, event):
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_ESCAPE:
                self.reset_match_state()
                self.state = "menu"
            if event.key == pygame.K_p:
                self.state = "paused"

    def handle_history_click(self, pos):
        if self.history_back_button.collidepoint(pos):
            self.state = "menu"

    def update_playing(self):
        if self.player1 is None or self.player2 is None or self.ball is None:
            return

        self.player1.update(self.ball)
        self.player2.update(self.ball)
        self.ball.update(self.player1, self.player2)

        if self.player1.score >= WIN_SCORE:
            if self.mode == "aivai":
                self.winner = "AI 1"
            else:
                self.winner = "Player 1"
            self.save_history(self.winner)
            self.state = "game_over"
        elif self.player2.score >= WIN_SCORE:
            if self.mode == "aivai":
                self.winner = "AI 2"
            else:
                self.winner = "Player 2" if self.mode == "pvp" else "AI"
            self.save_history(self.winner)
            self.state = "game_over"

    def draw_court(self):
        screen.fill(BACKGROUND)
        pygame.draw.rect(screen, COURT_GREEN, COURT)
        pygame.draw.rect(screen, COURT_LINE, COURT, 4)

        center_x = COURT.centerx
        pygame.draw.line(screen, COURT_LINE, (center_x, COURT.top), (center_x, COURT.bottom), 3)
        pygame.draw.line(screen, COURT_LINE, (center_x-180, COURT.top), (center_x-180, COURT.bottom), 2)
        pygame.draw.line(screen, COURT_LINE, (center_x+180, COURT.top), (center_x+180, COURT.bottom), 2)
        pygame.draw.rect(screen, NET_COLOR, (center_x-4, COURT.bottom-100, 8, 100))

    def draw_score(self):
        if self.player1 is None or self.player2 is None:
            return
        p1_score = font.render(str(self.player1.score), True, TEXT_COLOR)
        p2_score = font.render(str(self.player2.score), True, TEXT_COLOR)
        screen.blit(p1_score, (COURT.left+30, 50))
        screen.blit(p2_score, (COURT.right-50, 50))

    def draw_menu(self):
        screen.fill(MENU_BG)
        title = font.render("MODERN TENNIS", True, TEXT_COLOR)
        screen.blit(title, (WIDTH//2 - title.get_width()//2, 100))

        subtitle = font.render("Use WASD / Arrow keys to move", True, TEXT_COLOR)
        screen.blit(subtitle, (WIDTH//2 - subtitle.get_width()//2, 150))

        mouse_pos = pygame.mouse.get_pos()
        for btn in self.menu_buttons:
            hover = btn["rect"].collidepoint(mouse_pos)
            pygame.draw.rect(screen, BUTTON_HOVER if hover else BUTTON_COLOR, btn["rect"], border_radius=10)
            text = font.render(btn["text"], True, TEXT_COLOR)
            screen.blit(text, (btn["rect"].centerx - text.get_width()//2,
                               btn["rect"].centery - text.get_height()//2))

    def draw_history(self):
        screen.fill(MENU_BG)
        title = font.render("GAME HISTORY", True, TEXT_COLOR)
        screen.blit(title, (WIDTH//2 - title.get_width()//2, 50))

        if not self.history:
            empty_text = font.render("No matches played yet.", True, TEXT_COLOR)
            screen.blit(empty_text, (WIDTH//2 - empty_text.get_width()//2, 140))
        else:
            y = 120
            for entry in self.history[-10:]:
                line = f"{entry['mode'].upper()}  |  {entry['winner']} won  |  {entry['score']}"
                text = font.render(line, True, TEXT_COLOR)
                screen.blit(text, (100, y))
                y += 40

        pygame.draw.rect(screen, BUTTON_COLOR, self.history_back_button, border_radius=10)
        back_text = font.render("Back", True, TEXT_COLOR)
        screen.blit(back_text, (self.history_back_button.centerx - back_text.get_width()//2,
                                self.history_back_button.centery - back_text.get_height()//2))

    def draw_game_over(self):
        overlay = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
        overlay.fill((0, 0, 0, 180))
        screen.blit(overlay, (0, 0))
        msg = f"{self.winner} Wins!"
        text = font.render(msg, True, TEXT_COLOR)
        screen.blit(text, (WIDTH//2 - text.get_width()//2, HEIGHT//2 - 40))
        prompt = font.render("Press ESC to return to menu", True, TEXT_COLOR)
        screen.blit(prompt, (WIDTH//2 - prompt.get_width()//2, HEIGHT//2 + 20))

    def run(self):
        running = True
        while running:
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    running = False
                elif event.type == pygame.MOUSEBUTTONDOWN:
                    if self.state == "menu":
                        self.handle_menu_click(event.pos)
                    elif self.state == "history":
                        self.handle_history_click(event.pos)
                elif event.type == pygame.KEYDOWN:
                    if self.state == "playing":
                        self.handle_playing_events(event)
                    elif self.state == "game_over" and event.key == pygame.K_ESCAPE:
                        self.reset_match_state()
                        self.state = "menu"
                    elif self.state == "paused" and event.key == pygame.K_p:
                        self.state = "playing"

            if self.state == "playing":
                self.update_playing()

            if self.state == "menu":
                self.draw_menu()
            elif self.state == "history":
                self.draw_history()
            elif self.state in ("playing", "paused", "game_over"):
                self.draw_court()
                if self.player1 and self.player2:
                    self.player1.draw(screen)
                    self.player2.draw(screen)
                if self.ball:
                    self.ball.draw(screen)
                self.draw_score()
                if self.state == "game_over":
                    self.draw_game_over()
                elif self.state == "paused":
                    pause_text = font.render("PAUSED - Press P to resume", True, TEXT_COLOR)
                    screen.blit(pause_text, (WIDTH//2 - pause_text.get_width()//2, 50))

            pygame.display.flip()
            clock.tick(FPS)

        pygame.quit()
        sys.exit()


if __name__ == "__main__":
    game = Game()
    game.run()

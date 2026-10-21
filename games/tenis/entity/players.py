import random

import pygame
from setting import *


class Player:
    def __init__(self, x, y, color, controls, is_ai=False, side="left"):
        self.rect = pygame.Rect(x, y, PLAYER_WIDTH, PLAYER_HEIGHT)
        self.color = color
        self.controls = controls
        self.is_ai = is_ai
        self.side = side
        self.score = 0
        self.speed = PLAYER_SPEED
        self.dx = 0
        self.dy = 0
        self.prev_x = self.rect.x
        self.prev_y = self.rect.y
        self.ai_difficulty = "medium"
        self.ai_error = 20
        self.set_difficulty("medium")

        if self.side == "left":
            self.allowed_rect = pygame.Rect(
                COURT.left,
                COURT.top,
                COURT.width // 4,
                COURT.height
            )
        elif self.side == "right":
            self.allowed_rect = pygame.Rect(
                COURT.right - COURT.width // 4,
                COURT.top,
                COURT.width // 4,
                COURT.height
            )
        else:
            self.allowed_rect = COURT

    def set_difficulty(self, difficulty):
        self.ai_difficulty = difficulty.lower()

        if self.ai_difficulty == "easy":
            self.speed = PLAYER_SPEED * 0.45
            self.ai_error = 90
        elif self.ai_difficulty == "medium":
            self.speed = PLAYER_SPEED * 0.8
            self.ai_error = 35
        else:
            self.speed = PLAYER_SPEED * 1.05
            self.ai_error = 10

    def update(self, ball=None):
        self.prev_x = self.rect.x
        self.prev_y = self.rect.y

        if self.is_ai:
            self._ai_move(ball)
        else:
            self._human_move()

        self.rect.left = max(self.rect.left, self.allowed_rect.left)
        self.rect.right = min(self.rect.right, self.allowed_rect.right)
        self.rect.top = max(self.rect.top, self.allowed_rect.top)
        self.rect.bottom = min(self.rect.bottom, self.allowed_rect.bottom)

        self.dx = self.rect.x - self.prev_x
        self.dy = self.rect.y - self.prev_y

    def _human_move(self):
        if self.controls is None:
            return

        keys = pygame.key.get_pressed()
        if keys[self.controls["left"]]:
            self.rect.x -= self.speed
        if keys[self.controls["right"]]:
            self.rect.x += self.speed
        if keys[self.controls["up"]]:
            self.rect.y -= self.speed
        if keys[self.controls["down"]]:
            self.rect.y += self.speed

    def _ai_move(self, ball):
        if ball is None:
            return

        if ball.velocity_x > 0 or ball.x > COURT.centerx:
            target_x, target_y = self._predict_ball_position(ball)
        else:
            target_x = self.allowed_rect.centerx
            target_y = self.allowed_rect.centery

        if self.ai_difficulty != "hard":
            target_y += random.uniform(-self.ai_error, self.ai_error)

        target_x = max(self.allowed_rect.left + self.rect.width//2,
                       min(target_x, self.allowed_rect.right - self.rect.width//2))
        target_y = max(self.allowed_rect.top + self.rect.height//2,
                       min(target_y, self.allowed_rect.bottom - self.rect.height//2))

        if self.rect.centerx < target_x:
            self.rect.x += self.speed
        elif self.rect.centerx > target_x:
            self.rect.x -= self.speed

        if self.rect.centery < target_y:
            self.rect.y += self.speed
        elif self.rect.centery > target_y:
            self.rect.y -= self.speed

    def _predict_ball_position(self, ball, max_steps=1000):
        x = ball.x
        y = ball.y
        vx = ball.velocity_x
        vy = ball.velocity_y
        radius = BALL_RADIUS
        court_left = COURT.left
        court_right = COURT.right
        court_top = COURT.top
        court_bottom = COURT.bottom
        net_x = COURT.centerx
        bounce_factor = WALL_BOUNCE_FACTOR

        for _ in range(max_steps):
            x += vx
            y += vy
            vx *= BALL_DECAY
            vy *= BALL_DECAY

            if y - radius <= court_top:
                y = court_top + radius
                vy *= -bounce_factor
            if y + radius >= court_bottom:
                y = court_bottom - radius
                vy *= -bounce_factor
            if x - radius <= court_left:
                x = court_left + radius
                vx *= -bounce_factor
            if x + radius >= court_right:
                x = court_right - radius
                vx *= -bounce_factor

            if x > net_x:
                return x, y

        return x, y

    def draw(self, screen):
        pygame.draw.rect(screen, self.color, self.rect, border_radius=8)

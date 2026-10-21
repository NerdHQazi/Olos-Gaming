import pygame
from setting import *


class Ball:
    def __init__(self):
        self.x = WIDTH // 2
        self.y = COURT.centery
        self.velocity_x = BALL_SPEED_X
        self.velocity_y = BALL_SPEED_Y
        self.radius = BALL_RADIUS
        self.prev_x = self.x
        self.prev_y = self.y
        try:
            self.image = pygame.image.load("assets/ball.gif").convert_alpha()
            self.image = pygame.transform.scale(self.image, (self.radius * 2, self.radius * 2))
        except Exception:
            self.image = None

    def update(self, player1, player2):
        self.prev_x = self.x
        self.prev_y = self.y

        self.x += self.velocity_x
        self.y += self.velocity_y
        self.velocity_x *= BALL_DECAY
        self.velocity_y *= BALL_DECAY

        if self._check_back_wall_score(player1, player2):
            return

        if self.y - self.radius <= COURT.top:
            self.y = COURT.top + self.radius
            self.velocity_y *= -WALL_BOUNCE_FACTOR
        if self.y + self.radius >= COURT.bottom:
            self.y = COURT.bottom - self.radius
            self.velocity_y *= -WALL_BOUNCE_FACTOR

        if self.x - self.radius <= COURT.left and self.velocity_x < 0:
            self.x = COURT.left + self.radius
            self.velocity_x *= -WALL_BOUNCE_FACTOR
        if self.x + self.radius >= COURT.right and self.velocity_x > 0:
            self.x = COURT.right - self.radius
            self.velocity_x *= -WALL_BOUNCE_FACTOR

        self._collide_with_player(player1)
        self._collide_with_player(player2)

    def _check_back_wall_score(self, player1, player2):
        if self.x + self.radius < player1.rect.left and self.velocity_x < 0:
            player2.score += 1
            self.reset()
            return True

        if self.x - self.radius > player2.rect.right and self.velocity_x > 0:
            player1.score += 1
            self.reset()
            return True

        return False

    def _collide_with_player(self, player):
        ball_rect = self.rect
        if not ball_rect.colliderect(player.rect):
            return

        prev_ball_rect = pygame.Rect(self.prev_x - self.radius, self.prev_y - self.radius,
                                     self.radius * 2, self.radius * 2)

        hit_direction_x = 1 if player.side == "left" else -1

        hit_position_x = (self.x - player.rect.centerx) / (player.rect.width / 2)
        hit_position_x = max(-1, min(1, hit_position_x))
        hit_position_y = (self.y - player.rect.centery) / (player.rect.height / 2)
        hit_position_y = max(-1, min(1, hit_position_y))

        if prev_ball_rect.right <= player.rect.left and self.velocity_x > 0:
            self.x = player.rect.left - self.radius
            self.velocity_x = -abs(BALL_HIT_SPEED_X)
            self.velocity_y = player.dy * 0.5 + hit_position_y * BALL_HIT_SPEED_Y
        elif prev_ball_rect.left >= player.rect.right and self.velocity_x < 0:
            self.x = player.rect.right + self.radius
            self.velocity_x = abs(BALL_HIT_SPEED_X)
            self.velocity_y = player.dy * 0.5 + hit_position_y * BALL_HIT_SPEED_Y
        elif prev_ball_rect.bottom <= player.rect.top and self.velocity_y > 0:
            self.y = player.rect.top - self.radius
            self.velocity_y = -abs(BALL_HIT_SPEED_Y)
            self.velocity_x = hit_direction_x * BALL_HIT_SPEED_X + player.dx * 0.5 + hit_position_x * 2
            if abs(self.velocity_x) < BALL_HIT_SPEED_X * 0.5:
                self.velocity_x = hit_direction_x * BALL_HIT_SPEED_X * 0.5
        elif prev_ball_rect.top >= player.rect.bottom and self.velocity_y < 0:
            self.y = player.rect.bottom + self.radius
            self.velocity_y = abs(BALL_HIT_SPEED_Y)
            self.velocity_x = hit_direction_x * BALL_HIT_SPEED_X + player.dx * 0.5 + hit_position_x * 2
        else:
            overlap_left = ball_rect.right - player.rect.left
            overlap_right = player.rect.right - ball_rect.left
            overlap_top = ball_rect.bottom - player.rect.top
            overlap_bottom = player.rect.bottom - ball_rect.top

            min_overlap = min(overlap_left, overlap_right, overlap_top, overlap_bottom)

            if min_overlap == overlap_left:
                self.x = player.rect.left - self.radius
                self.velocity_x = -abs(BALL_HIT_SPEED_X)
                self.velocity_y = player.dy * 0.5
            elif min_overlap == overlap_right:
                self.x = player.rect.right + self.radius
                self.velocity_x = abs(BALL_HIT_SPEED_X)
                self.velocity_y = player.dy * 0.5
            elif min_overlap == overlap_top:
                self.y = player.rect.top - self.radius
                self.velocity_y = -abs(BALL_HIT_SPEED_Y)
                self.velocity_x = hit_direction_x * BALL_HIT_SPEED_X
            else:
                self.y = player.rect.bottom + self.radius
                self.velocity_y = abs(BALL_HIT_SPEED_Y)
                self.velocity_x = hit_direction_x * BALL_HIT_SPEED_X

    @property
    def rect(self):
        return pygame.Rect(self.x - self.radius, self.y - self.radius,
                           self.radius * 2, self.radius * 2)

    def reset(self):
        self.x = WIDTH // 2
        self.y = COURT.centery
        self.velocity_x = BALL_SPEED_X * (1 if (pygame.time.get_ticks() // 500) % 2 == 0 else -1)
        self.velocity_y = 0
        self.prev_x = self.x
        self.prev_y = self.y

    def draw(self, screen):
        if self.image:
            screen.blit(self.image, (self.x - self.radius, self.y - self.radius))
        else:
            pygame.draw.circle(screen, BALL_COLOR, (int(self.x), int(self.y)), self.radius)

import * as Phaser from "phaser";
import { Scene, GameObjects } from "phaser";
import { Ball } from "../ball";
import { Stick } from "./stick";
import { Board } from "./board";

export class Bot {
  scene: Scene;
  me: Ball;
  balls: Ball[];
  stick: Stick;
  board: Board;

  hasShot = false;

  // BOT'S OWN FORCE
  botForce = 800;

  constructor(
    scene: Scene,
    me: Ball,
    balls: Ball[],
    stick: Stick,
    board: Board,
  ) {
    this.scene = scene;
    this.me = me;
    this.balls = balls;
    this.stick = stick;
    this.board = board;
  }

  // Find the closest colored ball to the white ball
  getClosestBall(): Ball | null {
    let closestBall: Ball | null = null;
    let closestDistance = Infinity;

    for (const ball of this.balls) {
      if (ball === this.me) {
        continue;
      }

      const distance = Phaser.Math.Distance.Between(
        this.me.x,
        this.me.y,
        ball.x,
        ball.y,
      );

      if (distance < closestDistance) {
        closestDistance = distance;
        closestBall = ball;
      }
    }

    return closestBall;
  }

  // Find the closest hole to the colored ball
  getClosestHole(ball: Ball): GameObjects.Arc | null {
    let closestHole: GameObjects.Arc | null = null;
    let closestDistance = Infinity;

    for (const hole of this.board.holes) {
      const distance = Phaser.Math.Distance.Between(
        ball.x,
        ball.y,
        hole.x,
        hole.y,
      );

      if (distance < closestDistance) {
        closestDistance = distance;
        closestHole = hole;
      }
    }

    return closestHole;
  }

  chooseShot() {
    const targetBall = this.getClosestBall();

    if (!targetBall) {
      return null;
    }

    const targetHole = this.getClosestHole(targetBall);

    if (!targetHole) {
      return null;
    }

    // ============================================
    // SHOOT STRAIGHT AT THE COLORED BALL
    // ============================================

    const angle = Phaser.Math.Angle.Between(
      this.me.x,
      this.me.y,
      targetBall.x,
      targetBall.y,
    );

    // Distance from colored ball to its nearest hole
    const holeDistance = Phaser.Math.Distance.Between(
      targetBall.x,
      targetBall.y,
      targetHole.x,
      targetHole.y,
    );

    return {
      ball: targetBall,
      hole: targetHole,
      angle: angle,
      holeDistance: holeDistance,
    };
  }

  // ============================================
  // BOT SHOOTING
  // ============================================

  pullBackAndShoot(onShot: () => void) {
    if (this.hasShot) {
      return;
    }

    const shot = this.chooseShot();

    if (!shot) {
      return;
    }

    const angle = shot.angle;

    // ============================================
    // BOT DECIDES ITS OWN PULLBACK
    // ============================================

    const minPullBack = 20;
    const maxPullBack = 150;

    const maxHoleDistance = 700;

    const pullPower = Phaser.Math.Clamp(
      shot.holeDistance / maxHoleDistance,
      0.1,
      1,
    );

    const pullBack = Phaser.Math.Linear(minPullBack, maxPullBack, pullPower);

    // BOT'S OWN FORCE
    const force = pullBack * this.botForce;

    // ============================================
    // CUE ANIMATION
    // ============================================

    const animation = {
      amount: 0,
    };

    const updateStick = () => {
      const gap = 20 + animation.amount;

      const tipX = this.me.x - Math.cos(angle) * gap;

      const tipY = this.me.y - Math.sin(angle) * gap;

      this.stick.Aimat(tipX, tipY, angle);
    };

    // Initial cue position
    updateStick();

    // ============================================
    // PULL CUE BACK
    // ============================================

    this.scene.tweens.add({
      targets: animation,
      amount: pullBack,
      duration: 500,
      ease: "Quad.easeOut",

      onUpdate: () => {
        updateStick();
      },

      onComplete: () => {
        this.scene.time.delayedCall(150, () => {
          this.scene.tweens.add({
            targets: animation,
            amount: 0,
            duration: 120,
            ease: "Quad.easeIn",

            onUpdate: () => {
              updateStick();
            },

            onComplete: () => {
              // SHOOT STRAIGHT
              this.me.setVelocity(
                Math.cos(angle) * force,
                Math.sin(angle) * force,
              );

              this.hasShot = true;

              onShot();
            },
          });
        });
      },
    });
  }

  replay() {
    this.hasShot = false;
  }
}

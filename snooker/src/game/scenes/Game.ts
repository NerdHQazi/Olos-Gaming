import { GameObjects, Scene } from "phaser";
import { EventBus } from "../EventBus";
import * as Phaser from "phaser";
import RAPIER from "@dimforge/rapier2d-compat";
import { Ball } from "../ball";
import { Board } from "./board";
import { Stick } from "./stick";
import { Bot } from "./Bot";
import {
  STOP_SPEED_THRESHOLD,
  ballSpeed,
  computeShotSpeed,
  isBallStopped,
  toPhysics,
} from "../shot";

export class Game extends Scene {
  cursor: Phaser.Types.Input.Keyboard.CursorKeys;
  roll: GameObjects.Arc;
  world: RAPIER.World;
  board: Board;
  stick: Stick;
  private wasPointerDown = false;
  me: Ball;
  colors = [
    0xffff00, // yellow
    0x008000, // green
    0x8b4513, // brown
    0x0000ff, // blue
    0xff69b4, // pink
    0x000000, // black
  ];
  currentPLayer: "player" | "Bot" = "player";
  playerScore = 0;
  botScore = 0;
  isBeenShot = false;
  bot: Bot;
  botWaiting = false;
  botAngle = 0;
  pocketedBall = false;
  forceText: GameObjects.Text;

  constructor() {
    super("Game");
  }
  private balls: Ball[] = [];

  pullBack = 0;
  stickOffset = 20;
  Max_pullback = 150;

  preload() {
    this.load.setPath("assets");
  }

  create() {
    EventBus.emit("current-scene-ready", this);

    const gameWidth = this.scale.width;
    const gameHeight = this.scale.height;

    this.world = new RAPIER.World({ x: 0, y: 0 });

    this.board = new Board(this, this.world, gameWidth, gameHeight);
    this.me = new Ball(
      this,
      this.world,
      this.board.Line,
      gameHeight / 2,
      0xffffff,
    );
    this.balls.push(this.me);

    this.stick = new Stick(this, this.world, 0, 0);

    this.forceText = this.add
      .text(this.stick.x, this.stick.y, "force: 0", {
        color: "#fff",
        fontSize: "18px",
      })
      .setVisible(false);

    this.bot = new Bot(this, this.me, this.balls, this.stick, this.board);

    for (let i = 0; i < 15; i++) {
      const Xposition = Phaser.Math.Between(0, this.scale.width);
      const Yposition = Phaser.Math.Between(0, this.scale.height);
      const ball = new Ball(this, this.world, Xposition, Yposition);
      ball.body.setFillStyle(0xff0000);
      this.balls.push(ball);
    }

    for (const color of this.colors) {
      const Xposition = Phaser.Math.Between(0, this.scale.width);
      const Yposition = Phaser.Math.Between(0, this.scale.height);
      const ball = new Ball(this, this.world, Xposition, Yposition);
      ball.body.setFillStyle(color);
      this.balls.push(ball);
    }

    this.cursor = this.input.keyboard!.createCursorKeys();

    for (const ball of this.balls) {
      if (ball === this.me) {
        ball.body.setFillStyle(0xffffff);
      }
    }
  }

  deleteBall(index: number) {
    const ball = this.balls[index];

    if (ball === this.me) {
      ball.rigid_body.setTranslation(
        {
          x: toPhysics(this.board.Line),
          y: toPhysics(this.scale.height / 2),
        },
        true,
      );
      ball.rigid_body.setLinvel({ x: 0, y: 0 }, true);
      return;
    }

    this.world.removeRigidBody(ball.rigid_body);

    this.pocketedBall = true;

    ball.container.destroy();

    this.balls.splice(index, 1);
  }

  changePlayer() {
    EventBus.emit("change-player", {
      turn: this.currentPLayer,
      playerscore: this.playerScore,
      botscore: this.botScore,
    });
  }

  switchTurn() {
    if (this.pocketedBall && this.currentPLayer === "player") {
      this.playerScore++;
      this.currentPLayer = "player";
    } else if (!this.pocketedBall && this.currentPLayer === "player") {
      this.currentPLayer = "Bot";
    } else if (this.pocketedBall && this.currentPLayer === "Bot") {
      this.botScore++;
      this.currentPLayer = "Bot";
    } else if (!this.pocketedBall && this.currentPLayer === "Bot") {
      this.currentPLayer = "player";
    }

    this.pocketedBall = false;

    this.changePlayer();
    this.bot.replay();
  }

  allBallsStopped(): boolean {
    return this.balls.every((ball) => {
      const v = ball.rigid_body.linvel();
      return ballSpeed(v.x, v.y) < STOP_SPEED_THRESHOLD;
    });
  }

  // Snap imperceptibly slow balls (< STOP_SPEED_THRESHOLD) to a full stop
  // so rolls end crisply instead of creeping for seconds on damping alone.
  settleSlowBalls(): void {
    for (const ball of this.balls) {
      const v = ball.rigid_body.linvel();
      if (isBallStopped(v.x, v.y)) {
        ball.rigid_body.setLinvel({ x: 0, y: 0 }, true);
      }
    }
  }

  handleBotTurn() {
    if (this.botWaiting) {
      return;
    }

    this.botWaiting = true;

    this.time.delayedCall(1000, () => {
      this.bot.pullBackAndShoot(() => {
        this.isBeenShot = true;
        this.botWaiting = false;
      });
    });
  }

  update(time: number, delta: number): void {
    if (this.balls.length === 0) return;

    if (!this.isBeenShot) {
      if (this.currentPLayer === "player") {
        this.handleShoot(this.me);
      }

      if (this.currentPLayer === "Bot") {
        this.handleBotTurn();
      }
    }
    this.world.step();

    for (let i = this.balls.length - 1; i >= 0; i--) {
      const ball = this.balls[i];

      ball.updateballposition();

      for (let j = 0; j < this.board.holes.length; j++) {
        const hole = this.board.holes[j];

        const distance = Phaser.Math.Distance.Between(
          ball.x,
          ball.y,
          hole.x,
          hole.y,
        );

        if (distance < 30) {
          this.deleteBall(i);
          break;
        }
      }
    }

    if (this.allBallsStopped() && this.isBeenShot) {
      this.settleSlowBalls();
      this.isBeenShot = false;
      this.switchTurn();
    }
  }
  handleShoot(cueball: Ball) {
    const pointer = this.input.activePointer;

    const angle = Phaser.Math.Angle.Between(
      cueball.x,
      cueball.y,
      pointer.worldX,
      pointer.worldY,
    );

    const justReleased = this.wasPointerDown && !pointer.isDown;

    if (pointer.isDown) {
      this.pullBack = Math.min(this.pullBack + 3, this.Max_pullback);

      this.forceText.setVisible(true);

      const forcePercent = (this.pullBack / this.Max_pullback) * 100;

      this.forceText.setText(`Force: ${Math.round(forcePercent)}%`);
    } else if (justReleased && this.pullBack > 0) {
      const shotSpeed = computeShotSpeed(this.pullBack, this.Max_pullback);

      cueball.setVelocity(
        Math.cos(angle) * shotSpeed,
        Math.sin(angle) * shotSpeed,
      );

      this.pullBack = 0;
      this.isBeenShot = true;

      this.forceText.setVisible(false);
    }

    const gap = this.stickOffset + this.pullBack;

    const tipX = cueball.x - Math.cos(angle) * gap;

    const tipY = cueball.y - Math.sin(angle) * gap;

    this.stick.Aimat(tipX, tipY, angle);

    this.forceText.setPosition(tipX + 15, tipY - 15);

    this.wasPointerDown = pointer.isDown;
  }
}

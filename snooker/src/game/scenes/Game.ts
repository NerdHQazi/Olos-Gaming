import { GameObjects, Scene } from "phaser";
import { EventBus } from "../EventBus";
import * as Phaser from "phaser";
import RAPIER from "@dimforge/rapier2d-compat";
import { Ball } from "../ball";
import { Board } from "./board";
import { Stick } from "./stick";
import { Bot } from "./Bot";
import { toPhysics } from "../shot";

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
  pocketedBall = false;
  botWaiting = false;
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
    const midY = gameHeight / 2;

    this.world = new RAPIER.World({ x: 0, y: 0 });

    this.board = new Board(this, this.world, gameWidth, gameHeight);

    // white cue ball
    this.me = new Ball(this, this.world, this.board.Line, midY, 0xffffff);
    this.balls.push(this.me);

    this.stick = new Stick(this, this.world, 0, 0);
    this.forceText = this.add
      .text(0, 0, "Force: 0%", {
        color: "#ffffff",
        fontSize: "18px",
      })
      .setVisible(false);

    this.bot = new Bot(this, this.me, this.balls, this.stick, this.board);

    // colour spots
    const colourSpots = [
      { x: gameWidth * 0.22, y: midY + 70, color: this.colors[0] }, // yellow
      { x: gameWidth * 0.22, y: midY - 70, color: this.colors[1] }, // green
      { x: gameWidth * 0.3, y: midY, color: this.colors[2] }, // brown
      { x: gameWidth * 0.5, y: midY, color: this.colors[3] }, // blue
      { x: gameWidth * 0.68, y: midY, color: this.colors[4] }, // pink
      { x: gameWidth * 0.84, y: midY, color: this.colors[5] }, // black
    ];

    for (const spot of colourSpots) {
      this.balls.push(new Ball(this, this.world, spot.x, spot.y, spot.color));
    }

    // 15 reds in triangle
    const ballGap = 32;
    const startX = gameWidth * 0.72;
    const startY = midY;

    for (let row = 0; row < 5; row++) {
      for (let col = 0; col <= row; col++) {
        const Xposition = startX + row * (ballGap * 0.9);
        const Yposition = startY - (row * ballGap) / 2 + col * ballGap;

        this.balls.push(
          new Ball(this, this.world, Xposition, Yposition, 0xff0000),
        );
      }
    }

    this.cursor = this.input.keyboard!.createCursorKeys();
  }

  isRed(ball: Ball) {
    return ball.colorValue === 0xff0000;
  }

  deleteBall(index: number) {
    const ball = this.balls[index];

    // WHITE BALL falls in hole
    if (ball === this.me) {
      // put white back to start position
      ball.rigid_body.setTranslation(
        {
          x: toPhysics(this.board.Line),
          y: toPhysics(this.scale.height / 2),
        },
        true,
      );

      // stop it
      ball.rigid_body.setLinvel({ x: 0, y: 0 }, true);

      // move the visible ball too
      ball.container.setPosition(this.board.Line, this.scale.height / 2);

      // not a successful pot
      this.pocketedBall = false;
      return;
    }

    // normal ball pot
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
    if (this.pocketedBall) {
      // keep same player and score
      if (this.currentPLayer === "player") {
        this.playerScore++;
      } else {
        this.botScore++;
      }
    } else {
      // miss → switch turn
      this.currentPLayer = this.currentPLayer === "player" ? "Bot" : "player";
    }

    this.pocketedBall = false;
    this.changePlayer();
    this.bot.replay();
  }

  allBallsStopped(): boolean {
    const threshold = 5;
    return this.balls.every((ball) => {
      const v = ball.rigid_body.linvel();
      const speed = Math.sqrt(v.x * v.x + v.y * v.y);
      return speed < threshold;
    });
  }

  handleBotTurn() {
    if (this.botWaiting) return;

    this.botWaiting = true;

    this.time.delayedCall(1000, () => {
      this.bot.pullBackAndShoot(() => {
        this.isBeenShot = true;
        this.botWaiting = false;
      });
    });
  }

  update(_time: number, _delta: number): void {
    if (this.balls.length === 0) return;

    if (!this.isBeenShot) {
      if (this.currentPLayer === "player") {
        this.handleShoot(this.me);
      } else {
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

      // visual force like old code
      this.forceText.setVisible(true);
      const forcePercent = (this.pullBack / this.Max_pullback) * 100;
      this.forceText.setText(`Force: ${Math.round(forcePercent)}%`);
    } else if (justReleased && this.pullBack > 0) {
      const minSpeed = 20000;
      const maxSpeed = 50000;
      const chargeRatio = this.pullBack / this.Max_pullback;
      const shotSpeed = minSpeed + chargeRatio * (maxSpeed - minSpeed);

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

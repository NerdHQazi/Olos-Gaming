import { GameObjects, Scene } from "phaser";
import { EventBus } from "../EventBus";
import * as Phaser from "phaser";
import RAPIER from "@dimforge/rapier2d-compat";
import { Ball } from "../ball";
import { Board } from "./board";
import { Stick } from "./stick";
import { Bot } from "./Bot";

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

        this.bot = new Bot(this, this.me, this.balls);

        this.stick = new Stick(this, this.world, 0, 0);

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
                { x: this.board.Line, y: this.scale.height / 2 },
                true,
            );
            ball.rigid_body.setLinvel({ x: 0, y: 0 }, true);
            return;
        }

        this.world.removeRigidBody(ball.rigid_body);

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
        if (this.currentPLayer === "player") {
            this.playerScore++;
        } else {
            this.botScore++;
        }
        this.currentPLayer = this.currentPLayer === "player" ? "Bot" : "player";
        this.changePlayer();
        this.bot.replay();
    }

    allBallsStopped(): boolean {
        const threshold = 5; // treat anything below this speed as "stopped"
        return this.balls.every((ball) => {
            const v = ball.rigid_body.linvel();
            const speed = Math.sqrt(v.x * v.x + v.y * v.y);
            return speed < threshold;
        });
    }

    update(time: number, delta: number): void {
        if (this.balls.length === 0) return;

        if (!this.isBeenShot) {
            this.handleShoot(this.me);
        } else {
            this.bot.play();
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

        // detect "just released" — was down last frame, but not down now
        const justReleased = this.wasPointerDown && !pointer.isDown;

        if (pointer.isDown) {
            this.pullBack = Math.min(this.pullBack + 3, this.Max_pullback);
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
        }

        const gap = this.stickOffset + this.pullBack;
        const tipX = cueball.x - Math.cos(angle) * gap;
        const tipY = cueball.y - Math.sin(angle) * gap;

        this.stick.Aimat(tipX, tipY, angle);

        // update tracked state for next frame's comparison — MUST be last
        this.wasPointerDown = pointer.isDown;
    }
}

import { Scene } from "phaser";
import { Ball } from "../ball";

export class Bot {
    scene: Scene;
    me: Ball;
    balls: Ball[];
    hasShot = false;

    constructor(scene: Scene, me: Ball, balls: Ball[]) {
        this.scene = scene;
        this.me = me;
        this.balls = balls;
    }

    play() {
        if (this.hasShot) return;
        this.hasShot = true;
    }

    shoot() {
        for (const ball of this.balls) {
            if (ball === this.me) continue;

            const distance = Phaser.Math.Distance.Between(
                this.me.x,
                this.me.y,
                ball.x,
                ball.y,
            );
        }
    }
    replay() {
        this.hasShot = false;
    }
}


import RAPIER, {
    ColliderDesc,
    RigidBody,
    RigidBodyDesc,
    World,
} from "@dimforge/rapier2d-compat";
import { Scene } from "phaser";

export class Stick {
    scene: Scene;
    world: World;
    stick: Phaser.GameObjects.Rectangle;
    stick_rb: RAPIER.RigidBody;
    x: number;
    y: number;

    constructor(scene: Scene, world: World, x: number, y: number) {
        this.scene = scene;
        this.world = world;

        this.x = x;
        this.y = y;

        this.stick = this.scene.add
            .rectangle(0, 0, 500, 8, 0x8b5a2b)
            .setOrigin(0, 0.5)
            .setDepth(1000);
        this.stickBody();
    }

    stickBody() {
        const stickBody = RigidBodyDesc.kinematicPositionBased().setTranslation(
            this.x,
            this.y,
        );
        this.stick_rb = this.world.createRigidBody(stickBody);
        const stick_col = ColliderDesc.cuboid(250, 4);
        this.world.createCollider(stick_col, this.stick_rb);
    }

    Aimat(tipX: number, tipY: number, angle: number) {
        this.stick.setPosition(tipX, tipY);
        this.stick.setRotation(angle + Math.PI);
    }
}


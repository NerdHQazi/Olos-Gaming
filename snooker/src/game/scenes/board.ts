import RAPIER, { ColliderDesc, RigidBodyDesc } from "@dimforge/rapier2d-compat";
import { GameObjects, Scene } from "phaser";

export class Board {
    [x: string]: any;
    world: RAPIER.World;
    scene: Scene;
    holes: { x: number; y: number }[] = [];
    Line = 0;

    constructor(scene: Scene, world: RAPIER.World, w: number, h: number) {
        this.scene = scene;
        this.world = world;

        this.drawTable(w, h);
        this.createHoles(w, h);
        this.createWalls(w, h);
        this.DrawLines(w, h);
    }
    drawTable(w: number, h: number) {
        this.scene.add.rectangle(w / 2, h / 2, w, h, 0x0a5c2e);
    }

    DrawLines(w: number, h: number) {
        this.Line = w * 0.2;

        this.scene.add.rectangle(this.Line, h / 2, 2, h, 0xffffff, 0.35);
    }

    createWalls(w: number, h: number) {
        const thickness = 20;
        this.createWall(w / 2, -thickness / 2, w, thickness); // top
        this.createWall(w / 2, h + thickness / 2, w, thickness); // bottom
        this.createWall(-thickness / 2, h / 2, thickness, h); // left
        this.createWall(w + thickness / 2, h / 2, thickness, h);
    }

    createWall(x: number, y: number, w: number, h: number) {
        this.scene.add
            .rectangle(x, y, w + 30, h + 30, 0x70190d)
            .setDepth(10000000);
        const wall_desc = RigidBodyDesc.fixed().setTranslation(x, y);
        const wall_body = this.world.createRigidBody(wall_desc);

        const colliderDesc = RAPIER.ColliderDesc.cuboid(
            w / 2,
            h / 2,
        ).setRestitution(0.8);

        this.world.createCollider(colliderDesc, wall_body);
    }

    createHoles(w: number, h: number) {
        const radius = 20;
        const daimeter = radius + radius / 6;
        this.holes = [
            { x: 0 + daimeter, y: 0 + daimeter },
            { x: w / 2, y: 0 + daimeter },
            { x: w - daimeter, y: 0 + daimeter },

            { x: w - daimeter, y: h - daimeter },
            { x: w / 2, y: h - daimeter },
            { x: 0 + daimeter, y: h - daimeter },
        ];
        this.holes.forEach((hole) => {
            this.scene.add.circle(hole.x, hole.y, radius, 0x000000);
        });
    }
}


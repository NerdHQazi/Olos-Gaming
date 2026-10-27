import {
  ColliderDesc,
  RigidBody,
  RigidBodyDesc,
  World,
} from "@dimforge/rapier2d-compat";
import { Scene } from "phaser";
import { BALL_LINEAR_DAMPING, toPhysics, toPixels } from "./shot";

export class Ball {
  static readonly RADIUS_PX = 15;

  world: World;
  scene: Scene;
  rigid_body: RigidBody;
  container: Phaser.GameObjects.Container;
  body: Phaser.GameObjects.Arc;
  shadow: Phaser.GameObjects.Arc;
  shine: Phaser.GameObjects.Arc;
  colorValue: number;

  constructor(
    scene: Scene,
    world: World,
    x: number,
    y: number,
    color: number = 0xe74c3c,
  ) {
    this.scene = scene;
    this.world = world;
    this.colorValue = color;

    this.shadow = this.scene.add.circle(2, 3, Ball.RADIUS_PX, 0x000000, 0.22);
    this.body = this.scene.add.circle(0, 0, Ball.RADIUS_PX, color);
    this.body.setStrokeStyle(2, 0x000000, 0.3);
    this.shine = this.scene.add.circle(-4, -5, 5, 0xffffff, 0.35);

    this.container = this.scene.add.container(x, y, [
      this.shadow,
      this.body,
      this.shine,
    ]);

    this.createphysic(x, y);
  }

  createphysic(x: number, y: number) {
    const rb_desc = RigidBodyDesc.dynamic()
      .setTranslation(toPhysics(x), toPhysics(y))
      .setLinearDamping(BALL_LINEAR_DAMPING);

    this.rigid_body = this.world.createRigidBody(rb_desc);

    const col_desc = ColliderDesc.ball(toPhysics(Ball.RADIUS_PX))
      .setRestitution(0.5)
      .setFriction(0.2);

    this.world.createCollider(col_desc, this.rigid_body);
  }

  get x() {
    return this.container.x;
  }

  get y() {
    return this.container.y;
  }

  updateballposition() {
    const position = this.rigid_body.translation();
    this.container.setPosition(toPixels(position.x), toPixels(position.y));
  }

  setVelocity(x: number, y: number) {
    // x/y are pixels/second from Game/Bot
    this.rigid_body.setLinvel(
      {
        x: toPhysics(x),
        y: toPhysics(y),
      },
      true,
    );
  }
}

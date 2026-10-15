import RAPIER, { RigidBodyDesc, World } from "@dimforge/rapier2d-compat";
import { Scene } from "phaser";

export class Stick {
  scene: Scene;
  world: World;
  container: Phaser.GameObjects.Container;
  stick_rb: RAPIER.RigidBody;
  x: number;
  y: number;

  constructor(scene: Scene, world: World, x: number, y: number) {
    this.scene = scene;
    this.world = world;

    this.x = x;
    this.y = y;

    this.container = this.scene.add.container(x, y).setDepth(1000);

    this.renderCueStick();
    this.stickBody();
  }

  renderCueStick() {
    const graphics = this.scene.add.graphics();

    const tipLength = 6;
    const ferruleLength = 8;
    const shaftLength = 340;
    const buttLength = 140;
    const bumperLength = 8;

    const tipRadius = 3; // Half of 6px tip width
    const midRadius = 5; // Half of 10px joint width
    const buttRadius = 7; // Half of 14px butt width

    // 1. Rounded Blue Leather Tip
    graphics.fillStyle(0x2b5c8f, 1);
    graphics.fillCircle(tipRadius, 0, tipRadius);
    graphics.fillRect(
      tipRadius,
      -tipRadius,
      tipLength - tipRadius,
      tipRadius * 2,
    );

    // 2. Brass Ferrule
    const ferruleStart = tipLength;
    graphics.fillStyle(0xd4af37, 1);
    graphics.fillRect(ferruleStart, -tipRadius, ferruleLength, tipRadius * 2);

    // 3. Smooth Tapered Ash Shaft
    const shaftStart = ferruleStart + ferruleLength;
    const shaftEnd = shaftStart + shaftLength;

    graphics.fillStyle(0xded0a5, 1);
    graphics.beginPath();
    graphics.moveTo(shaftStart, -tipRadius);
    graphics.lineTo(shaftEnd, -midRadius);
    graphics.lineTo(shaftEnd, midRadius);
    graphics.lineTo(shaftStart, tipRadius);
    graphics.closePath();
    graphics.fillPath();

    // 4. Brass Joint Ring
    graphics.fillStyle(0xd4af37, 1);
    graphics.fillRect(shaftEnd, -midRadius, 4, midRadius * 2);

    // 5. Tapered Ebony Butt Handle
    const buttStart = shaftEnd + 4;
    const buttEnd = buttStart + buttLength;

    graphics.fillStyle(0x1a110b, 1);
    graphics.beginPath();
    graphics.moveTo(buttStart, -midRadius);
    graphics.lineTo(buttEnd, -buttRadius);
    graphics.lineTo(buttEnd, buttRadius);
    graphics.lineTo(buttStart, midRadius);
    graphics.closePath();
    graphics.fillPath();

    // 6. Rounded Rubber Bumper Cap at the back
    graphics.fillStyle(0x111111, 1);
    graphics.fillCircle(buttEnd + bumperLength - buttRadius, 0, buttRadius);
    graphics.fillRect(
      buttEnd,
      -buttRadius,
      bumperLength - buttRadius,
      buttRadius * 2,
    );

    this.container.add(graphics);
  }

  stickBody() {
    // Kinematic rigid body without any colliders attached
    // This stops the stick from physically bumping into balls when aim tracking
    const stickBody = RigidBodyDesc.kinematicPositionBased().setTranslation(
      this.x,
      this.y,
    );
    this.stick_rb = this.world.createRigidBody(stickBody);
  }

  Aimat(tipX: number, tipY: number, angle: number) {
    this.container.setPosition(tipX, tipY);
    this.container.setRotation(angle + Math.PI);

    this.stick_rb.setNextKinematicTranslation({ x: tipX, y: tipY });
    this.stick_rb.setNextKinematicRotation(angle + Math.PI);
  }
}

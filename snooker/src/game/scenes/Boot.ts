import { Scene } from "phaser";
import { EventBus } from "../EventBus";
import RAPIER from "@dimforge/rapier2d-compat";

export class Boot extends Scene {
    constructor() {
        super("Boot");
    }
    preload() {
        this.load.setPath("assets");
    }

    create() {
        EventBus.emit("current-scene-ready", this);
        this.initializeRapier();
    }

    async initializeRapier() {
        await RAPIER.init();
        this.scene.start("Game");
    }
}


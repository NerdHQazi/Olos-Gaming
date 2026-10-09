import { Boot } from "./scenes/Boot";
import { Game as MainGame } from "./scenes/Game";
import { AUTO, Game, Scale, Types } from "phaser";

// Find out more information about the Game Config at:
// https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig
const config: Types.Core.GameConfig = {
    type: AUTO,
    scale: {
        mode: Scale.FIT,
        autoCenter: Scale.CENTER_BOTH,
        width: window.innerWidth - 200,

        height: window.innerHeight,
    },

    parent: "game-container",

    backgroundColor: "#028af8",

    physics: {
        default: "arcade",
        arcade: {
            debug: true,
        },
    },

    scene: [Boot, MainGame],
};

const StartGame = (parent: string) => {
    return new Game({ ...config, parent });
};

export default StartGame;

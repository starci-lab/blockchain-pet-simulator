import RexUIPlugin from "phaser3-rex-plugins/templates/ui/ui-plugin.js";
import { GameScene } from "@/game/scenes/GameScene";
import { AUTO } from "phaser";
export const CONTAINER_ID = "phaser-container";

export const getConfig = (): Phaser.Types.Core.GameConfig => {
  // get the mobile orientation
  return {
    type: AUTO,
    width: window.innerWidth,
    height: 140,
    parent: CONTAINER_ID,
    scene: GameScene,
    transparent: true,
    plugins: {
      scene: [
        {
          key: "rexUI",
          plugin: RexUIPlugin,
          mapping: "rexUI"
        }
      ]
    }
  };
};

import { useUserStore } from "@/store/userStore";

const UI_FONT = "monospace";
const TOKEN_BG_COLOR = 0x2a2a2a; // Dark gray background
const TOKEN_BORDER_COLOR = 0x404040; // Lighter gray border
const TOKEN_TEXT_COLOR = "#b3b3b3"; // Light gray text
const TOKEN_WIDTH = 200;
const TOKEN_HEIGHT = 40;
const TOKEN_UI_DEPTH = 200; // Ensure above pets and world objects

export class TokenUI {
  private scene: Phaser.Scene;
  private tokenText!: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  create() {
    const screenWidth = this.scene.cameras.main.width;
    const padding = 20; // Match NavigationUI right padding
    const tokenX = screenWidth - padding - TOKEN_WIDTH / 2; // Align to right
    const tokenY = 30; // Top of screen, above NavigationUI

    // Main token background with rounded corners effect
    const bg = this.scene.add.rectangle(
      tokenX,
      tokenY,
      TOKEN_WIDTH,
      TOKEN_HEIGHT,
      TOKEN_BG_COLOR,
      0.95
    );
    bg.setStrokeStyle(1, TOKEN_BORDER_COLOR)
      .setOrigin(0.5, 0)
      .setDepth(TOKEN_UI_DEPTH);

    // Token icon: use pixel coin sprite
    this.scene.add
      .image(tokenX - 70, tokenY + 20, "coin")
      .setDepth(TOKEN_UI_DEPTH + 1)
      .setOrigin(0.5)
      .setDisplaySize(16, 16);

    // Token amount text
    this.tokenText = this.scene.add
      .text(tokenX + 20, tokenY + 20, "", {
        fontSize: "14px",
        color: TOKEN_TEXT_COLOR,
        fontStyle: "bold",
        fontFamily: UI_FONT,
        align: "left"
      })
      .setOrigin(0, 0.5)
      .setDepth(TOKEN_UI_DEPTH + 3);

    this.update();
  }

  getTokenIconPosition() {
    return { x: this.tokenText.x, y: this.tokenText.y };
  }

  update() {
    const nomToken = useUserStore.getState().nomToken;
    this.tokenText.setText(nomToken.toLocaleString());
  }
}

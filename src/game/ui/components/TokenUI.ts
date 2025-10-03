import { useUserStore } from "@/store/userStore";

const UI_FONT = "monospace";
const TOKEN_BG_COLOR = 0x101010; // Inner panel color
const TOKEN_BORDER_COLOR = 0x242424; // Inner border color
const TOKEN_OUTER_COLOR = 0x242424; // Outer container color
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
    const padding = 28; // Match NavigationUI right padding
    const tokenX = screenWidth - padding - TOKEN_WIDTH / 2; // keep right-aligned X
    const centerY = this.scene.cameras.main.centerY;
    const tokenY = centerY - 10 - TOKEN_HEIGHT / 2; // move slightly downward

    // Two-layer panel (outer container + inner with padding)
    const outerRadius = 8;
    const innerRadius = 8;
    const paddingInner = 6;

    const outer = this.scene.add.graphics();
    outer.fillStyle(TOKEN_OUTER_COLOR, 0.98);
    outer.fillRoundedRect(
      tokenX - TOKEN_WIDTH / 2,
      tokenY,
      TOKEN_WIDTH,
      TOKEN_HEIGHT,
      outerRadius
    );
    outer.setDepth(TOKEN_UI_DEPTH);

    const inner = this.scene.add.graphics();
    inner.fillStyle(TOKEN_BG_COLOR, 0.98);
    inner.lineStyle(2, TOKEN_BORDER_COLOR, 1);
    inner.fillRoundedRect(
      tokenX - TOKEN_WIDTH / 2 + paddingInner,
      tokenY + paddingInner,
      TOKEN_WIDTH - paddingInner * 2,
      TOKEN_HEIGHT - paddingInner * 2,
      innerRadius
    );
    inner.strokeRoundedRect(
      tokenX - TOKEN_WIDTH / 2 + paddingInner,
      tokenY + paddingInner,
      TOKEN_WIDTH - paddingInner * 2,
      TOKEN_HEIGHT - paddingInner * 2,
      innerRadius
    );
    inner.setDepth(TOKEN_UI_DEPTH + 1);

    // Token icon: use pixel coin sprite
    this.scene.add
      .image(tokenX - 70, tokenY + 20, "coin")
      .setDepth(TOKEN_UI_DEPTH + 2)
      .setOrigin(0.5)
      .setDisplaySize(16, 16);

    // Token amount text
    this.tokenText = this.scene.add
      .text(tokenX + 20, tokenY + 20, "", {
        fontSize: "16px",
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

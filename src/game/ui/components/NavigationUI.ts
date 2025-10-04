import type { GameScene } from "../../scenes/GameScene";

const NAV_BG_COLOR = 0x101010; // Inner panel color
const NAV_BORDER_COLOR = 0x242424; // Inner border color
const NAV_OUTER_COLOR = 0x242424; // Outer container color
const NAV_BUTTON_SIZE = 50;
const NAV_BUTTON_SPACING = 10;
const NAV_UI_DEPTH = 200; // Ensure above pets and world objects

export class NavigationUI {
  private scene: GameScene;
  private homeButton!: Phaser.GameObjects.Rectangle;
  private shopButton!: Phaser.GameObjects.Rectangle;
  private settingsButton!: Phaser.GameObjects.Rectangle;

  constructor(scene: GameScene) {
    this.scene = scene;
  }

  create() {
    console.log("🧭 Creating Navigation UI...");

    const centerY = this.scene.cameras.main.centerY;
    const startY = centerY + 40 - NAV_BUTTON_SIZE / 2; // move slightly further below center
    const screenWidth = this.scene.cameras.main.width;
    const totalWidth = NAV_BUTTON_SIZE * 3 + NAV_BUTTON_SPACING * 2;
    const padding = 28; // Slightly increased padding from right edge
    const startX = screenWidth - totalWidth - padding;

    // Home Button
    this.createHomeButton(startX, startY);

    // Shop Button
    this.createShopButton(
      startX + NAV_BUTTON_SIZE + NAV_BUTTON_SPACING,
      startY
    );

    // Settings Button
    this.createSettingsButton(
      startX + (NAV_BUTTON_SIZE + NAV_BUTTON_SPACING) * 2,
      startY
    );

    console.log("✅ Navigation UI created successfully");
  }

  private createHomeButton(x: number, y: number) {
    // Button background
    // Two-layer panel (outer + inner)
    const radius = 12;
    const paddingInner = 8;

    const outer = this.scene.add.graphics();
    outer.fillStyle(NAV_OUTER_COLOR, 0.98);
    outer.fillRoundedRect(
      x - NAV_BUTTON_SIZE / 2,
      y,
      NAV_BUTTON_SIZE,
      NAV_BUTTON_SIZE,
      radius
    );
    outer.setDepth(NAV_UI_DEPTH);

    const panel = this.scene.add.graphics();
    panel.fillStyle(NAV_BG_COLOR, 0.98);
    panel.lineStyle(2, NAV_BORDER_COLOR, 1);
    panel.fillRoundedRect(
      x - NAV_BUTTON_SIZE / 2 + paddingInner,
      y + paddingInner,
      NAV_BUTTON_SIZE - paddingInner * 2,
      NAV_BUTTON_SIZE - paddingInner * 2,
      radius - 4
    );
    panel.strokeRoundedRect(
      x - NAV_BUTTON_SIZE / 2 + paddingInner,
      y + paddingInner,
      NAV_BUTTON_SIZE - paddingInner * 2,
      NAV_BUTTON_SIZE - paddingInner * 2,
      radius - 4
    );
    panel.setDepth(NAV_UI_DEPTH + 1);

    // Transparent hit area on top to keep interactions
    this.homeButton = this.scene.add
      .rectangle(x, y, NAV_BUTTON_SIZE, NAV_BUTTON_SIZE, 0x000000, 0)
      .setOrigin(0.5, 0)
      .setDepth(NAV_UI_DEPTH + 2)
      .setInteractive({ useHandCursor: true });

    // Home icon (pixel art style)
    this.createHomeIcon(x, y + 25);

    // Hover effects
    this.homeButton.on("pointerover", () => {
      this.homeButton.setFillStyle(0x3a3a3a);
    });

    this.homeButton.on("pointerout", () => {
      this.homeButton.setFillStyle(NAV_BG_COLOR, 0.95);
    });

    // Click handler
    this.homeButton.on("pointerdown", () => {
      console.log("🏠 Home button clicked");
      // Add home functionality here if needed
    });
  }

  private createShopButton(x: number, y: number) {
    // Button background
    const radius = 12;
    const paddingInner2 = 8;
    const outer2 = this.scene.add.graphics();
    outer2.fillStyle(NAV_OUTER_COLOR, 0.98);
    outer2.fillRoundedRect(
      x - NAV_BUTTON_SIZE / 2,
      y,
      NAV_BUTTON_SIZE,
      NAV_BUTTON_SIZE,
      radius
    );
    outer2.setDepth(NAV_UI_DEPTH);

    const panel2 = this.scene.add.graphics();
    panel2.fillStyle(NAV_BG_COLOR, 0.98);
    panel2.lineStyle(2, NAV_BORDER_COLOR, 1);
    panel2.fillRoundedRect(
      x - NAV_BUTTON_SIZE / 2 + paddingInner2,
      y + paddingInner2,
      NAV_BUTTON_SIZE - paddingInner2 * 2,
      NAV_BUTTON_SIZE - paddingInner2 * 2,
      radius - 4
    );
    panel2.strokeRoundedRect(
      x - NAV_BUTTON_SIZE / 2 + paddingInner2,
      y + paddingInner2,
      NAV_BUTTON_SIZE - paddingInner2 * 2,
      NAV_BUTTON_SIZE - paddingInner2 * 2,
      radius - 4
    );
    panel2.setDepth(NAV_UI_DEPTH + 1);

    this.shopButton = this.scene.add
      .rectangle(x, y, NAV_BUTTON_SIZE, NAV_BUTTON_SIZE, 0x000000, 0)
      .setOrigin(0.5, 0)
      .setDepth(NAV_UI_DEPTH + 2)
      .setInteractive({ useHandCursor: true });

    // Shop icon (pixel art style)
    this.createShopIcon(x, y + 25);

    // Hover effects
    this.shopButton.on("pointerover", () => {
      this.shopButton.setFillStyle(0x3a3a3a);
    });

    this.shopButton.on("pointerout", () => {
      this.shopButton.setFillStyle(NAV_BG_COLOR, 0.95);
    });

    // Click handler - open React shop
    this.shopButton.on("pointerdown", () => {
      console.log("🛒 Shop button clicked - opening React shop");
      this.scene.events.emit("open-react-shop");
    });
  }

  private createSettingsButton(x: number, y: number) {
    // Button background
    const radius = 12;
    const paddingInner3 = 8;
    const outer3 = this.scene.add.graphics();
    outer3.fillStyle(NAV_OUTER_COLOR, 0.98);
    outer3.fillRoundedRect(
      x - NAV_BUTTON_SIZE / 2,
      y,
      NAV_BUTTON_SIZE,
      NAV_BUTTON_SIZE,
      radius
    );
    outer3.setDepth(NAV_UI_DEPTH);

    const panel3 = this.scene.add.graphics();
    panel3.fillStyle(NAV_BG_COLOR, 0.98);
    panel3.lineStyle(2, NAV_BORDER_COLOR, 1);
    panel3.fillRoundedRect(
      x - NAV_BUTTON_SIZE / 2 + paddingInner3,
      y + paddingInner3,
      NAV_BUTTON_SIZE - paddingInner3 * 2,
      NAV_BUTTON_SIZE - paddingInner3 * 2,
      radius - 4
    );
    panel3.strokeRoundedRect(
      x - NAV_BUTTON_SIZE / 2 + paddingInner3,
      y + paddingInner3,
      NAV_BUTTON_SIZE - paddingInner3 * 2,
      NAV_BUTTON_SIZE - paddingInner3 * 2,
      radius - 4
    );
    panel3.setDepth(NAV_UI_DEPTH + 1);

    this.settingsButton = this.scene.add
      .rectangle(x, y, NAV_BUTTON_SIZE, NAV_BUTTON_SIZE, 0x000000, 0)
      .setOrigin(0.5, 0)
      .setDepth(NAV_UI_DEPTH + 2)
      .setInteractive({ useHandCursor: true });

    // Settings icon (pixel art style)
    this.createSettingsIcon(x, y + 25);

    // Hover effects
    this.settingsButton.on("pointerover", () => {
      this.settingsButton.setFillStyle(0x3a3a3a);
    });

    this.settingsButton.on("pointerout", () => {
      this.settingsButton.setFillStyle(NAV_BG_COLOR, 0.95);
    });

    // Click handler
    this.settingsButton.on("pointerdown", () => {
      console.log("⚙️ Settings button clicked");
      // Add settings functionality here if needed
    });
  }

  private createHomeIcon(x: number, y: number) {
    // Create a simple house icon using graphics
    this.scene.add
      .image(x, y, "home")
      .setOrigin(0.5)
      .setDisplaySize(30, 30)
      .setDepth(NAV_UI_DEPTH + 3);
  }

  private createShopIcon(x: number, y: number) {
    // Use image-based icon (requested: @images/game-ui/setting.png)
    this.scene.add
      .image(x, y, "shop")
      .setOrigin(0.5)
      .setDisplaySize(20, 20)
      .setDepth(NAV_UI_DEPTH + 3);
  }

  private createSettingsIcon(x: number, y: number) {
    // Use the same setting image for settings button
    this.scene.add
      .image(x, y, "setting")
      .setOrigin(0.5)
      .setDisplaySize(20, 20)
      .setDepth(NAV_UI_DEPTH + 3);
  }
}

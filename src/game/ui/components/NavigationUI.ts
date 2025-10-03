import type { GameScene } from "../../scenes/GameScene";

const NAV_BG_COLOR = 0x2a2a2a; // Inner panel color
const NAV_BORDER_COLOR = 0x404040; // Inner border color
const NAV_OUTER_COLOR = 0x101010; // Outer container color
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
    const graphics = this.scene.add.graphics();

    // House base (rectangle)
    graphics.fillStyle(0xffffff);
    graphics.fillRect(x - 8, y - 5, 16, 10);

    // House roof (triangle)
    graphics.fillStyle(0x87ceeb); // Light blue roof
    graphics.beginPath();
    graphics.moveTo(x - 10, y - 5);
    graphics.lineTo(x, y - 12);
    graphics.lineTo(x + 10, y - 5);
    graphics.closePath();
    graphics.fillPath();

    // Door
    graphics.fillStyle(0x8b4513); // Brown door
    graphics.fillRect(x - 2, y - 2, 4, 6);

    graphics.setDepth(NAV_UI_DEPTH + 1); // Above button
  }

  private createShopIcon(x: number, y: number) {
    // Create a simple shop icon using graphics
    const graphics = this.scene.add.graphics();

    // Shop base
    graphics.fillStyle(0xffffff);
    graphics.fillRect(x - 8, y - 5, 16, 10);

    // Shop roof with stripes
    graphics.fillStyle(0xff0000); // Red
    graphics.fillRect(x - 10, y - 8, 20, 3);
    graphics.fillStyle(0xffffff); // White
    graphics.fillRect(x - 10, y - 11, 20, 3);

    // Windows
    graphics.fillStyle(0x87ceeb); // Light blue
    graphics.fillRect(x - 6, y - 3, 3, 3);
    graphics.fillRect(x + 3, y - 3, 3, 3);

    // Door
    graphics.fillStyle(0x8b4513); // Brown
    graphics.fillRect(x - 1, y - 2, 2, 6);

    graphics.setDepth(NAV_UI_DEPTH + 1); // Above button
  }

  private createSettingsIcon(x: number, y: number) {
    // Create a simple gear icon using graphics
    const graphics = this.scene.add.graphics();

    // Gear icon (simplified)
    graphics.fillStyle(0xb3b3b3); // Light gray

    // Center circle
    graphics.fillCircle(x, y, 4);

    // Gear teeth (simplified as small rectangles)
    graphics.fillRect(x - 8, y - 1, 3, 2);
    graphics.fillRect(x + 5, y - 1, 3, 2);
    graphics.fillRect(x - 1, y - 8, 2, 3);
    graphics.fillRect(x - 1, y + 5, 2, 3);

    graphics.setDepth(NAV_UI_DEPTH + 1); // Above button
  }
}

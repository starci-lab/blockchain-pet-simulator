import { PetManager } from "@/game/managers/PetManager";

const UI_PADDING = 8;

export class HappinessUI {
  private scene: Phaser.Scene;
  private petManager: PetManager;
  private happinessLabel!: Phaser.GameObjects.Text;
  private happinessBar!: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene, petManager: PetManager) {
    this.scene = scene;
    this.petManager = petManager;
  }

  create() {
    this.happinessLabel = this.scene.add.text(
      300, // X position - rightmost
      10, // Same Y as Food and Cleanliness labels
      "Happiness:",
      {
        fontSize: "16px",
        color: "#333333",
        backgroundColor: "transparent",
        padding: { x: UI_PADDING, y: 4 },
      }
    );

    const activePet = this.petManager.getActivePet();
    this.happinessBar = this.scene.add
      .rectangle(
        300, // X position - rightmost
        40, // Same Y as other bars
        activePet?.happinessSystem.happinessLevel || 100,
        10,
        0x4a90e2 // Blue color for happiness
      )
      .setOrigin(0, 0.5);
  }

  update() {
    const activePet = this.petManager.getActivePet();

    if (this.happinessBar && activePet) {
      const happinessLevel = activePet.happinessSystem.happinessLevel;
      this.happinessBar.setSize(happinessLevel, 10);

      // Color coding based on happiness level
      let barColor: number;
      if (happinessLevel >= 80) {
        barColor = 0x4a90e2; // Blue for happy
      } else if (happinessLevel >= 60) {
        barColor = 0x8bc34a; // Light Green for content
      } else if (happinessLevel >= 40) {
        barColor = 0xffeb3b; // Yellow for neutral
      } else if (happinessLevel >= 20) {
        barColor = 0xff9800; // Orange for sad
      } else {
        barColor = 0xf44336; // Red for very sad
      }
      this.happinessBar.setFillStyle(barColor);
    }
  }

  destroy() {
    this.happinessLabel?.destroy();
    this.happinessBar?.destroy();
  }
}

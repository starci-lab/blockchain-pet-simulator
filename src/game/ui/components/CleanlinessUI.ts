import { PetManager } from "@/game/managers/PetManager";

const UI_PADDING = 8;

export class CleanlinessUI {
  private scene: Phaser.Scene;
  private petManager: PetManager;
  private cleanlinessLabel!: Phaser.GameObjects.Text;
  private cleanlinessBar!: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene, petManager: PetManager) {
    this.scene = scene;
    this.petManager = petManager;
  }

  create() {
    this.cleanlinessLabel = this.scene.add.text(
      150, // X position - middle
      10, // Same Y as Food label
      "Cleanliness:",
      {
        fontSize: "16px",
        color: "#333333",
        backgroundColor: "transparent",
        padding: { x: UI_PADDING, y: 4 },
      }
    );

    const activePet = this.petManager.getActivePet();
    this.cleanlinessBar = this.scene.add
      .rectangle(
        150, // X position - middle
        40, // Same Y as hunger bar
        activePet?.cleanlinessSystem.cleanlinessLevel || 100,
        10,
        0x4caf50 // Green color for clean
      )
      .setOrigin(0, 0.5);
  }

  update() {
    const activePet = this.petManager.getActivePet();

    if (this.cleanlinessBar && activePet) {
      const cleanlinessLevel = activePet.cleanlinessSystem.cleanlinessLevel;
      this.cleanlinessBar.setSize(cleanlinessLevel, 10);

      // Color coding based on cleanliness level
      let barColor: number;
      if (cleanlinessLevel >= 80) {
        barColor = 0x4caf50; // Green - Very Clean
      } else if (cleanlinessLevel >= 60) {
        barColor = 0x8bc34a; // Light Green - Clean
      } else if (cleanlinessLevel >= 40) {
        barColor = 0xffeb3b; // Yellow - Neutral
      } else if (cleanlinessLevel >= 20) {
        barColor = 0xff9800; // Orange - Dirty
      } else {
        barColor = 0xf44336; // Red - Very Dirty
      }
      this.cleanlinessBar.setFillStyle(barColor);
    }
  }

  destroy() {
    this.cleanlinessLabel?.destroy();
    this.cleanlinessBar?.destroy();
  }
}

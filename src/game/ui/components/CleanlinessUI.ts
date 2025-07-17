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
    const activePet = this.petManager.getActivePet();

    this.cleanlinessLabel = this.scene.add.text(
      10,
      70, // Position below hunger bar (hunger is at y=40)
      "Cleanliness:",
      {
        fontSize: "16px",
        color: "#333333",
        backgroundColor: "transparent",
        padding: { x: UI_PADDING, y: 4 },
      }
    );

    // Create cleanliness bar - blue color for cleanliness
    this.cleanlinessBar = this.scene.add
      .rectangle(
        10,
        100, // Position below the label
        activePet?.cleanlinessSystem.cleanlinessLevel || 100,
        10,
        0x00aaff // Light blue color for cleanliness
      )
      .setOrigin(0, 0.5);
  }

  update() {
    const activePet = this.petManager.getActivePet();

    if (this.cleanlinessBar && activePet && activePet.cleanlinessSystem) {
      const cleanlinessLevel = activePet.cleanlinessSystem.cleanlinessLevel;
      this.cleanlinessBar.setSize(cleanlinessLevel, 10);
    }
  }
}

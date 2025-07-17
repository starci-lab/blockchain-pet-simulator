import { PetManager, type PetData } from "@/game/managers/PetManager";

const UI_PADDING = 8;

export class HappinessUI {
  private scene: Phaser.Scene;
  private petManager: PetManager;
  private happinessLabel!: Phaser.GameObjects.Text;
  private petHappinessElements: Map<
    string,
    {
      nameText: Phaser.GameObjects.Text;
      happinessBar: Phaser.GameObjects.Rectangle;
    }
  > = new Map();

  constructor(scene: Phaser.Scene, petManager: PetManager) {
    this.scene = scene;
    this.petManager = petManager;
  }

  create() {
    this.happinessLabel = this.scene.add.text(
      10,
      100, // Position below cleanliness bar (cleanliness is at y=70)
      "Happiness:",
      {
        fontSize: "16px",
        color: "#333333",
        backgroundColor: "transparent",
        padding: { x: UI_PADDING, y: 4 },
      }
    );

    // Create happiness UI for all existing pets
    this.updateAllPetElements();
  }

  update() {
    this.updateAllPetElements();
    this.updatePetBars();
  }

  private updateAllPetElements() {
    const allPets = this.petManager.getAllPets();

    // Remove UI elements for pets that no longer exist
    for (const [petId, elements] of this.petHappinessElements) {
      const petStillExists = allPets.some((petData) => petData.id === petId);
      if (!petStillExists) {
        elements.nameText.destroy();
        elements.happinessBar.destroy();
        this.petHappinessElements.delete(petId);
      }
    }

    // Create UI elements for new pets
    for (const petData of allPets) {
      if (!this.petHappinessElements.has(petData.id)) {
        this.createPetHappinessUI(petData);
      }
    }
  }

  private createPetHappinessUI(petData: PetData) {
    // Calculate position - arrange horizontally with some spacing
    const allPets = this.petManager.getAllPets();
    const petIndex = allPets.findIndex((p) => p.id === petData.id);
    const baseX = 100; // Starting X position after "Happiness:" label
    const spacingX = 200; // Spacing between pet happiness bars

    const barX = baseX + petIndex * spacingX;
    const barY = 100; // Same Y as label

    // Pet name
    const nameText = this.scene.add.text(barX, barY, `Pet ${petData.id}:`, {
      fontSize: "12px",
      color: "#555555",
      fontFamily: "monospace",
    });

    // Happiness bar background
    const barBg = this.scene.add.rectangle(barX, barY + 20, 100, 10, 0x555555);
    barBg.setOrigin(0, 0.5);

    // Happiness bar foreground
    const happinessBar = this.scene.add.rectangle(
      barX,
      barY + 20,
      100,
      10,
      0x4a90e2
    );
    happinessBar.setOrigin(0, 0.5);

    // Store elements for later updates
    this.petHappinessElements.set(petData.id, {
      nameText,
      happinessBar,
    });
  }

  private updatePetBars() {
    for (const [petId, elements] of this.petHappinessElements) {
      const petData = this.petManager.getPet(petId);
      if (!petData) continue;

      const happinessLevel = petData.pet.happinessLevel;
      const barWidth = Math.max(0, (happinessLevel / 100) * 100);
      elements.happinessBar.setDisplaySize(barWidth, 10);

      // Color coding based on happiness level
      let barColor: number;
      if (happinessLevel >= 80) {
        barColor = 0x4caf50; // Green - Very Happy
      } else if (happinessLevel >= 60) {
        barColor = 0x8bc34a; // Light Green - Happy
      } else if (happinessLevel >= 40) {
        barColor = 0xffeb3b; // Yellow - Neutral
      } else if (happinessLevel >= 20) {
        barColor = 0xff9800; // Orange - Sad
      } else {
        barColor = 0xf44336; // Red - Very Sad
      }
      elements.happinessBar.setFillStyle(barColor);

      // Update name text with happiness level
      elements.nameText.setText(
        `Pet ${petId}: ${Math.round(happinessLevel)}%`
      );
    }
  }

  destroy() {
    // Clean up all UI elements
    this.happinessLabel?.destroy();
    for (const elements of this.petHappinessElements.values()) {
      elements.nameText.destroy();
      elements.happinessBar.destroy();
    }
    this.petHappinessElements.clear();
  }
}

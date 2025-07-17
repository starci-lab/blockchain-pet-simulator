import { PetManager, type PetData } from "@/game/managers/PetManager";

const UI_PADDING = 8;

export class CleanlinessUI {
  private scene: Phaser.Scene;
  private petManager: PetManager;
  private cleanlinessLabel!: Phaser.GameObjects.Text;
  private petCleanlinessElements: Map<
    string,
    {
      nameText: Phaser.GameObjects.Text;
      cleanlinessBar: Phaser.GameObjects.Rectangle;
    }
  > = new Map();

  constructor(scene: Phaser.Scene, petManager: PetManager) {
    this.scene = scene;
    this.petManager = petManager;
  }

  create() {
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

    // Create cleanliness UI for all existing pets
    this.updateAllPetElements();
  }

  update() {
    this.updateAllPetElements();
    this.updatePetBars();
  }

  private updateAllPetElements() {
    const allPets = this.petManager.getAllPets();

    // Remove UI elements for pets that no longer exist
    for (const [petId, elements] of this.petCleanlinessElements) {
      const petStillExists = allPets.some((petData) => petData.id === petId);
      if (!petStillExists) {
        elements.nameText.destroy();
        elements.cleanlinessBar.destroy();
        this.petCleanlinessElements.delete(petId);
      }
    }

    // Create UI elements for new pets
    allPets.forEach((petData, index) => {
      if (!this.petCleanlinessElements.has(petData.id)) {
        this.createPetCleanlinessUI(petData, index);
      }
    });
  }

  private createPetCleanlinessUI(petData: PetData, index: number) {
    // Horizontal layout: each pet gets space horizontally
    const baseX = 10 + index * 200; // 200px spacing between each pet's UI horizontally
    const baseY = 100; // Fixed Y position for all pets

    // Pet name text
    const nameText = this.scene.add.text(
      baseX,
      baseY,
      `Pet ${petData.id.slice(-4)}:`, // Show last 4 characters of ID
      {
        fontSize: "12px", // Smaller font for horizontal layout
        color: "#666666",
        backgroundColor: "transparent",
        padding: { x: UI_PADDING, y: 2 },
      }
    );

    // Cleanliness bar for this pet (positioned below the name)
    const cleanlinessBar = this.scene.add
      .rectangle(
        baseX, // Align with name text
        baseY + 20, // Position below name text
        Math.max(petData.pet.cleanlinessLevel || 100, 10), // Minimum width of 10px
        8,
        0x00aaff // Light blue color for cleanliness
      )
      .setOrigin(0, 0.5);

    this.petCleanlinessElements.set(petData.id, {
      nameText,
      cleanlinessBar,
    });
  }

  private updatePetBars() {
    const allPets = this.petManager.getAllPets();

    allPets.forEach((petData) => {
      const elements = this.petCleanlinessElements.get(petData.id);
      if (elements && petData.pet) {
        const cleanlinessLevel = petData.pet.cleanlinessLevel;
        // Set minimum width to ensure bar is always visible
        const barWidth = Math.max(cleanlinessLevel, 10);
        elements.cleanlinessBar.setSize(barWidth, 8);

        // Change color based on cleanliness level
        let color = 0x00aaff; // Blue for clean
        if (cleanlinessLevel < 30) {
          color = 0xff4444; // Red for filthy
        } else if (cleanlinessLevel < 50) {
          color = 0xffaa00; // Orange for dirty
        } else if (cleanlinessLevel < 80) {
          color = 0xffff00; // Yellow for normal
        }
        elements.cleanlinessBar.setFillStyle(color);
      }
    });
  }

  destroy() {
    // Clean up all pet UI elements
    for (const [, elements] of this.petCleanlinessElements) {
      elements.nameText.destroy();
      elements.cleanlinessBar.destroy();
    }
    this.petCleanlinessElements.clear();

    if (this.cleanlinessLabel) {
      this.cleanlinessLabel.destroy();
    }
  }
}

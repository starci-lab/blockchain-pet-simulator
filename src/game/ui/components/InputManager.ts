import { PetManager } from "@/game/managers/PetManager";

const UI_FONT = "monospace";

export class InputManager {
  private scene: Phaser.Scene;
  private petManager: PetManager;
  private notificationUI: any;

  constructor(
    scene: Phaser.Scene,
    petManager: PetManager,
    notificationUI: any,
    shopUI: any // Keep parameter for compatibility but don't use it
  ) {
    this.scene = scene;
    this.petManager = petManager;
    this.notificationUI = notificationUI;
    // shopUI is no longer used - legacy ShopUI removed
  }

  setupInputHandlers() {
    console.log("⌨️ Setting up input handlers...");

    // Track click timing for double click detection
    let lastClickTime = 0;
    const DOUBLE_CLICK_THRESHOLD = 300; // ms

    // Main click handler for pet interaction
    this.scene.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      const currentTime = Date.now();
      const isDoubleClick =
        currentTime - lastClickTime < DOUBLE_CLICK_THRESHOLD;
      lastClickTime = currentTime;

      if (isDoubleClick) {
        // Double click - pet interaction
        this.handlePetInteraction(pointer.x, pointer.y);
      } else {
        // Single click - basic interaction
        this.handleSingleClick(pointer.x, pointer.y);
      }
    });

    console.log("✅ Input handlers set up successfully");
  }

  private handlePetInteraction(x: number, y: number) {
    const activePet = this.petManager.getActivePet();
    if (!activePet) {
      console.log("No active pet to interact with");
      return;
    }

    // Check if click is near the pet
    const petBounds = activePet.pet.getBounds();
    const distance = Phaser.Math.Distance.Between(
      x,
      y,
      petBounds.centerX,
      petBounds.centerY
    );

    if (distance < 100) {
      // Within interaction range
      // Random pet interaction
      const interactions = ["play", "feed", "pet"];
      const randomInteraction =
        interactions[Math.floor(Math.random() * interactions.length)];

      activePet.pet.setUserActivity(randomInteraction);
      this.notificationUI.showNotification(
        `Pet interaction: ${randomInteraction}`,
        x,
        y
      );

      console.log(`🐕 Pet interaction: ${randomInteraction}`);
    }
  }

  private handleSingleClick(x: number, y: number) {
    // Basic single click handling
    console.log(`🖱️ Single click at (${x}, ${y})`);
  }
}

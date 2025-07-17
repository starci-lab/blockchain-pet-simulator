import { PetManager } from "@/game/managers/PetManager";
import { FeedingUI } from "./components/FeedingUI";
import { CleanlinessUI } from "./components/CleanlinessUI";
import { TokenUI } from "./components/TokenUI";
import { ShopUI } from "./components/ShopUI";
import { NotificationUI } from "./components/NotificationUI";
import { PetShopModal } from "./components/PetShopModal";
import { InputManager } from "./components/InputManager";

const PET_PRICE = 50; // Price to buy a new pet

export class GameUI {
  private scene: Phaser.Scene;
  private petManager: PetManager;

  // UI Components
  private feedingUI: FeedingUI;
  private cleanlinessUI: CleanlinessUI;
  private tokenUI: TokenUI;
  private shopUI: ShopUI;
  private notificationUI: NotificationUI;
  private petShopModal: PetShopModal;
  private inputManager: InputManager;

  // UI Elements
  private buyPetButton!: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene, petManager: PetManager) {
    this.scene = scene;
    this.petManager = petManager;

    // Initialize UI components
    this.notificationUI = new NotificationUI(scene);
    this.feedingUI = new FeedingUI(scene, petManager);
    this.cleanlinessUI = new CleanlinessUI(scene, petManager);
    this.tokenUI = new TokenUI(scene);
    this.shopUI = new ShopUI(scene, petManager, this.notificationUI);
    this.petShopModal = new PetShopModal(
      scene,
      petManager,
      this.notificationUI
    );
    this.inputManager = new InputManager(
      scene,
      petManager,
      this.notificationUI,
      this.shopUI
    );
  }

  create() {
    console.log("🎨 Creating GameUI...");

    // Create all UI components
    this.feedingUI.create();
    this.cleanlinessUI.create();
    this.tokenUI.create();
    this.shopUI.create();
    this.createBuyPetButton();
    this.inputManager.setupInputHandlers();

    console.log("✅ GameUI created successfully");
  }

  // Buy Pet Button
  private createBuyPetButton() {
    console.log("🏪 Creating Buy Pet Button...");

    // Position button below the shop
    const buttonX = this.scene.cameras.main.width - 100;
    const buttonY = 60; // Below the token UI
    const buttonWidth = 80;
    const buttonHeight = 30;

    // Button background
    this.buyPetButton = this.scene.add
      .rectangle(buttonX, buttonY, buttonWidth, buttonHeight, 0x4caf50, 0.9)
      .setStrokeStyle(2, 0x388e3c)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    // Button text
    this.scene.add
      .text(buttonX, buttonY, `Buy Pet\n🪙${PET_PRICE}`, {
        fontSize: "12px",
        color: "#ffffff",
        fontStyle: "bold",
        fontFamily: "monospace",
        align: "center",
      })
      .setOrigin(0.5);

    // Button click handler
    this.buyPetButton.on("pointerdown", () => {
      this.petShopModal.showBuyPetModal();
    });

    // Hover effects
    this.buyPetButton.on("pointerover", () => {
      this.buyPetButton.setFillStyle(0x66bb6a);
    });

    this.buyPetButton.on("pointerout", () => {
      this.buyPetButton.setFillStyle(0x4caf50);
    });

    console.log("✅ Buy Pet Button created successfully");
  }

  // Public method for external components (like ColyseusClient) to show notifications
  showNotification(message: string, x?: number, y?: number) {
    this.notificationUI.showNotification(message, x, y);
  }

  // Update all UI components
  updateUI() {
    this.feedingUI.update();
    this.cleanlinessUI.update();
    this.tokenUI.update();
    this.shopUI.updateTokenUI();
    this.shopUI.updatePriceDisplay();
  }

  // Debug method to show pet stats
  showPetStats() {
    const stats = this.petManager.getPetStats();
    console.log("🐕 Pet Manager Stats:", stats);
  }
}

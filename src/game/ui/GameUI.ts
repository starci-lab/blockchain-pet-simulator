import type { GameScene } from "../scenes/GameScene";
import { PetManager, type PetData } from "@/game/managers/PetManager";
import { FeedingUI } from "./components/FeedingUI";
import { CleanlinessUI } from "./components/CleanlinessUI";
import { HappinessUI } from "./components/HappinessUI";
import { TokenUI } from "./components/TokenUI";
import { ShopUI } from "./components/ShopUI";
import { NotificationUI } from "./components/NotificationUI";
import { PetShopModal } from "./components/PetShopModal";
import { PetDetailsModal } from "./components/PetDetailsModal";
import { InputManager } from "./components/InputManager";
import ShopModal from "./components/ShopModal";

const PET_PRICE = 50; // Price to buy a new pet

export class GameUI {
  private scene: GameScene;
  private petManager: PetManager;

  // UI Components
  private feedingUI: FeedingUI;
  private cleanlinessUI: CleanlinessUI;
  private happinessUI: HappinessUI;
  private tokenUI: TokenUI;
  private shopUI: ShopUI;
  private notificationUI: NotificationUI;
  private petShopModal: PetShopModal;
  private petDetailsModal: PetDetailsModal;
  private inputManager: InputManager;
  private shopModal: ShopModal;

  // UI Elements
  private buyPetButton!: Phaser.GameObjects.Rectangle;
  private shopButton!: Phaser.GameObjects.Rectangle;

  constructor(scene: GameScene, petManager: PetManager) {
    this.scene = scene;
    this.petManager = petManager;

    // Initialize UI components
    this.notificationUI = new NotificationUI(scene);
    this.feedingUI = new FeedingUI(scene, petManager);
    this.cleanlinessUI = new CleanlinessUI(scene, petManager);
    this.happinessUI = new HappinessUI(scene, petManager);
    this.tokenUI = new TokenUI(scene);
    this.shopUI = new ShopUI(scene, petManager, this.notificationUI);
    this.petShopModal = new PetShopModal(petManager, this.notificationUI);
    this.petDetailsModal = new PetDetailsModal();
    this.inputManager = new InputManager(
      scene,
      petManager,
      this.notificationUI,
      this.shopUI
    );
    this.shopModal = new ShopModal(scene, petManager);
  }

  create() {
    console.log("🎨 Creating GameUI...");

    // Create all UI components
    this.feedingUI.create();
    this.cleanlinessUI.create();
    this.happinessUI.create();
    this.tokenUI.create();
    this.shopUI.create();
    this.createBuyPetButton();
    this.createShopButton();
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
        align: "center"
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

  // Shop Button
  private createShopButton() {
    console.log("🏪 Creating Shop Button...");

    // Position button below the buy pet button
    const buttonX = this.scene.cameras.main.width - 100;
    const buttonY = 100; // Below the buy pet button
    const buttonWidth = 80;
    const buttonHeight = 30;

    // Button background with modern gradient-like appearance
    this.shopButton = this.scene.add
      .rectangle(buttonX, buttonY, buttonWidth, buttonHeight, 0x6366f1, 0.9)
      .setStrokeStyle(2, 0x4f46e5)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    // Button text
    this.scene.add
      .text(buttonX, buttonY, "🏪 Shop", {
        fontSize: "14px",
        color: "#ffffff",
        fontStyle: "bold",
        fontFamily: "Segoe UI, Arial, sans-serif",
        align: "center"
      })
      .setOrigin(0.5);

    // Button click handler
    this.shopButton.on("pointerdown", () => {
      this.shopModal.show();
    });

    // Hover effects
    this.shopButton.on("pointerover", () => {
      this.shopButton.setFillStyle(0x7c3aed);
    });

    this.shopButton.on("pointerout", () => {
      this.shopButton.setFillStyle(0x6366f1);
    });

    console.log("✅ Shop Button created successfully");
  }

  // Public method for external components (like ColyseusClient) to show notifications
  showNotification(message: string, x?: number, y?: number) {
    this.notificationUI.showNotification(message, x, y);
  }

  // Update all UI components
  updateUI() {
    this.feedingUI.update();
    this.cleanlinessUI.update();
    this.happinessUI.update();
    this.tokenUI.update();
    this.shopUI.updateTokenUI();
    this.shopUI.updatePriceDisplay();
    this.petDetailsModal.update();
  }

  // Debug method to show pet stats
  showPetStats() {
    const stats = this.petManager.getPetStats();
    console.log("🐕 Pet Manager Stats:", stats);
  }

  // Show pet details modal
  showPetDetailsModal(petData: PetData) {
    this.petDetailsModal.show(petData);
  }

  getTokenUI(): TokenUI {
    return this.tokenUI;
  }
}

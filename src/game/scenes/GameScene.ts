import { SceneName } from "@/constants/scene";
import {
  loadChogAssets,
  loadBackgroundAssets,
  loadFoodAssets,
} from "@/game/load";
import Phaser from "phaser";
import { GameUI } from "@/game/ui/GameUI";
import { ColyseusClient } from "@/game/colyseus/client";
import { initializeGame } from "@/gameInit";
import { PetManager } from "@/game/managers/PetManager";
import { gameConfigManager } from "@/game/configs/gameConfig";
import { GamePositioning } from "@/game/constants/gameConstants";
import RexUIPlugin from "phaser3-rex-plugins/templates/ui/ui-plugin.js";
const BACKEND_URL = import.meta.env.VITE_BASE_SOCKET || "ws://localhost:3002";

export class GameScene extends Phaser.Scene {
  rexUI!: RexUIPlugin;
  private petManager!: PetManager;
  private gameUI!: GameUI;
  private colyseusClient!: ColyseusClient;
  private isInitialized = false;

  constructor() {
    super({ key: SceneName.Gameplay });
  }
  preload() {
    loadChogAssets(this);
    loadBackgroundAssets(this);
    loadFoodAssets(this);
  }
  async create() {
    // Disable browser context menu on right click for the whole scene
    this.input.mouse?.disableContextMenu();

    // Add background image
    this.createBackground();

    // Initialize game configuration first
    console.log("🎮 Initializing game configuration...");
    await initializeGame();

    // Debug log food items
    gameConfigManager.logFoodItems();

    // Initialize systems
    this.initializeSystems();
    this.initializePets();
    this.initializeUI();

    // Setup cursor
    this.input.setDefaultCursor(
      `url(./src/assets/images/cursor/navigation_nw.png), pointer`
    );

    // Connect to Colyseus (optional, game works offline too)
    console.log("🔌 Starting Colyseus connection...");
    await this.colyseusClient.connect(BACKEND_URL);

    console.log("🏁 Scene initialization complete");
    console.log(
      "Room status:",
      this.colyseusClient.isConnected() ? "Connected" : "Offline mode"
    );

    // Mark as initialized
    this.isInitialized = true;
    console.log("✅ GameScene fully initialized");
  }

  private initializeSystems() {
    // Initialize multiplayer client first
    this.colyseusClient = new ColyseusClient(this);

    // Initialize pet manager
    this.petManager = new PetManager(this, this.colyseusClient);
  }

  private initializePets() {
    console.log("🐕 Pet initialization - waiting for server sync...");
    // Don't create initial pets locally when using Colyseus
    // The server will create and sync the starter pet automatically
    // This prevents conflicts between local and server pet IDs
  }

  private initializeUI() {
    // Initialize UI with pet manager
    this.gameUI = new GameUI(this, this.petManager);
    this.gameUI.create();

    // Set GameUI reference in ColyseusClient for notifications
    this.colyseusClient.setGameUI(this.gameUI);
  }

  update() {
    // Don't update until fully initialized
    if (!this.isInitialized) {
      return;
    }

    // Check if managers are initialized
    if (!this.petManager) {
      return;
    }

    if (!this.gameUI) {
      return;
    }

    try {
      // Update all pets through manager
      this.petManager.update();

      // Update UI
      this.gameUI.updateUI();
    } catch (error) {
      console.error("❌ Error in GameScene.update():", error);
    }
  }

  // Compatibility methods for React component
  get speed() {
    const activePet = this.petManager.getActivePet();
    return activePet?.pet.speed || 0;
  }

  set speed(value: number) {
    const activePet = this.petManager.getActivePet();
    if (activePet) {
      activePet.pet.speed = value;
    }
  }

  get currentActivity() {
    const activePet = this.petManager.getActivePet();
    return activePet?.pet.currentActivity || "idle";
  }

  set currentActivity(value: string) {
    const activePet = this.petManager.getActivePet();
    if (activePet) {
      activePet.pet.setActivity(value);
    }
  }

  updateSpeed(newSpeed: number) {
    const activePet = this.petManager.getActivePet();
    if (activePet) {
      activePet.pet.speed = newSpeed;
    }
  }

  setUserActivity(newActivity: string) {
    const activePet = this.petManager.getActivePet();
    if (activePet) {
      activePet.pet.setUserActivity(newActivity);
    }
  }

  // New methods for multi-pet management
  getPetManager(): PetManager {
    return this.petManager;
  }

  addPet(petId: string, x?: number, y?: number): boolean {
    const petData = this.petManager.createPet(
      petId,
      x || Math.random() * 300 + 50,
      y || GamePositioning.getPetY(this.cameras.main.height)
    );
    return !!petData;
  }

  removePet(petId: string): boolean {
    return this.petManager.removePet(petId);
  }

  switchToPet(petId: string): boolean {
    return this.petManager.setActivePet(petId);
  }

  // Debug method
  debugPets(): void {
    this.petManager.debugPetsStatus();
  }

  // Force reset all pets (emergency method)
  forceResetPets(): void {
    this.petManager.forceResetAllPets();
  } // Create background image
  private createBackground() {
    const cameraWidth = this.cameras.main.width;
    const cameraHeight = this.cameras.main.height;

    try {
      // Try to load your custom background
      const background = this.add.image(0, 0, "game-background");
      background.setOrigin(0, 0); // Set origin to top-left
      background.setDisplaySize(cameraWidth, cameraHeight); // Scale to fit camera
      background.setDepth(-100); // Put background behind everything

      console.log("✅ Custom background loaded successfully");
    } catch {
      // Fallback: create a gradient background
      this.createGradientBackground();
    }
  }

  private createGradientBackground() {
    const cameraWidth = this.cameras.main.width;
    const cameraHeight = this.cameras.main.height;

    // Create a simple gradient background as fallback
    const graphics = this.add.graphics();

    // Sky gradient (light blue to white)
    graphics.fillGradientStyle(0x87ceeb, 0x87ceeb, 0xe0f6ff, 0xe0f6ff);
    graphics.fillRect(0, 0, cameraWidth, cameraHeight);
    graphics.setDepth(-100);

    console.log("✅ Gradient background created as fallback");
  }
}

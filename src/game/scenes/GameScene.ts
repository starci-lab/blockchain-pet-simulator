import { SceneName } from "@/constants/scene";
import {
  loadChogAssets,
  loadBackgroundAssets,
  loadFoodAssets,
  loadPoopAssets,
  loadCleaningAssets,
  loadToyAssets,
  loadEffectAssets,
  loadUiAssets
} from "@/game/load";
import Phaser from "phaser";
import { GameUI } from "@/game/ui/GameUI";
import { ColyseusClient } from "@/game/colyseus/client";
import { initializeGame } from "@/gameInit";
import { PetManager } from "@/game/managers/PetManager";
import { gameConfigManager } from "@/game/configs/gameConfig";
import { GamePositioning } from "@/game/constants/gameConstants";
import RexUIPlugin from "phaser3-rex-plugins/templates/ui/ui-plugin.js";
import { eventBus, EventNames, TilemapInputSystem } from "@/game/tilemap";
import { PurchaseSystem } from "@/game/systems/PurchaseSystem";
import { PurchaseUI } from "@/game/ui/PurchaseUI";
const BACKEND_URL = import.meta.env.VITE_BASE_SOCKET || "ws://localhost:3002";

export class GameScene extends Phaser.Scene {
  rexUI!: RexUIPlugin;
  private petManager!: PetManager;
  private gameUI!: GameUI;
  private colyseusClient!: ColyseusClient;
  private isInitialized = false;
  private backgroundImage?: Phaser.GameObjects.Image;
  private pendingColyseusRoom?: unknown;
  private tilemapInput?: TilemapInputSystem;
  private _purchaseSystem?: PurchaseSystem;
  private purchaseUI?: PurchaseUI;

  constructor() {
    super({ key: SceneName.Gameplay });
  }
  preload() {
    loadChogAssets(this);
    loadBackgroundAssets(this);
    loadFoodAssets(this);
    loadPoopAssets(this);
    loadCleaningAssets(this);
    loadToyAssets(this);
    loadEffectAssets(this);
    loadUiAssets(this);
  }
  async create() {
    // Disable browser context menu on right click for the whole scene
    this.input.mouse?.disableContextMenu();

    // Add background image (default)
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

    // Multiplayer connection is managed externally (React via use-colyseus) or via explicit call
    console.log(
      "🏁 Scene initialization complete (waiting for multiplayer attach/connect)"
    );

    // Mark as initialized
    this.isInitialized = true;
    console.log("✅ GameScene fully initialized");

    // Notify external listeners (React) that assets/UI are ready for multiplayer connect
    this.events.emit("assets-ready");

    // Subscribe to React UI tile events via global event bus
    this.setupTileInputListeners();

    // Initialize Phaser-native tilemap input for the bottom HUD area
    const tileWidth = this.cameras.main.width / 32;
    const tileHeight = this.cameras.main.height / 5;
    this.tilemapInput = new TilemapInputSystem(this, {
      rows: 1,
      cols: 32,
      tileWidth: tileWidth,
      tileHeight: tileHeight,
      offsetX: 0,
      offsetY: this.cameras.main.height - tileHeight,
      drawGrid: false
    });

    // Initialize purchase system
    this._purchaseSystem = new PurchaseSystem(this.colyseusClient);
    this.purchaseUI = new PurchaseUI(this);
  }

  private initializeSystems() {
    // Initialize multiplayer client first
    this.colyseusClient = new ColyseusClient(this);

    // Initialize pet manager
    this.petManager = new PetManager(this, this.colyseusClient);

    // If a room was provided before systems were ready, attach it now
    if (this.pendingColyseusRoom) {
      this.colyseusClient.attachRoom(this.pendingColyseusRoom);
      this.pendingColyseusRoom = undefined;
    }
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

  private setupTileInputListeners() {
    const handleTileSelected = (payload: {
      tile: { row: number; col: number };
      worldX: number;
      worldY: number;
    }) => {
      try {
        // Example: Move active pet horizontally based on tile col
        const active = this.petManager.getActivePet();
        if (!active) return;
        const cameraWidth = this.cameras.main.width;
        const cols = 32;
        const x = (payload.tile.col + 0.5) * (cameraWidth / cols);
        const y = GamePositioning.getPetY(this.cameras.main.height);
        active.pet.startChasing(x, y);
      } catch (e) {
        console.error("Tile select handling error", e);
      }
    };

    eventBus.on(EventNames.TileSelected, handleTileSelected);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      eventBus.off(EventNames.TileSelected, handleTileSelected);
    });
  }

  shutdown() {
    if (this.tilemapInput) {
      this.tilemapInput.destroy();
      this.tilemapInput = undefined;
    }
    if (this.purchaseUI) {
      this.purchaseUI.destroy();
      this.purchaseUI = undefined;
    }
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
  forceResetPets(): void {
    this.petManager.forceResetAllPets();
  }

  // ===== Multiplayer wiring (for React/use-colyseus) =====
  attachColyseusRoom(room: unknown) {
    if (!this.colyseusClient) {
      // Defer until systems are initialized
      this.pendingColyseusRoom = room;
      return;
    }
    this.colyseusClient.attachRoom(room);
  }

  async connectToColyseus(url: string = BACKEND_URL) {
    await this.colyseusClient.connect(url);
  }

  // Create or update background image
  createBackground(textureKey: string = "game-background") {
    const cameraWidth = this.cameras.main.width;
    const cameraHeight = this.cameras.main.height;

    // Remove previous background if exists
    if (this.backgroundImage) {
      this.backgroundImage.destroy();
      this.backgroundImage = undefined;
    }

    try {
      // Try to load the specified background
      this.backgroundImage = this.add.image(0, 0, textureKey);
      this.backgroundImage.setOrigin(0, 0); // Set origin to top-left

      // Calculate scale to maintain aspect ratio while covering the entire camera
      const texture = this.textures.get(textureKey);
      if (texture) {
        const textureWidth = texture.source[0].width;
        const textureHeight = texture.source[0].height;

        // Calculate scale to cover the entire camera area while maintaining aspect ratio
        const scaleX = cameraWidth / textureWidth;
        const scaleY = cameraHeight / textureHeight;
        const scale = Math.max(scaleX, scaleY); // Use the larger scale to ensure coverage

        this.backgroundImage.setScale(scale);

        // Center the background if it's larger than the camera
        if (scale === scaleX) {
          // Background is wider than camera, center vertically
          this.backgroundImage.setY((cameraHeight - textureHeight * scale) / 2);
        } else {
          // Background is taller than camera, center horizontally
          this.backgroundImage.setX((cameraWidth - textureWidth * scale) / 2);
        }
      } else {
        // Fallback to simple scaling if texture info not available
        this.backgroundImage.setDisplaySize(cameraWidth, cameraHeight);
      }

      this.backgroundImage.setDepth(-100); // Put background behind everything

      console.log(
        `✅ Background '${textureKey}' loaded successfully with proper scaling`
      );
    } catch {
      // Fallback: create a gradient background
      this.createGradientBackground();
    }
  }

  // ===== Exposed getters for React UI integration =====
  getPurchaseSystem(): PurchaseSystem | undefined {
    return this._purchaseSystem;
  }

  // Temporary legacy hook: send buy_food with requested payload
  sendBuyFoodLegacy(payload: {
    itemType: string;
    itemName: string;
    quantity: number;
    itemId: string;
  }) {
    if (!this.colyseusClient) return;
    this.colyseusClient.purchaseItem(
      payload.itemType,
      payload.itemName,
      payload.quantity,
      payload.itemId
    );
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

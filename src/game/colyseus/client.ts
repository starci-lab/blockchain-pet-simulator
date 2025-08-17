import { GameRoomState } from "@/game/schema/ChatSchema";
import { Room, Client, getStateCallbacks } from "colyseus.js";
import { useUserStore } from "@/store/userStore";

export class ColyseusClient {
  public room: Room<GameRoomState> | null = null;
  private scene: Phaser.Scene;
  private stateCallbacksSetup = false;
  private gameUI: any; // Reference to GameUI for notifications
  private lastClickPosition: { x: number; y: number } | null = null; // Track last click position

  constructor(scene: Phaser.Scene, gameUI?: any) {
    this.scene = scene;
    this.gameUI = gameUI;
    this.setupClickTracking();
  }

  // Method to set GameUI reference after initialization
  setGameUI(gameUI: any) {
    this.gameUI = gameUI;
  }

  // Setup click tracking to capture cursor positions
  private setupClickTracking() {
    // Track all pointer down events to store the last click position
    this.scene.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.lastClickPosition = { x: pointer.x, y: pointer.y };
    });
  }

  // ===== CONNECTION MANAGEMENT =====

  async connect(backendUrl: string) {
    const statusText = this.showConnectionStatus("Connecting...");
    const client = new Client(backendUrl);

    try {
      console.log("🔄 Connecting to Colyseus:", backendUrl);

      this.room = await client.joinOrCreate("single_player", {
        name: "Pet Game",
        addressWallet: useUserStore.getState().addressWallet
      });

      console.log("✅ Connected to Colyseus!");
      statusText.setText("✅ Connected!");
      statusText.setStyle({ color: "#00ff00" });

      this.setupEventListeners();
      this.hideStatusAfterDelay(statusText, 3000);
    } catch (error) {
      console.error("❌ Connection failed:", error);
      statusText.setText("❌ Connection failed!");
      statusText.setStyle({ color: "#ff0000" });
      this.room = null;
    }
  }

  isConnected(): boolean {
    return !!this.room;
  }

  sendMessage(type: string, data: any) {
    if (!this.room) {
      console.warn("⚠️ Cannot send message - room is null");
      return;
    }

    if (!this.isConnected()) {
      console.warn("⚠️ Cannot send message - not connected");
      return;
    }

    console.log(`📤 Sending: ${type}`, data);
    try {
      this.room.send(type, data);
    } catch (error) {
      console.error("❌ Failed to send message:", error);
    }
  }

  // ===== EVENT LISTENERS SETUP =====

  private setupEventListeners() {
    if (!this.room) return;

    // State changes
    this.room.onStateChange((state) => {
      console.log("🔄 State changed");
      this.setupStateCallbacks(state);
    });

    // Message handling
    this.room.onMessage("*", (type, message) => {
      console.log("📨 Message:", type, message);
      if (typeof type === "string") {
        this.handleMessage(type, message);
      }
    });

    // Connection events
    this.room.onError((code, message) => {
      console.error("❌ Room error:", code, message);
    });

    this.room.onLeave((code) => {
      console.log("👋 Left room:", code);
    });
  }

  // ===== MESSAGE HANDLING =====

  private handleMessage(type: string, message: any) {
    switch (type) {
      case "purchase_response":
        this.handlePurchaseResponse(message);
        break;

      case "feed_pet_response":
      case "play_pet_response":
      case "clean_pet_response":
        this.handlePetActionResponse(message);
        break;

      case "player_state_sync":
        this.handlePlayerSync(message);
        break;

      case "pets_state_sync":
        this.handlePetsSync(message);
        break;

      case "buy_pet_response":
        this.handleBuyPetResponse(message);
        break;

      case "welcome":
        this.requestPlayerState();
        break;

      default:
        // Other messages can be handled here
        break;
    }
  }

  // Handle buy-pet-response from server: update tokens and sync pets
  private handleBuyPetResponse(message: any) {
    console.log("🐾 Buy pet response:", message);

    if (message.success) {
      // Update tokens if provided
      if (message.currentTokens !== undefined) {
        useUserStore.getState().setNomToken(message.currentTokens);
        console.log(`💰 Tokens updated: ${message.currentTokens}`);
      }

      // Sync pets if provided
      if (message.pets && Array.isArray(message.pets)) {
        this.handlePetsSync({ pets: message.pets });
      } else {
        // Fallback: force request pets state from server
        this.sendMessage("request_pets_state", {});
      }

      // Show notification if needed
      if (this.gameUI && this.gameUI.showNotification) {
        this.gameUI.showNotification("🎉 You bought a new pet!");
      }
    } else {
      // Show error notification at last click position
      const x = this.lastClickPosition?.x;
      const y = this.lastClickPosition?.y;
      if (this.gameUI && this.gameUI.showNotification) {
        this.gameUI.showNotification(`❌ ${message.message}`, x, y);
      }
    }
  }

  private handlePurchaseResponse(message: any) {
    console.log("🛒 Purchase response:", message);

    if (message.success) {
      // Update tokens from server
      if (message.currentTokens !== undefined) {
        useUserStore.getState().setNomToken(message.currentTokens);
        console.log(`💰 Tokens updated: ${message.currentTokens}`);
      }
    } else {
      const x = this.lastClickPosition?.x;
      const y = this.lastClickPosition?.y;
      this.gameUI.showNotification(`❌ ${message.message}`, x, y);
    }
  }

  private handlePetActionResponse(message: any) {
    console.log("🐕 Pet action response:", message);

    if (message.success) {
      // Show success notification
      if (this.gameUI && this.gameUI.showNotification) {
        this.gameUI.showNotification(`✅ ${message.message}`);
      }

      // Update pet stats if provided
      if (message.petStats) {
        console.log("📊 Pet stats updated:", message.petStats);
      }
    } else {
      // Show failure notification
      if (this.gameUI && this.gameUI.showNotification) {
        this.gameUI.showNotification(`❌ ${message.message}`);
      }
    }
  }

  private handlePlayerSync(message: any) {
    console.log("👤 Player sync:", message);

    // Update tokens if provided
    if (message.tokens !== undefined) {
      const currentTokens = useUserStore.getState().nomToken;
      if (currentTokens !== message.tokens) {
        useUserStore.getState().setNomToken(message.tokens);
        console.log(`💰 Tokens synced: ${currentTokens} -> ${message.tokens}`);

        // Update UI to reflect token change
        if (this.gameUI && this.gameUI.updateUI) {
          this.gameUI.updateUI();
        }
      }
    }

    // Update inventory summary if provided
    if (message.inventory) {
      console.log(`📦 Inventory synced:`, message.inventory);

      // Update UI to reflect inventory changes
      if (this.gameUI && this.gameUI.updateUI) {
        this.gameUI.updateUI();
      }
    }

    // Update any other player data
    if (message.playerData) {
      console.log("📊 Player data synced:", message.playerData);
    }
  }

  private handlePetsSync(message: any) {
    console.log("🐕 Pets sync:", message);

    const petManager = this.getPetManager();
    if (!petManager) {
      console.warn("⚠️ PetManager not found - cannot sync pets");
      return;
    }

    if (!message.pets || !Array.isArray(message.pets)) {
      console.log("📝 No pets to sync or invalid pets data");
      return;
    }

    // Get current local pets
    const localPets = new Set(
      petManager.getAllPets().map((petData: any) => petData.id)
    );
    const serverPets = new Set(message.pets.map((pet: any) => pet.id));

    console.log(`🔄 Local pets: [${Array.from(localPets).join(", ")}]`);
    console.log(`🔄 Server pets: [${Array.from(serverPets).join(", ")}]`);

    // Track if we create any new pets
    let newPetsCreated: string[] = [];

    // Remove pets that don't exist on server
    for (const localPetId of localPets) {
      if (!serverPets.has(localPetId)) {
        console.log(`🗑️ Removing pet ${localPetId} (not on server)`);
        petManager.removePet(localPetId);
      }
    }

    // Add or update pets from server
    message.pets.forEach((serverPet: any) => {
      let localPetData = petManager.getPet(serverPet.id);

      // Create pet if it doesn't exist locally
      if (!localPetData) {
        console.log(`➕ Creating new pet ${serverPet.id}`);
        const minX = 100,
          maxX = 1200;
        const minY = 200,
          maxY = 500;
        const x = Math.floor(Math.random() * (maxX - minX + 1)) + minX;
        const y = Math.floor(Math.random() * (maxY - minY + 1)) + minY;
        localPetData = petManager.createPet(serverPet.id, x, y);

        if (!localPetData) {
          console.error(`❌ Failed to create pet ${serverPet.id}`);
          return;
        }

        // Track new pet creation
        newPetsCreated.push(serverPet.id);

        // Show notification for new pet
        if (this.gameUI && this.gameUI.showNotification) {
          this.gameUI.showNotification(`🎉 New pet appeared: ${serverPet.id}`);
        }
      }

      if (localPetData) {
        // Update pet stats (simplified - no position/activity sync needed for this simple version)
        console.log(
          `🔄 Pet ${serverPet.id} synced: hunger=${serverPet.hunger}, happiness=${serverPet.happiness}, cleanliness=${serverPet.cleanliness}`
        );
      }
    });

    // If new pets were created and no active pet, set the newest one as active
    if (newPetsCreated.length > 0) {
      const currentActivePet = petManager.getActivePet();
      if (!currentActivePet && newPetsCreated.length > 0) {
        const newestPetId = newPetsCreated[newPetsCreated.length - 1];
        petManager.setActivePet(newestPetId);
        console.log(`🎯 Set newest pet ${newestPetId} as active`);

        if (this.gameUI && this.gameUI.showNotification) {
          this.gameUI.showNotification(
            `🎯 Switched to new pet: ${newestPetId}`
          );
        }
      }
      console.log(
        `🆕 Created ${newPetsCreated.length} new pets: [${newPetsCreated.join(
          ", "
        )}]`
      );
    }

    console.log(
      `✅ Pet sync completed. Total pets: ${petManager.getAllPets().length}`
    );

    // Ensure visual states are updated after sync (especially on page reload)
    if (petManager.updatePetVisualStates) {
      petManager.updatePetVisualStates();
      console.log("🎨 Updated pet visual states after sync");
    }

    // Force UI update after pet sync
    if (this.gameUI && this.gameUI.updateUI) {
      this.gameUI.updateUI();
      console.log("🎨 Forced UI update after pet sync");
    }
  }

  // ===== STATE CALLBACKS SETUP =====

  private setupStateCallbacks(state: GameRoomState) {
    if (this.stateCallbacksSetup) return;
    this.stateCallbacksSetup = true;

    const $ = getStateCallbacks(this.room!);

    console.log("🔧 Setting up state callbacks...");

    // Player tokens sync
    $(state).players.onAdd((player: any, playerId: string) => {
      console.log(`👤 Player added: ${playerId}`);

      if (this.room && playerId === this.room.sessionId) {
        console.log("✅ Setting up callbacks for current player");

        // Listen for token changes
        $(player).listen("tokens", (current: number, previous: number) => {
          console.log(`💰 Tokens changed: ${previous} -> ${current}`);
          useUserStore.getState().setNomToken(current);

          // Update UI immediately
          if (this.gameUI && this.gameUI.updateUI) {
            this.gameUI.updateUI();
            console.log("🎨 UI updated due to token change");
          }
        });

        // Listen for inventory changes
        $(player).inventory.onChange(() => {
          console.log("📦 Inventory changed on server");
          // Request fresh player state when inventory changes
          this.requestPlayerState();
        });

        // Listen for any other player property changes
        $(player).onChange(() => {
          console.log("🔄 Player state changed on server");
          // Optionally request full player sync
          this.requestPlayerState();
        });
      }
    });

    // Listen for player removal
    $(state).players.onRemove((_player: any, playerId: string) => {
      console.log(`👋 Player removed: ${playerId}`);
    });

    console.log("✅ State callbacks setup completed");

    // Request initial player state after callbacks are set up
    setTimeout(() => {
      if (this.isConnected()) {
        this.requestPlayerState();
        console.log("📤 Requested initial player state");
      } else {
        console.warn("⚠️ Cannot request initial state - not connected");
      }
    }, 2000); // Increase delay to ensure connection is stable
  }

  // ===== UTILITY METHODS =====

  private getPetManager() {
    const gameScene = this.scene as any;
    console.log("🔍 Getting PetManager from scene:", gameScene);

    if (
      gameScene.getPetManager &&
      typeof gameScene.getPetManager === "function"
    ) {
      const petManager = gameScene.getPetManager();
      console.log("✅ PetManager found:", petManager);
      return petManager;
    } else {
      console.warn("⚠️ getPetManager method not found on scene");
      return null;
    }
  }

  private requestPlayerState() {
    console.log("📤 Requesting player state from server...");
    this.sendMessage("request_player_state", {});

    // Don't send too many messages at once - add delay
    setTimeout(() => {
      this.sendMessage("request_pets_state", {});
    }, 500);
  }

  private showConnectionStatus(text: string) {
    return this.scene.add
      .text(10, 70, text)
      .setStyle({ color: "#ff0000", fontSize: "12px" })
      .setPadding(4);
  }

  private hideStatusAfterDelay(
    textObj: Phaser.GameObjects.Text,
    delay: number
  ) {
    this.scene.time.delayedCall(delay, () => {
      if (textObj) textObj.destroy();
    });
  }

  // ===== SIMPLE API METHODS FOR UI =====

  // Purchase item from store
  purchaseItem(
    itemType: string,
    itemName: string,
    quantity: number = 1,
    itemId: string
  ) {
    this.sendMessage("buy_food", { itemType, itemName, quantity, itemId });
  }

  // Feed pet
  feedPet(petId: string, foodType: string) {
    this.sendMessage("feed_pet", { petId, foodType });
  }

  // Play with pet
  playWithPet(petId: string) {
    this.sendMessage("play_with_pet", { petId });
  }

  // Clean pet
  cleanPet(petId: string) {
    this.sendMessage("clean_pet", { petId });
  }

  // Get store catalog
  getStoreCatalog() {
    this.sendMessage("get_store_catalog", {});
  }

  // Get player inventory
  getInventory() {
    this.sendMessage("get_inventory", {});
  }

  // Handle pet eating food
  eatedFood(data: { hunger_level: number; pet_id: string; owner_id: string }) {
    this.sendMessage("eated_food", data);
  }

  // Handle pet being cleaned
  cleanedPet(data: {
    cleanliness_level: number;
    pet_id: string;
    owner_id: string;
  }) {
    this.sendMessage("cleaned_pet", data);
  }

  // Handle pet playing
  playedPet(data: {
    happiness_level: number;
    pet_id: string;
    owner_id: string;
  }) {
    this.sendMessage("played_pet", data);
  }

  // ===== SYNC METHODS =====

  // Force sync all state from server
  public forceSyncState() {
    console.log("🔄 Force syncing all state from server...");
    this.requestPlayerState();

    // Add delays between requests to avoid overwhelming the connection
    setTimeout(() => {
      this.sendMessage("get_store_catalog", {});
    }, 1000);

    setTimeout(() => {
      this.sendMessage("get_inventory", {});
    }, 1500);

    console.log("📤 Sync requests sent");
  }
}

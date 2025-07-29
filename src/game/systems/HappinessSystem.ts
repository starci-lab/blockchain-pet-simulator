import { Pet } from "../entities/Pet";
import { GAME_MECHANICS } from "../constants/gameConstants";
import { gameConfigManager } from "@/game/configs/gameConfig";
import { useUserStore } from "@/store/userStore";
import type { ColyseusClient } from "@/game/colyseus/client";

// Happiness states
export const HappinessState = {
  Ecstatic: "ecstatic",
  Happy: "happy",
  Normal: "normal",
  Sad: "sad",
  Depressed: "depressed",
} as const;
export type HappinessState =
  (typeof HappinessState)[keyof typeof HappinessState];

export function getHappinessState(happinessLevel: number): HappinessState {
  if (happinessLevel >= 95) return HappinessState.Ecstatic;
  if (happinessLevel >= 80) return HappinessState.Happy;
  if (happinessLevel >= 60) return HappinessState.Normal;
  if (happinessLevel >= 30) return HappinessState.Sad;
  return HappinessState.Depressed;
}

export class HappinessSystem {
  // Public properties - chỉ quản lý toy inventory, balls được quản lý bởi PetManager
  public toyInventory: number = 0; // Số lượng ball có trong inventory
  public happinessLevel: number = 100; // Happiness level similar to hungerLevel in FeedingSystem

  // Private properties
  private lastHappinessUpdate: number = 0;
  private scene: Phaser.Scene;
  private pet: Pet;
  private colyseusClient: ColyseusClient;
  private petId: string;

  constructor(
    scene: Phaser.Scene,
    pet: Pet,
    colyseusClient: ColyseusClient,
    petId: string
  ) {
    this.scene = scene;
    this.pet = pet;
    this.colyseusClient = colyseusClient;
    this.petId = petId;
  }

  // ===== UPDATE LOOP =====

  update() {
    this.updateHappiness();
  }

  private updateHappiness() {
    const now = Date.now();
    if (
      now - this.lastHappinessUpdate <
      GAME_MECHANICS.HAPPINESS_UPDATE_INTERVAL
    ) {
      return;
    }
    this.lastHappinessUpdate = now;

    // Giảm happiness level theo thời gian với multiplier riêng cho mỗi pet
    this.happinessLevel -=
      GAME_MECHANICS.HAPPINESS_DECREASE_RATE *
      this.pet.happinessDecreaseMultiplier;
    this.happinessLevel = Math.max(0, this.happinessLevel);
  }

  // ===== INVENTORY MANAGEMENT =====

  buyToy(toyId: string = "ball"): boolean {
    const toy = gameConfigManager.getToyItem(toyId);
    if (!toy) {
      console.log(`❌ Toy with ID ${toyId} not found in config`);
      return false;
    }

    console.log(`🛒 Buying toy: ${toy.name}`);
    const toyPrice = toy.price;

    if (this.colyseusClient && this.colyseusClient.isConnected()) {
      console.log(
        "🌐 Checking tokens before sending purchase request to server"
      );

      // Check if player has enough tokens before sending to server
      const currentTokens = useUserStore.getState().nomToken;
      if (currentTokens < toyPrice) {
        console.log(
          `❌ Not enough tokens: need ${toyPrice}, have ${currentTokens}`
        );
        return false;
      }

      console.log("💰 Tokens sufficient, sending purchase request to server");
      this.colyseusClient.purchaseItem("toys", toyId, 1);

      return true; // Server will handle validation and update inventory
    } else {
      console.log("🔌 Offline mode - using local validation");

      const userStore = useUserStore.getState();
      if (userStore.nomToken >= toyPrice) {
        userStore.setNomToken(userStore.nomToken - toyPrice);
        this.toyInventory++;

        console.log(
          `✅ Purchase successful: ${toy.name} for ${toyPrice} tokens. Inventory: ${this.toyInventory}`
        );
        return true;
      }

      console.log(
        `❌ Not enough tokens to buy ${toy.name}. Need: ${toyPrice}, Have: ${userStore.nomToken}`
      );
      return false;
    }
  }

  // ===== PLAY MECHANICS =====

  /**
   * Triggers the play behavior for the pet.
   * This function updates the pet's happiness, changes its activity to 'idleplay',
   * and sends a message to the server if connected.
   * @param happinessIncrease The amount to increase the happiness level by.
   */
  triggerPlay(happinessIncrease: number = 25): void {
    const oldHappiness = this.happinessLevel;
    this.happinessLevel = Math.min(
      100,
      this.happinessLevel + happinessIncrease
    );
    console.log(
      `📈 Pet ${this.petId} happiness: ${oldHappiness.toFixed(
        1
      )} → ${this.happinessLevel.toFixed(1)}`
    );

    // Send played pet event to server if connected
    if (this.colyseusClient && this.colyseusClient.isConnected()) {
      const userStore = useUserStore.getState();
      this.colyseusClient.playedPet({
        happiness_level: this.happinessLevel,
        pet_id: this.petId,
        owner_id: userStore.addressWallet || "unknown",
      });
      console.log(`📤 Sent 'played_pet' to server for pet ${this.petId}`);
    }

    // The PetManager is responsible for stopping the chase.
    // This system is only responsible for updating state and animation.
    this.pet.setActivity("idleplay");
  }

  // ===== CLEANUP =====

  destroy() {
    // No ball objects to clean up anymore, handled by PetManager
  }
}

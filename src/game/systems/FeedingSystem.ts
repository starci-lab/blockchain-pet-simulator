import type { ColyseusClient } from "@/game/colyseus/client";
import { Pet } from "../entities/Pet";
import { useUserStore } from "@/store/userStore";
import { gameConfigManager } from "@/game/configs/gameConfig";
import { GAME_MECHANICS } from "../constants/gameConstants";

// Hunger states
export const HungerState = {
  Full: "full",
  Normal: "normal",
  Hungry: "hungry",
  Starving: "starving"
} as const;
export type HungerState = (typeof HungerState)[keyof typeof HungerState];

export function getHungerState(hungerLevel: number): HungerState {
  if (hungerLevel >= 95) return HungerState.Full;
  if (hungerLevel >= 80) return HungerState.Normal;
  if (hungerLevel >= 30) return HungerState.Hungry;
  return HungerState.Starving;
}

export class FeedingSystem {
  // Public properties
  public foodInventory: number = 0;
  public hungerLevel: number = 100;

  // Private properties
  private lastHungerUpdate: number = 0;
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
    this.updateHunger();
  }

  private updateHunger() {
    const now = this.scene.time.now;
    if (!this.lastHungerUpdate) this.lastHungerUpdate = now;

    const elapsed = (now - this.lastHungerUpdate) / 1000;
    const decreaseRate = GAME_MECHANICS.HUNGER_DECREASE_PER_HOUR / 3600;

    if (elapsed > 0) {
      this.hungerLevel = Math.max(0, this.hungerLevel - decreaseRate * elapsed);
      this.lastHungerUpdate = now;
    }
  }

  // ===== FOOD PURCHASE =====
  buyFood(foodId: string): boolean {
    const food = gameConfigManager.getFoodItem(foodId);
    if (!food) {
      return false;
    }

    const foodPrice = food.price;

    if (this.colyseusClient && this.colyseusClient.isConnected()) {
      console.log(
        "🌐 Checking tokens before sending purchase request to server"
      );

      // Check if player has enough tokens before sending to server
      const currentTokens = useUserStore.getState().nomToken;
      if (currentTokens < foodPrice) {
        console.log(
          `❌ Not enough tokens: need ${foodPrice}, have ${currentTokens}`
        );
        return false;
      }

      // Get food item to retrieve both id and name
      const foodItem = gameConfigManager.getFoodItem(foodId);
      const itemName = foodItem?.name || foodId; // Fallback to foodId if name not found

      this.colyseusClient.purchaseItem("food", itemName, 1, foodId);

      return true; // Server will handle validation and update inventory
    } else {
      console.log("🔌 Offline mode - using local validation");

      const spendToken = useUserStore.getState().spendToken;
      if (spendToken(foodPrice)) {
        this.foodInventory += 1;
        console.log(
          `✅ Purchase successful: ${foodId} for ${foodPrice} tokens`
        );
        return true;
      } else {
        console.log(`❌ Not enough tokens: need ${foodPrice}`);
        return false;
      }
    }
  }

  // ===== FOOD EATING =====

  /**
   * Triggers the eating process for the pet.
   * This function updates the pet's hunger, changes its activity,
   * and sends a message to the server if connected.
   * @param foodType The type of food being eaten, to determine hunger recovery.
   */
  public triggerEat(foodType: string = "hamburger"): void {
    const foodItem = gameConfigManager.getFoodItem(foodType);
    const recovery =
      foodItem?.hungerRestore ?? GAME_MECHANICS.HUNGER_RESTORE_AMOUNT;

    const oldHunger = this.hungerLevel;
    this.hungerLevel = Math.min(100, this.hungerLevel + recovery);

    console.log(
      `📈 Pet ${this.petId} hunger: ${oldHunger.toFixed(
        1
      )} → ${this.hungerLevel.toFixed(1)}`
    );

    // Send eaten food event to server if connected
    if (this.colyseusClient && this.colyseusClient.isConnected()) {
      const userStore = useUserStore.getState();
      this.colyseusClient.eatedFood({
        hunger_level: this.hungerLevel,
        pet_id: this.petId,
        owner_id: userStore.addressWallet || "unknown"
      });
      console.log(`📤 Sent 'eated_food' to server for pet ${this.petId}`);
    }

    // The PetManager is responsible for stopping the chase.
    // This system is only responsible for updating state and animation.
    this.pet.setActivity("chew");
  }

  // ===== CLEANUP =====

  destroy(): void {
    this.cleanup();
    console.log("🧹 FeedingSystem destroyed");
  }

  cleanup() {
    // No more dropped food to clean up in this system
  }
}

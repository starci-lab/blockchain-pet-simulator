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

  constructor(scene: Phaser.Scene, pet: Pet, colyseusClient: ColyseusClient) {
    this.scene = scene;
    this.pet = pet;
    this.colyseusClient = colyseusClient;
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

  buyBall(): boolean {
    console.log(`🛒 Buying ball`);
    const ballPrice = gameConfigManager.getToyItems().ball.price;

    if (this.colyseusClient && this.colyseusClient.isConnected()) {
      console.log(
        "🌐 Checking tokens before sending purchase request to server"
      );

      // Check if player has enough tokens before sending to server
      const currentTokens = useUserStore.getState().nomToken;
      if (currentTokens < ballPrice) {
        console.log(
          `❌ Not enough tokens: need ${ballPrice}, have ${currentTokens}`
        );
        return false;
      }

      console.log("💰 Tokens sufficient, sending purchase request to server");
      this.colyseusClient.purchaseItem("toys", "ball", 1);

      return true; // Server will handle validation and update inventory
    } else {
      console.log("🔌 Offline mode - using local validation");

      const userStore = useUserStore.getState();
      if (userStore.nomToken >= ballPrice) {
        userStore.setNomToken(userStore.nomToken - ballPrice);
        this.toyInventory++;

        console.log(
          `✅ Purchase successful: ball for ${ballPrice} tokens. Inventory: ${this.toyInventory}`
        );
        return true;
      }

      console.log(
        `❌ Not enough tokens to buy ball. Need: ${ballPrice}, Have: ${userStore.nomToken}`
      );
      return false;
    }
  }

  // ===== CLEANUP =====

  destroy() {
    // No ball objects to clean up anymore, handled by PetManager
  }
}

import { Pet } from "../entities/Pet";
import { GAME_MECHANICS } from "../constants/gameConstants";
import { gameConfigManager } from "@/game/configs/gameConfig";
import { useUserStore } from "@/store/userStore";

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

  // Private properties
  private lastHappinessUpdate: number = 0;
  private scene: Phaser.Scene;
  private pet: Pet;

  constructor(scene: Phaser.Scene, pet: Pet) {
    this.scene = scene;
    this.pet = pet;
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
    this.pet.happinessLevel -=
      GAME_MECHANICS.HAPPINESS_DECREASE_RATE *
      this.pet.happinessDecreaseMultiplier;
    this.pet.happinessLevel = Math.max(0, this.pet.happinessLevel);
  }

  // ===== INVENTORY MANAGEMENT =====

  buyBall(): boolean {
    const ballPrice = gameConfigManager.getToyItems().ball.price;
    const userStore = useUserStore.getState();

    if (userStore.nomToken >= ballPrice) {
      userStore.setNomToken(userStore.nomToken - ballPrice);
      this.toyInventory++;
      return true;
    }
    return false;
  }

  // ===== PUBLIC UTILITIES =====

  getHappinessLevel(): number {
    return this.pet.happinessLevel;
  }

  getHappinessState(): HappinessState {
    return getHappinessState(this.pet.happinessLevel);
  }

  // ===== CLEANUP =====

  destroy() {
    // No ball objects to clean up anymore, handled by PetManager
  }
}

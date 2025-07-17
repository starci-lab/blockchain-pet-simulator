import type { ColyseusClient } from "@/game/colyseus/client";
import { Pet } from "../entities/Pet";
import { GAME_MECHANICS } from "../constants/gameConstants";

// Cleanliness states
export const CleanlinessState = {
  Clean: "clean",
  Normal: "normal",
  Dirty: "dirty",
  Filthy: "filthy",
} as const;
export type CleanlinessState =
  (typeof CleanlinessState)[keyof typeof CleanlinessState];

export function getCleanlinessState(
  cleanlinessLevel: number
): CleanlinessState {
  if (cleanlinessLevel >= 95) return CleanlinessState.Clean;
  if (cleanlinessLevel >= 80) return CleanlinessState.Normal;
  if (cleanlinessLevel >= 30) return CleanlinessState.Dirty;
  return CleanlinessState.Filthy;
}

export class CleanlinessSystem {
  // Public properties
  public cleanlinessLevel: number = 100;
  public poopObjects: Phaser.GameObjects.Sprite[] = [];
  public poopShadows: Phaser.GameObjects.Ellipse[] = [];
  public poopTimers: Phaser.Time.TimerEvent[] = [];

  // Private properties
  private lastCleanlinessUpdate: number = 0;
  private lastPoopCheck: number = 0;
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
    this.updateCleanliness();
    this.checkPoopOpportunity();
  }

  private updateCleanliness() {
    const now = this.scene.time.now;
    if (!this.lastCleanlinessUpdate) this.lastCleanlinessUpdate = now;

    const elapsed = (now - this.lastCleanlinessUpdate) / 1000;
    const decreaseRate = GAME_MECHANICS.CLEANLINESS_DECREASE_PER_HOUR / 3600;

    if (elapsed > 0) {
      this.cleanlinessLevel = Math.max(
        0,
        this.cleanlinessLevel - decreaseRate * elapsed
      );
      this.lastCleanlinessUpdate = now;
    }
  }

  private checkPoopOpportunity() {
    const cleanlinessState = getCleanlinessState(this.cleanlinessLevel);
    const shouldPoop =
      !this.pet.isChasing &&
      this.pet.currentActivity !== "chew" &&
      (cleanlinessState === CleanlinessState.Dirty ||
        cleanlinessState === CleanlinessState.Filthy) &&
      this.cleanlinessLevel < GAME_MECHANICS.POOP_THRESHOLD;

    if (shouldPoop) {
      const now = this.scene.time.now;
      if (
        !this.lastPoopCheck ||
        now - this.lastPoopCheck > GAME_MECHANICS.POOP_CHECK_INTERVAL
      ) {
        this.dropPoop();
        this.lastPoopCheck = now;
      }
    }
  }

  // ===== POOP MANAGEMENT =====

  private dropPoop() {
    const petX = this.pet.sprite.x;
    const petY = this.pet.sprite.y;

    // Create poop sprite
    const poop = this.scene.add.sprite(petX, petY - 5, "poop");
    poop.setScale(0.1); // Smaller scale for poop
    poop.setAlpha(0.9);

    // Create shadow
    const shadow = this.scene.add.ellipse(
      petX,
      petY + 5,
      20,
      10,
      0x000000,
      0.3
    );

    // Add animation effect
    this.scene.tweens.add({
      targets: poop,
      scaleX: 0.2,
      scaleY: 0.3,
      duration: 200,
      yoyo: true,
    });

    this.poopObjects.push(poop);
    this.poopShadows.push(shadow);

    // Auto-despawn timer
    const despawnTimer = this.scene.time.delayedCall(
      GAME_MECHANICS.POOP_DESPAWN_TIME,
      () => {
        const poopIndex = this.poopObjects.indexOf(poop);
        if (poopIndex !== -1) {
          this.removePoopAtIndex(poopIndex);
        }
      }
    );
    this.poopTimers.push(despawnTimer);

    // Reduce cleanliness level when pooping
    this.cleanlinessLevel = Math.max(0, this.cleanlinessLevel - 5);
  }

  private removePoopAtIndex(index: number) {
    if (index < 0 || index >= this.poopObjects.length) return;

    const poop = this.poopObjects[index];
    const shadow = this.poopShadows[index];
    const timer = this.poopTimers[index];

    // Cancel timer
    if (timer && !timer.hasDispatched) {
      timer.destroy();
    }

    // Animate removal
    this.scene.tweens.add({
      targets: poop,
      scaleX: 0,
      scaleY: 0,
      alpha: 0,
      duration: 300,
      ease: "Power2.easeIn",
      onComplete: () => poop.destroy(),
    });

    this.scene.tweens.add({
      targets: shadow,
      alpha: 0,
      duration: 300,
      onComplete: () => shadow.destroy(),
    });

    // Remove from arrays
    this.poopObjects.splice(index, 1);
    this.poopShadows.splice(index, 1);
    this.poopTimers.splice(index, 1);
  }

  // ===== PUBLIC METHODS =====

  cleanPoop(x: number, y: number): boolean {
    const poopIndex = this.poopObjects.findIndex(
      (poop) => Phaser.Math.Distance.Between(poop.x, poop.y, x, y) < 40
    );

    if (poopIndex !== -1) {
      this.removePoopAtIndex(poopIndex);

      // Increase cleanliness when cleaning poop
      this.cleanlinessLevel = Math.min(100, this.cleanlinessLevel + 10);

      return true;
    }
    return false;
  }

  // ===== CLEANUP =====

  destroy(): void {
    this.cleanup();
  }

  cleanup() {
    while (this.poopObjects.length > 0) {
      this.removePoopAtIndex(0);
    }
  }

  // ===== GETTERS =====

  getCleanlinessLevel(): number {
    return this.cleanlinessLevel;
  }

  getCleanlinessState(): CleanlinessState {
    return getCleanlinessState(this.cleanlinessLevel);
  }
}

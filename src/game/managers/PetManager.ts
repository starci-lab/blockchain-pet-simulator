import { Pet } from "@/game/entities/Pet";
import { FeedingSystem } from "@/game/systems/FeedingSystem";
import { CleanlinessSystem } from "@/game/systems/CleanlinessSystem";
import { MovementSystem } from "@/game/systems/MovementSystem";
import { ActivitySystem } from "@/game/systems/ActivitySystem";
import { ColyseusClient } from "@/game/colyseus/client";
import {
  GamePositioning,
  GAME_MECHANICS,
} from "@/game/constants/gameConstants";

export interface PetData {
  id: string;
  pet: Pet;
  feedingSystem: FeedingSystem;
  cleanlinessSystem: CleanlinessSystem;
  movementSystem: MovementSystem;
  activitySystem: ActivitySystem;
}

export class PetManager {
  private pets: Map<string, PetData> = new Map();
  private scene: Phaser.Scene;
  private colyseusClient: ColyseusClient;
  private activePetId: string | null = null;

  // Shared food pool for all pets
  private sharedDroppedFood: Phaser.GameObjects.Sprite[] = [];
  private sharedFoodShadows: Phaser.GameObjects.Ellipse[] = [];
  private sharedFoodTimers: Phaser.Time.TimerEvent[] = [];

  // Track which pet is chasing which food to prevent conflicts
  private foodTargets: Map<Phaser.GameObjects.Sprite, string> = new Map(); // food -> petId

  // Safety timer to prevent pets getting stuck
  private safetyTimer?: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene, colyseusClient: ColyseusClient) {
    this.scene = scene;
    this.colyseusClient = colyseusClient;

    // Start safety check timer every 5 seconds
    this.startSafetyCheck();
  }

  /**
   * Tạo pet entity local (chỉ render, không gửi event mua pet)
   */
  createPet(petId: string, x: number, y: number): PetData {
    console.log(`🐕 Creating pet entity: ${petId}`);
    const pet = new Pet(this.scene);
    pet.createAnimations();
    pet.create(x, y);
    const movementSystem = new MovementSystem(pet, this.scene);
    const activitySystem = new ActivitySystem(pet);
    const feedingSystem = new FeedingSystem(
      this.scene,
      pet,
      this.colyseusClient
    );
    const cleanlinessSystem = new CleanlinessSystem(this.scene, pet);

    const petData: PetData = {
      id: petId,
      pet,
      feedingSystem,
      cleanlinessSystem,
      movementSystem,
      activitySystem,
    };
    pet.onStopChasing = () => {
      this.releaseFoodTarget(petId);
    };
    this.pets.set(petId, petData);
    if (!this.activePetId) {
      this.activePetId = petId;
    }
    console.log(`✅ Pet entity ${petId} created (local only)`);
    return petData;
  }

  /**
   * Gửi event mua pet lên server (buy_pet logic chuẩn backend)
   */
  /**
   * Gửi event mua pet lên server (chuẩn backend: create_pet với isBuyPet)
   * (Truyền x/y random để server có thể lưu vị trí spawn ban đầu nếu muốn)
   */
  buyPet(petType: string = "chog") {
    if (this.colyseusClient?.isConnected()) {
      // Random vị trí spawn cho pet mới
      const minX = 100,
        maxX = 700;
      const minY = 200,
        maxY = 500;
      const x = Math.floor(Math.random() * (maxX - minX + 1)) + minX;
      const y = Math.floor(Math.random() * (maxY - minY + 1)) + minY;
      this.colyseusClient.sendMessage("create_pet", {
        petType,
        isBuyPet: true,
        x,
        y,
      });
    }
  }

  // Xóa pet
  removePet(petId: string): boolean {
    const petData = this.pets.get(petId);
    if (!petData) return false;

    // Notify server about pet removal if connected
    if (this.colyseusClient?.isConnected()) {
      console.log(`📤 Sending remove-pet message to server for ${petId}`);
      this.colyseusClient.sendMessage("remove_pet", {
        petId: petId,
      });
    }

    // Cleanup pet and systems
    petData.pet.destroy();
    petData.feedingSystem.destroy();
    petData.cleanlinessSystem.destroy();

    this.pets.delete(petId);

    // Update active pet if needed
    if (this.activePetId === petId) {
      const remainingPets = Array.from(this.pets.keys());
      this.activePetId = remainingPets.length > 0 ? remainingPets[0] : null;
    }

    console.log(`🗑️ Pet ${petId} removed`);
    return true;
  }

  // Get pet data
  getPet(petId: string): PetData | undefined {
    return this.pets.get(petId);
  }

  // Get active pet
  getActivePet(): PetData | undefined {
    return this.activePetId ? this.pets.get(this.activePetId) : undefined;
  }

  // Set active pet
  setActivePet(petId: string): boolean {
    if (this.pets.has(petId)) {
      this.activePetId = petId;
      console.log(`🎯 Active pet changed to: ${petId}`);
      return true;
    }
    return false;
  }

  // Get all pets
  getAllPets(): PetData[] {
    return Array.from(this.pets.values());
  }

  // Get pet data by ID (for server sync)
  getPetData(petId: string): PetData | undefined {
    return this.pets.get(petId);
  }

  // Get all pets data
  getAllPetsData(): Map<string, PetData> {
    return this.pets;
  }

  // Sync pet with server data
  syncPetWithServer(petId: string, serverPet: any): void {
    const petData = this.getPetData(petId);
    if (petData) {
      // Update position if significantly different
      const threshold = 5; // pixels
      if (
        Math.abs(petData.pet.sprite.x - serverPet.x) > threshold ||
        Math.abs(petData.pet.sprite.y - serverPet.y) > threshold
      ) {
        petData.pet.sprite.setPosition(serverPet.x, serverPet.y);
      }

      // Update other properties
      petData.pet.speed = serverPet.speed;

      // Update hunger through feeding system
      if (petData.feedingSystem && typeof serverPet.hungerLevel === "number") {
        petData.feedingSystem.hungerLevel = serverPet.hungerLevel;
      }

      petData.pet.setActivity(serverPet.currentActivity);

      if (serverPet.isChasing) {
        petData.pet.startChasing(serverPet.targetX, serverPet.targetY);
      } else {
        petData.pet.stopChasing();
      }

      console.log(`🔄 Pet ${petId} synced with server data`);
    }
  }

  // Add food from server
  addSharedFoodFromServer(foodId: string, serverFood: any): void {
    console.log("🍎 Adding shared food from server:", foodId, serverFood);

    // Create food sprite (using sprite instead of image for consistency)
    const foodSprite = this.scene.add.sprite(
      serverFood.x,
      serverFood.y,
      "hamburger"
    );
    foodSprite.setScale(0.5);

    // Create shadow
    const shadow = this.scene.add.ellipse(
      serverFood.x,
      serverFood.y + 10,
      30,
      15,
      0x000000,
      0.3
    );

    // Create timer for food expiration (optional)
    const timer = this.scene.time.delayedCall(300000, () => {
      // 5 minutes
      this.removeSharedFoodByServerId(foodId);
    });

    // Add to shared food arrays with server ID metadata
    const foodWithId = foodSprite as any;
    foodWithId.serverId = foodId;
    foodWithId.droppedAt = serverFood.droppedAt || Date.now();

    this.sharedDroppedFood.push(foodSprite);
    this.sharedFoodShadows.push(shadow);
    this.sharedFoodTimers.push(timer);

    // Notify all pets about new food
    this.notifyPetsAboutFood();
  }

  // Remove food by server ID
  removeSharedFoodByServerId(serverId: string): void {
    const index = this.sharedDroppedFood.findIndex(
      (food: any) => food.serverId === serverId
    );

    if (index !== -1) {
      console.log("🗑️ Removing shared food by server ID:", serverId);

      // Get references
      const food = this.sharedDroppedFood[index];
      const shadow = this.sharedFoodShadows[index];
      const timer = this.sharedFoodTimers[index];

      // Handle pets that were targeting this food
      this.handleFoodRemovalForPets(food);

      // Clean up
      food.destroy();
      shadow.destroy();
      timer.destroy();

      // Remove from arrays
      this.sharedDroppedFood.splice(index, 1);
      this.sharedFoodShadows.splice(index, 1);
      this.sharedFoodTimers.splice(index, 1);
    }
  }

  // Handle food removal for pets that were targeting it
  private handleFoodRemovalForPets(
    removedFood: Phaser.GameObjects.Sprite
  ): void {
    for (const petData of this.pets.values()) {
      if (petData.pet.chaseTarget && petData.pet.chaseTarget === removedFood) {
        console.log(
          `🚶 Pet ${petData.id} target food removed, returning to walk`
        );
        petData.pet.stopChasing();
        petData.pet.isUserControlled = false;
        petData.pet.setActivity("walk");
      }
    }

    // Remove from food targets map
    this.foodTargets.delete(removedFood);
  }

  // Update all pets
  update(): void {
    for (const petData of this.pets.values()) {
      const previousActivity = petData.pet.currentActivity;
      const previousX = petData.pet.sprite.x;
      const previousY = petData.pet.sprite.y;

      // Update movement
      const movementResult = petData.movementSystem.update();

      // Check if pet reached shared food
      if (
        movementResult &&
        "reachedTarget" in movementResult &&
        movementResult.reachedTarget &&
        movementResult.targetX !== undefined &&
        movementResult.targetY !== undefined
      ) {
        // Try to eat from shared food pool instead of individual food
        this.checkSharedFoodEating(
          petData,
          movementResult.targetX,
          movementResult.targetY
        );
      }

      // Update activity and feeding
      petData.activitySystem.update();
      petData.feedingSystem.update();
      petData.cleanlinessSystem.update();

      // Sync with server if activity or position changed significantly
      const currentActivity = petData.pet.currentActivity;
      const currentX = petData.pet.sprite.x;
      const currentY = petData.pet.sprite.y;

      const positionChanged =
        Math.abs(currentX - previousX) > 5 ||
        Math.abs(currentY - previousY) > 5;
      const activityChanged = currentActivity !== previousActivity;

      // Removed server sync for simplified version
      if (activityChanged || positionChanged) {
        console.log(`🔄 Pet ${petData.id} activity/position changed locally`);
      }
    }
  }

  // Shared feeding operations
  buyFood(foodId: string = "hamburger"): boolean {
    // Use active pet's feeding system for purchase
    const activePet = this.getActivePet();
    if (activePet) {
      return activePet.feedingSystem.buyFood(foodId);
    }
    return false;
  }

  // Combined buy and drop food operation - more reliable than separate calls
  buyAndDropFood(x: number, y?: number, foodId: string = "hamburger"): boolean {
    const activePet = this.getActivePet();
    if (!activePet) {
      console.log("❌ No active pet for buyAndDropFood");
      return false;
    }

    // Check if we already have food in inventory
    if (activePet.feedingSystem.foodInventory > 0) {
      console.log("🍔 Using existing food from inventory");
      this.dropFood(x, y);
      return true;
    } // Try to buy food first
    const purchased = this.buyFood(foodId);
    if (purchased) {
      console.log("🛒 Food purchased successfully, now dropping");

      // For both online and offline mode, ensure we can drop the food
      // In online mode, we trust the server response and allow immediate drop
      if (this.colyseusClient?.isConnected()) {
        // Online mode: temporarily increase inventory to allow drop
        // Server will sync the correct state later
        activePet.feedingSystem.foodInventory += 1;
        this.dropFood(x, y);
      } else {
        // Offline mode: inventory is already updated by buyFood
        this.dropFood(x, y);
      }
      return true;
    }

    console.log("❌ Failed to buy food for dropping");
    return false;
  }

  dropFood(x: number, y?: number): void {
    const activePet = this.getActivePet();
    if (activePet && activePet.feedingSystem.foodInventory > 0) {
      // Deduct from active pet's inventory
      activePet.feedingSystem.foodInventory -= 1;

      // Drop food to shared pool instead of individual pet
      this.dropSharedFood(x, y);
    }
  }

  // Drop food to shared pool that all pets can eat
  private dropSharedFood(x: number, _y?: number): void {
    // Food always drops near the bottom of the screen (ground line)
    const cameraHeight = this.scene.cameras.main.height;
    const cameraWidth = this.scene.cameras.main.width;
    const foodFinalY = GamePositioning.getFoodFinalY(cameraHeight);

    // Clamp food position to stay within pet boundaries (not food boundaries)
    // This ensures pets can always reach the food
    const petBounds = GamePositioning.getPetBoundaries(cameraWidth);
    const clampedX = Phaser.Math.Clamp(x, petBounds.minX, petBounds.maxX);

    console.log(
      `🍔 Dropping food: requested x=${x}, clamped x=${clampedX}, pet bounds=[${petBounds.minX}, ${petBounds.maxX}], finalY=${foodFinalY}`
    );

    const food = this.scene.add.image(
      clampedX,
      GamePositioning.getFoodDropY(cameraHeight),
      "hamburger"
    );
    food.setScale(1.5);
    food.setAlpha(0.9);

    // Add drop animation effect
    this.scene.tweens.add({
      targets: food,
      y: GamePositioning.getFoodFinalY(cameraHeight),
      duration: 500,
      ease: "Bounce.easeOut",
      onComplete: () => {
        this.scene.tweens.add({
          targets: food,
          scaleX: 1.7,
          scaleY: 1.2,
          duration: 100,
          yoyo: true,
        });
      },
    });

    // Add shadow effect
    const shadow = this.scene.add.ellipse(
      clampedX,
      foodFinalY + 5,
      30,
      12,
      0x000000,
      0.3
    );
    this.scene.tweens.add({
      targets: shadow,
      scaleX: 1.3,
      alpha: 0.5,
      duration: 500,
      ease: "Power2.easeOut",
    });

    this.sharedDroppedFood.push(food as any);
    this.sharedFoodShadows.push(shadow);

    // Create timer to auto-despawn food after 20s
    const despawnTimer = this.scene.time.delayedCall(20000, () => {
      const currentFoodIndex = this.sharedDroppedFood.indexOf(food as any);
      if (currentFoodIndex !== -1) {
        this.removeSharedFoodAtIndex(currentFoodIndex);
        console.log("Shared food auto-despawned after 20 seconds");
      }
    });
    this.sharedFoodTimers.push(despawnTimer);

    // Notify all pets about new food
    this.notifyPetsAboutFood();

    console.log(`Dropped shared food at (${clampedX}, ${foodFinalY})`);
  }

  // Remove shared food at specific index
  private removeSharedFoodAtIndex(index: number): void {
    if (index < 0 || index >= this.sharedDroppedFood.length) return;

    const food = this.sharedDroppedFood[index];
    const shadow = this.sharedFoodShadows[index];
    const timer = this.sharedFoodTimers[index];

    // Check if any pet was chasing this specific food
    const chasingPetId = this.foodTargets.get(food);
    let wasBeingChased = false;
    let chasingPetData: PetData | undefined;

    if (chasingPetId) {
      chasingPetData = this.pets.get(chasingPetId);
      if (
        chasingPetData &&
        chasingPetData.pet.isChasing &&
        chasingPetData.pet.chaseTarget
      ) {
        const distance = Phaser.Math.Distance.Between(
          chasingPetData.pet.chaseTarget.x,
          chasingPetData.pet.chaseTarget.y,
          food.x,
          food.y
        );
        wasBeingChased = distance < 10;
      }
    }

    // Remove from food targets tracking
    this.foodTargets.delete(food);

    // Cancel timer if it exists
    if (timer && !timer.hasDispatched) {
      timer.destroy();
    }

    // Animate food and shadow removal
    this.scene.tweens.add({
      targets: food,
      scaleX: 0,
      scaleY: 0,
      alpha: 0,
      duration: 300,
      ease: "Power2.easeIn",
      onComplete: () => {
        food.destroy();
      },
    });

    this.scene.tweens.add({
      targets: shadow,
      alpha: 0,
      duration: 300,
      onComplete: () => {
        shadow.destroy();
      },
    });

    // Remove from arrays
    this.sharedDroppedFood.splice(index, 1);
    this.sharedFoodShadows.splice(index, 1);
    this.sharedFoodTimers.splice(index, 1);

    // Handle pet that was chasing this food (similar to FeedingSystem logic)
    if (wasBeingChased && chasingPetData) {
      console.log(
        `🍔 Pet ${chasingPetData.id} was chasing food that disappeared, handling gracefully`
      );

      // Stop chasing immediately
      chasingPetData.pet.stopChasing();

      // Quick transition to avoid stuttering (like FeedingSystem does)
      this.scene.time.delayedCall(30, () => {
        if (
          chasingPetData.feedingSystem.hungerLevel < 100 &&
          this.sharedDroppedFood.length > 0
        ) {
          console.log(
            `🔄 Pet ${chasingPetData.id} looking for another food after target disappeared`
          );
          this.checkPetShouldChaseSharedFood(chasingPetData);
        } else {
          console.log(
            `🚶 Pet ${chasingPetData.id} returning to walk mode after target disappeared`
          );
          chasingPetData.pet.isUserControlled = false;
          chasingPetData.pet.setActivity("walk");
        }
      });
    }

    console.log("Shared food removed at index:", index);
  }

  // Notify all pets about new food available
  private notifyPetsAboutFood(): void {
    for (const petData of this.pets.values()) {
      // Check if pet should start chasing the new food
      this.checkPetShouldChaseSharedFood(petData);
    }
  }

  // Check if a specific pet should chase shared food
  private checkPetShouldChaseSharedFood(petData: PetData): void {
    if (this.sharedDroppedFood.length === 0) return;
    if (petData.pet.isChasing || petData.pet.currentActivity === "chew") return;

    // Check hunger level using the same logic as FeedingSystem
    const hungerLevel = petData.feedingSystem.hungerLevel;
    const isHungry = hungerLevel < GAME_MECHANICS.HUNGER_THRESHOLD; // Hungry or Starving

    console.log(
      `🔍 Checking chase for Pet ${petData.id}: hunger=${hungerLevel}%, hungry=${isHungry}`
    );

    if (isHungry) {
      // Find food that is not being chased by another pet
      const availableFood = this.sharedDroppedFood.filter(
        (food) => !this.foodTargets.has(food)
      );

      console.log(
        `🍔 Available food count: ${availableFood.length}/${this.sharedDroppedFood.length}`
      );

      if (availableFood.length > 0) {
        // Find closest available food instead of random (more natural behavior)
        let closestFood: Phaser.GameObjects.Sprite | null = null;
        let closestDistance = Infinity;

        for (const food of availableFood) {
          const distance = Phaser.Math.Distance.Between(
            petData.pet.sprite.x,
            petData.pet.sprite.y,
            food.x,
            food.y
          );
          if (distance < closestDistance) {
            closestDistance = distance;
            closestFood = food;
          }
        }

        if (closestFood) {
          // Mark this food as being chased by this pet
          this.foodTargets.set(closestFood, petData.id);

          petData.pet.startChasing(closestFood.x, closestFood.y);

          // Removed server sync for simplified version
          console.log(`🏃 Pet ${petData.id} started chasing food locally`);

          console.log(
            `🏃 Pet ${petData.id} started chasing closest shared food at (${
              closestFood.x
            }, ${closestFood.y}), distance: ${closestDistance.toFixed(1)}`
          );
        }
      } else {
        console.log(
          `⚠️ Pet ${petData.id} wants to chase food but all food is being chased`
        );
      }
    }
  }

  // Check if pet can eat shared food
  checkSharedFoodEating(petData: PetData, x: number, y: number): boolean {
    // Find and remove food from shared pool
    const foodIndex = this.sharedDroppedFood.findIndex(
      (food) => Phaser.Math.Distance.Between(food.x, food.y, x, y) < 40
    );

    if (foodIndex !== -1) {
      console.log(`🍔 Pet ${petData.id} is eating food at index ${foodIndex}`);

      // Release food target for this pet
      this.releaseFoodTarget(petData.id);

      // Remove food from shared pool
      this.removeSharedFoodAtIndex(foodIndex);

      // Increase pet's hunger
      const oldHunger = petData.feedingSystem.hungerLevel;
      petData.feedingSystem.hungerLevel = Math.min(
        100,
        petData.feedingSystem.hungerLevel + 20
      );

      console.log(
        `📈 Pet ${petData.id} hunger: ${oldHunger} → ${petData.feedingSystem.hungerLevel}`
      );

      // Stop chasing and switch to chew animation
      petData.pet.stopChasing();
      petData.pet.setActivity("chew");

      // Handle post-eating behavior
      this.handlePetPostEating(petData);

      return true;
    }

    return false;
  }

  // Handle pet behavior after eating
  private handlePetPostEating(petData: PetData): void {
    console.log(
      `🍽️ Pet ${petData.id} started eating, will check for next action in 2 seconds`
    );

    // Force ensure pet is in correct state
    petData.pet.isUserControlled = true; // Temporarily user controlled while eating

    // Use fixed timer instead of animation event for reliability
    this.scene.time.delayedCall(2000, () => {
      // Force check and reset pet state regardless of current activity
      if (
        petData.pet.currentActivity === "chew" ||
        petData.pet.isUserControlled
      ) {
        // Check if pet should continue chasing more food or return to auto walk
        if (
          petData.feedingSystem.hungerLevel < 100 &&
          this.sharedDroppedFood.length > 0
        ) {
          // Reset state before checking for more food
          petData.pet.isUserControlled = false;
          petData.pet.isChasing = false;
          petData.pet.chaseTarget = null;

          // Use forceStartChasing for more reliable food targeting
          this.forceStartChasing(petData);
        } else {
          // Force return to auto walk mode
          this.forceReturnToWalk(petData);
        }
      } else {
        this.forceReturnToWalk(petData);
      }
    });
  }

  // Force pet to return to walk mode (safety method)
  private forceReturnToWalk(petData: PetData): void {
    // Release any food target this pet was chasing
    this.releaseFoodTarget(petData.id);

    // Reset all states completely
    petData.pet.isUserControlled = false;
    petData.pet.isChasing = false;
    petData.pet.chaseTarget = null;

    // Reset lastEdgeHit to allow proper boundary detection
    petData.pet.lastEdgeHit = "";

    // Force activity to walk and ensure pet starts moving automatically
    petData.pet.setActivity("walk");

    // Double-check: if pet is still not moving automatically after a brief delay
    this.scene.time.delayedCall(500, () => {
      if (
        petData.pet.isUserControlled ||
        petData.pet.currentActivity !== "walk"
      ) {
        petData.pet.isUserControlled = false;
        petData.pet.isChasing = false;
        petData.pet.chaseTarget = null;
        petData.pet.lastEdgeHit = ""; // Reset edge detection again
        petData.pet.setActivity("walk");
      }
    });

    console.log(`✅ Pet ${petData.id} forced back to walk mode`);
  }

  // Get shared food inventory (from active pet)
  getFoodInventory(): number {
    const activePet = this.getActivePet();
    return activePet?.feedingSystem.foodInventory || 0;
  }

  // Cleaning management methods
  buyBroom(broomId: string = "broom"): boolean {
    const activePet = this.getActivePet();
    if (activePet) {
      return activePet.cleanlinessSystem.buyBroom(broomId);
    }
    return false;
  }

  useBroom(): boolean {
    const activePet = this.getActivePet();
    if (activePet) {
      return activePet.cleanlinessSystem.useBroom();
    }
    return false;
  }

  getCleaningInventory(): number {
    const activePet = this.getActivePet();
    return activePet?.cleanlinessSystem.cleaningInventory || 0;
  }

  // Get stats for UI
  getPetStats() {
    const stats = this.getAllPets().map((petData) => ({
      id: petData.id,
      isActive: petData.id === this.activePetId,
      hungerLevel: petData.feedingSystem.hungerLevel,
      currentActivity: petData.pet.currentActivity,
      foodInventory: petData.feedingSystem.foodInventory,
    }));

    return {
      activePetId: this.activePetId,
      totalPets: this.pets.size,
      pets: stats,
      totalFoodInventory: this.getFoodInventory(),
    };
  }
  // Cleanup all pets
  cleanup(): void {
    // Stop safety timer
    if (this.safetyTimer) {
      this.safetyTimer.destroy();
      this.safetyTimer = undefined;
    }

    for (const petData of this.pets.values()) {
      petData.pet.destroy();
      petData.feedingSystem.destroy();
      petData.cleanlinessSystem.destroy();
    }
    this.pets.clear();
    this.activePetId = null;

    // Cleanup shared food
    while (this.sharedDroppedFood.length > 0) {
      this.removeSharedFoodAtIndex(0);
    }

    // Clear food targets
    this.foodTargets.clear();
  }

  // Release food target when pet stops chasing
  private releaseFoodTarget(petId: string): void {
    for (const [food, chasingPetId] of this.foodTargets.entries()) {
      if (chasingPetId === petId) {
        this.foodTargets.delete(food);
        console.log(`Pet ${petId} released food target`);
        break;
      }
    }
  }

  // Start safety check timer
  private startSafetyCheck(): void {
    this.safetyTimer = this.scene.time.addEvent({
      delay: 5000, // 5 seconds
      callback: () => {
        this.performSafetyCheck();
      },
      loop: true,
    });
  }

  // Perform safety check on all pets
  private performSafetyCheck(): void {
    console.log("🔍 Performing safety check on all pets...");

    for (const petData of this.pets.values()) {
      // Check if pet has been chewing for too long
      if (petData.pet.currentActivity === "chew" && !petData.pet.isChasing) {
        console.log(
          `⚠️ SAFETY: Pet ${petData.id} stuck in chew mode, forcing to walk`
        );
        this.forceReturnToWalk(petData);
      }

      // Check if pet is user controlled but not chasing anything
      if (
        petData.pet.isUserControlled &&
        !petData.pet.isChasing &&
        !petData.pet.chaseTarget
      ) {
        console.log(
          `⚠️ SAFETY: Pet ${petData.id} user controlled but not chasing, releasing control`
        );
        petData.pet.isUserControlled = false;
        petData.pet.setActivity("walk");
      }

      // Check if pet has invalid chase target
      if (petData.pet.isChasing && !petData.pet.chaseTarget) {
        petData.pet.isChasing = false;
        petData.pet.isUserControlled = false;
        petData.pet.setActivity("walk");
      }
    }
  }

  // Force reset all pets to walking state (emergency method)
  forceResetAllPets(): void {
    for (const petData of this.pets.values()) {
      this.forceReturnToWalk(petData);
    }

    // Clear all food targets
    this.foodTargets.clear();
  }

  // Debug method to check all pets status
  debugPetsStatus(): void {
    console.log("=== PETS STATUS DEBUG ===");
    const cameraWidth = this.scene.cameras.main.width;
    const cameraHeight = this.scene.cameras.main.height;
    const petBounds = GamePositioning.getPetBoundaries(cameraWidth);
    const correctGroundY = GamePositioning.getPetY(cameraHeight);

    console.log(`Camera: ${cameraWidth}x${cameraHeight}`);
    console.log(`Pet Boundaries: [${petBounds.minX}, ${petBounds.maxX}]`);
    console.log(`Correct Ground Y: ${correctGroundY}`);

    for (const petData of this.pets.values()) {
      console.log(`Pet ${petData.id}:`);
      console.log(
        `  Position: (${petData.pet.sprite.x.toFixed(
          1
        )}, ${petData.pet.sprite.y.toFixed(1)})`
      );
      console.log(`  Stored Ground Y: ${petData.pet.groundY}`);
      console.log(`  Activity: ${petData.pet.currentActivity}`);
      console.log(`  Is Chasing: ${petData.pet.isChasing}`);
      console.log(`  Is User Controlled: ${petData.pet.isUserControlled}`);
      console.log(`  Direction: ${petData.pet.direction}`);
      console.log(`  Hunger: ${petData.feedingSystem.hungerLevel}%`);
      console.log(
        `  In Bounds: ${
          petData.pet.sprite.x >= petBounds.minX &&
          petData.pet.sprite.x <= petBounds.maxX
        }`
      );
      console.log(
        `  Chase Target: ${
          petData.pet.chaseTarget
            ? `(${petData.pet.chaseTarget.x}, ${petData.pet.chaseTarget.y})`
            : "None"
        }`
      );
    }
    console.log(`Food Targets: ${this.foodTargets.size}`);
    console.log(`Shared Food: ${this.sharedDroppedFood.length}`);
    console.log("=== END DEBUG ===");
  }

  // Force pet to start chasing (similar to FeedingSystem.forceStartChasing)
  private forceStartChasing(petData: PetData): void {
    // Check hunger level first
    const hungerLevel = petData.feedingSystem.hungerLevel;
    const isHungry = hungerLevel < 80;

    if (!isHungry || this.sharedDroppedFood.length === 0) {
      // If no more food or pet is full, return to walk mode
      petData.pet.isUserControlled = false;
      petData.pet.setActivity("walk");
      console.log(
        `🚶 Pet ${petData.id} not hungry or no food, returning to walk mode`
      );
      return;
    }

    // If pet is currently chasing, don't interrupt
    if (petData.pet.isChasing) {
      console.log(
        `⚠️ Pet ${petData.id} already chasing, not forcing new chase`
      );
      return;
    }

    // Find available food (not being chased by others)
    const availableFood = this.sharedDroppedFood.filter(
      (food) => !this.foodTargets.has(food)
    );

    if (availableFood.length > 0) {
      // Pick closest available food
      let closestFood: Phaser.GameObjects.Sprite | null = null;
      let closestDistance = Infinity;

      for (const food of availableFood) {
        const distance = Phaser.Math.Distance.Between(
          petData.pet.sprite.x,
          petData.pet.sprite.y,
          food.x,
          food.y
        );
        if (distance < closestDistance) {
          closestDistance = distance;
          closestFood = food;
        }
      }

      if (closestFood) {
        this.foodTargets.set(closestFood, petData.id);
        petData.pet.startChasing(closestFood.x, closestFood.y);
        console.log(
          `🚀 Pet ${petData.id} force started chasing food at (${closestFood.x}, ${closestFood.y})`
        );
      }
    } else {
      // No available food, return to walk mode
      petData.pet.isUserControlled = false;
      petData.pet.setActivity("walk");
      console.log(
        `😔 Pet ${petData.id} no available food, returning to walk mode`
      );
    }
  }
}

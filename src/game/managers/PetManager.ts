import { Pet } from '@/game/entities/Pet'
import { FeedingSystem } from '@/game/systems/FeedingSystem'
import { MovementSystem } from '@/game/systems/MovementSystem'
import { ActivitySystem } from '@/game/systems/ActivitySystem'
import { ColyseusClient } from '@/game/colyseus/client'

export interface PetData {
  id: string
  pet: Pet
  feedingSystem: FeedingSystem
  movementSystem: MovementSystem
  activitySystem: ActivitySystem
}

export class PetManager {
  private pets: Map<string, PetData> = new Map()
  private scene: Phaser.Scene
  private colyseusClient: ColyseusClient
  private activePetId: string | null = null

  // Shared food pool for all pets
  private sharedDroppedFood: Phaser.GameObjects.Sprite[] = []
  private sharedFoodShadows: Phaser.GameObjects.Ellipse[] = []
  private sharedFoodTimers: Phaser.Time.TimerEvent[] = []

  // Track which pet is chasing which food to prevent conflicts
  private foodTargets: Map<Phaser.GameObjects.Sprite, string> = new Map() // food -> petId

  // Safety timer to prevent pets getting stuck
  private safetyTimer?: Phaser.Time.TimerEvent

  constructor(scene: Phaser.Scene, colyseusClient: ColyseusClient) {
    this.scene = scene
    this.colyseusClient = colyseusClient

    // Start safety check timer every 5 seconds
    this.startSafetyCheck()
  }

  // Tạo pet mới
  createPet(petId: string, x: number, y: number): PetData {
    console.log(`🐕 Creating pet: ${petId}`)

    // Tạo pet entity
    const pet = new Pet(this.scene)
    pet.createAnimations()
    pet.create(x, y)

    // Tạo systems cho pet này
    const movementSystem = new MovementSystem(
      pet,
      this.scene.cameras.main.width
    )
    const activitySystem = new ActivitySystem(pet)
    const feedingSystem = new FeedingSystem(
      this.scene,
      pet,
      this.colyseusClient
    )

    const petData: PetData = {
      id: petId,
      pet,
      feedingSystem,
      movementSystem,
      activitySystem
    }

    // Set callback to release food target when pet stops chasing
    pet.onStopChasing = () => {
      this.releaseFoodTarget(petId)
    }

    this.pets.set(petId, petData)

    // Set first pet as active
    if (!this.activePetId) {
      this.activePetId = petId
    }

    console.log(`✅ Pet ${petId} created successfully`)
    return petData
  }

  // Xóa pet
  removePet(petId: string): boolean {
    const petData = this.pets.get(petId)
    if (!petData) return false

    // Cleanup pet and systems
    petData.pet.destroy()
    petData.feedingSystem.destroy()

    this.pets.delete(petId)

    // Update active pet if needed
    if (this.activePetId === petId) {
      const remainingPets = Array.from(this.pets.keys())
      this.activePetId = remainingPets.length > 0 ? remainingPets[0] : null
    }

    console.log(`🗑️ Pet ${petId} removed`)
    return true
  }

  // Get pet data
  getPet(petId: string): PetData | undefined {
    return this.pets.get(petId)
  }

  // Get active pet
  getActivePet(): PetData | undefined {
    return this.activePetId ? this.pets.get(this.activePetId) : undefined
  }

  // Set active pet
  setActivePet(petId: string): boolean {
    if (this.pets.has(petId)) {
      this.activePetId = petId
      console.log(`🎯 Active pet changed to: ${petId}`)
      return true
    }
    return false
  }

  // Get all pets
  getAllPets(): PetData[] {
    return Array.from(this.pets.values())
  }

  // Update all pets
  update(): void {
    for (const petData of this.pets.values()) {
      // Update movement
      const movementResult = petData.movementSystem.update()

      // Check if pet reached shared food
      if (
        movementResult &&
        'reachedTarget' in movementResult &&
        movementResult.reachedTarget &&
        movementResult.targetX !== undefined &&
        movementResult.targetY !== undefined
      ) {
        // Try to eat from shared food pool instead of individual food
        this.checkSharedFoodEating(
          petData,
          movementResult.targetX,
          movementResult.targetY
        )
      }

      // Update activity and feeding
      petData.activitySystem.update()
      petData.feedingSystem.update()
    }
  }

  // Shared feeding operations
  buyFood(foodId: string = 'hamburger'): boolean {
    // Use active pet's feeding system for purchase
    const activePet = this.getActivePet()
    if (activePet) {
      return activePet.feedingSystem.buyFood(foodId)
    }
    return false
  }

  dropFood(x: number, y?: number): void {
    const activePet = this.getActivePet()
    if (activePet && activePet.feedingSystem.foodInventory > 0) {
      // Deduct from active pet's inventory
      activePet.feedingSystem.foodInventory -= 1

      // Drop food to shared pool instead of individual pet
      this.dropSharedFood(x, y)
    }
  }

  // Drop food to shared pool that all pets can eat
  private dropSharedFood(x: number, _y?: number): void {
    // Food always drops near the bottom of the screen (ground line)
    const groundY = this.scene.cameras.main.height - 25

    const food = this.scene.add.image(x, groundY - 25, 'hamburger')
    food.setScale(1.5)
    food.setAlpha(0.9)

    // Add drop animation effect
    this.scene.tweens.add({
      targets: food,
      y: groundY,
      duration: 500,
      ease: 'Bounce.easeOut',
      onComplete: () => {
        this.scene.tweens.add({
          targets: food,
          scaleX: 1.7,
          scaleY: 1.2,
          duration: 100,
          yoyo: true
        })
      }
    })

    // Add shadow effect
    const shadow = this.scene.add.ellipse(x, groundY + 5, 30, 12, 0x000000, 0.3)
    this.scene.tweens.add({
      targets: shadow,
      scaleX: 1.3,
      alpha: 0.5,
      duration: 500,
      ease: 'Power2.easeOut'
    })

    this.sharedDroppedFood.push(food as any)
    this.sharedFoodShadows.push(shadow)

    // Create timer to auto-despawn food after 20s
    const despawnTimer = this.scene.time.delayedCall(20000, () => {
      const currentFoodIndex = this.sharedDroppedFood.indexOf(food as any)
      if (currentFoodIndex !== -1) {
        this.removeSharedFoodAtIndex(currentFoodIndex)
        console.log('Shared food auto-despawned after 20 seconds')
      }
    })
    this.sharedFoodTimers.push(despawnTimer)

    // Notify all pets about new food
    this.notifyPetsAboutFood()

    console.log(`Dropped shared food at (${x}, ${groundY})`)
  }

  // Remove shared food at specific index
  private removeSharedFoodAtIndex(index: number): void {
    if (index < 0 || index >= this.sharedDroppedFood.length) return

    const food = this.sharedDroppedFood[index]
    const shadow = this.sharedFoodShadows[index]
    const timer = this.sharedFoodTimers[index]

    // Remove from food targets tracking
    this.foodTargets.delete(food)

    // Cancel timer if it exists
    if (timer && !timer.hasDispatched) {
      timer.destroy()
    }

    // Animate food and shadow removal
    this.scene.tweens.add({
      targets: food,
      scaleX: 0,
      scaleY: 0,
      alpha: 0,
      duration: 300,
      ease: 'Power2.easeIn',
      onComplete: () => {
        food.destroy()
      }
    })

    this.scene.tweens.add({
      targets: shadow,
      alpha: 0,
      duration: 300,
      onComplete: () => {
        shadow.destroy()
      }
    })

    // Remove from arrays
    this.sharedDroppedFood.splice(index, 1)
    this.sharedFoodShadows.splice(index, 1)
    this.sharedFoodTimers.splice(index, 1)

    console.log('Shared food removed at index:', index)
  }

  // Notify all pets about new food available
  private notifyPetsAboutFood(): void {
    for (const petData of this.pets.values()) {
      // Check if pet should start chasing the new food
      this.checkPetShouldChaseSharedFood(petData)
    }
  }

  // Check if a specific pet should chase shared food
  private checkPetShouldChaseSharedFood(petData: PetData): void {
    if (this.sharedDroppedFood.length === 0) return
    if (petData.pet.isChasing || petData.pet.currentActivity === 'chew') return

    // Check hunger level using the same logic as FeedingSystem
    const hungerLevel = petData.feedingSystem.hungerLevel
    const isHungry = hungerLevel < 80 // Hungry or Starving

    console.log(
      `🔍 Checking chase for Pet ${petData.id}: hunger=${hungerLevel}%, hungry=${isHungry}`
    )

    if (isHungry) {
      // Find food that is not being chased by another pet
      const availableFood = this.sharedDroppedFood.filter(
        (food) => !this.foodTargets.has(food)
      )

      console.log(
        `🍔 Available food count: ${availableFood.length}/${this.sharedDroppedFood.length}`
      )

      if (availableFood.length > 0) {
        // Pick random available food
        const randomIndex = Math.floor(Math.random() * availableFood.length)
        const targetFood = availableFood[randomIndex]

        if (targetFood) {
          // Mark this food as being chased by this pet
          this.foodTargets.set(targetFood, petData.id)

          petData.pet.startChasing(targetFood.x, targetFood.y)
          console.log(
            `🏃 Pet ${petData.id} started chasing shared food at (${targetFood.x}, ${targetFood.y})`
          )
        }
      } else {
        console.log(
          `⚠️ Pet ${petData.id} wants to chase food but all food is being chased`
        )
      }
    }
  }

  // Check if pet can eat shared food
  checkSharedFoodEating(petData: PetData, x: number, y: number): boolean {
    // Find and remove food from shared pool
    const foodIndex = this.sharedDroppedFood.findIndex(
      (food) => Phaser.Math.Distance.Between(food.x, food.y, x, y) < 40
    )

    if (foodIndex !== -1) {
      console.log(`🍔 Pet ${petData.id} is eating food at index ${foodIndex}`)

      // Release food target for this pet
      this.releaseFoodTarget(petData.id)

      // Remove food from shared pool
      this.removeSharedFoodAtIndex(foodIndex)

      // Increase pet's hunger
      const oldHunger = petData.feedingSystem.hungerLevel
      petData.feedingSystem.hungerLevel = Math.min(
        100,
        petData.feedingSystem.hungerLevel + 20
      )

      console.log(
        `📈 Pet ${petData.id} hunger: ${oldHunger} → ${petData.feedingSystem.hungerLevel}`
      )

      // Stop chasing and switch to chew animation
      petData.pet.stopChasing()
      petData.pet.setActivity('chew')

      // Handle post-eating behavior
      this.handlePetPostEating(petData)

      return true
    }

    return false
  }

  // Handle pet behavior after eating
  private handlePetPostEating(petData: PetData): void {
    console.log(
      `🍽️ Pet ${petData.id} started eating, will check for next action in 2 seconds`
    )

    // Force ensure pet is in correct state
    petData.pet.isUserControlled = true // Temporarily user controlled while eating

    // Use fixed timer instead of animation event for reliability
    this.scene.time.delayedCall(2000, () => {
      console.log(
        `⏰ Timer fired for Pet ${petData.id}, current activity: ${petData.pet.currentActivity}`
      )

      // Force check and reset pet state regardless of current activity
      if (
        petData.pet.currentActivity === 'chew' ||
        petData.pet.isUserControlled
      ) {
        // Check if pet should continue chasing more food or return to auto walk
        if (
          petData.feedingSystem.hungerLevel < 100 &&
          this.sharedDroppedFood.length > 0
        ) {
          console.log(
            `🔄 Pet ${petData.id} still hungry (${petData.feedingSystem.hungerLevel}%), looking for more shared food...`
          )

          // Reset state before checking for more food
          petData.pet.isUserControlled = false
          petData.pet.isChasing = false
          petData.pet.chaseTarget = null

          this.checkPetShouldChaseSharedFood(petData)
        } else {
          // Force return to auto walk mode
          console.log(
            `🚶 Pet ${petData.id} finished eating (${petData.feedingSystem.hungerLevel}%), FORCING return to auto walk mode`
          )
          this.forceReturnToWalk(petData)
        }
      } else {
        console.log(
          `⚠️ Pet ${petData.id} is no longer chewing, current activity: ${petData.pet.currentActivity}, FORCING walk mode`
        )
        this.forceReturnToWalk(petData)
      }
    })
  }

  // Force pet to return to walk mode (safety method)
  private forceReturnToWalk(petData: PetData): void {
    console.log(`🔧 Force returning Pet ${petData.id} to walk mode`)

    // Release any food target this pet was chasing
    this.releaseFoodTarget(petData.id)

    // Reset all states completely
    petData.pet.isUserControlled = false
    petData.pet.isChasing = false
    petData.pet.chaseTarget = null

    // Force activity to walk and ensure pet starts moving automatically
    petData.pet.setActivity('walk')

    // Double-check: if pet is still not moving automatically after a brief delay
    this.scene.time.delayedCall(500, () => {
      if (
        petData.pet.isUserControlled ||
        petData.pet.currentActivity !== 'walk'
      ) {
        console.log(
          `🔄 Secondary force: Pet ${petData.id} still not walking, applying final reset`
        )
        petData.pet.isUserControlled = false
        petData.pet.isChasing = false
        petData.pet.chaseTarget = null
        petData.pet.setActivity('walk')
      }
    })

    console.log(`✅ Pet ${petData.id} forced back to walk mode`)
  }

  // Get shared food inventory (from active pet)
  getFoodInventory(): number {
    const activePet = this.getActivePet()
    return activePet?.feedingSystem.foodInventory || 0
  }

  // Get stats for UI
  getPetStats() {
    const stats = this.getAllPets().map((petData) => ({
      id: petData.id,
      isActive: petData.id === this.activePetId,
      hungerLevel: petData.feedingSystem.hungerLevel,
      currentActivity: petData.pet.currentActivity,
      foodInventory: petData.feedingSystem.foodInventory
    }))

    return {
      activePetId: this.activePetId,
      totalPets: this.pets.size,
      pets: stats,
      totalFoodInventory: this.getFoodInventory()
    }
  }
  // Cleanup all pets
  cleanup(): void {
    // Stop safety timer
    if (this.safetyTimer) {
      this.safetyTimer.destroy()
      this.safetyTimer = undefined
    }

    for (const petData of this.pets.values()) {
      petData.pet.destroy()
      petData.feedingSystem.destroy()
    }
    this.pets.clear()
    this.activePetId = null

    // Cleanup shared food
    while (this.sharedDroppedFood.length > 0) {
      this.removeSharedFoodAtIndex(0)
    }

    // Clear food targets
    this.foodTargets.clear()

    console.log('🧹 PetManager cleaned up')
  }

  // Release food target when pet stops chasing
  private releaseFoodTarget(petId: string): void {
    for (const [food, chasingPetId] of this.foodTargets.entries()) {
      if (chasingPetId === petId) {
        this.foodTargets.delete(food)
        console.log(`Pet ${petId} released food target`)
        break
      }
    }
  }

  // Start safety check timer
  private startSafetyCheck(): void {
    this.safetyTimer = this.scene.time.addEvent({
      delay: 5000, // 5 seconds
      callback: () => {
        this.performSafetyCheck()
      },
      loop: true
    })
  }

  // Perform safety check on all pets
  private performSafetyCheck(): void {
    console.log('🔍 Performing safety check on all pets...')

    for (const petData of this.pets.values()) {
      // Check if pet has been chewing for too long
      if (petData.pet.currentActivity === 'chew' && !petData.pet.isChasing) {
        console.log(
          `⚠️ SAFETY: Pet ${petData.id} stuck in chew mode, forcing to walk`
        )
        this.forceReturnToWalk(petData)
      }

      // Check if pet is user controlled but not chasing anything
      if (
        petData.pet.isUserControlled &&
        !petData.pet.isChasing &&
        !petData.pet.chaseTarget
      ) {
        console.log(
          `⚠️ SAFETY: Pet ${petData.id} user controlled but not chasing, releasing control`
        )
        petData.pet.isUserControlled = false
        petData.pet.setActivity('walk')
      }

      // Check if pet has invalid chase target
      if (petData.pet.isChasing && !petData.pet.chaseTarget) {
        console.log(
          `⚠️ SAFETY: Pet ${petData.id} chasing but no target, resetting`
        )
        petData.pet.isChasing = false
        petData.pet.isUserControlled = false
        petData.pet.setActivity('walk')
      }
    }
  }

  // Force reset all pets to walking state (emergency method)
  forceResetAllPets(): void {
    console.log('🆘 EMERGENCY: Force resetting all pets to walk mode')

    for (const petData of this.pets.values()) {
      this.forceReturnToWalk(petData)
    }

    // Clear all food targets
    this.foodTargets.clear()

    console.log('✅ All pets have been force reset to walk mode')
  }

  // Debug method to check all pets status
  debugPetsStatus(): void {
    console.log('=== PETS STATUS DEBUG ===')
    for (const petData of this.pets.values()) {
      console.log(`Pet ${petData.id}:`)
      console.log(`  Activity: ${petData.pet.currentActivity}`)
      console.log(`  Is Chasing: ${petData.pet.isChasing}`)
      console.log(`  Is User Controlled: ${petData.pet.isUserControlled}`)
      console.log(`  Hunger: ${petData.feedingSystem.hungerLevel}%`)
      console.log(
        `  Chase Target: ${
          petData.pet.chaseTarget
            ? `(${petData.pet.chaseTarget.x}, ${petData.pet.chaseTarget.y})`
            : 'None'
        }`
      )
    }
    console.log(`Food Targets: ${this.foodTargets.size}`)
    console.log(`Shared Food: ${this.sharedDroppedFood.length}`)
    console.log('=== END DEBUG ===')
  }
}

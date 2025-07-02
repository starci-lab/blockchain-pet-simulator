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

  constructor(scene: Phaser.Scene, colyseusClient: ColyseusClient) {
    this.scene = scene
    this.colyseusClient = colyseusClient
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

      // Check if pet reached food
      if (
        movementResult &&
        'reachedTarget' in movementResult &&
        movementResult.reachedTarget &&
        movementResult.targetX !== undefined &&
        movementResult.targetY !== undefined
      ) {
        petData.feedingSystem.eatFood(
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
    if (activePet) {
      activePet.feedingSystem.dropFood(x, y)
    }
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
    for (const petData of this.pets.values()) {
      petData.pet.destroy()
      petData.feedingSystem.destroy()
    }
    this.pets.clear()
    this.activePetId = null
    console.log('🧹 PetManager cleaned up')
  }
}

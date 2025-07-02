import type { ColyseusClient } from '@/game/colyseus/client'
import { Pet } from '../entities/Pet'
import { useUserStore } from '@/store/userStore'
import { gameConfigManager } from '@/game/configs/gameConfig'

// Use object instead of enum for erasableSyntaxOnly
export const HungerState = {
  Full: 'full',
  Normal: 'normal',
  Hungry: 'hungry',
  Starving: 'starving'
} as const
export type HungerState = (typeof HungerState)[keyof typeof HungerState]

export function getHungerState(hungerLevel: number): HungerState {
  if (hungerLevel >= 95) return HungerState.Full
  if (hungerLevel >= 80) return HungerState.Normal
  if (hungerLevel >= 30) return HungerState.Hungry
  return HungerState.Starving
}

export class FeedingSystem {
  public foodInventory: number = 0
  public hungerLevel: number = 100
  public droppedFood: Phaser.GameObjects.Sprite[] = []
  public foodShadows: Phaser.GameObjects.Ellipse[] = []
  public foodTimers: Phaser.Time.TimerEvent[] = [] // Track timers for each food
  private lastChaseCheck: number = 0 // Track when we last checked for chasing opportunities
  private lastHungerUpdate: number = 0 // Last time hunger was decreased

  private scene: Phaser.Scene
  private pet: Pet
  private colyseusClient: ColyseusClient

  constructor(scene: Phaser.Scene, pet: Pet, colyseusClient: ColyseusClient) {
    this.scene = scene
    this.pet = pet
    this.colyseusClient = colyseusClient
  }

  update() {
    // Decrease hunger based on real time, target: 2.5 points/hour
    // 2 points/hour = 2 / 3600 points/second
    const now = this.scene.time.now
    if (!this.lastHungerUpdate) this.lastHungerUpdate = now
    const elapsed = (now - this.lastHungerUpdate) / 1000 // seconds
    const HUNGER_DECREASE_PER_HOUR = 3000
    const HUNGER_DECREASE_PER_SEC = HUNGER_DECREASE_PER_HOUR / 3600
    if (elapsed > 0) {
      this.hungerLevel = Math.max(
        0,
        this.hungerLevel - HUNGER_DECREASE_PER_SEC * elapsed
      )
      this.lastHungerUpdate = now
    }

    // Check if pet should start chasing food if it becomes hungry and there's food available
    // Only check when pet is not chasing and not eating
    const hungerState = getHungerState(this.hungerLevel)
    if (
      !this.pet.isChasing &&
      this.pet.currentActivity !== 'chew' &&
      (hungerState === HungerState.Hungry ||
        hungerState === HungerState.Starving) &&
      this.droppedFood.length > 0
    ) {
      // Add a small delay to prevent constant checking
      if (
        !this.lastChaseCheck ||
        this.scene.time.now - this.lastChaseCheck > 1000
      ) {
        this.checkAndStartChasing()
        this.lastChaseCheck = this.scene.time.now
      }
    }
  }

  buyFood(foodId: string = 'hamburger'): boolean {
    console.log(`🛒 Attempting to buy food: ${foodId}`)
    const foodPrice = gameConfigManager.getFoodPrice(foodId)
    console.log(`Food price for ${foodId}: ${foodPrice}`)
    const spendToken = useUserStore.getState().spendToken

    if (spendToken(foodPrice)) {
      this.foodInventory += 1
      console.log(
        `Purchase successful! Food: ${foodId}, Price: ${foodPrice}, Remaining tokens: ${
          useUserStore.getState().nomToken
        }`
      )

      if (this.colyseusClient) {
        this.colyseusClient.sendMessage('food-purchase', {
          foodId,
          price: foodPrice,
          timestamp: Date.now()
        })
      } else {
        console.log(`⚠️ Not sending message - client not connected`)
      }

      return true
    } else {
      console.log(`Not enough tokens to buy ${foodId}! Price: ${foodPrice}`)
      return false
    }
  }

  dropFood(x: number, _y?: number) {
    if (this.foodInventory <= 0) return

    this.foodInventory -= 1

    // Food always drops near the bottom of the screen
    const groundY = this.scene.cameras.main.height - 25

    const food = this.scene.add.image(x, groundY - 25, 'hamburger')
    food.setScale(1.5) // Scale up hamburger
    food.setAlpha(0.9)

    // Add drop animation effect
    this.scene.tweens.add({
      targets: food,
      y: groundY, // Drop to ground level
      duration: 500,
      ease: 'Bounce.easeOut',
      onComplete: () => {
        // Add slight bounce effect
        this.scene.tweens.add({
          targets: food,
          scaleX: 1.7, // Bounce scale corresponding to scale 1.5
          scaleY: 1.2,
          duration: 100,
          yoyo: true
        })
      }
    })

    // Add shadow effect when dropping - shadow is also larger
    const shadow = this.scene.add.ellipse(x, groundY + 5, 30, 12, 0x000000, 0.3)
    this.scene.tweens.add({
      targets: shadow,
      scaleX: 1.3,
      alpha: 0.5,
      duration: 500,
      ease: 'Power2.easeOut'
    })

    this.droppedFood.push(food as any)
    this.foodShadows.push(shadow)

    // Create timer to auto-despawn food after 20s
    const despawnTimer = this.scene.time.delayedCall(20000, () => {
      const currentFoodIndex = this.droppedFood.indexOf(food as any)
      if (currentFoodIndex !== -1) {
        this.removeFoodAtIndex(currentFoodIndex)
        console.log('Food auto-despawned after 1 minute')
      }
    })
    this.foodTimers.push(despawnTimer)

    // Check if pet should chase food (only if hungry)
    this.checkAndStartChasing()

    console.log(`Dropped hamburger at (${x}, ${groundY})`)
  }

  /**
   * Pet eats food, recovers hunger based on food type
   * @param x X position of food
   * @param y Y position of food
   * @param foodType Type of food (default: 'hamburger')
   */
  eatFood(x: number, y: number, foodType: string = 'hamburger') {
    // Get recovery value from config
    const foodItem = gameConfigManager.getFoodItem(foodType)
    const recovery = foodItem?.hungerRestore || 10 // Default 10 if not found

    // Find and remove food - increase detection range for larger hamburger
    const foodIndex = this.droppedFood.findIndex(
      (food) => Phaser.Math.Distance.Between(food.x, food.y, x, y) < 40
    )

    if (foodIndex !== -1) {
      // Remove food and clean up timer
      this.removeFoodAtIndex(foodIndex)

      // Increase hunger based on food type
      this.hungerLevel = Math.min(100, this.hungerLevel + recovery)

      // Stop chasing and switch to chew animation
      this.pet.stopChasing()
      this.pet.setActivity('chew')

      this.pet.sprite.once('animationcomplete', () => {
        console.log(
          'Animation complete event fired, current activity:',
          this.pet.currentActivity
        )
        if (this.pet.currentActivity === 'chew') {
          // Check if pet should continue chasing more food or return to auto walk
          if (this.hungerLevel < 100 && this.droppedFood.length > 0) {
            // Pet is still hungry and there's more food, continue chasing
            console.log('Pet still hungry, looking for more food...')
            this.forceStartChasing()
          } else {
            // Pet is full or no more food, return to auto walk
            this.pet.isUserControlled = false
            this.pet.setActivity('walk')
            console.log('Pet finished eating, returning to auto walk mode')
          }
        }
      })

      this.scene.time.delayedCall(2000, () => {
        console.log(
          'Backup timer fired, current activity:',
          this.pet.currentActivity
        )
        if (this.pet.currentActivity === 'chew') {
          // Backup timer - same logic as animation complete
          if (this.hungerLevel < 100 && this.droppedFood.length > 0) {
            console.log('Backup: Pet still hungry, looking for more food...')
            // Force checkAndStartChasing to work even if pet is in chew mode
            this.forceStartChasing()
          } else {
            this.pet.isUserControlled = false
            this.pet.setActivity('walk')
            console.log('Backup: Pet returning to auto walk mode')
          }
        }
      })
    }
  }

  private removeFoodAtIndex(index: number) {
    if (index < 0 || index >= this.droppedFood.length) return

    const food = this.droppedFood[index]
    const shadow = this.foodShadows[index]
    const timer = this.foodTimers[index]

    // Check if the pet was chasing this specific food
    const wasChasing =
      this.pet.isChasing &&
      this.pet.chaseTarget &&
      Phaser.Math.Distance.Between(
        this.pet.chaseTarget.x,
        this.pet.chaseTarget.y,
        food.x,
        food.y
      ) < 10

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
    this.droppedFood.splice(index, 1)
    this.foodShadows.splice(index, 1)
    this.foodTimers.splice(index, 1)

    // If pet was chasing this food, we need to handle it smoothly
    if (wasChasing) {
      console.log(
        'Pet was chasing this food, stopping chase and finding new target'
      )
      this.pet.stopChasing()

      // Very quick transition to avoid stuttering
      this.scene.time.delayedCall(30, () => {
        if (this.hungerLevel < 100 && this.droppedFood.length > 0) {
          this.checkAndStartChasing()
        } else {
          this.pet.isUserControlled = false
          this.pet.setActivity('walk')
        }
      })
    }
  }

  private checkAndStartChasing() {
    // Only chase if Hungry or Starving
    const hungerState = getHungerState(this.hungerLevel)
    if (
      (hungerState !== HungerState.Hungry &&
        hungerState !== HungerState.Starving) ||
      this.droppedFood.length === 0
    ) {
      return
    }

    // If pet is already chasing or eating, don't interrupt
    if (this.pet.isChasing || this.pet.currentActivity === 'chew') {
      return
    }

    // Randomly select a food from the dropped food list
    const randomIndex = Math.floor(Math.random() * this.droppedFood.length)
    const targetFood = this.droppedFood[randomIndex]

    if (targetFood) {
      this.pet.startChasing(targetFood.x, targetFood.y)
      console.log(
        `Pet started chasing food at (${targetFood.x}, ${targetFood.y}), hunger: ${this.hungerLevel}`
      )
    }
  }

  private forceStartChasing() {
    // Only chase if Hungry or Starving
    const hungerState = getHungerState(this.hungerLevel)
    if (
      (hungerState !== HungerState.Hungry &&
        hungerState !== HungerState.Starving) ||
      this.droppedFood.length === 0
    ) {
      // If no more food or pet is full, return to walk mode
      this.pet.isUserControlled = false
      this.pet.setActivity('walk')
      return
    }

    // If pet is currently chasing, don't interrupt
    if (this.pet.isChasing) {
      return
    }

    // Randomly select a food from the dropped food list
    const randomIndex = Math.floor(Math.random() * this.droppedFood.length)
    const targetFood = this.droppedFood[randomIndex]

    if (targetFood) {
      this.pet.startChasing(targetFood.x, targetFood.y)
    } else {
      this.pet.isUserControlled = false
      this.pet.setActivity('walk')
    }
  }

  // Cleanup method
  destroy(): void {
    this.cleanup()
    console.log('🧹 FeedingSystem destroyed')
  }

  cleanup() {
    while (this.droppedFood.length > 0) {
      this.removeFoodAtIndex(0)
    }
  }
}

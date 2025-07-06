import type { ColyseusClient } from '@/game/colyseus/client'
import { Pet } from '../entities/Pet'
import { useUserStore } from '@/store/userStore'
import { gameConfigManager } from '@/game/configs/gameConfig'
import {
  GAME_LAYOUT,
  GAME_MECHANICS,
  GamePositioning
} from '../constants/gameConstants'

// Hunger states
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
  // Public properties
  public foodInventory: number = 0
  public hungerLevel: number = 100
  public droppedFood: Phaser.GameObjects.Sprite[] = []
  public foodShadows: Phaser.GameObjects.Ellipse[] = []
  public foodTimers: Phaser.Time.TimerEvent[] = []

  // Private properties
  private lastChaseCheck: number = 0
  private lastHungerUpdate: number = 0
  private scene: Phaser.Scene
  private pet: Pet
  private colyseusClient: ColyseusClient

  constructor(scene: Phaser.Scene, pet: Pet, colyseusClient: ColyseusClient) {
    this.scene = scene
    this.pet = pet
    this.colyseusClient = colyseusClient
  }

  // ===== UPDATE LOOP =====

  update() {
    this.updateHunger()
    this.checkChaseOpportunity()
  }

  private updateHunger() {
    const now = this.scene.time.now
    if (!this.lastHungerUpdate) this.lastHungerUpdate = now

    const elapsed = (now - this.lastHungerUpdate) / 1000
    const decreaseRate = GAME_MECHANICS.HUNGER_DECREASE_PER_HOUR / 3600

    if (elapsed > 0) {
      this.hungerLevel = Math.max(0, this.hungerLevel - decreaseRate * elapsed)
      this.lastHungerUpdate = now
    }
  }

  private checkChaseOpportunity() {
    const hungerState = getHungerState(this.hungerLevel)
    const shouldChase =
      !this.pet.isChasing &&
      this.pet.currentActivity !== 'chew' &&
      (hungerState === HungerState.Hungry ||
        hungerState === HungerState.Starving) &&
      this.droppedFood.length > 0

    if (shouldChase) {
      const now = this.scene.time.now
      if (
        !this.lastChaseCheck ||
        now - this.lastChaseCheck > GAME_MECHANICS.CHASE_CHECK_INTERVAL
      ) {
        this.checkAndStartChasing()
        this.lastChaseCheck = now
      }
    }
  }

  // ===== FOOD PURCHASE =====

  buyFood(foodId: string = 'hamburger'): boolean {
    console.log(`🛒 Buying food: ${foodId}`)
    const foodPrice = gameConfigManager.getFoodPrice(foodId)

    if (this.colyseusClient && this.colyseusClient.isConnected()) {
      console.log('🌐 Sending purchase request to server')

      this.colyseusClient.sendMessage('buy_food', {
        itemType: 'food',
        itemName: 'hamburger',
        quantity: 1
      })

      return true // Server will handle validation and update inventory
    } else {
      console.log('🔌 Offline mode - using local validation')

      const spendToken = useUserStore.getState().spendToken
      if (spendToken(foodPrice)) {
        this.foodInventory += 1
        console.log(`✅ Purchase successful: ${foodId} for ${foodPrice} tokens`)
        return true
      } else {
        console.log(`❌ Not enough tokens: need ${foodPrice}`)
        return false
      }
    }
  }

  // ===== FOOD DROP =====

  dropFood(x: number, _y?: number) {
    if (this.foodInventory <= 0) {
      console.log('❌ No food in inventory to drop')
      return
    }

    if (this.colyseusClient && this.colyseusClient.isConnected()) {
      console.log('🌐 Sending food drop request to server')

      this.colyseusClient.sendMessage('food-drop', {
        foodId: 'hamburger',
        x: x,
        y: GamePositioning.getFoodFinalY(this.scene.cameras.main.height)
      })

      // Note: Inventory will be decreased when server confirms the drop
    } else {
      console.log('🔌 Offline mode - dropping food locally')
      this.dropFoodLocally(x, _y)
    }
  }

  private dropFoodLocally(x: number, _y?: number) {
    if (this.foodInventory <= 0) return

    this.foodInventory -= 1

    const cameraHeight = this.scene.cameras.main.height
    const dropStartY = GamePositioning.getFoodDropY(cameraHeight)
    const finalY = GamePositioning.getFoodFinalY(cameraHeight)

    const food = this.scene.add.image(x, dropStartY, 'hamburger')
    food.setScale(GAME_LAYOUT.FOOD_SCALE)
    food.setAlpha(0.9)

    // Drop animation
    this.scene.tweens.add({
      targets: food,
      y: finalY,
      duration: 500,
      ease: 'Bounce.easeOut',
      onComplete: () => {
        this.scene.tweens.add({
          targets: food,
          scaleX: GAME_LAYOUT.FOOD_SCALE * 1.13,
          scaleY: GAME_LAYOUT.FOOD_SCALE * 0.8,
          duration: 100,
          yoyo: true
        })
      }
    })

    // Shadow effect
    const shadow = this.scene.add.ellipse(x, finalY + 5, 30, 12, 0x000000, 0.3)
    this.scene.tweens.add({
      targets: shadow,
      scaleX: 1.3,
      alpha: 0.5,
      duration: 500,
      ease: 'Power2.easeOut'
    })

    this.droppedFood.push(food as any)
    this.foodShadows.push(shadow)

    // Auto-despawn timer
    const despawnTimer = this.scene.time.delayedCall(
      GAME_MECHANICS.FOOD_DESPAWN_TIME,
      () => {
        const currentFoodIndex = this.droppedFood.indexOf(food as any)
        if (currentFoodIndex !== -1) {
          this.removeFoodAtIndex(currentFoodIndex)
          console.log('Food auto-despawned after timeout')
        }
      }
    )
    this.foodTimers.push(despawnTimer)

    this.checkAndStartChasing()
    console.log(`Dropped food at (${x}, ${finalY})`)
  }

  // ===== FOOD EATING =====

  eatFood(x: number, y: number, foodType: string = 'hamburger') {
    const foodItem = gameConfigManager.getFoodItem(foodType)
    const recovery = foodItem?.hungerRestore || 10

    const foodIndex = this.droppedFood.findIndex(
      (food) =>
        Phaser.Math.Distance.Between(food.x, food.y, x, y) <
        GAME_MECHANICS.FOOD_DETECTION_RANGE
    )

    if (foodIndex !== -1) {
      this.removeFoodAtIndex(foodIndex)
      this.hungerLevel = Math.min(100, this.hungerLevel + recovery)

      this.pet.stopChasing()
      this.pet.setActivity('chew')

      this.pet.sprite.once('animationcomplete', () => {
        this.handleEatingComplete()
      })

      this.scene.time.delayedCall(GAME_MECHANICS.POST_EATING_DELAY, () => {
        this.handleEatingComplete()
      })
    }
  }

  private handleEatingComplete() {
    if (this.pet.currentActivity === 'chew') {
      if (this.hungerLevel < 100 && this.droppedFood.length > 0) {
        console.log('Pet still hungry, looking for more food...')
        this.forceStartChasing()
      } else {
        this.pet.isUserControlled = false
        this.pet.setActivity('walk')
        console.log('Pet finished eating, returning to auto walk mode')
      }
    }
  }

  // ===== CHASING LOGIC =====

  private checkAndStartChasing() {
    const hungerState = getHungerState(this.hungerLevel)

    if (
      (hungerState !== HungerState.Hungry &&
        hungerState !== HungerState.Starving) ||
      this.droppedFood.length === 0 ||
      this.pet.isChasing ||
      this.pet.currentActivity === 'chew'
    ) {
      return
    }

    const randomIndex = Math.floor(Math.random() * this.droppedFood.length)
    const targetFood = this.droppedFood[randomIndex]

    if (targetFood) {
      this.pet.startChasing(targetFood.x, targetFood.y)
      console.log(
        `Pet started chasing food at (${targetFood.x}, ${targetFood.y})`
      )
    }
  }

  private forceStartChasing() {
    const hungerState = getHungerState(this.hungerLevel)

    if (
      (hungerState !== HungerState.Hungry &&
        hungerState !== HungerState.Starving) ||
      this.droppedFood.length === 0
    ) {
      this.pet.isUserControlled = false
      this.pet.setActivity('walk')
      return
    }

    if (this.pet.isChasing) return

    const randomIndex = Math.floor(Math.random() * this.droppedFood.length)
    const targetFood = this.droppedFood[randomIndex]

    if (targetFood) {
      this.pet.startChasing(targetFood.x, targetFood.y)
    } else {
      this.pet.isUserControlled = false
      this.pet.setActivity('walk')
    }
  }

  // ===== FOOD MANAGEMENT =====

  private removeFoodAtIndex(index: number) {
    if (index < 0 || index >= this.droppedFood.length) return

    const food = this.droppedFood[index]
    const shadow = this.foodShadows[index]
    const timer = this.foodTimers[index]

    const wasChasing =
      this.pet.isChasing &&
      this.pet.chaseTarget &&
      Phaser.Math.Distance.Between(
        this.pet.chaseTarget.x,
        this.pet.chaseTarget.y,
        food.x,
        food.y
      ) < 10

    // Cancel timer
    if (timer && !timer.hasDispatched) {
      timer.destroy()
    }

    // Animate removal
    this.scene.tweens.add({
      targets: food,
      scaleX: 0,
      scaleY: 0,
      alpha: 0,
      duration: 300,
      ease: 'Power2.easeIn',
      onComplete: () => food.destroy()
    })

    this.scene.tweens.add({
      targets: shadow,
      alpha: 0,
      duration: 300,
      onComplete: () => shadow.destroy()
    })

    // Remove from arrays
    this.droppedFood.splice(index, 1)
    this.foodShadows.splice(index, 1)
    this.foodTimers.splice(index, 1)

    // Handle pet chasing behavior
    if (wasChasing) {
      console.log('Pet was chasing this food, finding new target')
      this.pet.stopChasing()

      this.scene.time.delayedCall(GAME_MECHANICS.TRANSITION_DELAY, () => {
        if (this.hungerLevel < 100 && this.droppedFood.length > 0) {
          this.checkAndStartChasing()
        } else {
          this.pet.isUserControlled = false
          this.pet.setActivity('walk')
        }
      })
    }
  }

  // ===== CLEANUP =====

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

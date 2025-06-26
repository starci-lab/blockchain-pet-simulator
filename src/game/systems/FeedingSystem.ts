import { Pet } from '../entities/Pet'

export class FeedingSystem {
  public foodInventory: number = 0
  public hungerLevel: number = 100
  public droppedFood: Phaser.GameObjects.Sprite[] = []
  public foodShadows: Phaser.GameObjects.Ellipse[] = []
  public foodTimers: Phaser.Time.TimerEvent[] = [] // Track timers for each food

  private scene: Phaser.Scene
  private pet: Pet

  constructor(scene: Phaser.Scene, pet: Pet) {
    this.scene = scene
    this.pet = pet
  }

  update() {
    // Decrease hunger over time
    this.hungerLevel = Math.max(0, this.hungerLevel - 0.01)
  }

  buyFood() {
    this.foodInventory += 1
    console.log(`Bought food! Inventory: ${this.foodInventory}`)
  }

  dropFood(x: number, _y?: number) {
    if (this.foodInventory <= 0) return

    this.foodInventory -= 1

    // Food luôn rơi xuống gần đáy màn hình
    const groundY = this.scene.cameras.main.height - 25

    const food = this.scene.add.image(x, groundY - 25, 'hamburger')
    food.setScale(1.5) // Scale up hamburger
    food.setAlpha(0.9)

    // add effect drop animation
    this.scene.tweens.add({
      targets: food,
      y: groundY, // Drop to ground level
      duration: 500,
      ease: 'Bounce.easeOut',
      onComplete: () => {
        // Thêm slight bounce effect khi chạm đất
        this.scene.tweens.add({
          targets: food,
          scaleX: 1.7, // Bounce scale tương ứng với scale 1.5
          scaleY: 1.2,
          duration: 100,
          yoyo: true
        })
      }
    })

    // Thêm shadow effect khi rơi - shadow cũng to hơn
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

    // Create timer to auto-despawn food after 1 minute
    const despawnTimer = this.scene.time.delayedCall(10000, () => {
      const currentFoodIndex = this.droppedFood.indexOf(food as any)
      if (currentFoodIndex !== -1) {
        this.removeFoodAtIndex(currentFoodIndex)
        console.log('Food auto-despawned after 1 minute')
      }
    })
    this.foodTimers.push(despawnTimer)

    // Pet chase theo X, nhưng Y cố định ở ground level
    this.pet.startChasing(x, groundY)

    console.log(`Dropped hamburger at (${x}, ${groundY})`)
  }

  eatFood(x: number, y: number) {
    // Tìm và xóa food - tăng detection range cho hamburger to hơn
    const foodIndex = this.droppedFood.findIndex(
      (food) => Phaser.Math.Distance.Between(food.x, food.y, x, y) < 40
    )

    if (foodIndex !== -1) {
      // Remove food and clean up timer
      this.removeFoodAtIndex(foodIndex)

      // Tăng hunger
      this.hungerLevel = Math.min(100, this.hungerLevel + 20)

      // Dừng chase và chuyển sang chew animation
      this.pet.stopChasing()
      this.pet.setActivity('chew')

      console.log(`Pet ate hamburger! Hunger: ${this.hungerLevel}`)

      this.pet.sprite.once('animationcomplete', () => {
        if (this.pet.currentActivity === 'chew') {
          this.pet.isUserControlled = false
          this.pet.setActivity('walk')
          console.log('Pet finished eating, returning to auto walk mode')
        }
      })

      this.scene.time.delayedCall(2000, () => {
        if (this.pet.currentActivity === 'chew') {
          this.pet.isUserControlled = false
          this.pet.setActivity('walk')
          console.log('Backup: Pet returning to auto walk mode')
        }
      })
    }
  }

  private removeFoodAtIndex(index: number) {
    if (index < 0 || index >= this.droppedFood.length) return

    const food = this.droppedFood[index]
    const shadow = this.foodShadows[index]
    const timer = this.foodTimers[index]

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
  }

  cleanup() {
    // Clean up all remaining food and timers
    while (this.droppedFood.length > 0) {
      this.removeFoodAtIndex(0)
    }
  }
}

import { Pet } from '../entities/Pet'

export class FeedingSystem {
  public foodInventory: number = 0
  public hungerLevel: number = 100
  public droppedFood: Phaser.GameObjects.Sprite[] = []
  public foodShadows: Phaser.GameObjects.Ellipse[] = []

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

  dropFood(x: number, y: number) {
    if (this.foodInventory <= 0) return

    this.foodInventory -= 1

    const food = this.scene.add.image(x, y - 100, 'hamburger')
    food.setScale(1.5) // Scale up hamburger
    food.setAlpha(0.9)

    // add effect drop animation
    this.scene.tweens.add({
      targets: food,
      y: y, // Drop to ground
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
    const shadow = this.scene.add.ellipse(x, y + 5, 30, 12, 0x000000, 0.3)
    this.scene.tweens.add({
      targets: shadow,
      scaleX: 1.3,
      alpha: 0.5,
      duration: 500,
      ease: 'Power2.easeOut'
    })

    this.droppedFood.push(food as any)
    this.foodShadows.push(shadow)

    // Pet bắt đầu chase đến vị trí food
    this.pet.startChasing(x, y)

    console.log(`Dropped hamburger at (${x}, ${y})`)
  }

  eatFood(x: number, y: number) {
    // Tìm và xóa food - tăng detection range cho hamburger to hơn
    const foodIndex = this.droppedFood.findIndex(
      (food) => Phaser.Math.Distance.Between(food.x, food.y, x, y) < 40
    )

    if (foodIndex !== -1) {
      const food = this.droppedFood[foodIndex]
      const shadow = this.foodShadows[foodIndex]

      // Hiệu ứng ăn food (shrink and fade)
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

      // Fade shadow
      this.scene.tweens.add({
        targets: shadow,
        alpha: 0,
        duration: 300,
        onComplete: () => {
          shadow.destroy()
        }
      })

      this.droppedFood.splice(foodIndex, 1)
      this.foodShadows.splice(foodIndex, 1)
    }

    // Tăng hunger
    this.hungerLevel = Math.min(100, this.hungerLevel + 20)

    // Dừng chase và chuyển sang chew animation
    this.pet.stopChasing()
    this.pet.setActivity('chew')

    console.log(`Pet ate hamburger! Hunger: ${this.hungerLevel}`)

    // Sau khi ăn xong thì quay lại walk
    this.pet.sprite.once('animationcomplete', () => {
      if (this.pet.currentActivity === 'chew') {
        this.pet.isUserControlled = false
        this.pet.setActivity('walk')
        console.log('Pet finished eating, returning to auto walk mode')
      }
    })

    // Backup timer nếu animation không trigger
    this.scene.time.delayedCall(2000, () => {
      if (this.pet.currentActivity === 'chew') {
        this.pet.isUserControlled = false
        this.pet.setActivity('walk')
        console.log('Backup: Pet returning to auto walk mode')
      }
    })
  }
}

import { Pet } from '../entities/Pet'

export class FeedingSystem {
  public foodInventory: number = 0
  public hungerLevel: number = 100
  public droppedFood: Phaser.GameObjects.Sprite[] = []

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

    // Tạo food sprite
    const food = this.scene.add.circle(x, y, 8, 0xffd700)
    food.setStrokeStyle(2, 0xffa500)

    this.droppedFood.push(food as any)

    // Pet sẽ chạy đến food
    this.pet.startChasing(x, y)

    console.log(`Dropped food at (${x}, ${y})`)
  }

  eatFood(x: number, y: number) {
    // Tìm và xóa food
    const foodIndex = this.droppedFood.findIndex(
      (food) => Phaser.Math.Distance.Between(food.x, food.y, x, y) < 20
    )

    if (foodIndex !== -1) {
      this.droppedFood[foodIndex].destroy()
      this.droppedFood.splice(foodIndex, 1)
    }

    // Tăng hunger
    this.hungerLevel = Math.min(100, this.hungerLevel + 20)

    // Dừng chase và chuyển sang chew animation
    this.pet.stopChasing()
    this.pet.setActivity('chew')

    console.log(`Pet ate food! Hunger: ${this.hungerLevel}`)

    // Sau khi ăn xong thì quay lại walk
    this.pet.sprite.once('animationcomplete', () => {
      if (this.pet.currentActivity === 'chew') {
        this.pet.isUserControlled = false
        this.pet.setActivity('walk')
      }
    })
  }
}

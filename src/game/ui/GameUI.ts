import { FeedingSystem } from '../systems/FeedingSystem'

export class GameUI {
  private inventoryText!: Phaser.GameObjects.Text
  private hungerBar!: Phaser.GameObjects.Rectangle
  private foodShop!: Phaser.GameObjects.Rectangle

  private scene: Phaser.Scene
  private feedingSystem: FeedingSystem

  constructor(scene: Phaser.Scene, feedingSystem: FeedingSystem) {
    this.scene = scene
    this.feedingSystem = feedingSystem
  }

  create() {
    this.createFeedingUI()
    this.createFoodShop()
    this.setupInputHandlers()
  }

  private createFeedingUI() {
    // Show food inventory
    this.inventoryText = this.scene.add.text(
      10,
      10,
      `Food: ${this.feedingSystem.foodInventory}`,
      {
        fontSize: '16px',
        color: '#333333',
        backgroundColor: '#ffffff',
        padding: { x: 8, y: 4 }
      }
    )

    // Hunger bar
    const hungerBar = this.scene.add.rectangle(10, 40, 100, 10, 0xff0000)
    this.hungerBar = this.scene.add.rectangle(
      10,
      40,
      this.feedingSystem.hungerLevel,
      10,
      0x00ff00
    )
    this.hungerBar.setOrigin(0, 0.5)
    hungerBar.setOrigin(0, 0.5)
  }

  private createFoodShop() {
    // Create food shop at the top right corner
    const shopX = this.scene.cameras.main.width - 60
    const shopY = 30

    this.foodShop = this.scene.add.rectangle(shopX, shopY, 80, 40, 0x8b4513)
    this.foodShop.setStrokeStyle(2, 0x654321)
    this.foodShop.setInteractive()

    this.scene.add
      .text(shopX, shopY, '🏪 SHOP', {
        fontSize: '12px',
        color: '#ffffff'
      })
      .setOrigin(0.5)

    // Click to buy food
    this.foodShop.on('pointerdown', () => {
      this.feedingSystem.buyFood()
      this.updateUI()
    })
  }

  private setupInputHandlers() {
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (
        !this.foodShop.getBounds().contains(pointer.x, pointer.y) &&
        this.feedingSystem.foodInventory > 0
      ) {
        this.feedingSystem.dropFood(pointer.x, pointer.y)
        this.updateUI()
      }
    })
  }

  updateUI() {
    if (this.inventoryText) {
      this.inventoryText.setText(`Food: ${this.feedingSystem.foodInventory}`)
    }
    if (this.hungerBar) {
      this.hungerBar.setSize(this.feedingSystem.hungerLevel, 10)
    }
  }
}

import { PetManager } from '@/game/managers/PetManager'

const UI_PADDING = 8

export class FeedingUI {
  private scene: Phaser.Scene
  private petManager: PetManager
  private inventoryText!: Phaser.GameObjects.Text
  private hungerBar!: Phaser.GameObjects.Rectangle

  constructor(scene: Phaser.Scene, petManager: PetManager) {
    this.scene = scene
    this.petManager = petManager
  }

  create() {
    console.log('🍔 Creating Feeding UI...')
    const activePet = this.petManager.getActivePet()
    console.log('Active pet for UI:', activePet ? activePet.id : 'None')

    this.inventoryText = this.scene.add.text(
      10,
      10,
      `Food: ${this.petManager.getFoodInventory()}`,
      {
        fontSize: '16px',
        color: '#333333',
        backgroundColor: '#ffffff',
        padding: { x: UI_PADDING, y: 4 }
      }
    )

    this.scene.add.rectangle(10, 40, 100, 10, 0xff0000).setOrigin(0, 0.5)
    this.hungerBar = this.scene.add
      .rectangle(
        10,
        40,
        activePet?.feedingSystem.hungerLevel || 100,
        10,
        0x00ff00
      )
      .setOrigin(0, 0.5)

    console.log('✅ Feeding UI created')
  }

  update() {
    const stats = this.petManager.getPetStats()
    const activePet = this.petManager.getActivePet()

    if (this.inventoryText) {
      this.inventoryText.setText(`Food: ${stats.totalFoodInventory}`)
    }
    if (this.hungerBar && activePet) {
      this.hungerBar.setSize(activePet.feedingSystem.hungerLevel, 10)
    }
  }
}

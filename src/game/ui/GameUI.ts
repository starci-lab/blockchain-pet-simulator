import { FeedingSystem } from '../systems/FeedingSystem'
import { useUserStore } from '@/store/userStore'

export class GameUI {
  private inventoryText!: Phaser.GameObjects.Text
  private hungerBar!: Phaser.GameObjects.Rectangle
  private foodIcon!: Phaser.GameObjects.Image
  private foodPriceText!: Phaser.GameObjects.Text
  private isDroppingFood: boolean = false
  private tokenText!: Phaser.GameObjects.Text
  private notificationText?: Phaser.GameObjects.Text

  private scene: Phaser.Scene
  private feedingSystem: FeedingSystem

  constructor(scene: Phaser.Scene, feedingSystem: FeedingSystem) {
    this.scene = scene
    this.feedingSystem = feedingSystem
  }

  create() {
    this.createFeedingUI()
    this.createTokenUI()
    this.createMiniShop()
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

  private createTokenUI() {
    // Token UI
    const tokenX = this.scene.cameras.main.width - 30
    const tokenY = 18
    const bg = this.scene.add.rectangle(tokenX, tokenY, 70, 28, 0xf5e6b3, 0.98)
    bg.setStrokeStyle(2, 0xc2a14d)
    bg.setOrigin(1, 0)
    this.tokenText = this.scene.add
      .text(tokenX - 8, tokenY + 2, '', {
        fontSize: '16px',
        color: '#a86c00',
        fontStyle: 'bold',
        fontFamily: 'monospace',
        padding: { x: 4, y: 2 }
      })
      .setOrigin(1, 0)
    this.updateTokenUI()
  }

  private updateTokenUI() {
    const nomToken = useUserStore.getState().nomToken
    this.tokenText.setText(`🪙 ${nomToken}`)
  }

  private createMiniShop() {
    // Shop UI
    const shopX = this.scene.cameras.main.width - 30
    const shopY = 18
    // Token background
    const tokenBg = this.scene.add.rectangle(
      shopX,
      shopY,
      70,
      28,
      0xf5e6b3,
      0.98
    )
    tokenBg.setStrokeStyle(2, 0xc2a14d)
    tokenBg.setOrigin(1, 0)
    // Token text
    this.tokenText = this.scene.add.text(shopX - 8, shopY + 2, '', {
      fontSize: '16px',
      color: '#a86c00',
      fontStyle: 'bold',
      fontFamily: 'monospace',
      padding: { x: 4, y: 2 }
    })
    this.tokenText.setOrigin(1, 0)
    this.updateTokenUI()
    // Food icon (ex hamburger)
    const iconX = shopX - 80
    const iconY = shopY + 14
    this.foodIcon = this.scene.add
      .image(iconX, iconY, 'hamburger')
      .setDisplaySize(32, 32)
      .setOrigin(0.5)
    this.foodIcon.setInteractive({ useHandCursor: true })
    // Price
    this.foodPriceText = this.scene.add
      .text(iconX, iconY + 22, '5', {
        fontSize: '14px',
        color: '#a86c00',
        fontStyle: 'bold',
        fontFamily: 'monospace'
      })
      .setOrigin(0.5, 0)
    // Coin icon
    this.scene.add
      .text(iconX + 16, iconY + 22, '🪙', { fontSize: '14px' })
      .setOrigin(0.5, 0)

    // Click on the food icon to enter the feed mode
    this.foodIcon.on('pointerdown', () => {
      if (
        this.feedingSystem.foodInventory > 0 ||
        useUserStore.getState().nomToken >= 5
      ) {
        this.isDroppingFood = true
        this.foodIcon.setAlpha(0.6)
        this.foodPriceText.setAlpha(0.6)
      } else {
        // Nếu không đủ token thì show notification
        this.showNotification('You do not have enough NOM tokens!')
      }
    })
  }

  private setupInputHandlers() {
    // Khi ở feed mode: click trái để place, phải để hủy
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!this.isDroppingFood) return
      // Nếu click phải thì hủy feed mode
      if (pointer.rightButtonDown()) {
        this.isDroppingFood = false
        this.foodIcon.setAlpha(1)
        this.foodPriceText.setAlpha(1)
        return
      }
      // If click to icon food then do not drop food
      const iconBounds = this.foodIcon.getBounds()
      if (Phaser.Geom.Rectangle.Contains(iconBounds, pointer.x, pointer.y)) {
        return
      }
      // Check if enough tokens, if yes then deduct and drop food
      const canBuy = this.feedingSystem.buyFood()
      if (!canBuy) {
        // If not enough tokens, show notification and exit feed mode
        this.showNotification('You do not have enough NOM tokens!')
        this.isDroppingFood = false
        this.foodIcon.setAlpha(1)
        this.foodPriceText.setAlpha(1)
        return
      }
      // Drop food at cursor position
      this.feedingSystem.dropFood(pointer.x, pointer.y)
      this.updateUI()
      // Kep the feed mode until user cancels or runs out of money
    })
  }

  private showNotification(message: string) {
    // Toast nhỏ gọn, không có nút xác nhận, tự ẩn sau 2.5s
    const toast = (this.scene as any).rexUI.add
      .dialog({
        x: this.scene.cameras.main.width / 2,
        y: 80,
        width: 180,
        background: (this.scene as any).rexUI.add.roundRectangle(
          0,
          0,
          0,
          0,
          12,
          0xf5a623
        ),
        content: this.scene.add.text(0, 0, message, {
          fontSize: '14px',
          color: '#fff',
          fontFamily: 'monospace',
          padding: { x: 8, y: 4 },
          wordWrap: { width: 150 },
          align: 'center'
        }),
        space: {
          content: 10,
          left: 10,
          right: 10,
          top: 10,
          bottom: 10
        }
      })
      .layout()
      .setDepth(1000)
      .popUp(300)

    this.scene.time.delayedCall(2500, () => {
      toast.destroy()
    })
  }

  updateUI() {
    if (this.inventoryText) {
      this.inventoryText.setText(`Food: ${this.feedingSystem.foodInventory}`)
    }
    if (this.hungerBar) {
      this.hungerBar.setSize(this.feedingSystem.hungerLevel, 10)
    }
    this.updateTokenUI()
  }
}

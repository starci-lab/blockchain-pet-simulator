import { FeedingSystem } from '../systems/FeedingSystem'
import { useUserStore } from '@/store/userStore'

const UI_PADDING = 8
const UI_FONT = 'monospace'
const TOKEN_BG_COLOR = 0xf5e6b3
const TOKEN_BORDER_COLOR = 0xc2a14d
const TOKEN_TEXT_COLOR = '#a86c00'
const SHOP_WIDTH = 70
const SHOP_HEIGHT = 28
const FOOD_ICON_SIZE = 32
const FOOD_PRICE = 5
const TOAST_WIDTH = 180
const TOAST_DURATION = 2500
const TOAST_BG_COLOR = 0xf5a623

export class GameUI {
  private scene: Phaser.Scene
  private feedingSystem: FeedingSystem

  private inventoryText!: Phaser.GameObjects.Text
  private hungerBar!: Phaser.GameObjects.Rectangle
  private foodIcon!: Phaser.GameObjects.Image
  private foodPriceText!: Phaser.GameObjects.Text
  private tokenText!: Phaser.GameObjects.Text
  private isDroppingFood = false
  private dropHintText?: Phaser.GameObjects.Text

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

  // Feeding UI
  private createFeedingUI() {
    this.inventoryText = this.scene.add.text(
      10,
      10,
      `Food: ${this.feedingSystem.foodInventory}`,
      {
        fontSize: '16px',
        color: '#333333',
        backgroundColor: '#ffffff',
        padding: { x: UI_PADDING, y: 4 }
      }
    )
    this.scene.add.rectangle(10, 40, 100, 10, 0xff0000).setOrigin(0, 0.5)
    this.hungerBar = this.scene.add
      .rectangle(10, 40, this.feedingSystem.hungerLevel, 10, 0x00ff00)
      .setOrigin(0, 0.5)
  }

  // Token UI
  private createTokenUI() {
    const tokenX = this.scene.cameras.main.width - 30
    const tokenY = 18
    const bg = this.scene.add.rectangle(
      tokenX,
      tokenY,
      SHOP_WIDTH,
      SHOP_HEIGHT,
      TOKEN_BG_COLOR,
      0.98
    )
    bg.setStrokeStyle(2, TOKEN_BORDER_COLOR).setOrigin(1, 0)
    this.tokenText = this.scene.add
      .text(tokenX - 8, tokenY + 2, '', {
        fontSize: '16px',
        color: TOKEN_TEXT_COLOR,
        fontStyle: 'bold',
        fontFamily: UI_FONT,
        padding: { x: 4, y: 2 }
      })
      .setOrigin(1, 0)
    this.updateTokenUI()
  }

  private updateTokenUI() {
    const nomToken = useUserStore.getState().nomToken
    this.tokenText.setText(`🪙 ${nomToken}`)
  }

  // Shop UI
  private createMiniShop() {
    const shopX = this.scene.cameras.main.width - 30
    const shopY = 18
    // Token background & text
    const tokenBg = this.scene.add.rectangle(
      shopX,
      shopY,
      SHOP_WIDTH,
      SHOP_HEIGHT,
      TOKEN_BG_COLOR,
      0.98
    )
    tokenBg.setStrokeStyle(2, TOKEN_BORDER_COLOR).setOrigin(1, 0)
    this.tokenText = this.scene.add
      .text(shopX - 8, shopY + 2, '', {
        fontSize: '16px',
        color: TOKEN_TEXT_COLOR,
        fontStyle: 'bold',
        fontFamily: UI_FONT,
        padding: { x: 4, y: 2 }
      })
      .setOrigin(1, 0)
    this.updateTokenUI()
    // Food icon
    const iconX = shopX - 80
    const iconY = shopY + 14
    this.foodIcon = this.scene.add
      .image(iconX, iconY, 'hamburger')
      .setDisplaySize(FOOD_ICON_SIZE, FOOD_ICON_SIZE)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
    // Price
    this.foodPriceText = this.scene.add
      .text(iconX, iconY + 22, FOOD_PRICE.toString(), {
        fontSize: '14px',
        color: TOKEN_TEXT_COLOR,
        fontStyle: 'bold',
        fontFamily: UI_FONT
      })
      .setOrigin(0.5, 0)
    // Coin icon
    this.scene.add
      .text(iconX + 16, iconY + 22, '🪙', { fontSize: '14px' })
      .setOrigin(0.5, 0)
    // Food icon click handler
    this.foodIcon.on('pointerdown', () => {
      if (
        this.feedingSystem.foodInventory > 0 ||
        useUserStore.getState().nomToken >= FOOD_PRICE
      ) {
        this.isDroppingFood = true
        this.foodIcon.setAlpha(0.6)
        this.foodPriceText.setAlpha(0.6)
        // Show drop hint text
        if (!this.dropHintText) {
          this.dropHintText = this.scene.add
            .text(
              this.scene.cameras.main.width / 2,
              10, // 10px from top
              'Left click to place, right click to cancel',
              {
                fontSize: '10px',
                color: '#fff',
                fontFamily: UI_FONT,
                stroke: '#000',
                strokeThickness: 3,
                align: 'center'
              }
            )
            .setOrigin(0.5, 0)
        } else {
          this.dropHintText.setY(20)
          this.dropHintText.setVisible(true)
        }
      } else {
        this.showNotification('You do not have enough NOM tokens!')
      }
    })
  }

  // Input handlers
  private setupInputHandlers() {
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!this.isDroppingFood) return
      if (pointer.rightButtonDown()) {
        this.isDroppingFood = false
        this.foodIcon.setAlpha(1)
        this.foodPriceText.setAlpha(1)
        // Hide drop hint text
        if (this.dropHintText) this.dropHintText.setVisible(false)
        return
      }
      const iconBounds = this.foodIcon.getBounds()
      if (Phaser.Geom.Rectangle.Contains(iconBounds, pointer.x, pointer.y)) {
        return
      }
      const canBuy = this.feedingSystem.buyFood()
      if (!canBuy) {
        this.showNotification(
          'You do not have enough NOM tokens!',
          pointer.x,
          pointer.y
        )
        return
      }
      this.feedingSystem.dropFood(pointer.x, pointer.y)
      this.updateUI()
    })
  }

  // Toast notification
  private showNotification(message: string, x?: number, y?: number) {
    const toastX = x !== undefined ? x : this.scene.cameras.main.width / 2
    const toastY = y !== undefined ? y : 80
    const toast = (this.scene as any).rexUI.add
      .dialog({
        x: toastX,
        y: toastY,
        width: TOAST_WIDTH,
        background: (this.scene as any).rexUI.add.roundRectangle(
          0,
          0,
          0,
          0,
          12,
          TOAST_BG_COLOR
        ),
        content: this.scene.add.text(0, 0, message, {
          fontSize: '14px',
          color: '#fff',
          fontFamily: UI_FONT,
          padding: { x: 8, y: 4 },
          wordWrap: { width: TOAST_WIDTH - 30 },
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
    this.scene.time.delayedCall(TOAST_DURATION, () => {
      toast.destroy()
    })
  }

  // Update all UI
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

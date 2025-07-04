import { PetManager } from '@/game/managers/PetManager'
import { useUserStore } from '@/store/userStore'
import { gameConfigManager } from '@/game/configs/gameConfig'

const UI_FONT = 'monospace'
const TOKEN_BG_COLOR = 0xf5e6b3
const TOKEN_BORDER_COLOR = 0xc2a14d
const TOKEN_TEXT_COLOR = '#a86c00'
const SHOP_WIDTH = 70
const SHOP_HEIGHT = 28
const FOOD_ICON_SIZE = 32

export class ShopUI {
  private scene: Phaser.Scene
  private petManager: PetManager
  private notificationUI: any
  private tokenText!: Phaser.GameObjects.Text
  private foodIcon!: Phaser.GameObjects.Image
  private foodPriceText!: Phaser.GameObjects.Text
  private onFoodIconClick?: () => void

  constructor(
    scene: Phaser.Scene,
    petManager: PetManager,
    notificationUI: any
  ) {
    this.scene = scene
    this.petManager = petManager
    this.notificationUI = notificationUI
  }

  create() {
    console.log('🛒 Creating Mini Shop...')
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

    // Price - get current price dynamically
    const currentPrice = gameConfigManager.getFoodPrice('hamburger')
    this.foodPriceText = this.scene.add
      .text(iconX, iconY + 22, currentPrice.toString(), {
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
      const currentPrice = gameConfigManager.getFoodPrice('hamburger')
      const hasInventory = this.petManager.getFoodInventory() > 0
      const hasTokens = useUserStore.getState().nomToken >= currentPrice

      if (hasInventory || hasTokens) {
        if (this.onFoodIconClick) {
          this.onFoodIconClick()
        }
      } else {
        this.notificationUI.showNotification(
          'You do not have enough NOM tokens!'
        )
      }
    })

    console.log('✅ Mini Shop created successfully')
  }

  updateTokenUI() {
    const nomToken = useUserStore.getState().nomToken
    this.tokenText.setText(`🪙 ${nomToken}`)
  }

  updatePriceDisplay() {
    if (this.foodPriceText) {
      const currentPrice = gameConfigManager.getFoodPrice('hamburger')
      this.foodPriceText.setText(currentPrice.toString())
    }
  }

  setFoodDropState(isDropping: boolean) {
    this.foodIcon.setAlpha(isDropping ? 0.6 : 1)
    this.foodPriceText.setAlpha(isDropping ? 0.6 : 1)
  }

  setOnFoodIconClick(callback: () => void) {
    this.onFoodIconClick = callback
  }

  getFoodIcon() {
    return this.foodIcon
  }
}

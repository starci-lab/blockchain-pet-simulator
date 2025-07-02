import { PetManager } from '@/game/managers/PetManager'
import { useUserStore } from '@/store/userStore'
import { gameConfigManager } from '@/game/configs/gameConfig'

const UI_PADDING = 8
const UI_FONT = 'monospace'
const TOKEN_BG_COLOR = 0xf5e6b3
const TOKEN_BORDER_COLOR = 0xc2a14d
const TOKEN_TEXT_COLOR = '#a86c00'
const SHOP_WIDTH = 70
const SHOP_HEIGHT = 28
const FOOD_ICON_SIZE = 32
const TOAST_WIDTH = 180
const TOAST_DURATION = 2500
const TOAST_BG_COLOR = 0xf5a623
const PET_PRICE = 50 // Price to buy a new pet

export class GameUI {
  private scene: Phaser.Scene
  private petManager: PetManager

  private inventoryText!: Phaser.GameObjects.Text
  private hungerBar!: Phaser.GameObjects.Rectangle
  private foodIcon!: Phaser.GameObjects.Image
  private foodPriceText!: Phaser.GameObjects.Text
  private tokenText!: Phaser.GameObjects.Text
  private isDroppingFood = false
  private dropHintText?: Phaser.GameObjects.Text
  private buyPetButton!: Phaser.GameObjects.Rectangle
  private _buyPetText!: Phaser.GameObjects.Text

  constructor(scene: Phaser.Scene, petManager: PetManager) {
    this.scene = scene
    this.petManager = petManager
  }

  create() {
    console.log('🎨 Creating GameUI...')
    this.createFeedingUI()
    this.createTokenUI()
    this.createMiniShop()
    this.createBuyPetButton()
    this.setupInputHandlers()
    console.log('✅ GameUI created successfully')
  }

  // Feeding UI
  private createFeedingUI() {
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
      if (
        this.petManager.getFoodInventory() > 0 ||
        useUserStore.getState().nomToken >= currentPrice
      ) {
        this.isDroppingFood = true
        this.foodIcon.setAlpha(0.6)
        this.foodPriceText.setAlpha(0.6)
        // Đổi cursor thành hình hamburger bằng setDefaultCursor
        this.scene.input.setDefaultCursor(
          'url(./src/assets/images/food/hambuger.png), pointer'
        )
        // Show drop hint text
        if (!this.dropHintText) {
          this.dropHintText = this.scene.add
            .text(
              this.scene.cameras.main.width / 2,
              10, // 10px from top
              'Left click to place, double click to cancel',
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
          this.dropHintText.setText(
            'Left click to place, double click to cancel'
          )
          this.dropHintText.setY(20)
          this.dropHintText.setVisible(true)
        }
      } else {
        this.showNotification('You do not have enough NOM tokens!')
      }
    })
    console.log('✅ Mini Shop created successfully')
  }

  // Input handlers
  private setupInputHandlers() {
    console.log('⌨️ Setting up input handlers...')

    // Track click timing for double click detection
    let lastClickTime = 0
    let pendingDrop: { x: number; y: number } | null = null
    let dropTimeout: Phaser.Time.TimerEvent | null = null
    const DOUBLE_CLICK_THRESHOLD = 300 // ms

    // Helper function to exit food dropping mode
    const exitFoodDropMode = () => {
      this.isDroppingFood = false
      this.foodIcon.setAlpha(1)
      this.foodPriceText.setAlpha(1)
      this.scene.input.setDefaultCursor(
        'url(/assets/images/cursor/navigation_nw.png), pointer'
      )
      if (this.dropHintText) this.dropHintText.setVisible(false)

      // Clean up pending drop
      if (dropTimeout) {
        dropTimeout.destroy()
        dropTimeout = null
      }
      pendingDrop = null

      console.log('🚪 Exited food dropping mode')
    }

    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!this.isDroppingFood) return

      // Check if clicking on food icon (ignore)
      const iconBounds = this.foodIcon.getBounds()
      if (Phaser.Geom.Rectangle.Contains(iconBounds, pointer.x, pointer.y)) {
        return
      }

      const currentTime = Date.now()
      const timeDiff = currentTime - lastClickTime
      lastClickTime = currentTime

      if (timeDiff < DOUBLE_CLICK_THRESHOLD && pendingDrop) {
        // Double click detected - cancel pending drop and exit mode
        exitFoodDropMode()
        return
      }

      // Single click - prepare to drop food but wait for potential double click
      pendingDrop = { x: pointer.x, y: pointer.y }

      // Cancel any existing timeout
      if (dropTimeout) {
        dropTimeout.destroy()
      }

      // Set timer to actually drop food if no second click comes
      dropTimeout = this.scene.time.delayedCall(DOUBLE_CLICK_THRESHOLD, () => {
        if (pendingDrop && this.isDroppingFood) {
          // Actually drop the food now
          const canBuy = this.petManager.buyFood()
          if (!canBuy) {
            this.showNotification(
              'You do not have enough NOM tokens!',
              pendingDrop.x,
              pendingDrop.y
            )
          } else {
            this.petManager.dropFood(pendingDrop.x, pendingDrop.y)
            this.updateUI()
          }
        }

        // Clean up only the pending drop and timeout, keep dropping mode active
        pendingDrop = null
        dropTimeout = null
      })
    })

    console.log('✅ Input handlers set up successfully')
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
  // Buy Pet Button
  private createBuyPetButton() {
    console.log('🏪 Creating Buy Pet Button...')

    // Position button below the shop
    const buttonX = this.scene.cameras.main.width - 100
    const buttonY = 60 // Below the token UI
    const buttonWidth = 80
    const buttonHeight = 30

    // Button background
    this.buyPetButton = this.scene.add
      .rectangle(buttonX, buttonY, buttonWidth, buttonHeight, 0x4caf50, 0.9)
      .setStrokeStyle(2, 0x388e3c)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })

    // Button text
    this._buyPetText = this.scene.add
      .text(buttonX, buttonY, `Buy Pet\n🪙${PET_PRICE}`, {
        fontSize: '12px',
        color: '#ffffff',
        fontStyle: 'bold',
        fontFamily: UI_FONT,
        align: 'center'
      })
      .setOrigin(0.5)

    // Button click handler
    this.buyPetButton.on('pointerdown', () => {
      // Use DOM modal (most reliable)
      this.showDOMBuyPetModal()
    })

    // Hover effects
    this.buyPetButton.on('pointerover', () => {
      this.buyPetButton.setFillStyle(0x66bb6a)
    })

    this.buyPetButton.on('pointerout', () => {
      this.buyPetButton.setFillStyle(0x4caf50)
    })

    console.log('✅ Buy Pet Button created successfully')
  }

  // DOM Modal (Most Reliable)
  private showDOMBuyPetModal() {
    console.log('🛒 Showing DOM Buy Pet Modal...')

    const currentTokens = useUserStore.getState().nomToken
    const canAfford = currentTokens >= PET_PRICE

    // Create modal window (game-style, no overlay)
    const modalWindow = document.createElement('div')
    modalWindow.id = 'pet-buy-modal'
    modalWindow.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(145deg, #4A90E2, #357ABD);
      border: 3px solid #2E5C8A;
      border-radius: 15px;
      padding: 25px;
      text-align: center;
      color: white;
      width: 350px;
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
      z-index: 10000;
      font-family: monospace;
      animation: modalSlideIn 0.3s ease-out;
    `

    // Add CSS animation
    if (!document.getElementById('modal-styles')) {
      const style = document.createElement('style')
      style.id = 'modal-styles'
      style.textContent = `
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translate(-50%, -60%) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }
      `
      document.head.appendChild(style)
    }

    // Title with close button
    const titleContainer = document.createElement('div')
    titleContainer.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    `

    const title = document.createElement('h2')
    title.textContent = '🐕 Buy New Pet'
    title.style.cssText = `
      margin: 0;
      font-size: 24px;
      color: white;
    `

    // Close button (X)
    const closeButton = document.createElement('button')
    closeButton.textContent = '×'
    closeButton.style.cssText = `
      background: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: white;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 20px;
      font-weight: bold;
      display: flex;
      align-items: center;
      justify-content: center;
    `

    closeButton.onmouseover = () => {
      closeButton.style.background = 'rgba(255, 255, 255, 0.3)'
    }
    closeButton.onmouseout = () => {
      closeButton.style.background = 'rgba(255, 255, 255, 0.2)'
    }

    closeButton.onclick = () => {
      this.closeDOMModal()
    }

    titleContainer.appendChild(title)
    titleContainer.appendChild(closeButton)

    // Content text
    const content = document.createElement('p')
    const contentText = canAfford
      ? `Do you want to buy a new pet for ${PET_PRICE} tokens?\n\nYour tokens: ${currentTokens}`
      : `Not enough tokens!\n\nNeed: ${PET_PRICE} tokens\nYour tokens: ${currentTokens}`

    content.textContent = contentText
    content.style.cssText = `
      margin: 0 0 30px 0;
      font-size: 16px;
      line-height: 1.5;
      white-space: pre-line;
    `

    // Buttons container
    const buttonsContainer = document.createElement('div')
    buttonsContainer.style.cssText = `
      display: flex;
      gap: 20px;
      justify-content: center;
    `

    if (canAfford) {
      // Buy button
      const buyButton = document.createElement('button')
      buyButton.textContent = 'Buy Pet'
      buyButton.style.cssText = `
        background: #4CAF50;
        border: 2px solid #388E3C;
        color: white;
        padding: 12px 24px;
        font-size: 16px;
        font-weight: bold;
        border-radius: 8px;
        cursor: pointer;
        font-family: monospace;
      `

      buyButton.onmouseover = () => {
        buyButton.style.background = '#66BB6A'
      }
      buyButton.onmouseout = () => {
        buyButton.style.background = '#4CAF50'
      }

      buyButton.onclick = () => {
        this.processPetPurchase()
        this.closeDOMModal()
      }

      // Cancel button
      const cancelButton = document.createElement('button')
      cancelButton.textContent = 'Cancel'
      cancelButton.style.cssText = `
        background: #F44336;
        border: 2px solid #D32F2F;
        color: white;
        padding: 12px 24px;
        font-size: 16px;
        font-weight: bold;
        border-radius: 8px;
        cursor: pointer;
        font-family: monospace;
      `

      cancelButton.onmouseover = () => {
        cancelButton.style.background = '#EF5350'
      }
      cancelButton.onmouseout = () => {
        cancelButton.style.background = '#F44336'
      }

      cancelButton.onclick = () => {
        this.closeDOMModal()
      }

      buttonsContainer.appendChild(buyButton)
      buttonsContainer.appendChild(cancelButton)
    } else {
      // Close button only
      const closeButton = document.createElement('button')
      closeButton.textContent = 'Close'
      closeButton.style.cssText = `
        background: #757575;
        border: 2px solid #616161;
        color: white;
        padding: 12px 24px;
        font-size: 16px;
        font-weight: bold;
        border-radius: 8px;
        cursor: pointer;
        font-family: monospace;
      `

      closeButton.onmouseover = () => {
        closeButton.style.background = '#9E9E9E'
      }
      closeButton.onmouseout = () => {
        closeButton.style.background = '#757575'
      }

      closeButton.onclick = () => {
        this.closeDOMModal()
      }

      buttonsContainer.appendChild(closeButton)
    }

    // Assemble modal (no overlay, direct window)
    modalWindow.appendChild(titleContainer)
    modalWindow.appendChild(content)
    modalWindow.appendChild(buttonsContainer)

    // Add to DOM
    document.body.appendChild(modalWindow)

    // Add ESC key listener
    const escListener = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.closeDOMModal()
        document.removeEventListener('keydown', escListener)
      }
    }
    document.addEventListener('keydown', escListener)

    console.log('✅ DOM Modal shown')
  }

  private closeDOMModal() {
    const modal = document.getElementById('pet-buy-modal')
    if (modal) {
      modal.remove()
      console.log('📷 DOM modal closed')
    }
  }

  // Process Pet Purchase
  private processPetPurchase() {
    console.log('💰 Processing pet purchase...')

    const userStore = useUserStore.getState()
    const currentTokens = userStore.nomToken

    if (currentTokens < PET_PRICE) {
      this.showNotification('Not enough tokens!')
      return
    }

    // Deduct tokens
    useUserStore.getState().setNomToken(currentTokens - PET_PRICE)

    // Generate new pet ID
    const petId = `pet_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`

    // Find a spawn position (same ground line as other pets)
    const groundY = this.scene.cameras.main.height - 40 // Same as GROUND_OFFSET in GameScene
    const spawnX = Math.random() * (this.scene.cameras.main.width - 200) + 100
    const spawnY = groundY

    // Create new pet through PetManager
    this.petManager.createPet(petId, spawnX, spawnY)

    // Update UI
    this.updateUI()

    // Show success notification
    this.showNotification(`New pet purchased! 🐕`)

    console.log(
      `✅ Pet ${petId} purchased successfully for ${PET_PRICE} tokens`
    )

    // TODO: Later add backend call to save pet purchase
    // await this.savePetPurchaseToBackend(petId)
  }

  // Update all UI
  updateUI() {
    const stats = this.petManager.getPetStats()
    const activePet = this.petManager.getActivePet()

    if (this.inventoryText) {
      this.inventoryText.setText(`Food: ${stats.totalFoodInventory}`)
    }
    if (this.hungerBar && activePet) {
      this.hungerBar.setSize(activePet.feedingSystem.hungerLevel, 10)
    }

    // Update price display in case it changed
    if (this.foodPriceText) {
      const currentPrice = gameConfigManager.getFoodPrice('hamburger')
      this.foodPriceText.setText(currentPrice.toString())
    }

    this.updateTokenUI()
  }

  // Debug method to show pet stats
  showPetStats() {
    const stats = this.petManager.getPetStats()
    console.log('🐕 Pet Manager Stats:', stats)

    stats.pets.forEach((pet) => {
      console.log(`Pet ${pet.id} ${pet.isActive ? '(ACTIVE)' : ''}:`)
      console.log(`  Hunger: ${pet.hungerLevel.toFixed(1)}%`)
      console.log(`  Activity: ${pet.currentActivity}`)
      console.log(`  Food Inventory: ${pet.foodInventory}`)
    })
  }
}

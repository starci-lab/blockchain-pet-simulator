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
    console.log('✅ Mini Shop created successfully')
  }

  // Input handlers
  private setupInputHandlers() {
    console.log('⌨️ Setting up input handlers...')
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!this.isDroppingFood) return
      if (pointer.rightButtonDown()) {
        this.isDroppingFood = false
        this.foodIcon.setAlpha(1)
        this.foodPriceText.setAlpha(1)
        // Trả cursor về mặc định sau khi thả thức ăn
        this.scene.input.setDefaultCursor(
          'url(/assets/images/cursor/navigation_nw.png), pointer'
        )
        // Hide drop hint text
        if (this.dropHintText) this.dropHintText.setVisible(false)
        return
      }
      const iconBounds = this.foodIcon.getBounds()
      if (Phaser.Geom.Rectangle.Contains(iconBounds, pointer.x, pointer.y)) {
        return
      }
      const canBuy = this.petManager.buyFood()
      if (!canBuy) {
        this.showNotification(
          'You do not have enough NOM tokens!',
          pointer.x,
          pointer.y
        )
        return
      }
      this.petManager.dropFood(pointer.x, pointer.y)
      this.updateUI()
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

    // Create modal overlay
    const modalOverlay = document.createElement('div')
    modalOverlay.id = 'pet-buy-modal'
    modalOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      font-family: monospace;
    `

    // Create modal content
    const modalContent = document.createElement('div')
    modalContent.style.cssText = `
      background: #2196F3;
      border: 4px solid #1976D2;
      border-radius: 20px;
      padding: 30px;
      text-align: center;
      color: white;
      max-width: 400px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    `

    // Title
    const title = document.createElement('h2')
    title.textContent = '🐕 Buy New Pet'
    title.style.cssText = `
      margin: 0 0 20px 0;
      font-size: 24px;
      color: white;
    `

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

    // Assemble modal
    modalContent.appendChild(title)
    modalContent.appendChild(content)
    modalContent.appendChild(buttonsContainer)
    modalOverlay.appendChild(modalContent)

    // Add to DOM
    document.body.appendChild(modalOverlay)

    // Close on overlay click
    modalOverlay.onclick = (e) => {
      if (e.target === modalOverlay) {
        this.closeDOMModal()
      }
    }

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

  // Buy Pet Modal (RexUI version - backup)
  /*
  private _showBuyPetModal() {
    console.log('🛒 Showing Buy Pet Modal...')

    const currentTokens = useUserStore.getState().nomToken
    const canAfford = currentTokens >= PET_PRICE

    const modalContent = canAfford
      ? `Do you want to buy a new pet for ${PET_PRICE} tokens?\n\nYour tokens: ${currentTokens}`
      : `Not enough tokens!\n\nNeed: ${PET_PRICE} tokens\nYour tokens: ${currentTokens}`

    console.log('📱 Modal content:', modalContent)
    console.log('💰 Can afford:', canAfford)

    // Temporarily expand camera to full screen for modal
    const originalHeight = this.scene.cameras.main.height
    const originalY = this.scene.cameras.main.scrollY

    console.log('📷 Original camera height:', originalHeight, 'Y:', originalY)

    // Set camera to cover full screen
    this.scene.cameras.main.setViewport(
      0,
      0,
      window.innerWidth,
      window.innerHeight
    )
    this.scene.cameras.main.setScroll(0, 0)

    console.log('📷 Camera updated to:', window.innerWidth, 'x', window.innerHeight)

    // Use window dimensions for full-screen modal positioning
    const screenCenterX = window.innerWidth / 2
    const screenCenterY = window.innerHeight / 2

    console.log('🎯 Modal position:', screenCenterX, screenCenterY)

    // Create semi-transparent overlay background
    const overlay = this.scene.add
      .rectangle(0, 0, window.innerWidth, window.innerHeight, 0x000000, 0.5)
      .setOrigin(0, 0)
      .setDepth(1500)

    console.log('🖤 Overlay created')

    // Check if rexUI is available
    if (!(this.scene as any).rexUI) {
      console.error('❌ RexUI plugin not found!')
      this.showSimpleBuyPetModal() // Fallback to simple modal
      return
    }

    console.log('🔧 Creating RexUI modal...')

    try {
      const modal = (this.scene as any).rexUI.add
        .dialog({
          x: screenCenterX,
          y: screenCenterY,
          width: 300,
          height: 200,
          background: (this.scene as any).rexUI.add
            .roundRectangle(0, 0, 0, 0, 20, 0x2196f3)
            .setStrokeStyle(3, 0x1976d2),

          title: (this.scene as any).rexUI.add.label({
            background: (this.scene as any).rexUI.add.roundRectangle(
              0,
              0,
              0,
              0,
              15,
              0x1976d2
            ),
            text: this.scene.add.text(0, 0, '🐕 Buy New Pet', {
              fontSize: '18px',
              color: '#ffffff',
              fontStyle: 'bold',
              fontFamily: UI_FONT
            }),
            space: { left: 15, right: 15, top: 10, bottom: 10 }
          }),

          content: this.scene.add.text(0, 0, modalContent, {
            fontSize: '14px',
            color: '#ffffff',
            fontFamily: UI_FONT,
            align: 'center',
            wordWrap: { width: 250 }
          }),

          actions: canAfford
            ? [
                (this.scene as any).rexUI.add.label({
                  background: (this.scene as any).rexUI.add.roundRectangle(
                    0,
                    0,
                    0,
                    0,
                    10,
                    0x4caf50
                  ),
                  text: this.scene.add.text(0, 0, 'Buy', {
                    fontSize: '14px',
                    color: '#ffffff',
                    fontFamily: UI_FONT
                  }),
                  space: { left: 15, right: 15, top: 8, bottom: 8 }
                }),
                (this.scene as any).rexUI.add.label({
                  background: (this.scene as any).rexUI.add.roundRectangle(
                    0,
                    0,
                    0,
                    0,
                    10,
                    0xf44336
                  ),
                  text: this.scene.add.text(0, 0, 'Cancel', {
                    fontSize: '14px',
                    color: '#ffffff',
                    fontFamily: UI_FONT
                  }),
                  space: { left: 15, right: 15, top: 8, bottom: 8 }
                })
              ]
            : [
                (this.scene as any).rexUI.add.label({
                  background: (this.scene as any).rexUI.add.roundRectangle(
                    0,
                    0,
                    0,
                    0,
                    10,
                    0x757575
                  ),
                  text: this.scene.add.text(0, 0, 'Close', {
                    fontSize: '14px',
                    color: '#ffffff',
                    fontFamily: UI_FONT
                  }),
                  space: { left: 15, right: 15, top: 8, bottom: 8 }
                })
              ],

          space: {
            title: 15,
            content: 20,
            action: 15,
            left: 20,
            right: 20,
            top: 20,
            bottom: 20
          }
        })
        .layout()
        .setDepth(2000)

      console.log('✅ Modal created successfully')
      
      // Try different approach to show modal
      modal.setVisible(true)
      modal.popUp(300)

      console.log('🎭 Modal should be visible now')

      // Handle modal actions
      modal.on(
        'button.click',
        (_button: any, _groupName: string, index: number) => {
          console.log('🖱️ Button clicked, index:', index)
          
          if (canAfford) {
            if (index === 0) {
              // Buy button
              this.processPetPurchase()
            }
            // index === 1 is Cancel button - just close modal
          }

          // Cleanup and restore camera when modal closes
          overlay.destroy()

          // Restore original camera viewport
          this.scene.cameras.main.setViewport(
            0,
            0,
            window.innerWidth,
            originalHeight
          )
          this.scene.cameras.main.setScroll(0, originalY)

          console.log('📷 Camera restored')

          // Close modal
          modal.scaleDownDestroy(200)
        }
      )

      console.log('✅ Buy Pet Modal shown with debug logs')
      
    } catch (error) {
      console.error('❌ Error creating modal:', error)
      
      // Cleanup on error
      overlay.destroy()
      this.scene.cameras.main.setViewport(
        0,
        0,
        window.innerWidth,
        originalHeight
      )
      this.scene.cameras.main.setScroll(0, originalY)
    }
  }
  */

  // Simple Modal Fallback (backup - not used)
  /*
  private showSimpleBuyPetModal() {
    console.log('🛒 Showing Simple Buy Pet Modal...')

    const currentTokens = useUserStore.getState().nomToken
    const canAfford = currentTokens >= PET_PRICE

    // Temporarily expand camera to full screen for modal
    const originalHeight = this.scene.cameras.main.height
    const originalY = this.scene.cameras.main.scrollY

    // Set camera to cover full screen
    this.scene.cameras.main.setViewport(
      0,
      0,
      window.innerWidth,
      window.innerHeight
    )
    this.scene.cameras.main.setScroll(0, 0)

    // Use window dimensions for full-screen modal positioning
    const screenCenterX = window.innerWidth / 2
    const screenCenterY = window.innerHeight / 2

    // Create semi-transparent overlay background
    const overlay = this.scene.add
      .rectangle(0, 0, window.innerWidth, window.innerHeight, 0x000000, 0.7)
      .setOrigin(0, 0)
      .setDepth(1500)
      .setInteractive()

    // Modal background
    const modalBg = this.scene.add
      .rectangle(screenCenterX, screenCenterY, 400, 250, 0x2196f3, 1)
      .setDepth(2000)
      .setStrokeStyle(4, 0x1976d2)

    // Title
    const title = this.scene.add
      .text(screenCenterX, screenCenterY - 80, '🐕 Buy New Pet', {
        fontSize: '24px',
        color: '#ffffff',
        fontStyle: 'bold',
        fontFamily: UI_FONT
      })
      .setOrigin(0.5)
      .setDepth(2001)

    // Content
    const content = canAfford
      ? `Do you want to buy a new pet for ${PET_PRICE} tokens?\n\nYour tokens: ${currentTokens}`
      : `Not enough tokens!\n\nNeed: ${PET_PRICE} tokens\nYour tokens: ${currentTokens}`

    const contentText = this.scene.add
      .text(screenCenterX, screenCenterY - 20, content, {
        fontSize: '16px',
        color: '#ffffff',
        fontFamily: UI_FONT,
        align: 'center',
        wordWrap: { width: 350 }
      })
      .setOrigin(0.5)
      .setDepth(2001)

    // Buttons
    let buyButton: Phaser.GameObjects.Rectangle
    let buyText: Phaser.GameObjects.Text
    let cancelButton: Phaser.GameObjects.Rectangle
    let cancelText: Phaser.GameObjects.Text
    let closeButton: Phaser.GameObjects.Rectangle
    let closeText: Phaser.GameObjects.Text

    if (canAfford) {
      // Buy button
      buyButton = this.scene.add
        .rectangle(screenCenterX - 70, screenCenterY + 70, 120, 40, 0x4caf50)
        .setDepth(2001)
        .setInteractive({ useHandCursor: true })
        .setStrokeStyle(2, 0x388e3c)

      buyText = this.scene.add
        .text(screenCenterX - 70, screenCenterY + 70, 'Buy Pet', {
          fontSize: '16px',
          color: '#ffffff',
          fontStyle: 'bold',
          fontFamily: UI_FONT
        })
        .setOrigin(0.5)
        .setDepth(2002)

      buyButton.on('pointerdown', () => {
        this.processPetPurchase()
        const elements = [
          overlay,
          modalBg,
          title,
          contentText,
          buyButton,
          buyText,
          cancelButton,
          cancelText
        ].filter(Boolean)
        this.closeSimpleModal(elements, originalHeight, originalY)
      })

      // Cancel button
      cancelButton = this.scene.add
        .rectangle(screenCenterX + 70, screenCenterY + 70, 120, 40, 0xf44336)
        .setDepth(2001)
        .setInteractive({ useHandCursor: true })
        .setStrokeStyle(2, 0xd32f2f)

      cancelText = this.scene.add
        .text(screenCenterX + 70, screenCenterY + 70, 'Cancel', {
          fontSize: '16px',
          color: '#ffffff',
          fontStyle: 'bold',
          fontFamily: UI_FONT
        })
        .setOrigin(0.5)
        .setDepth(2002)

      cancelButton.on('pointerdown', () => {
        const elements = [
          overlay,
          modalBg,
          title,
          contentText,
          buyButton,
          buyText,
          cancelButton,
          cancelText
        ].filter(Boolean)
        this.closeSimpleModal(elements, originalHeight, originalY)
      })
    } else {
      // Close button only
      closeButton = this.scene.add
        .rectangle(screenCenterX, screenCenterY + 70, 120, 40, 0x757575)
        .setDepth(2001)
        .setInteractive({ useHandCursor: true })
        .setStrokeStyle(2, 0x616161)

      closeText = this.scene.add
        .text(screenCenterX, screenCenterY + 70, 'Close', {
          fontSize: '16px',
          color: '#ffffff',
          fontStyle: 'bold',
          fontFamily: UI_FONT
        })
        .setOrigin(0.5)
        .setDepth(2002)

      closeButton.on('pointerdown', () => {
        const elements = [
          overlay,
          modalBg,
          title,
          contentText,
          closeButton,
          closeText
        ].filter(Boolean)
        this.closeSimpleModal(elements, originalHeight, originalY)
      })
    }

    console.log('✅ Simple Modal shown')
  }

  private closeSimpleModal(
    elements: Phaser.GameObjects.GameObject[],
    originalHeight: number,
    originalY: number
  ) {
    // Destroy all modal elements
    elements.forEach((element) => element.destroy())

    // Restore original camera viewport
    this.scene.cameras.main.setViewport(0, 0, window.innerWidth, originalHeight)
    this.scene.cameras.main.setScroll(0, originalY)

    console.log('📷 Simple modal closed and camera restored')
  }
  */

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

    // Find a spawn position (random position on screen)
    const spawnX = Math.random() * (this.scene.cameras.main.width - 200) + 100
    const spawnY = Math.random() * (this.scene.cameras.main.height - 200) + 100

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

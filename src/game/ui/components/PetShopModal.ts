import { PetManager } from '@/game/managers/PetManager'
import { useUserStore } from '@/store/userStore'

const PET_PRICE = 50 // Price to buy a new pet

export class PetShopModal {
  private scene: Phaser.Scene
  private petManager: PetManager
  private notificationUI: any

  constructor(
    scene: Phaser.Scene,
    petManager: PetManager,
    notificationUI: any
  ) {
    this.scene = scene
    this.petManager = petManager
    this.notificationUI = notificationUI
  }

  // DOM Modal (Most Reliable)
  showBuyPetModal() {
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
      this.closeModal()
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
        this.closeModal()
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
        this.closeModal()
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
        this.closeModal()
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
        this.closeModal()
        document.removeEventListener('keydown', escListener)
      }
    }
    document.addEventListener('keydown', escListener)

    console.log('✅ DOM Modal shown')
  }

  private closeModal() {
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
      this.notificationUI.showNotification('Not enough tokens!')
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

    // Show success notification
    this.notificationUI.showNotification(`New pet purchased! 🐕`)

    console.log(
      `✅ Pet ${petId} purchased successfully for ${PET_PRICE} tokens`
    )

    // TODO: Later add backend call to save pet purchase
    // await this.savePetPurchaseToBackend(petId)
  }
}

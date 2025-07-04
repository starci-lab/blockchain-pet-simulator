import { GameRoomState } from '@/game/schema/ChatSchema'
import { Room, Client, getStateCallbacks } from 'colyseus.js'
import { useUserStore } from '@/store/userStore'

export class ColyseusClient {
  public room: Room<GameRoomState> | null = null
  private scene: Phaser.Scene
  private stateCallbacksSetup = false
  private gameUI: any // Reference to GameUI for notifications

  constructor(scene: Phaser.Scene, gameUI?: any) {
    this.scene = scene
    this.gameUI = gameUI
  }

  // Method to set GameUI reference after initialization
  setGameUI(gameUI: any) {
    this.gameUI = gameUI
  }

  // ===== CONNECTION MANAGEMENT =====

  async connect(backendUrl: string) {
    const statusText = this.showConnectionStatus('Connecting...')
    const client = new Client(backendUrl)

    try {
      console.log('🔄 Connecting to Colyseus:', backendUrl)

      this.room = await client.joinOrCreate('game', { name: 'Pet Game' })

      console.log('✅ Connected to Colyseus!')
      statusText.setText('✅ Connected!')
      statusText.setStyle({ color: '#00ff00' })

      this.setupEventListeners()
      this.hideStatusAfterDelay(statusText, 3000)
    } catch (error) {
      console.error('❌ Connection failed:', error)
      statusText.setText('❌ Connection failed!')
      statusText.setStyle({ color: '#ff0000' })
      this.room = null
    }
  }

  isConnected(): boolean {
    return !!this.room
  }

  sendMessage(type: string, data: any) {
    if (this.room) {
      console.log(`📤 Sending: ${type}`, data)
      this.room.send(type, data)
    } else {
      console.warn('⚠️ Cannot send message - not connected')
    }
  }

  // ===== EVENT LISTENERS SETUP =====

  private setupEventListeners() {
    if (!this.room) return

    // State changes
    this.room.onStateChange((state) => {
      console.log('🔄 State changed')
      this.setupStateCallbacks(state)
    })

    // Message handling
    this.room.onMessage('*', (type, message) => {
      console.log('📨 Message:', type, message)
      if (typeof type === 'string') {
        this.handleMessage(type, message)
      }
    })

    // Connection events
    this.room.onError((code, message) => {
      console.error('❌ Room error:', code, message)
    })

    this.room.onLeave((code) => {
      console.log('👋 Left room:', code)
    })
  }

  // ===== MESSAGE HANDLING =====

  private handleMessage(type: string, message: any) {
    switch (type) {
      case 'food-purchase-response':
        this.handleFoodPurchase(message)
        break

      case 'food-drop-response':
        this.handleFoodDrop(message)
        break

      case 'player-state-sync':
        this.handlePlayerSync(message)
        break

      case 'welcome':
        this.requestPlayerState()
        break

      default:
        // Other messages can be handled here
        break
    }
  }

  private handleFoodPurchase(message: any) {
    console.log('🛒 Purchase response:', message)

    if (message.success) {
      // Update tokens from server
      if (message.currentTokens !== undefined) {
        useUserStore.getState().setNomToken(message.currentTokens)
        console.log(`💰 Tokens updated: ${message.currentTokens}`)
      }

      // Update inventory
      this.updateLocalInventory(message.quantity, 'add')
      // Remove success notification for buy-and-drop operations
      // this.showNotification(`✅ ${message.message}`, '#00ff00')
    } else {
      // Sync tokens even on failure
      if (message.currentTokens !== undefined) {
        useUserStore.getState().setNomToken(message.currentTokens)
      }

      // Show styled notification for purchase failure via GameUI
      if (this.gameUI && this.gameUI.showNotification) {
        this.gameUI.showNotification(`❌ ${message.message}`)
      }
    }
  }

  private handleFoodDrop(message: any) {
    console.log('🍎 Drop response:', message)

    if (!message.success) {
      // Revert inventory on failed drop
      this.updateLocalInventory(1, 'add')
      // Show styled notification for drop failure via GameUI
      if (this.gameUI && this.gameUI.showNotification) {
        this.gameUI.showNotification(`❌ ${message.error}`)
      }
    }
    // Success is handled by 'food-dropped' broadcast
  }

  private handlePlayerSync(message: any) {
    console.log('👤 Player sync:', message)

    if (message.tokens !== undefined) {
      useUserStore.getState().setNomToken(message.tokens)
      console.log(`💰 Synced tokens: ${message.tokens}`)
    }

    if (message.inventory) {
      const totalInventory = Object.values(message.inventory).reduce(
        (sum: number, item: any) => sum + (item.quantity || 0),
        0
      )
      this.setLocalInventory(totalInventory)
    }
  }

  // ===== STATE CALLBACKS SETUP =====

  private setupStateCallbacks(state: GameRoomState) {
    if (this.stateCallbacksSetup) return
    this.stateCallbacksSetup = true

    const $ = getStateCallbacks(this.room!)

    // Player tokens sync
    $(state).players.onAdd((player: any, playerId: string) => {
      if (this.room && playerId === this.room.sessionId) {
        $(player).listen('tokens', (current: number, previous: number) => {
          console.log(`💰 Tokens changed: ${previous} -> ${current}`)
          useUserStore.getState().setNomToken(current)
        })

        // Inventory sync
        $(player).foodInventory.onChange(() => {
          this.syncInventoryFromServer(player.foodInventory)
        })
      }
    })

    // Food drops sync
    $(state).droppedFood.onAdd((food: any, foodId: string) => {
      console.log('🍎 Food added:', foodId)
      this.addFoodToScene(foodId, food)
    })

    $(state).droppedFood.onRemove((_food: any, foodId: string) => {
      console.log('🗑️ Food removed:', foodId)
      this.removeFoodFromScene(foodId)
    })
  }

  // ===== INVENTORY MANAGEMENT =====

  private updateLocalInventory(amount: number, operation: 'add' | 'subtract') {
    const petManager = this.getPetManager()
    if (petManager?.feedingSystem) {
      if (operation === 'add') {
        petManager.feedingSystem.foodInventory += amount
      } else {
        petManager.feedingSystem.foodInventory = Math.max(
          0,
          petManager.feedingSystem.foodInventory - amount
        )
      }
      console.log(
        `📦 Inventory ${operation}: ${petManager.feedingSystem.foodInventory}`
      )
    }
  }

  private setLocalInventory(amount: number) {
    const petManager = this.getPetManager()
    if (petManager?.feedingSystem) {
      petManager.feedingSystem.foodInventory = amount
      console.log(`📦 Inventory set to: ${amount}`)
    }
  }

  private syncInventoryFromServer(serverInventory: any) {
    let total = 0
    if (serverInventory?.size) {
      serverInventory.forEach((item: any) => {
        total += item.quantity || 0
      })
    }
    this.setLocalInventory(total)
  }

  // ===== FOOD MANAGEMENT =====

  private addFoodToScene(foodId: string, food: any) {
    const petManager = this.getPetManager()
    if (petManager) {
      petManager.addSharedFoodFromServer(foodId, food)
      console.log('🍎 Added food to scene:', foodId)
    }
  }

  private removeFoodFromScene(foodId: string) {
    const petManager = this.getPetManager()
    if (petManager) {
      petManager.removeSharedFoodByServerId(foodId)
      console.log('🗑️ Removed food from scene:', foodId)
    }
  }

  // ===== UTILITY METHODS =====

  private getPetManager() {
    const gameScene = this.scene as any
    if (
      gameScene.getPetManager &&
      typeof gameScene.getPetManager === 'function'
    ) {
      return gameScene.getPetManager()
    }
    return null
  }

  private requestPlayerState() {
    this.sendMessage('request-player-state', {})
  }

  private showConnectionStatus(text: string) {
    return this.scene.add
      .text(10, 70, text)
      .setStyle({ color: '#ff0000', fontSize: '12px' })
      .setPadding(4)
  }

  private hideStatusAfterDelay(
    textObj: Phaser.GameObjects.Text,
    delay: number
  ) {
    this.scene.time.delayedCall(delay, () => {
      if (textObj) textObj.destroy()
    })
  }
}

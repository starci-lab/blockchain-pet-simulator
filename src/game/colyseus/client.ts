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
    if (this.room && this.isConnected()) {
      console.log(`📤 Sending: ${type}`, data)
      try {
        this.room.send(type, data)
      } catch (error) {
        console.error('❌ Failed to send message:', error)
      }
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
      case 'purchase-response':
        this.handlePurchaseResponse(message)
        break

      case 'feed-pet-response':
      case 'play-pet-response':
      case 'clean-pet-response':
        this.handlePetActionResponse(message)
        break

      case 'player-state-sync':
        this.handlePlayerSync(message)
        break

      case 'pets-state-sync':
        this.handlePetsSync(message)
        break

      case 'welcome':
        this.requestPlayerState()
        break

      default:
        // Other messages can be handled here
        break
    }
  }

  private handlePurchaseResponse(message: any) {
    console.log('🛒 Purchase response:', message)

    if (message.success) {
      // Update tokens from server
      if (message.currentTokens !== undefined) {
        useUserStore.getState().setNomToken(message.currentTokens)
        console.log(`💰 Tokens updated: ${message.currentTokens}`)
      }

      // Show success notification
      if (this.gameUI && this.gameUI.showNotification) {
        this.gameUI.showNotification(`✅ ${message.message}`)
      }
    } else {
      // Show failure notification
      if (this.gameUI && this.gameUI.showNotification) {
        this.gameUI.showNotification(`❌ ${message.message}`)
      }
    }
  }

  private handlePetActionResponse(message: any) {
    console.log('🐕 Pet action response:', message)

    if (message.success) {
      // Show success notification
      if (this.gameUI && this.gameUI.showNotification) {
        this.gameUI.showNotification(`✅ ${message.message}`)
      }

      // Update pet stats if provided
      if (message.petStats) {
        console.log('📊 Pet stats updated:', message.petStats)
      }
    } else {
      // Show failure notification
      if (this.gameUI && this.gameUI.showNotification) {
        this.gameUI.showNotification(`❌ ${message.message}`)
      }
    }
  }

  private handlePlayerSync(message: any) {
    console.log('👤 Player sync:', message)

    if (message.tokens !== undefined) {
      useUserStore.getState().setNomToken(message.tokens)
      console.log(`💰 Synced tokens: ${message.tokens}`)
    }

    // Update inventory summary if provided
    if (message.inventory) {
      console.log(`📦 Inventory synced:`, message.inventory)
    }
  }

  private handlePetsSync(message: any) {
    console.log('🐕 Pets sync:', message)

    const petManager = this.getPetManager()
    if (!petManager) {
      console.warn('⚠️ PetManager not found - cannot sync pets')
      return
    }

    if (!message.pets || !Array.isArray(message.pets)) {
      console.log('📝 No pets to sync or invalid pets data')
      return
    }

    // Get current local pets
    const localPets = new Set(
      petManager.getAllPets().map((petData: any) => petData.id)
    )
    const serverPets = new Set(message.pets.map((pet: any) => pet.id))

    console.log(`🔄 Local pets: [${Array.from(localPets).join(', ')}]`)
    console.log(`🔄 Server pets: [${Array.from(serverPets).join(', ')}]`)

    // Track if we create any new pets
    let newPetsCreated: string[] = []

    // Remove pets that don't exist on server
    for (const localPetId of localPets) {
      if (!serverPets.has(localPetId)) {
        console.log(`🗑️ Removing pet ${localPetId} (not on server)`)
        petManager.removePet(localPetId)
      }
    }

    // Add or update pets from server
    message.pets.forEach((serverPet: any) => {
      let localPetData = petManager.getPet(serverPet.id)

      // Create pet if it doesn't exist locally
      if (!localPetData) {
        console.log(`➕ Creating new pet ${serverPet.id}`)
        const x = 400
        const y = 300
        localPetData = petManager.createPet(serverPet.id, x, y)

        if (!localPetData) {
          console.error(`❌ Failed to create pet ${serverPet.id}`)
          return
        }

        // Track new pet creation
        newPetsCreated.push(serverPet.id)

        // Show notification for new pet
        if (this.gameUI && this.gameUI.showNotification) {
          this.gameUI.showNotification(`🎉 New pet appeared: ${serverPet.id}`)
        }
      }

      if (localPetData) {
        // Update pet stats (simplified - no position/activity sync needed for this simple version)
        console.log(
          `🔄 Pet ${serverPet.id} synced: hunger=${serverPet.hunger}, happiness=${serverPet.happiness}, cleanliness=${serverPet.cleanliness}`
        )
      }
    })

    // If new pets were created and no active pet, set the newest one as active
    if (newPetsCreated.length > 0) {
      const currentActivePet = petManager.getActivePet()
      if (!currentActivePet && newPetsCreated.length > 0) {
        const newestPetId = newPetsCreated[newPetsCreated.length - 1]
        petManager.setActivePet(newestPetId)
        console.log(`🎯 Set newest pet ${newestPetId} as active`)

        if (this.gameUI && this.gameUI.showNotification) {
          this.gameUI.showNotification(`🎯 Switched to new pet: ${newestPetId}`)
        }
      }
      console.log(
        `🆕 Created ${newPetsCreated.length} new pets: [${newPetsCreated.join(
          ', '
        )}]`
      )
    }

    console.log(
      `✅ Pet sync completed. Total pets: ${petManager.getAllPets().length}`
    )

    // Force UI update after pet sync
    if (this.gameUI && this.gameUI.updateUI) {
      this.gameUI.updateUI()
      console.log('🎨 Forced UI update after pet sync')
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

        // Simple inventory sync for new schema
        $(player).inventory.onChange(() => {
          console.log('📦 Inventory changed on server')
        })
      }
    })
  }

  // ===== UTILITY METHODS =====

  private getPetManager() {
    const gameScene = this.scene as any
    console.log('🔍 Getting PetManager from scene:', gameScene)

    if (
      gameScene.getPetManager &&
      typeof gameScene.getPetManager === 'function'
    ) {
      const petManager = gameScene.getPetManager()
      console.log('✅ PetManager found:', petManager)
      return petManager
    } else {
      console.warn('⚠️ getPetManager method not found on scene')
      return null
    }
  }

  private requestPlayerState() {
    this.sendMessage('request_player_state', {})
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

  // ===== SIMPLE API METHODS FOR UI =====

  // Purchase item from store
  purchaseItem(itemType: string, itemName: string, quantity: number = 1) {
    this.sendMessage('buy_food', { itemType, itemName, quantity })
  }

  // Feed pet
  feedPet(petId: string, foodType: string) {
    this.sendMessage('feed_pet', { petId, foodType })
  }

  // Play with pet
  playWithPet(petId: string) {
    this.sendMessage('play_with_pet', { petId })
  }

  // Clean pet
  cleanPet(petId: string) {
    this.sendMessage('clean_pet', { petId })
  }

  // Get store catalog
  getStoreCatalog() {
    this.sendMessage('get_store_catalog', {})
  }

  // Get player inventory
  getInventory() {
    this.sendMessage('get_inventory', {})
  }
}

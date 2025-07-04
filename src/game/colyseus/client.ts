import { GameRoomState } from '@/game/schema/ChatSchema'
import { Room, Client, getStateCallbacks } from 'colyseus.js'
import { gameConfigManager } from '@/game/configs/gameConfig'
import { useUserStore } from '@/store/userStore'

export class ColyseusClient {
  public room: Room<GameRoomState> | null = null
  private scene: Phaser.Scene
  private stateCallbacksSetup = false

  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }

  async connect(backendUrl: string) {
    const connectionStatusText = this.scene.add
      .text(10, 70, 'Trying to connect with the server...')
      .setStyle({ color: '#ff0000', fontSize: '12px' })
      .setPadding(4)

    const client = new Client(backendUrl)

    try {
      console.log('🔄 Attempting to connect to Colyseus:', backendUrl)

      this.room = await client.joinOrCreate('game', {
        name: 'Chat Room'
      })

      console.log('✅ Colyseus connected successfully!')
      connectionStatusText.setText('✅ Connected to Colyseus server!')
      connectionStatusText.setStyle({ color: '#00ff00' })

      this.setupEventListeners()

      // Hide connection status after 3 seconds
      this.scene.time.delayedCall(3000, () => {
        if (connectionStatusText) {
          connectionStatusText.destroy()
        }
      })
    } catch (e) {
      console.error('❌ Colyseus connection failed:', e)
      connectionStatusText.setText('❌ Connection failed! Check server.')
      connectionStatusText.setStyle({ color: '#ff0000' })

      // Set room to null để trigger offline mode nếu cần
      this.room = null
    }
  }

  private setupEventListeners() {
    if (!this.room) return

    // Setup room event listeners với error protection
    try {
      this.room.onStateChange((state) => {
        try {
          console.log('🔄 Room state changed:', state)

          // Setup detailed state callbacks for tracking specific changes
          this.setupStateCallbacks(state)
        } catch (schemaError) {
          console.warn(
            '⚠️ Schema error in onStateChange (ignored):',
            schemaError
          )
        }
      })
    } catch (listenerError) {
      console.warn(
        '⚠️ Error setting up onStateChange listener (ignored):',
        listenerError
      )
    }

    try {
      this.room.onMessage('*', (type, message) => {
        console.log('📨 Received message:', type, message)

        // Handle real-time config updates
        if (type === 'config-update') {
          console.log('🔄 Updating game config from server:', message)
          gameConfigManager.updateConfig(message)
        }

        // Handle price updates
        if (type === 'price-update') {
          console.log('💰 Price update received:', message)
          gameConfigManager.updateConfig({
            food: {
              ...gameConfigManager.getConfig().food,
              items: gameConfigManager
                .getConfig()
                .food.items.map((item) =>
                  item.id === message.foodId
                    ? { ...item, price: message.newPrice }
                    : item
                )
            }
          })
        }

        // Handle food purchase response from server
        if (type === 'food-purchase-response') {
          this.handleFoodPurchaseResponse(message)
        }

        // Handle food drop response from server
        if (type === 'food-drop-response') {
          this.handleFoodDropResponse(message)
        }

        // Handle player data sync from server
        if (type === 'player-state-sync') {
          this.handlePlayerStateSync(message)
        }

        // Handle welcome message to sync initial player state
        if (type === 'welcome') {
          console.log('👋 Welcome message received:', message)
          this.requestInitialPlayerState()
        }
      })
    } catch (messageError) {
      console.warn(
        '⚠️ Error setting up message listener (ignored):',
        messageError
      )
    }

    try {
      this.room.onError((code, message) => {
        console.error('❌ Room error (non-fatal):', code, message)
      })
    } catch (errorListenerError) {
      console.warn(
        '⚠️ Error setting up error listener (ignored):',
        errorListenerError
      )
    }

    try {
      this.room.onLeave((code) => {
        console.log('👋 Left room with code:', code)
      })
    } catch (leaveError) {
      console.warn('⚠️ Error setting up leave listener (ignored):', leaveError)
    }
  }

  private setupStateCallbacks(state: GameRoomState) {
    // Only setup callbacks once to avoid duplicate listeners
    if (this.stateCallbacksSetup) return
    this.stateCallbacksSetup = true

    try {
      console.log('🔧 Setting up detailed state callbacks...')

      // Get the state callbacks handler
      const $ = getStateCallbacks(this.room!)

      // Track pets changes using the correct MapSchema callbacks
      $(state).pets.onAdd((pet: any, petId: string) => {
        console.log('🐕 Pet added to server state:', petId, pet)
        // Sync local pet with server pet data
        this.syncPetFromServer(petId, pet)

        // Listen for individual pet property changes
        $(pet).listen('x', (currentX: number, previousX: number) => {
          console.log(
            `🔄 Pet ${petId} position X changed: ${previousX} -> ${currentX}`
          )
          this.updatePetFromServer(petId, pet)
        })

        $(pet).listen('y', (currentY: number, previousY: number) => {
          console.log(
            `🔄 Pet ${petId} position Y changed: ${previousY} -> ${currentY}`
          )
          this.updatePetFromServer(petId, pet)
        })

        $(pet).listen(
          'currentActivity',
          (currentActivity: string, previousActivity: string) => {
            console.log(
              `🔄 Pet ${petId} activity changed: ${previousActivity} -> ${currentActivity}`
            )
            this.updatePetFromServer(petId, pet)
          }
        )

        $(pet).listen(
          'hungerLevel',
          (currentHunger: number, previousHunger: number) => {
            console.log(
              `🔄 Pet ${petId} hunger changed: ${previousHunger} -> ${currentHunger}`
            )
            this.updatePetFromServer(petId, pet)
          }
        )

        $(pet).listen(
          'isChasing',
          (isChasing: boolean, wasChasing: boolean) => {
            console.log(
              `🔄 Pet ${petId} chasing state: ${wasChasing} -> ${isChasing}`
            )
            this.updatePetFromServer(petId, pet)
          }
        )

        $(pet).onChange(() => {
          console.log(`🔄 Pet ${petId} general change detected`)
          this.updatePetFromServer(petId, pet)
        })
      })

      $(state).pets.onRemove((_pet: any, petId: string) => {
        console.log('�️ Pet removed from server state:', petId)
        // Remove local pet
        this.removePetFromLocal(petId)
      })

      // Track players changes
      $(state).players.onAdd((player: any, playerId: string) => {
        console.log('� Player joined:', playerId, player)

        // Listen for player property changes
        $(player).listen(
          'tokens',
          (currentTokens: number, previousTokens: number) => {
            console.log(
              `💰 Player ${playerId} tokens changed: ${previousTokens} -> ${currentTokens}`
            )
            // Update local UI/store if this is the current player
            if (this.room && playerId === this.room.sessionId) {
              const userStore = useUserStore.getState()
              userStore.setNomToken(currentTokens)
              console.log(
                `💰 Updated local tokens to match server: ${currentTokens}`
              )
            }
          }
        )

        $(player).listen(
          'isOnline',
          (isOnline: boolean, wasOnline: boolean) => {
            console.log(
              `🔌 Player ${playerId} online status: ${wasOnline} -> ${isOnline}`
            )
            // Update player status display
          }
        )

        // Listen for food inventory changes
        $(player).foodInventory.onAdd((foodItem: any, foodId: string) => {
          console.log(
            `🍎 Player ${playerId} added food to inventory:`,
            foodId,
            foodItem
          )
          // Update local inventory if this is the current player
          if (this.room && playerId === this.room.sessionId) {
            this.syncLocalInventoryFromServer(player.foodInventory)
          }
        })

        $(player).foodInventory.onChange((foodItem: any, foodId: string) => {
          console.log(
            `🔄 Player ${playerId} food inventory changed:`,
            foodId,
            foodItem
          )
          // Update local inventory if this is the current player
          if (this.room && playerId === this.room.sessionId) {
            this.syncLocalInventoryFromServer(player.foodInventory)
          }
        })

        $(player).foodInventory.onRemove((_foodItem: any, foodId: string) => {
          console.log(
            `🗑️ Player ${playerId} removed food from inventory:`,
            foodId
          )
          // Update local inventory if this is the current player
          if (this.room && playerId === this.room.sessionId) {
            this.syncLocalInventoryFromServer(player.foodInventory)
          }
        })

        $(player).onChange(() => {
          console.log(`🔄 Player ${playerId} general change detected`)
        })
      })

      $(state).players.onRemove((_player: any, playerId: string) => {
        console.log('👋 Player left:', playerId)
        // Handle player leaving
      })

      // Track dropped food changes
      $(state).droppedFood.onAdd((food: any, foodId: string) => {
        console.log('🍎 Food dropped on server:', foodId, food)
        // Add food to local game world
        this.addFoodToLocal(foodId, food)

        // Listen for food property changes
        $(food).listen('x', (currentX: number, previousX: number) => {
          console.log(
            `🔄 Food ${foodId} position X changed: ${previousX} -> ${currentX}`
          )
        })

        $(food).listen('y', (currentY: number, previousY: number) => {
          console.log(
            `🔄 Food ${foodId} position Y changed: ${previousY} -> ${currentY}`
          )
        })

        $(food).listen(
          'quantity',
          (currentQuantity: number, previousQuantity: number) => {
            console.log(
              `🔄 Food ${foodId} quantity changed: ${previousQuantity} -> ${currentQuantity}`
            )
          }
        )

        $(food).onChange(() => {
          console.log(`🔄 Food ${foodId} general change detected`)
        })
      })

      $(state).droppedFood.onRemove((_food: any, foodId: string) => {
        console.log('🗑️ Food removed from server:', foodId)
        // Remove food from local game world
        this.removeFoodFromLocal(foodId)
      })

      // Listen for room-level changes
      $(state).listen(
        'playerCount',
        (currentCount: number, previousCount: number) => {
          console.log(
            `👥 Player count changed: ${previousCount} -> ${currentCount}`
          )
          // Update UI to show current player count
        }
      )

      $(state).listen('isActive', (isActive: boolean, wasActive: boolean) => {
        console.log(
          `🏠 Room active status changed: ${wasActive} -> ${isActive}`
        )
        if (!isActive) {
          console.log('⚠️ Room is shutting down!')
          // Handle room shutdown
        }
      })

      console.log('✅ State callbacks setup complete')
    } catch (error) {
      console.warn('⚠️ Error setting up state callbacks (ignored):', error)
    }
  }

  // Sync methods for handling server state changes
  private syncPetFromServer(petId: string, serverPet: any) {
    // Get the game scene's pet manager
    const gameScene = this.scene as any
    if (
      gameScene.getPetManager &&
      typeof gameScene.getPetManager === 'function'
    ) {
      const petManager = gameScene.getPetManager()

      // Check if we already have this pet locally
      const localPet = petManager.getPetData(petId)

      if (!localPet) {
        // Create new pet based on server data
        console.log('🆕 Creating new pet from server data:', petId)
        petManager.createPet(petId, serverPet.x, serverPet.y)
      } else {
        // Sync existing pet with server data
        petManager.syncPetWithServer(petId, serverPet)
      }
    }
  }

  private updatePetFromServer(petId: string, serverPet: any) {
    // Get the game scene's pet manager
    const gameScene = this.scene as any
    if (
      gameScene.getPetManager &&
      typeof gameScene.getPetManager === 'function'
    ) {
      const petManager = gameScene.getPetManager()
      // Use the sync method for updates too
      petManager.syncPetWithServer(petId, serverPet)
    }
  }

  private removePetFromLocal(petId: string) {
    const gameScene = this.scene as any
    if (
      gameScene.getPetManager &&
      typeof gameScene.getPetManager === 'function'
    ) {
      const petManager = gameScene.getPetManager()
      petManager.removePet(petId)
    }
  }

  private addFoodToLocal(foodId: string, serverFood: any) {
    // Add food to local feeding system
    const gameScene = this.scene as any
    if (
      gameScene.getPetManager &&
      typeof gameScene.getPetManager === 'function'
    ) {
      const petManager = gameScene.getPetManager()
      petManager.addSharedFoodFromServer(foodId, serverFood)
      console.log('🍎 Added server food to local game:', foodId, serverFood)
    }
  }

  private removeFoodFromLocal(foodId: string) {
    // Remove food from local feeding system
    const gameScene = this.scene as any
    if (
      gameScene.getPetManager &&
      typeof gameScene.getPetManager === 'function'
    ) {
      const petManager = gameScene.getPetManager()
      petManager.removeSharedFoodByServerId(foodId)
      console.log('🗑️ Removed server food from local game:', foodId)
    }
  }

  private syncLocalInventoryFromServer(serverInventory: any) {
    // Update local feeding system inventory to match server
    const gameScene = this.scene as any
    if (
      gameScene.getPetManager &&
      typeof gameScene.getPetManager === 'function'
    ) {
      const petManager = gameScene.getPetManager()
      if (petManager.feedingSystem) {
        // Calculate total food inventory from server data
        let totalInventory = 0
        if (serverInventory && serverInventory.size) {
          serverInventory.forEach((item: any) => {
            totalInventory += item.quantity || 0
          })
        }

        petManager.feedingSystem.foodInventory = totalInventory
        console.log(`📦 Synced local inventory with server: ${totalInventory}`)
      }
    }
  }

  sendMessage(type: string, data: any) {
    console.log(`📤 Sending message: ${type}`, data)
    if (this.room) {
      this.room.send(type, data)
    }
  }

  // Request latest prices from server
  requestPriceUpdate() {
    if (this.room) {
      this.room.send('request-prices', {})
    }
  }

  isConnected(): boolean {
    return !!this.room
  }

  // Message handlers for server responses
  private handleFoodPurchaseResponse(message: any) {
    console.log('🛒 Food purchase response:', message)

    if (message.success) {
      console.log(
        `✅ Purchase successful: ${message.quantity}x ${message.foodId} for ${message.totalPrice} tokens`
      )

      // Update local token count to match server
      if (message.currentTokens !== undefined) {
        const userStore = useUserStore.getState()
        userStore.setNomToken(message.currentTokens)
        console.log(`💰 Updated tokens to: ${message.currentTokens}`)
      }

      // Update local inventory count in feeding system if available
      const gameScene = this.scene as any
      if (
        gameScene.getPetManager &&
        typeof gameScene.getPetManager === 'function'
      ) {
        const petManager = gameScene.getPetManager()
        if (petManager.feedingSystem) {
          // Server confirmed purchase, so local inventory should be updated
          petManager.feedingSystem.foodInventory += message.quantity
          console.log(
            `📦 Updated local inventory to: ${petManager.feedingSystem.foodInventory}`
          )
        }
      }

      // Show success message to user
      this.showNotification(`✅ ${message.message}`, '#00ff00')
    } else {
      console.log(`❌ Purchase failed: ${message.message}`)

      // Update token count even on failed purchase to stay in sync
      if (message.currentTokens !== undefined) {
        const userStore = useUserStore.getState()
        userStore.setNomToken(message.currentTokens)
        console.log(
          `💰 Synced tokens after failed purchase: ${message.currentTokens}`
        )
      }

      // Revert optimistic local changes if any
      const gameScene = this.scene as any
      if (
        gameScene.getPetManager &&
        typeof gameScene.getPetManager === 'function'
      ) {
        const petManager = gameScene.getPetManager()
        if (
          petManager.feedingSystem &&
          petManager.feedingSystem.foodInventory > 0
        ) {
          // If we optimistically increased inventory, revert it
          petManager.feedingSystem.foodInventory -= message.quantity || 1
          console.log(
            `📦 Reverted local inventory to: ${petManager.feedingSystem.foodInventory}`
          )
        }
      }

      // Show error message to user
      this.showNotification(`❌ ${message.message}`, '#ff0000')
    }
  }

  private handleFoodDropResponse(message: any) {
    console.log('🍎 Food drop response:', message)

    if (!message.success) {
      console.log(`❌ Food drop failed: ${message.error}`)

      // Revert optimistic local inventory decrease
      const gameScene = this.scene as any
      if (
        gameScene.getPetManager &&
        typeof gameScene.getPetManager === 'function'
      ) {
        const petManager = gameScene.getPetManager()
        if (petManager.feedingSystem) {
          petManager.feedingSystem.foodInventory += 1
          console.log(
            `📦 Reverted inventory after failed drop: ${petManager.feedingSystem.foodInventory}`
          )
        }
      }

      this.showNotification(`❌ ${message.error}`, '#ff0000')
    }
    // Note: Successful drops are handled by the 'food-dropped' broadcast message
  }

  private handlePlayerStateSync(message: any) {
    console.log('👤 Player state sync:', message)

    if (message.tokens !== undefined) {
      // Update local token count to match server
      const userStore = useUserStore.getState()
      userStore.setNomToken(message.tokens)
      console.log(`💰 Synced tokens with server: ${message.tokens}`)
    }

    if (message.inventory) {
      // Update local inventory to match server
      const gameScene = this.scene as any
      if (
        gameScene.getPetManager &&
        typeof gameScene.getPetManager === 'function'
      ) {
        const petManager = gameScene.getPetManager()
        if (petManager.feedingSystem) {
          // Calculate total food inventory from server data
          const totalInventory = Object.values(message.inventory).reduce(
            (sum: number, item: any) => sum + (item.quantity || 0),
            0
          )
          petManager.feedingSystem.foodInventory = totalInventory
          console.log(`📦 Synced inventory with server: ${totalInventory}`)
        }
      }
    }
  }

  private requestInitialPlayerState() {
    if (this.room) {
      console.log('📤 Requesting initial player state from server')
      this.room.send('request-player-state', {})
    }
  }

  private showNotification(message: string, color: string) {
    // Show a temporary notification on screen
    const notification = this.scene.add
      .text(this.scene.cameras.main.width / 2, 100, message)
      .setStyle({
        color,
        fontSize: '16px',
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: { x: 10, y: 5 }
      })
      .setOrigin(0.5, 0.5)
      .setDepth(1000)

    // Fade out after 3 seconds
    this.scene.tweens.add({
      targets: notification,
      alpha: 0,
      duration: 3000,
      ease: 'Power2.easeOut',
      onComplete: () => {
        notification.destroy()
      }
    })
  }
}

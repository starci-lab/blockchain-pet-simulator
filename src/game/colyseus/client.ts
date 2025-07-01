import type { ChatRoomState } from '@/game/schema/ChatSchema'
import { Room, Client } from 'colyseus.js'
import { gameConfigManager } from '@/game/configs/gameConfig'

export class ColyseusClient {
  public room: Room<ChatRoomState> | null = null
  private scene: Phaser.Scene

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

      this.room = await client.joinOrCreate('chat', {
        name: 'Chat Room'
      })

      console.log('✅ Colyseus connected successfully!')
      console.log('Room ID:', this.room.roomId)

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
}

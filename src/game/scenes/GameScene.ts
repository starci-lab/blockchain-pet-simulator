import { SceneName } from '@/constants/scene'
import { loadChogAssets } from '@/game/load'
import Phaser from 'phaser'
import { Pet } from '@/game/entities/Pet'
import { MovementSystem } from '@/game/systems/MovementSystem'
import { ActivitySystem } from '@/game/systems/ActivitySystem'
import { FeedingSystem } from '@/game/systems/FeedingSystem'
import { GameUI } from '@/game/ui/GameUI'
import { ColyseusClient } from '@/game/colyseus/client'

const BACKEND_URL = 'ws://localhost:3002'

export class GameScene extends Phaser.Scene {
  // Core entities and systems
  private pet!: Pet
  private movementSystem!: MovementSystem
  private activitySystem!: ActivitySystem
  private feedingSystem!: FeedingSystem
  private gameUI!: GameUI
  private colyseusClient!: ColyseusClient

  constructor() {
    super({ key: SceneName.Gameplay })
  }

  preload() {
    loadChogAssets(this)
  }

  async create() {
    // Initialize entities and systems
    this.initializeEntities()
    this.initializeSystems()
    this.initializeUI()

    // Setup cursor
    this.input.setDefaultCursor(
      `url(./src/assets/images/cursor/navigation_nw.png), pointer`
    )

    // Connect to Colyseus (optional, game works offline too)
    console.log('🔌 Starting Colyseus connection...')
    await this.colyseusClient.connect(BACKEND_URL)

    console.log('🏁 Scene initialization complete')
    console.log(
      'Room status:',
      this.colyseusClient.isConnected() ? 'Connected' : 'Offline mode'
    )
  }

  private initializeEntities() {
    // Create pet
    this.pet = new Pet(this)
    this.pet.createAnimations()
    this.pet.create(100, this.cameras.main.height - 40)
  }

  private initializeSystems() {
    // Initialize systems
    this.movementSystem = new MovementSystem(this.pet, this.cameras.main.width)
    this.activitySystem = new ActivitySystem(this.pet)
    this.feedingSystem = new FeedingSystem(this, this.pet)

    // Initialize multiplayer
    this.colyseusClient = new ColyseusClient(this)
  }

  private initializeUI() {
    // Initialize UI
    this.gameUI = new GameUI(this, this.feedingSystem)
    this.gameUI.create()
  }

  update() {
    // Update movement system
    if (!this.colyseusClient) return
    const movementResult = this.movementSystem.update()

    // Check if pet reached food
    if (
      movementResult &&
      'reachedTarget' in movementResult &&
      movementResult.reachedTarget &&
      movementResult.targetX !== undefined &&
      movementResult.targetY !== undefined
    ) {
      this.feedingSystem.eatFood(movementResult.targetX, movementResult.targetY)
    }

    // Update activity system
    this.activitySystem.update()

    // Update feeding system (hunger decrease)
    this.feedingSystem.update()

    // Update UI
    this.gameUI.updateUI()
  }

  // Compatibility methods for React component
  get speed() {
    return this.pet.speed
  }

  set speed(value: number) {
    this.pet.speed = value
  }

  get currentActivity() {
    return this.pet.currentActivity
  }

  set currentActivity(value: string) {
    this.pet.setActivity(value)
  }

  updateSpeed(newSpeed: number) {
    this.pet.speed = newSpeed
  }

  setUserActivity(newActivity: string) {
    this.pet.setUserActivity(newActivity)
  }
}

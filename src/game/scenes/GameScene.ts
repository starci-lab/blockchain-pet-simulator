import { loadChogAssets } from '@/game/load'
import Phaser from 'phaser'
// import { Room, Client, getStateCallbacks } from 'colyseus.js'
// import { envConfig } from '../configs/env'
// const BACKEND_URL = envConfig.BACKEND_URL

export class GameScene extends Phaser.Scene {
  dog!: Phaser.GameObjects.Sprite
  direction: number = 1
  speed: number = 50
  currentActivity: string = 'walk'
  isMoving: boolean = true
  walkCycles: number = 0
  isUserControlled: boolean = false
  lastEdgeHit: string = ''
  randomStopTimer: number = 0
  nextRandomStopTime: number = 0
  constructor() {
    super({ key: 'GameScene' })
    this.setNextRandomStopTime()
  }

  preload() {
    loadChogAssets(this)
  }

  async create() {
    this.createAnimations()
    this.createSprite()
    // connect with the room
    // await this.connect();

    // remove local reference when entity is removed from the server
  }

  // async connect() {
  //   // add connection status text
  //   const connectionStatusText = this.add
  //     .text(0, 0, 'Trying to connect with the server...')
  //     .setStyle({ color: '#ff0000' })
  //     .setPadding(4)

  //   const client = new Client(BACKEND_URL)

  //   try {
  //     this.room = await client.joinOrCreate('part1_room', {})

  //     // connection successful!
  //     connectionStatusText.destroy()
  //   } catch (e) {
  //     // couldn't connect
  //     connectionStatusText.text = 'Could not connect with the server.'
  //   }
  // }

  createAnimations() {
    // Animations for auto mode
    this.anims.create({
      key: 'dog-sleep',
      frames: [
        { key: 'dog-sleep', frame: 'chog_sleep 0.aseprite' },
        { key: 'dog-sleep', frame: 'chog_sleep 1.aseprite' },
        { key: 'dog-sleep', frame: 'chog_sleep 2.aseprite' },
        { key: 'dog-sleep', frame: 'chog_sleep 3.aseprite' },
        { key: 'dog-sleep', frame: 'chog_sleep 4.aseprite' },
        { key: 'dog-sleep', frame: 'chog_sleep 5.aseprite' }
      ],
      frameRate: 3,
      repeat: 1
    })

    this.anims.create({
      key: 'dog-play',
      frames: [
        { key: 'dog-play', frame: 'chog_idleplay 0.aseprite' },
        { key: 'dog-play', frame: 'chog_idleplay 1.aseprite' },
        { key: 'dog-play', frame: 'chog_idleplay 2.aseprite' },
        { key: 'dog-play', frame: 'chog_idleplay 3.aseprite' },
        { key: 'dog-play', frame: 'chog_idleplay 4.aseprite' },
        { key: 'dog-play', frame: 'chog_idleplay 5.aseprite' },
        { key: 'dog-play', frame: 'chog_idleplay 6.aseprite' },
        { key: 'dog-play', frame: 'chog_idleplay 7.aseprite' },
        { key: 'dog-play', frame: 'chog_idleplay 8.aseprite' },
        { key: 'dog-play', frame: 'chog_idleplay 9.aseprite' },
        { key: 'dog-play', frame: 'chog_idleplay 10.aseprite' },
        { key: 'dog-play', frame: 'chog_idleplay 11.aseprite' },
        { key: 'dog-play', frame: 'chog_idleplay 12.aseprite' },
        { key: 'dog-play', frame: 'chog_idleplay 13.aseprite' },
        { key: 'dog-play', frame: 'chog_idleplay 14.aseprite' }
      ],
      frameRate: 10,
      repeat: 1
    })

    this.anims.create({
      key: 'dog-chew',
      frames: [
        { key: 'dog-chew', frame: 'chog_chew 0.aseprite' },
        { key: 'dog-chew', frame: 'chog_chew 1.aseprite' },
        { key: 'dog-chew', frame: 'chog_chew 2.aseprite' },
        { key: 'dog-chew', frame: 'chog_chew 3.aseprite' },
        { key: 'dog-chew', frame: 'chog_chew 4.aseprite' },
        { key: 'dog-chew', frame: 'chog_chew 5.aseprite' }
      ],
      frameRate: 6,
      repeat: 1
    })

    // Animations for user control mode
    this.anims.create({
      key: 'dog-sleep-loop',
      frames: [
        { key: 'dog-sleep', frame: 'chog_sleep 0.aseprite' },
        { key: 'dog-sleep', frame: 'chog_sleep 1.aseprite' },
        { key: 'dog-sleep', frame: 'chog_sleep 2.aseprite' },
        { key: 'dog-sleep', frame: 'chog_sleep 3.aseprite' },
        { key: 'dog-sleep', frame: 'chog_sleep 4.aseprite' },
        { key: 'dog-sleep', frame: 'chog_sleep 5.aseprite' }
      ],
      frameRate: 3,
      repeat: -1
    })

    this.anims.create({
      key: 'dog-play-loop',
      frames: [
        { key: 'dog-play', frame: 'chog_idleplay 0.aseprite' },
        { key: 'dog-play', frame: 'chog_idleplay 1.aseprite' },
        { key: 'dog-play', frame: 'chog_idleplay 2.aseprite' },
        { key: 'dog-play', frame: 'chog_idleplay 3.aseprite' },
        { key: 'dog-play', frame: 'chog_idleplay 4.aseprite' },
        { key: 'dog-play', frame: 'chog_idleplay 5.aseprite' },
        { key: 'dog-play', frame: 'chog_idleplay 6.aseprite' },
        { key: 'dog-play', frame: 'chog_idleplay 7.aseprite' },
        { key: 'dog-play', frame: 'chog_idleplay 8.aseprite' },
        { key: 'dog-play', frame: 'chog_idleplay 9.aseprite' },
        { key: 'dog-play', frame: 'chog_idleplay 10.aseprite' },
        { key: 'dog-play', frame: 'chog_idleplay 11.aseprite' },
        { key: 'dog-play', frame: 'chog_idleplay 12.aseprite' },
        { key: 'dog-play', frame: 'chog_idleplay 13.aseprite' },
        { key: 'dog-play', frame: 'chog_idleplay 14.aseprite' }
      ],
      frameRate: 10,
      repeat: -1
    })

    this.anims.create({
      key: 'dog-chew-loop',
      frames: [
        { key: 'dog-chew', frame: 'chog_chew 0.aseprite' },
        { key: 'dog-chew', frame: 'chog_chew 1.aseprite' },
        { key: 'dog-chew', frame: 'chog_chew 2.aseprite' },
        { key: 'dog-chew', frame: 'chog_chew 3.aseprite' },
        { key: 'dog-chew', frame: 'chog_chew 4.aseprite' },
        { key: 'dog-chew', frame: 'chog_chew 5.aseprite' }
      ],
      frameRate: 6,
      repeat: -1
    })

    this.anims.create({
      key: 'dog-walk',
      frames: [
        { key: 'dog-walk', frame: 'chog_walk 0.aseprite' },
        { key: 'dog-walk', frame: 'chog_walk 1.aseprite' },
        { key: 'dog-walk', frame: 'chog_walk 2.aseprite' },
        { key: 'dog-walk', frame: 'chog_walk 3.aseprite' },
        { key: 'dog-walk', frame: 'chog_walk 4.aseprite' },
        { key: 'dog-walk', frame: 'chog_walk 5.aseprite' },
        { key: 'dog-walk', frame: 'chog_walk 6.aseprite' },
        { key: 'dog-walk', frame: 'chog_walk 7.aseprite' }
      ],
      frameRate: 8,
      repeat: -1
    })
  }

  createSprite() {
    this.dog = this.add.sprite(
      100,
      this.cameras.main.height - 40,
      'dog-sleep',
      'chog_sleep 0.aseprite'
    )

    this.dog.setScale(2)
    this.updateActivity()
  }
  update() {
    // skip loop if not connected with room yet.
    // if (!this.room) {
    //   return
    // }

    if (!this.isUserControlled) {
      if (this.currentActivity === 'walk') {
        this.handleWalkCycle()
        this.handleRandomStop()
      }
    }

    if (this.isMoving && this.currentActivity === 'walk') {
      this.handleMovement()
    }
  }
  handleWalkCycle() {
    const dogWidth = 40 * 2
    if (
      this.dog.x >= this.cameras.main.width - dogWidth / 2 &&
      this.direction === 1 &&
      this.lastEdgeHit !== 'right'
    ) {
      this.direction = -1
      this.dog.setFlipX(true)
      this.lastEdgeHit = 'right'
      // this.randomActivity()
    } else if (
      this.dog.x <= dogWidth / 2 &&
      this.direction === -1 &&
      this.lastEdgeHit !== 'left'
    ) {
      this.direction = 1
      this.dog.setFlipX(false)
      this.lastEdgeHit = 'left'
      // this.randomActivity()
    }
  }
  handleMovement() {
    this.dog.x += this.direction * this.speed * (1 / 60)
  }

  handleRandomStop() {
    this.randomStopTimer += 1 / 60 // ~16.67ms per frame

    if (this.randomStopTimer >= this.nextRandomStopTime) {
      console.log('Random stop triggered!')
      this.randomActivity()
      this.setNextRandomStopTime()
      this.randomStopTimer = 0
    }
  }
  setNextRandomStopTime() {
    // Random from 10-15 seconds
    this.nextRandomStopTime = Phaser.Math.Between(15, 25)
    console.log('Next random stop in:', this.nextRandomStopTime, 'seconds')
  }
  updateActivity() {
    switch (this.currentActivity) {
      case 'walk':
        this.dog.play('dog-walk')
        this.isMoving = true
        break
      case 'sleep':
        if (this.isUserControlled) {
          this.dog.play('dog-sleep-loop')
        } else {
          this.dog.play('dog-sleep')
        }
        this.isMoving = false
        break
      case 'idleplay':
        if (this.isUserControlled) {
          this.dog.play('dog-play-loop')
        } else {
          this.dog.play('dog-play')
        }
        this.isMoving = false
        break
      case 'chew':
        if (this.isUserControlled) {
          this.dog.play('dog-chew-loop')
        } else {
          this.dog.play('dog-chew')
        }
        this.isMoving = false
        break
      default:
        this.dog.play('dog-walk')
        this.isMoving = true
    }
  }

  randomActivity() {
    const activities = ['idleplay', 'chew']
    const newActivity = Phaser.Utils.Array.GetRandom(activities)
    this.setActivity(newActivity)

    this.dog.once('animationcomplete', () => {
      if (!this.isUserControlled && this.currentActivity === newActivity) {
        console.log('Animation completed, returning to walk...')
        this.setActivity('walk')
      }
    })
  }

  setActivity(newActivity: string) {
    this.currentActivity = newActivity
    this.updateActivity()
    this.walkCycles = 0
    this.lastEdgeHit = ''
  }

  setUserActivity(newActivity: string) {
    this.currentActivity = newActivity
    this.updateActivity()

    this.walkCycles = 0
    this.lastEdgeHit = ''

    if (newActivity === 'walk') {
      this.isUserControlled = false
    } else {
      this.isUserControlled = true
    }
  }

  updateSpeed(newSpeed: number) {
    this.speed = newSpeed
  }

  updateCurrentActivity(newActivity: string) {
    this.currentActivity = newActivity
    this.updateActivity()
  }
}

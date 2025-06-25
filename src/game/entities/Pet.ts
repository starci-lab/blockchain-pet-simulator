import Phaser from 'phaser'

export class Pet {
  public sprite!: Phaser.GameObjects.Sprite
  public direction: number = 1
  public speed: number = 50
  public currentActivity: string = 'walk'
  public isMoving: boolean = true
  public isUserControlled: boolean = false
  public lastEdgeHit: string = ''

  // Chasing properties
  public isChasing: boolean = false
  public chaseTarget: { x: number; y: number } | null = null

  private scene: Phaser.Scene

  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }

  create(x: number, y: number) {
    this.sprite = this.scene.add.sprite(
      x,
      y,
      'dog-walk',
      'chog_walk 0.aseprite'
    )
    this.sprite.setScale(2)

    console.log('🐕 Pet created at:', this.sprite.x, this.sprite.y)
    console.log('🚶 Initial activity:', this.currentActivity)
    console.log('🏃 Is moving:', this.isMoving)
    console.log('👤 User controlled:', this.isUserControlled)

    this.updateActivity()
  }

  createAnimations() {
    // Walk animation
    this.scene.anims.create({
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

    // Sleep animations
    this.scene.anims.create({
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

    this.scene.anims.create({
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

    // Play animations
    this.scene.anims.create({
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

    this.scene.anims.create({
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

    // Chew animations
    this.scene.anims.create({
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

    this.scene.anims.create({
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
  }

  updateActivity() {
    switch (this.currentActivity) {
      case 'walk':
        this.sprite.play('dog-walk')
        this.isMoving = true
        break
      case 'sleep':
        if (this.isUserControlled) {
          this.sprite.play('dog-sleep-loop')
        } else {
          this.sprite.play('dog-sleep')
        }
        this.isMoving = false
        break
      case 'idleplay':
        if (this.isUserControlled) {
          this.sprite.play('dog-play-loop')
        } else {
          this.sprite.play('dog-play')
        }
        this.isMoving = false
        break
      case 'chew':
        if (this.isUserControlled) {
          this.sprite.play('dog-chew-loop')
        } else {
          this.sprite.play('dog-chew')
        }
        this.isMoving = false
        break
      default:
        this.sprite.play('dog-walk')
        this.isMoving = true
    }
  }

  setActivity(newActivity: string) {
    console.log(
      '🔄 Changing activity from',
      this.currentActivity,
      'to',
      newActivity
    )
    this.currentActivity = newActivity
    this.updateActivity()
  }

  setUserActivity(newActivity: string) {
    this.currentActivity = newActivity
    this.updateActivity()

    if (newActivity === 'walk') {
      this.isUserControlled = false
    } else {
      this.isUserControlled = true
    }
  }

  startChasing(x: number, y: number) {
    this.isChasing = true
    this.chaseTarget = { x, y }
    this.isUserControlled = true
    this.setActivity('walk')
    console.log(`Pet chasing food at (${x}, ${y})`)
  }

  stopChasing() {
    this.isChasing = false
    this.chaseTarget = null
  }
}

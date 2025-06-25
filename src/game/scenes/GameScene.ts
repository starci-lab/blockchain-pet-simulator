import { SceneName } from '@/constants/scene'
import { loadChogAssets } from '@/game/load'
import Phaser from 'phaser'
import RexUIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin.js'
// import { Room, Client, getStateCallbacks } from 'colyseus.js'
// import { envConfig } from '@/configs/env'
// const BACKEND_URL = envConfig.baseUrl

export class GameScene extends Phaser.Scene {
  // room!: Room
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
  // Feeding system properties
  foodShop!: Phaser.GameObjects.Rectangle
  foodInventory: number = 0
  droppedFood: Phaser.GameObjects.Sprite[] = []
  isChasing: boolean = false
  chaseTarget: { x: number; y: number } | null = null
  hungerLevel: number = 100
  rexUI!: RexUIPlugin
  inventoryText!: Phaser.GameObjects.Text
  hungerBar!: Phaser.GameObjects.Rectangle
  constructor() {
    super({ key: SceneName.Gameplay })
    this.setNextRandomStopTime()
  }
  preload() {
    loadChogAssets(this)
  }
  async create() {
    this.createAnimations()
    this.createSprite()
    this.createFoodShop()
    this.createFeedingUI()
    this.setupInputHandlers()
    this.input.setDefaultCursor(
      `url(./src/assets/images/cursor/navigation_nw.png), pointer`
    )

    // connect with the room
    // await this.connect()

    // remove local reference when entity is removed from the server
  }

  // async connect() {
  //   const connectionStatusText = this.add
  //     .text(0, 0, 'Trying to connect with the server...')
  //     .setStyle({ color: '#ff0000' })
  //     .setPadding(4)

  //   const client = new Client(BACKEND_URL)

  //   try {
  //     this.room = await client.joinOrCreate('part1_room', {})

  //     connectionStatusText.destroy()
  //   } catch (e) {
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

    // Handle chasing food
    if (this.isChasing && this.chaseTarget) {
      this.handleChasing()
    } else if (!this.isUserControlled) {
      if (this.currentActivity === 'walk') {
        this.handleWalkCycle()
        this.handleRandomStop()
      }
    }

    if (this.isMoving && this.currentActivity === 'walk') {
      this.handleMovement()
    }

    // Decrease hunger over time
    this.hungerLevel = Math.max(0, this.hungerLevel - 0.01)
    this.updateUI()
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

  createFoodShop() {
    // Tạo shop ở góc phải
    const shopX = this.cameras.main.width - 60
    const shopY = 30

    this.foodShop = this.add.rectangle(shopX, shopY, 80, 40, 0x8b4513)
    this.foodShop.setStrokeStyle(2, 0x654321)
    this.foodShop.setInteractive()

    // Thêm text "SHOP"
    this.add
      .text(shopX, shopY, '🏪 SHOP', {
        fontSize: '12px',
        color: '#ffffff'
      })
      .setOrigin(0.5)

    // Click để mua food
    this.foodShop.on('pointerdown', () => {
      this.buyFood()
    })
  }

  createFeedingUI() {
    // Hiển thị food inventory
    const inventoryText = this.add.text(10, 10, `Food: ${this.foodInventory}`, {
      fontSize: '16px',
      color: '#333333',
      backgroundColor: '#ffffff',
      padding: { x: 8, y: 4 }
    })

    // Hunger bar
    const hungerBar = this.add.rectangle(10, 40, 100, 10, 0xff0000)
    const hungerFill = this.add.rectangle(
      10,
      40,
      this.hungerLevel,
      10,
      0x00ff00
    )
    hungerFill.setOrigin(0, 0.5)
    hungerBar.setOrigin(0, 0.5)

    // Lưu reference để update
    this.inventoryText = inventoryText
    this.hungerBar = hungerFill
  }

  setupInputHandlers() {
    // Click để thả food
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // Chỉ thả food nếu không click vào shop và có food
      if (
        !this.foodShop.getBounds().contains(pointer.x, pointer.y) &&
        this.foodInventory > 0
      ) {
        this.dropFood(pointer.x, pointer.y)
      }
    })
  }

  buyFood() {
    this.foodInventory += 1
    this.updateUI()
    console.log(`Bought food! Inventory: ${this.foodInventory}`)
  }

  dropFood(x: number, y: number) {
    if (this.foodInventory <= 0) return

    this.foodInventory -= 1

    // Tạo food sprite
    const food = this.add.circle(x, y, 8, 0xffd700) // Màu vàng cho food
    food.setStrokeStyle(2, 0xffa500)

    this.droppedFood.push(food as any)

    // Pet sẽ chạy đến food
    this.startChasing(x, y)
    this.updateUI()

    console.log(`Dropped food at (${x}, ${y})`)
  }

  startChasing(x: number, y: number) {
    this.isChasing = true
    this.chaseTarget = { x, y }
    this.isUserControlled = true
    this.setActivity('walk')

    console.log(`Pet chasing food at (${x}, ${y})`)
  }

  handleChasing() {
    if (!this.chaseTarget) return

    const targetX = this.chaseTarget.x
    const targetY = this.chaseTarget.y
    const distance = Phaser.Math.Distance.Between(
      this.dog.x,
      this.dog.y,
      targetX,
      targetY
    )

    // Nếu đủ gần thì ăn food
    if (distance < 20) {
      this.eatFood(targetX, targetY)
      return
    }

    // Di chuyển về phía food
    const angle = Phaser.Math.Angle.Between(
      this.dog.x,
      this.dog.y,
      targetX,
      targetY
    )
    this.dog.x += Math.cos(angle) * this.speed * (1 / 60)

    // Flip sprite theo hướng di chuyển
    if (Math.cos(angle) > 0) {
      this.dog.setFlipX(false)
      this.direction = 1
    } else {
      this.dog.setFlipX(true)
      this.direction = -1
    }
  }

  eatFood(x: number, y: number) {
    // Tìm và xóa food
    const foodIndex = this.droppedFood.findIndex(
      (food) => Phaser.Math.Distance.Between(food.x, food.y, x, y) < 20
    )

    if (foodIndex !== -1) {
      this.droppedFood[foodIndex].destroy()
      this.droppedFood.splice(foodIndex, 1)
    }

    // Tăng hunger
    this.hungerLevel = Math.min(100, this.hungerLevel + 20)

    // Dừng chase và chuyển sang chew animation
    this.isChasing = false
    this.chaseTarget = null
    this.setActivity('chew')

    console.log(`Pet ate food! Hunger: ${this.hungerLevel}`)

    // Sau khi ăn xong thì quay lại walk
    this.dog.once('animationcomplete', () => {
      if (this.currentActivity === 'chew') {
        this.isUserControlled = false
        this.setActivity('walk')
      }
    })
  }

  updateUI() {
    if (this.inventoryText) {
      this.inventoryText.setText(`Food: ${this.foodInventory}`)
    }
    if (this.hungerBar) {
      this.hungerBar.setSize(this.hungerLevel, 10)
    }
  }
}

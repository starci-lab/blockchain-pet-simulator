import { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import dogSleepImg from '../assets/images/Chog/chog_sleep.png'
import dogSleepJson from '../assets/images/Chog/chog_sleep.json'
import dogPlayImg from '../assets/images/Chog/chog_idleplay.png'
import dogPlayJson from '../assets/images/Chog/chog_idleplay.json'
import dogChewImg from '../assets/images/Chog/chog_chew.png'
import dogChewJson from '../assets/images/Chog/chog_chew.json'
import dogWalkImg from '../assets/images/Chog/chog_walk.png'
import dogWalkJson from '../assets/images/Chog/chog_walk_animated.json'

interface PhaserPetGameProps {
  speed?: number
  activity?: 'walk' | 'sleep' | 'idleplay' | 'chew'
}

const PhaserPetGame = ({
  speed = 50,
  activity = 'walk'
}: PhaserPetGameProps) => {
  const gameRef = useRef<HTMLDivElement>(null)
  const phaserGameRef = useRef<Phaser.Game | null>(null)
  const sceneRef = useRef<Phaser.Scene | null>(null)

  useEffect(() => {
    if (!gameRef.current) return

    class GameScene extends Phaser.Scene {
      dog!: Phaser.GameObjects.Sprite
      direction: number = 1
      speed: number = speed
      currentActivity: string = activity
      activityTimer: number = 0
      isMoving: boolean = true
      walkCycles: number = 0
      isUserControlled: boolean = false
      lastEdgeHit: string = '' // Track để tránh đếm lặp lại

      constructor() {
        super({ key: 'GameScene' })
      }
      preload() {
        // Load sprite sheets có đầy đủ JSON
        this.load.atlas('dog-sleep', dogSleepImg, dogSleepJson)
        this.load.atlas('dog-play', dogPlayImg, dogPlayJson)
        this.load.atlas('dog-chew', dogChewImg, dogChewJson)
        this.load.atlas('dog-walk', dogWalkImg, dogWalkJson)
      }
      create() {
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
          repeat: -1
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
          repeat: -1
        }) // Chewing animation
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
        // Tăng timer
        this.activityTimer += 1 / 60

        // Debug current state
        if (
          Math.floor(this.activityTimer) % 2 === 0 &&
          this.activityTimer % 1 < 0.1
        ) {
          console.log(
            `State: activity=${this.currentActivity}, userControlled=${
              this.isUserControlled
            }, cycles=${this.walkCycles}, timer=${this.activityTimer.toFixed(
              1
            )}, speed=${this.speed}`
          )
        }

        // Auto random chỉ khi không có user control
        if (!this.isUserControlled) {
          // Nếu đang walk và hoàn thành 1 vòng đi lại
          if (this.currentActivity === 'walk') {
            // Logic đếm vòng walk - đếm khi chạm biên (tránh đếm lặp)
            const dogWidth = 40 * 2
            if (
              this.dog.x >= this.cameras.main.width - dogWidth / 2 &&
              this.direction === 1 &&
              this.lastEdgeHit !== 'right'
            ) {
              // Chạm biên phải
              this.walkCycles++
              this.lastEdgeHit = 'right'
              console.log('Hit RIGHT edge, walkCycles:', this.walkCycles)
            } else if (
              this.dog.x <= dogWidth / 2 &&
              this.direction === -1 &&
              this.lastEdgeHit !== 'left'
            ) {
              // Chạm biên trái
              this.walkCycles++
              this.lastEdgeHit = 'left'
              console.log('Hit LEFT edge, walkCycles:', this.walkCycles)
            }

            if (this.walkCycles >= 2) {
              // Sau 1 vòng đầy đủ (2 lần chạm biên)
              console.log('Walking complete! Triggering random activity...')
              this.randomActivity()
              this.walkCycles = 0
              this.lastEdgeHit = ''
              this.activityTimer = 0
            }
          } else {
            // Nếu đang làm activity khác, sau 5 giây thì quay về walk
            if (this.activityTimer > 5) {
              console.log('Activity timeout! Back to walk...')
              this.setActivity('walk')
              this.activityTimer = 0
            }
          }
        } else {
          console.log('User control mode - blocking auto actions')
        }

        // Di chuyển chỉ khi đang walking
        if (this.isMoving && this.currentActivity === 'walk') {
          this.dog.x += this.direction * this.speed * (1 / 60)

          const dogWidth = 40 * 2
          if (this.dog.x >= this.cameras.main.width - dogWidth / 2) {
            this.direction = -1
            this.dog.setFlipX(true)
          } else if (this.dog.x <= dogWidth / 2) {
            this.direction = 1
            this.dog.setFlipX(false)
          }
        }
      }
      updateActivity() {
        switch (this.currentActivity) {
          case 'walk':
            this.dog.play('dog-walk')
            this.isMoving = true
            break
          case 'sleep':
            this.dog.play('dog-sleep')
            this.isMoving = false
            break
          case 'idleplay':
            this.dog.play('dog-play')
            this.isMoving = false
            break
          case 'chew':
            this.dog.play('dog-chew')
            this.isMoving = false
            break
          default:
            this.dog.play('dog-walk')
            this.isMoving = true
        }
      }
      randomActivity() {
        const activities = ['sleep', 'idleplay', 'chew'] // Bỏ 'walk' để không random về walk
        const newActivity = Phaser.Utils.Array.GetRandom(activities)
        console.log('Random activity selected:', newActivity)
        this.setActivity(newActivity)
      }
      setActivity(newActivity: string) {
        console.log('=== AUTO setActivity ===', newActivity)
        this.currentActivity = newActivity
        this.updateActivity()

        // Reset timer và edge tracking
        this.activityTimer = 0
        this.walkCycles = 0
        this.lastEdgeHit = ''

        // Cho auto system - không thay đổi user control flag
        console.log('Auto activity change, keeping current control mode')
      }

      // Method riêng cho user click (từ bên ngoài)
      setUserActivity(newActivity: string) {
        console.log('=== USER CLICKED ===', newActivity)
        this.currentActivity = newActivity
        this.updateActivity()

        // Reset timer
        this.activityTimer = 0
        this.walkCycles = 0
        this.lastEdgeHit = ''

        // Phân biệt auto mode vs user control
        if (newActivity === 'walk') {
          // User click "Auto Mode" -> về auto mode
          this.isUserControlled = false
          console.log('Switched to AUTO MODE')
        } else {
          // User click activity khác -> user control mode
          this.isUserControlled = true
          console.log('Switched to USER CONTROL MODE')
        }
      }

      updateSpeed(newSpeed: number) {
        console.log('=== SPEED UPDATE ===', 'from', this.speed, 'to', newSpeed)
        this.speed = newSpeed
      }

      updateCurrentActivity(newActivity: string) {
        console.log(
          '=== ACTIVITY UPDATE ===',
          'from',
          this.currentActivity,
          'to',
          newActivity
        )
        this.currentActivity = newActivity
        this.updateActivity()
      }
    }
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: window.innerWidth,
      height: 120,
      parent: gameRef.current,
      backgroundColor: '#87CEEB',
      scene: GameScene
    }

    phaserGameRef.current = new Phaser.Game(config)

    // Đợi một chút để scene khởi tạo xong
    setTimeout(() => {
      sceneRef.current =
        phaserGameRef.current?.scene.getScene('GameScene') || null
      console.log('Scene initialized:', sceneRef.current ? 'SUCCESS' : 'FAILED')
      console.log(
        'Available methods:',
        sceneRef.current ? Object.getOwnPropertyNames(sceneRef.current) : 'none'
      )
    }, 500)

    const handleResize = () => {
      if (phaserGameRef.current) {
        phaserGameRef.current.scale.resize(window.innerWidth, 120)
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (phaserGameRef.current) {
        phaserGameRef.current.destroy(true)
        phaserGameRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    console.log('=== SPEED EFFECT TRIGGERED ===', speed)
    // Delay để đảm bảo scene đã sẵn sàng
    setTimeout(() => {
      if (sceneRef.current && 'updateSpeed' in sceneRef.current) {
        console.log('Found scene, updating speed...')
        ;(sceneRef.current as any).updateSpeed(speed)
      } else {
        console.log('Scene not found for speed update')
      }
    }, 100)
  }, [speed])

  useEffect(() => {
    console.log('=== ACTIVITY EFFECT TRIGGERED ===', activity)
    // Delay để đảm bảo scene đã sẵn sàng
    setTimeout(() => {
      if (sceneRef.current && 'setUserActivity' in sceneRef.current) {
        console.log('Found scene, updating activity...')
        ;(sceneRef.current as any).setUserActivity(activity)
      } else {
        console.log('Scene not found for activity update')
      }
    }, 100)
  }, [activity])

  return (
    <div
      ref={gameRef}
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100vw',
        height: '120px',
        zIndex: 1000,
        border: 'none'
      }}
    />
  )
}

export default PhaserPetGame

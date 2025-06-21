import { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import dogSleepImg from '../assets/images/Chog/chog_sleep.png'
import dogSleepJson from '../assets/images/Chog/chog_sleep.json'
// Uncomment khi có assets khác
import dogWalkImg from '../assets/images/Chog/chog_walk.png'
import dogWalkJson from '../assets/images/Chog/chog_walk.json'
import dogEatImg from '../assets/images/Chog/chog_chew.png'
import dogEatJson from '../assets/images/Chog/'
import dogPlayImg from '../assets/images/chog_play.png'
import dogPlayJson from '../assets/images/chog_play.json'

interface PhaserPetGameProps {
  speed?: number
  activity?: 'walking' | 'sleeping' | 'eating' | 'playing'
}

const PhaserPetGame = ({
  speed = 50,
  activity = 'walking'
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

      constructor() {
        super({ key: 'GameScene' })
      }
      preload() {
        // Load multiple sprite sheets for different activities
        this.load.atlas('dog-sleep', dogSleepImg, dogSleepJson)

        // Load other activities if assets exist
        this.load.atlas('dog-walk', dogWalkImg, dogWalkJson)
        this.load.atlas('dog-eat', dogEatImg, dogEatJson)
        this.load.atlas('dog-play', dogPlayImg, dogPlayJson)
      }
      create() {
        // Sleeping animation
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

        // Walking animation (faster frames)
        this.anims.create({
          key: 'dog-walk',
          frames: [
            { key: 'dog-sleep', frame: 'chog_sleep 1.aseprite' },
            { key: 'dog-sleep', frame: 'chog_sleep 2.aseprite' },
            { key: 'dog-sleep', frame: 'chog_sleep 3.aseprite' },
            { key: 'dog-sleep', frame: 'chog_sleep 4.aseprite' }
          ],
          frameRate: 8,
          repeat: -1
        })

        // Eating animation
        this.anims.create({
          key: 'dog-eat',
          frames: [
            { key: 'dog-sleep', frame: 'chog_sleep 2.aseprite' },
            { key: 'dog-sleep', frame: 'chog_sleep 3.aseprite' }
          ],
          frameRate: 4,
          repeat: -1
        })

        // Playing animation
        this.anims.create({
          key: 'dog-play',
          frames: [
            { key: 'dog-sleep', frame: 'chog_sleep 1.aseprite' },
            { key: 'dog-sleep', frame: 'chog_sleep 4.aseprite' },
            { key: 'dog-sleep', frame: 'chog_sleep 5.aseprite' }
          ],
          frameRate: 10,
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

        // Thay đổi hoạt động ngẫu nhiên mỗi 5-10 giây
        if (this.activityTimer > Phaser.Math.Between(5, 10)) {
          this.randomActivity()
          this.activityTimer = 0
        }

        // Di chuyển chỉ khi đang walking
        if (this.isMoving && this.currentActivity === 'walking') {
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
          case 'sleeping':
            this.dog.play('dog-sleep')
            this.isMoving = false
            break
          case 'walking':
            this.dog.play('dog-walk')
            this.isMoving = true
            break
          case 'eating':
            this.dog.play('dog-eat')
            this.isMoving = false
            break
          case 'playing':
            this.dog.play('dog-play')
            this.isMoving = false
            break
          default:
            this.dog.play('dog-walk')
            this.isMoving = true
        }
      }

      randomActivity() {
        const activities = ['walking', 'sleeping', 'eating', 'playing']
        const newActivity = Phaser.Utils.Array.GetRandom(activities)
        this.setActivity(newActivity)
      }

      setActivity(newActivity: string) {
        this.currentActivity = newActivity
        this.updateActivity()
      }

      updateSpeed(newSpeed: number) {
        this.speed = newSpeed
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
    sceneRef.current = phaserGameRef.current.scene.getScene('GameScene')

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

  // Update speed khi props thay đổi
  useEffect(() => {
    if (sceneRef.current && 'updateSpeed' in sceneRef.current) {
      ;(sceneRef.current as any).updateSpeed(speed)
    }
  }, [speed])

  // Update activity khi props thay đổi
  useEffect(() => {
    if (sceneRef.current && 'setActivity' in sceneRef.current) {
      ;(sceneRef.current as any).setActivity(activity)
    }
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

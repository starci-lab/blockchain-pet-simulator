import { useEffect, useRef } from 'react'
import Phaser from 'phaser'

interface PhaserDogGameProps {
  speed?: number
}

const PhaserDogGame = ({ speed = 50 }: PhaserDogGameProps) => {
  const gameRef = useRef<HTMLDivElement>(null)
  const phaserGameRef = useRef<Phaser.Game | null>(null)
  useEffect(() => {
    if (!gameRef.current) return

    class GameScene extends Phaser.Scene {
      dog!: Phaser.GameObjects.Sprite
      direction: number = 1
      speed: number = speed

      constructor() {
        super({ key: 'GameScene' })
      }

      preload() {
        this.load.atlas(
          'dog',
          '/assets/images/chog_sleep.png',
          '/assets/images/chog_sleep.json'
        )
      }

      create() {
        this.anims.create({
          key: 'dog-idle',
          frames: [
            { key: 'dog', frame: 'chog_sleep 0.aseprite' },
            { key: 'dog', frame: 'chog_sleep 1.aseprite' },
            { key: 'dog', frame: 'chog_sleep 2.aseprite' },
            { key: 'dog', frame: 'chog_sleep 3.aseprite' },
            { key: 'dog', frame: 'chog_sleep 4.aseprite' },
            { key: 'dog', frame: 'chog_sleep 5.aseprite' }
          ],
          frameRate: 6,
          repeat: -1
        })

        this.dog = this.add.sprite(
          100,
          this.cameras.main.height - 40,
          'dog',
          'chog_sleep 0.aseprite'
        )

        this.dog.setScale(2)

        this.dog.play('dog-idle')
      }

      update() {
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

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: window.innerWidth,
      height: 120,
      parent: gameRef.current,
      backgroundColor: '#87CEEB',
      scene: GameScene
    }

    phaserGameRef.current = new Phaser.Game(config)

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
  }, [speed])

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

export default PhaserDogGame

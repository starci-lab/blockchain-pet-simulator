import { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import { GameScene } from '../game/scenes/GameScene'

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
  const sceneRef = useRef<GameScene | null>(null)

  useEffect(() => {
    if (!gameRef.current) return

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: window.innerWidth,
      height: 120,
      parent: gameRef.current,
      backgroundColor: '#87CEEB',
      scene: GameScene
    }

    phaserGameRef.current = new Phaser.Game(config)

    setTimeout(() => {
      sceneRef.current =
        (phaserGameRef.current?.scene.getScene('GameScene') as GameScene) ||
        null

      if (sceneRef.current) {
        sceneRef.current.speed = speed
        sceneRef.current.currentActivity = activity
      }
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
    setTimeout(() => {
      if (sceneRef.current && 'updateSpeed' in sceneRef.current) {
        sceneRef.current.updateSpeed(speed)
      }
    }, 100)
  }, [speed])

  useEffect(() => {
    setTimeout(() => {
      if (sceneRef.current && 'setUserActivity' in sceneRef.current) {
        sceneRef.current.setUserActivity(activity)
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

import { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import http from '@/utils/http'
import { ROUTES } from '@/constants/routes'
import { GameScene } from '@/game/scenes/GameScene'

interface PhaserPetGameProps {
  speed?: number
  activity?: 'walk' | 'sleep' | 'idleplay' | 'chew'
  publicKey: string
  signMessage?: (message: string) => string | Promise<string>
}

const PhaserPetGame = ({
  speed = 50,
  activity = 'walk',
  publicKey,
  signMessage
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

  useEffect(() => {
    if (!signMessage || !publicKey) {
      return
    }
    const handleSignMessage = async () => {
      try {
        const response = await http.get(ROUTES.getMessage)
        console.log('Message to Sign Response:', response.data)
        const messageToSign = response.data.message
        console.log('Signed Message:', messageToSign)
        const signedMessage = await signMessage(messageToSign)
        if (!signedMessage || signedMessage === '') {
          console.error('Signed message is empty or invalid')
          return
        }

        const verifyResponse = await http.post(ROUTES.verify, {
          message: messageToSign,
          address: publicKey,
          signature: signedMessage
        })
        console.log('Verification Response:', verifyResponse.data)
        // TODO: Save state user to zustand store
      } catch (error) {
        console.error('Error signing message:', error)
      }
    }
    handleSignMessage()
  }, [publicKey, signMessage])

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

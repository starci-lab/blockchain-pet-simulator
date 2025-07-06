import { useEffect, useRef, useState } from 'react'
import Phaser from 'phaser'
import http from '@/utils/http'
import { ROUTES } from '@/constants/routes'
import { GameScene } from '@/game/scenes/GameScene'
import RexUIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin.js'
import { useUserStore } from '@/store/userStore'

interface PhaserPetGameProps {
  publicKey: string
  signMessage?: (message: string) => string | Promise<string>
}

const PhaserPetGame = ({ publicKey, signMessage }: PhaserPetGameProps) => {
  const gameRef = useRef<HTMLDivElement>(null)
  const phaserGameRef = useRef<Phaser.Game | null>(null)
  const sceneRef = useRef<GameScene | null>(null)
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(false)
  const [isGameInitialized, setIsGameInitialized] = useState(false)

  useEffect(() => {
    console.log('🔍 Game initialization check:', {
      gameRef: !!gameRef.current,
      isUserAuthenticated,
      isGameInitialized
    })

    if (!gameRef.current || !isUserAuthenticated || isGameInitialized) {
      console.log('❌ Skipping game initialization')
      return
    }

    console.log('🎮 Starting Phaser game initialization...')

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: window.innerWidth,
      height: 120,
      parent: gameRef.current,
      backgroundColor: '#87CEEB',
      scene: GameScene,
      plugins: {
        scene: [
          {
            key: 'rexUI',
            plugin: RexUIPlugin,
            mapping: 'rexUI'
          }
        ]
      }
    }

    try {
      phaserGameRef.current = new Phaser.Game(config)
      console.log('✅ Phaser Game created successfully')

      setTimeout(() => {
        sceneRef.current =
          (phaserGameRef.current?.scene.getScene('gameplay') as GameScene) ||
          null

        if (sceneRef.current) {
          console.log('✅ GameScene loaded successfully')
          setIsGameInitialized(true) // Only set after GameScene is loaded
        } else {
          console.error('❌ Failed to get GameScene')
          // Retry after a longer delay
          setTimeout(() => {
            sceneRef.current =
              (phaserGameRef.current?.scene.getScene(
                'gameplay'
              ) as GameScene) || null
            if (sceneRef.current) {
              console.log('✅ GameScene loaded successfully (retry)')
              setIsGameInitialized(true)
            } else {
              console.error('❌ GameScene still not available after retry')
            }
          }, 1000)
        }
      }, 500)
    } catch (error) {
      console.error('❌ Failed to create Phaser Game:', error)
    }

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
  }, [isUserAuthenticated])

  useEffect(() => {
    console.log('🔐 Authentication check:', {
      signMessage: !!signMessage,
      publicKey: !!publicKey
    })

    if (!signMessage || !publicKey) {
      console.log('✅ No authentication needed, setting authenticated = true')
      setIsUserAuthenticated(true) // No authentication needed
      return
    }

    console.log('🔐 Starting authentication process...')
    const handleSignMessage = async () => {
      try {
        const response = await http.get(ROUTES.getMessage)
        console.log('Message to Sign Response:', response.data)
        const messageToSign = response.data.message
        console.log('Signed Message:', messageToSign)
        const signedMessage = await signMessage(messageToSign)
        if (!signedMessage || signedMessage === '') {
          console.error('Signed message is empty or invalid')
          setIsUserAuthenticated(false)
          return
        }

        const verifyResponse = await http.post(ROUTES.verify, {
          message: messageToSign,
          address: publicKey,
          signature: signedMessage
        })
        console.log('Verification Response:', verifyResponse.data)
        // Save state user to zustand store
        useUserStore
          .getState()
          .setAddressWallet(verifyResponse.data.wallet_address)

        console.log('✅ Authentication completed successfully!')
        setIsUserAuthenticated(true) // Authentication completed
      } catch (error) {
        console.error('Error signing message:', error)
        setIsUserAuthenticated(false)
      }
    }
    handleSignMessage()
  }, [publicKey, signMessage])

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100vw',
        height: '120px',
        zIndex: 1000,
        border: 'none',
        backgroundColor: '#87CEEB'
      }}
    >
      {!isUserAuthenticated && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            color: 'white',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          Đang xác thực người dùng...
        </div>
      )}
      <div
        ref={gameRef}
        style={{
          width: '100%',
          height: '100%',
          display: isUserAuthenticated ? 'block' : 'none'
        }}
      />
    </div>
  )
}

export default PhaserPetGame

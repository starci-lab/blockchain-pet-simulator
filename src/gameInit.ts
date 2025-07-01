import { gameConfigManager } from './game/configs/gameConfig'

// Initialize game configuration when the game starts
export async function initializeGame() {
  console.log('🎮 Initializing game...')

  try {
    // Load game configuration (tries API first, falls back to local)
    await gameConfigManager.loadConfig()
    console.log('✅ Game configuration loaded')

    return true
  } catch (error) {
    console.error('❌ Game initialization failed:', error)
    return false
  }
}

// Call this before starting your Phaser game
// Example usage in your main.tsx or index.ts:
// await initializeGame()
// new Phaser.Game(config)

// Game layout constants
export const GAME_LAYOUT = {
  GROUND_OFFSET: 30, // Distance from bottom of screen for ground line
  PET_GROUND_OFFSET: 30, // Distance from bottom for pets (standing on ground)
  FOOD_GROUND_OFFSET: 15, // Distance from bottom for food (sitting on ground)
  FOOD_DROP_HEIGHT: 25, // Height above final position for food drop animation
  PET_HEIGHT: 40, // Pet sprite height (approximate)
  PET_WIDTH: 40, // Pet sprite width (approximate)
  PET_SCALE: 2, // Pet sprite scale multiplier
  FOOD_WIDTH: 30, // Food sprite width (approximate)
  FOOD_HEIGHT: 30, // Food sprite height (approximate)
  FOOD_SCALE: 1.5 // Food sprite scale multiplier
} as const

// Calculated constants based on layout
export const CALCULATED_CONSTANTS = {
  // Pet dimensions after scaling
  get SCALED_PET_WIDTH() {
    return GAME_LAYOUT.PET_WIDTH * GAME_LAYOUT.PET_SCALE
  },
  get SCALED_PET_HEIGHT() {
    return GAME_LAYOUT.PET_HEIGHT * GAME_LAYOUT.PET_SCALE
  },

  // Food dimensions after scaling
  get SCALED_FOOD_WIDTH() {
    return GAME_LAYOUT.FOOD_WIDTH * GAME_LAYOUT.FOOD_SCALE
  },
  get SCALED_FOOD_HEIGHT() {
    return GAME_LAYOUT.FOOD_HEIGHT * GAME_LAYOUT.FOOD_SCALE
  }
} as const

// Game mechanics constants
export const GAME_MECHANICS = {
  CHASE_DISTANCE: 20, // Distance to reach food
  FOOD_DETECTION_RANGE: 40, // Range to detect food for eating
  HUNGER_THRESHOLD: 80, // Hunger level below which pets chase food
  HUNGER_RESTORE_AMOUNT: 20, // Hunger restored when eating food
  HUNGER_DECREASE_PER_HOUR: 3000, // Hunger decrease rate per hour
  FOOD_DESPAWN_TIME: 20000, // Time before food auto-despawns (ms)
  SAFETY_CHECK_INTERVAL: 5000, // Safety check timer interval (ms)
  POST_EATING_DELAY: 2000, // Delay after eating before next action (ms)
  TRANSITION_DELAY: 30, // Quick transition delay (ms)
  SECONDARY_CHECK_DELAY: 500, // Secondary force check delay (ms)
  CHASE_CHECK_INTERVAL: 1000 // Interval between chase opportunity checks (ms)
} as const

// Helper functions for game positioning
export const GamePositioning = {
  // Get ground Y position for a given camera height (general ground line)
  getGroundY(cameraHeight: number): number {
    return cameraHeight - GAME_LAYOUT.GROUND_OFFSET
  },

  // Get pet spawn Y position (pets stand on ground)
  getPetY(cameraHeight: number): number {
    return cameraHeight - GAME_LAYOUT.PET_GROUND_OFFSET
  },

  // Get food drop Y position (food drops slightly above final position)
  getFoodDropY(cameraHeight: number): number {
    return (
      cameraHeight -
      GAME_LAYOUT.FOOD_GROUND_OFFSET -
      GAME_LAYOUT.FOOD_DROP_HEIGHT
    )
  },

  // Get food final Y position (food sits on ground)
  getFoodFinalY(cameraHeight: number): number {
    return cameraHeight - GAME_LAYOUT.FOOD_GROUND_OFFSET
  },

  // Get pet boundary limits
  getPetBoundaries(cameraWidth: number) {
    const halfWidth = CALCULATED_CONSTANTS.SCALED_PET_WIDTH / 2
    const bounds = {
      minX: halfWidth,
      maxX: cameraWidth - halfWidth
    }
    // console.log(`Pet boundaries: [${bounds.minX.toFixed(1)}, ${bounds.maxX.toFixed(1)}], camera: ${cameraWidth}`)
    return bounds
  },

  // Get food boundary limits
  getFoodBoundaries(cameraWidth: number) {
    const halfWidth = CALCULATED_CONSTANTS.SCALED_FOOD_WIDTH / 2
    const bounds = {
      minX: halfWidth,
      maxX: cameraWidth - halfWidth
    }
    // console.log(`Food boundaries: [${bounds.minX.toFixed(1)}, ${bounds.maxX.toFixed(1)}], camera: ${cameraWidth}`)
    return bounds
  }
} as const

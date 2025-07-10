import Phaser from 'phaser'
import backgroundImg from '@/assets/images/backgrounds/game-bg.svg'
import dogSleepImg from '@/assets/images/Chog/chog_sleep.png'
import dogSleepJson from '@/assets/images/Chog/chog_sleep.json'
import dogPlayImg from '@/assets/images/Chog/chog_idleplay.png'
import dogPlayJson from '@/assets/images/Chog/chog_idleplay.json'
import dogChewImg from '@/assets/images/Chog/chog_chew.png'
import dogChewJson from '@/assets/images/Chog/chog_chew.json'
import dogWalkImg from '@/assets/images/Chog/chog_walk.png'
import dogWalkJson from '@/assets/images/Chog/chog_walk_animated.json'
import hamburgerImg from '@/assets/images/food/hambuger.png'

export const loadChogAssets = (scene: Phaser.Scene) => {
  scene.load.atlas('dog-sleep', dogSleepImg, dogSleepJson)
  scene.load.atlas('dog-play', dogPlayImg, dogPlayJson)
  scene.load.atlas('dog-chew', dogChewImg, dogChewJson)
  scene.load.atlas('dog-walk', dogWalkImg, dogWalkJson)
}

// Load background assets
export const loadBackgroundAssets = (scene: Phaser.Scene) => {
  // Load your custom background image
  scene.load.image(
    'game-background',
    backgroundImg
  )
}

export const loadFoodAssets = (scene: Phaser.Scene) => {
  scene.load.image('hamburger', hamburgerImg)
}

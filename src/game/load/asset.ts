import Phaser from "phaser";
import backgroundImg from "@/assets/images/backgrounds/game-bg.png";
import dogSleepImg from "@/assets/images/Chog/chog_sleep.png";
import dogSleepJson from "@/assets/images/Chog/chog_sleep.json";
import dogPlayImg from "@/assets/images/Chog/chog_idleplay.png";
import dogPlayJson from "@/assets/images/Chog/chog_idleplay.json";
import dogChewImg from "@/assets/images/Chog/chog_chew.png";
import dogChewJson from "@/assets/images/Chog/chog_chew.json";
import dogWalkImg from "@/assets/images/Chog/chog_walk.png";
import dogWalkJson from "@/assets/images/Chog/chog_walk_animated.json";
// KeoneDog assets (using current path until migration)
import keonedogSleepImg from "@/assets/images/KeoneDog/keonedog_sleep.png";
import keonedogSleepJson from "@/assets/images/KeoneDog/keonedog_sleep.json";
import keonedogPlayImg from "@/assets/images/KeoneDog/keonedog_idleplay.png";
import keonedogPlayJson from "@/assets/images/KeoneDog/keonedog_idleplay.json";
import keonedogChewImg from "@/assets/images/KeoneDog/keonedog_chew.png";
import keonedogChewJson from "@/assets/images/KeoneDog/keonedog_chew.json";
import keonedogWalkImg from "@/assets/images/KeoneDog/keonedog_walk.png";
import keonedogWalkJson from "@/assets/images/KeoneDog/keonedog_walk.json";
import keonedogIdleImg from "@/assets/images/KeoneDog/keonedog_idle.png";
import keonedogIdleJson from "@/assets/images/KeoneDog/keonedog_idle.json";
// Ghost assets
import ghostSleepImg from "@/assets/images/Ghost/ghost_sleep.png";
import ghostSleepJson from "@/assets/images/Ghost/ghost_sleep.json";
import ghostPlayImg from "@/assets/images/Ghost/ghost_idleplay.png";
import ghostPlayJson from "@/assets/images/Ghost/ghost_idleplay.json";
import ghostChewImg from "@/assets/images/Ghost/ghost_chew.png";
import ghostChewJson from "@/assets/images/Ghost/ghost_chew.json";
import ghostIdleImg from "@/assets/images/Ghost/ghost_idle.png";
import ghostIdleJson from "@/assets/images/Ghost/ghost_idle.json";
import ghostWalkImg from "@/assets/images/Ghost/ghost_walk.png";
import ghostWalkJson from "@/assets/images/Ghost/ghost_walk.json";
import hamburgerImg from "@/assets/images/food/hambuger.png";
import poopImg from "@/assets/images/poop/poop.png";
import broomImg from "@/assets/images/broom/broom.png";
import ballImg from "@/assets/images/ball/ball.png";
import forestBgImg from "@/assets/images/backgrounds/forest-bg.png";
import heartImg from "@/assets/images/effects/heart.png";
import coinPixelImg from "@/assets/images/coin/coin-e4dae5.png";
import settingImg from "@/assets/images/game-ui/setting.png";
import shopImg from "@/assets/images/game-ui/shop.png";
import homeImg from "@/assets/images/game-ui/home.png";
export const loadChogAssets = (scene: Phaser.Scene) => {
  scene.load.atlas("dog-sleep", dogSleepImg, dogSleepJson);
  scene.load.atlas("dog-play", dogPlayImg, dogPlayJson);
  scene.load.atlas("dog-chew", dogChewImg, dogChewJson);
  scene.load.atlas("dog-walk", dogWalkImg, dogWalkJson);
};

export const loadKeoneDogAssets = (scene: Phaser.Scene) => {
  scene.load.atlas("keonedog-idle", keonedogIdleImg, keonedogIdleJson);
  scene.load.atlas("keonedog-sleep", keonedogSleepImg, keonedogSleepJson);
  scene.load.atlas("keonedog-play", keonedogPlayImg, keonedogPlayJson);
  scene.load.atlas("keonedog-chew", keonedogChewImg, keonedogChewJson);
  scene.load.atlas("keonedog-walk", keonedogWalkImg, keonedogWalkJson);
};

export const loadGhostAssets = (scene: Phaser.Scene) => {
  scene.load.atlas("ghost-idle", ghostIdleImg, ghostIdleJson);
  scene.load.atlas("ghost-sleep", ghostSleepImg, ghostSleepJson);
  scene.load.atlas("ghost-play", ghostPlayImg, ghostPlayJson);
  scene.load.atlas("ghost-chew", ghostChewImg, ghostChewJson);
  scene.load.atlas("ghost-walk", ghostWalkImg, ghostWalkJson);
};

// Load all pet assets
export const loadAllPetAssets = (scene: Phaser.Scene) => {
  loadChogAssets(scene);
  loadKeoneDogAssets(scene);
  loadGhostAssets(scene);
};

// Load background assets
export const loadBackgroundAssets = (scene: Phaser.Scene) => {
  // Load your custom background image
  scene.load.image("game-background", backgroundImg);
  scene.load.image("forest-bg", forestBgImg);
};

export const loadFoodAssets = (scene: Phaser.Scene) => {
  scene.load.image("hamburger", hamburgerImg);
};

export const loadPoopAssets = (scene: Phaser.Scene) => {
  scene.load.image("poop", poopImg);
};

export const loadCleaningAssets = (scene: Phaser.Scene) => {
  scene.load.image("broom", broomImg);
};

export const loadToyAssets = (scene: Phaser.Scene) => {
  scene.load.image("ball", ballImg);
};

export const loadEffectAssets = (scene: Phaser.Scene) => {
  scene.load.image("heart", heartImg);
  // Use pixel-styled coin sprite instead of effects coin
  scene.load.image("coin", coinPixelImg);
};

export const loadUiAssets = (scene: Phaser.Scene) => {
  // Generic setting icon used for both shop and settings buttons per request
  scene.load.image("setting", settingImg);
  scene.load.image("shop", shopImg);
  scene.load.image("home", homeImg);
};

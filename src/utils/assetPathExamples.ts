/**
 * Example usage of asset path utilities
 * This file demonstrates how to use the new asset path system
 */

import {
  generateAssetPath,
  parseBackendImageUrl,
  getShopItemAssetPath,
  ASSET_PATHS,
  PET_VARIANTS
} from "./assetPath";
import { normalizePetAssetData, migrateLegacyPath } from "./assetMigration";

// Example 1: Generate asset path for different categories
console.log("=== Asset Path Generation Examples ===");

// Food item
const foodPath = generateAssetPath({
  category: "food",
  itemName: "hamburger",
  extension: "png"
});
console.log("Food path:", foodPath); // "assets/images/food/hamburger.png"

// Pet with variant
const petPath = generateAssetPath({
  category: "pets",
  itemName: "Chog",
  variant: PET_VARIANTS.IDLE,
  extension: "png"
});
console.log("Pet path:", petPath); // "assets/images/pets/Chog/Chog_idle.png"

// Example 2: Parse backend image URLs
console.log("\n=== Backend URL Parsing Examples ===");

const backendUrls = [
  "/assets/images/KeoneDog/keonedog_idle.png",
  "/assets/images/Chog/chog_walk.png",
  "assets/images/food/hamburger.png"
];

backendUrls.forEach((url) => {
  const parsed = parseBackendImageUrl(url);
  console.log(`Backend: ${url} -> Frontend: ${parsed}`);
});

// Example 3: Shop item asset path resolution
console.log("\n=== Shop Item Asset Path Examples ===");

const shopItems = [
  {
    category: "pets",
    item: {
      image_url: "/assets/images/KeoneDog/keonedog_idle.png",
      species: "KeoneDog",
      name: "KeoneDog"
    }
  },
  {
    category: "food",
    item: {
      texture: "hamburger",
      name: "Hamburger"
    }
  },
  {
    category: "pets",
    item: {
      species: "Ghost",
      name: "Ghost Pet"
    }
  }
];

shopItems.forEach(({ category, item }) => {
  const path = getShopItemAssetPath(category, item);
  console.log(`${category}: ${item.name} -> ${path}`);
});

// Example 4: Normalize backend pet data
console.log("\n=== Pet Data Normalization Examples ===");

const backendPetData = {
  image_url: "/assets/images/KeoneDog/keonedog_idle.png",
  species: "keonedog",
  name: "KeoneDog",
  texture: "keonedog"
};

const normalized = normalizePetAssetData(backendPetData);
console.log("Original:", backendPetData);
console.log("Normalized:", normalized);

// Example 5: Legacy path migration
console.log("\n=== Legacy Path Migration Examples ===");

const legacyPaths = [
  "assets/images/Chog/chog_idle.png",
  "assets/images/KeoneDog/keonedog_walk.png",
  "assets/images/ball/ball.png"
];

legacyPaths.forEach((path) => {
  const migrated = migrateLegacyPath(path);
  console.log(`Legacy: ${path} -> Migrated: ${migrated}`);
});

// Example 6: Using constants for consistency
console.log("\n=== Using Asset Path Constants ===");

console.log("Base path:", ASSET_PATHS.BASE);
console.log("Pets path:", ASSET_PATHS.PETS);
console.log("Food path:", ASSET_PATHS.FOOD);

// Example 7: Pet variants
console.log("\n=== Pet Variants ===");

Object.entries(PET_VARIANTS).forEach(([key, value]) => {
  console.log(`${key}: ${value}`);
});

export {
  // Re-export for easy access
  generateAssetPath,
  parseBackendImageUrl,
  getShopItemAssetPath,
  normalizePetAssetData,
  migrateLegacyPath,
  ASSET_PATHS,
  PET_VARIANTS
};

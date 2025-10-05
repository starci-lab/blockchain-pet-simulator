/**
 * Migration script to reorganize assets from old structure to new structure
 * This script helps migrate assets to the new organized folder structure
 */

import { ASSET_PATHS, PET_VARIANTS } from "./assetPath";

/**
 * Migration mapping for old to new structure
 */
export const MIGRATION_MAPPING = {
  // Pet migrations
  pets: {
    // Old: assets/images/Chog/ -> New: assets/images/pets/Chog/
    Chog: "pets/Chog",
    KeoneDog: "pets/KeoneDog",
    Keonedog: "pets/KeoneDog",
    Ghost: "pets/Ghost",

    // Category migrations
    ball: "toys",
    broom: "cleaning"
  }
} as const;

/**
 * Generate migration commands for file system
 */
export function generateMigrationCommands(): string[] {
  const commands: string[] = [];

  // Pet migrations
  commands.push("# Pet Asset Migrations");
  commands.push("# Move Chog assets to new structure");
  commands.push("mkdir -p src/assets/images/pets/Chog");
  commands.push("mv src/assets/images/Chog/* src/assets/images/pets/Chog/");
  commands.push("rmdir src/assets/images/Chog");

  commands.push("# Move KeoneDog assets (if they exist in old location)");
  commands.push("mkdir -p src/assets/images/pets/KeoneDog");
  commands.push(
    "# mv src/assets/images/KeoneDog/* src/assets/images/pets/KeoneDog/"
  );

  commands.push("# Move Ghost assets (if they exist in old location)");
  commands.push("mkdir -p src/assets/images/pets/Ghost");
  commands.push("# mv src/assets/images/Ghost/* src/assets/images/pets/Ghost/");

  // Category migrations
  commands.push("\n# Category Migrations");
  commands.push("mkdir -p src/assets/images/toys");
  commands.push("mv src/assets/images/ball/* src/assets/images/toys/");
  commands.push("rmdir src/assets/images/ball");

  commands.push("mkdir -p src/assets/images/cleaning");
  commands.push("mv src/assets/images/broom/* src/assets/images/cleaning/");
  commands.push("rmdir src/assets/images/broom");

  commands.push("mkdir -p src/assets/images/ui");
  commands.push("mv src/assets/images/game-ui/* src/assets/images/ui/");
  commands.push("rmdir src/assets/images/game-ui");

  return commands;
}

/**
 * Validate asset structure after migration
 */
export function validateAssetStructure(): {
  isValid: boolean;
  issues: string[];
  suggestions: string[];
} {
  const issues: string[] = [];
  const suggestions: string[] = [];

  // Check if required pet folders exist
  const requiredPetFolders = ["Chog", "KeoneDog", "Ghost"];
  requiredPetFolders.forEach((pet) => {
    const petPath = `${ASSET_PATHS.PETS}${pet}/`;
    // This would need to be implemented with actual file system checks
    suggestions.push(`Verify folder exists: ${petPath}`);
  });

  // Check if required variants exist for each pet
  requiredPetFolders.forEach((pet) => {
    Object.values(PET_VARIANTS).forEach((variant) => {
      const spritePath = `${
        ASSET_PATHS.PETS
      }${pet}/${pet.toLowerCase()}_${variant}.png`;
      const jsonPath = `${
        ASSET_PATHS.PETS
      }${pet}/${pet.toLowerCase()}_${variant}.json`;

      suggestions.push(`Verify sprite exists: ${spritePath}`);
      suggestions.push(`Verify animation data exists: ${jsonPath}`);
    });
  });

  return {
    isValid: issues.length === 0,
    issues,
    suggestions
  };
}

/**
 * Generate asset inventory report
 */
export function generateAssetInventory(): {
  pets: Record<string, string[]>;
  categories: Record<string, string[]>;
} {
  return {
    pets: {
      Chog: [
        "chog_idle.png",
        "chog_idle.json",
        "chog_walk.png",
        "chog_walk.json",
        "chog_sleep.png",
        "chog_sleep.json",
        "chog_chew.png",
        "chog_chew.json",
        "chog_idleplay.png",
        "chog_idleplay.json"
      ],
      KeoneDog: [
        "keonedog_idle.png",
        "keonedog_idle.json",
        "keonedog_walk.png",
        "keonedog_walk.json",
        "keonedog_sleep.png",
        "keonedog_sleep.json",
        "keonedog_chew.png",
        "keonedog_chew.json",
        "keonedog_idleplay.png",
        "keonedog_idleplay.json"
      ],
      Ghost: [
        "ghost_idle.png",
        "ghost_idle.json",
        "ghost_walk.png",
        "ghost_walk.json",
        "ghost_sleep.png",
        "ghost_sleep.json",
        "ghost_chew.png",
        "ghost_chew.json",
        "ghost_idleplay.png",
        "ghost_idleplay.json"
      ]
    },
    categories: {
      food: ["hamburger.png"],
      toys: ["ball.png"],
      cleaning: ["broom.png"],
      backgrounds: ["forest-bg.png", "game-bg.png", "sky.png"],
      effects: ["coin.png", "heart.png"],
      ui: ["home.png", "setting.png", "shop.png"]
    }
  };
}

/**
 * Print migration instructions
 */
export function printMigrationInstructions(): void {
  console.log("=== Asset Migration Instructions ===");
  console.log("\n1. Run the migration commands:");
  generateMigrationCommands().forEach((cmd) => console.log(cmd));

  console.log("\n2. Verify asset structure:");
  const validation = validateAssetStructure();
  validation.suggestions.forEach((suggestion) =>
    console.log(`- ${suggestion}`)
  );

  console.log("\n3. Expected asset inventory:");
  const inventory = generateAssetInventory();
  console.log("Pets:", inventory.pets);
  console.log("Categories:", inventory.categories);

  console.log("\n4. Update your backend to use new paths:");
  console.log("- KeoneDog: /assets/images/pets/KeoneDog/keonedog_idle.png");
  console.log("- Chog: /assets/images/pets/Chog/chog_idle.png");
  console.log("- Ghost: /assets/images/pets/Ghost/ghost_idle.png");
}

// Export for use in other files
export {
  generateMigrationCommands,
  validateAssetStructure,
  generateAssetInventory,
  printMigrationInstructions
};

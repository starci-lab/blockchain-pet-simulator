/**
 * Asset path utility for generating consistent asset URLs
 */

export interface AssetPathConfig {
  basePath?: string;
  category: string;
  itemName: string;
  extension?: string;
  variant?: string;
}

/**
 * Generate asset path based on category and item properties
 */
export function generateAssetPath(config: AssetPathConfig): string {
  const {
    basePath = "assets/images/",
    category,
    itemName,
    extension = "png",
    variant
  } = config;

  // Handle different category patterns
  switch (category.toLowerCase()) {
    case "food":
      return `${basePath}food/${itemName}.${extension}`;

    case "toy":
      return `${basePath}ball/${itemName}.${extension}`;

    case "clean":
    case "cleaning":
      return `${basePath}broom/${itemName}.${extension}`;

    case "pets":
    case "pet":
      // For pets, we need to handle different species and variants
      const petVariant = variant || "idle";
      return `${basePath}pets/${itemName}/${itemName}_${petVariant}.${extension}`;

    case "backgrounds":
    case "background":
      return `${basePath}backgrounds/${itemName}.${extension}`;

    case "furniture":
      // Default furniture icon
      return `${basePath}effects/coin.${extension}`;

    default:
      return `${basePath}${category}/${itemName}.${extension}`;
  }
}

/**
 * Parse backend image_url and convert to frontend asset path
 */
export function parseBackendImageUrl(imageUrl: string): string {
  if (!imageUrl) return "";

  // Remove leading slash if present
  const cleanUrl = imageUrl.startsWith("/") ? imageUrl.slice(1) : imageUrl;

  // If it's already a valid frontend path, return as is
  if (cleanUrl.startsWith("assets/images/")) {
    return cleanUrl;
  }

  // Parse backend path structure
  const pathParts = cleanUrl.split("/");
  if (pathParts.length < 3) return cleanUrl;

  const [, , category, ...rest] = pathParts;
  const fileName = rest.join("/");

  // Extract item name and variant from filename
  const nameParts = fileName.split("_");
  const itemName = nameParts[0];
  const variant = nameParts.length > 1 ? nameParts[1].split(".")[0] : undefined;

  return generateAssetPath({
    category,
    itemName,
    variant,
    extension: fileName.split(".").pop() || "png"
  });
}

/**
 * Get asset path for shop items with fallback logic
 */
export function getShopItemAssetPath(
  category: string,
  item: {
    texture?: string;
    name?: string;
    image_url?: string;
    species?: string;
  }
): string {
  // Priority 1: Use image_url from backend if available
  if (item.image_url) {
    const parsedUrl = parseBackendImageUrl(item.image_url);
    if (parsedUrl) return parsedUrl;
  }

  // Priority 2: Use texture property
  const itemName = item.texture || item.species || item.name || "default";

  const generatedPath = generateAssetPath({
    category,
    itemName,
    variant: category === "pets" ? "idle" : undefined
  });

  // Priority 3: Fallback for missing assets
  if (!generatedPath) {
    return getFallbackAssetPath(category, itemName);
  }

  return generatedPath;
}

/**
 * Get fallback asset path when primary path fails
 */
function getFallbackAssetPath(category: string, itemName: string): string {
  const fallbackMappings: Record<string, string> = {
    pets: "assets/images/effects/heart.png",
    food: "assets/images/effects/coin.png",
    toy: "assets/images/effects/coin.png",
    clean: "assets/images/effects/coin.png",
    background: "assets/images/backgrounds/forest-bg.png",
    backgrounds: "assets/images/backgrounds/forest-bg.png",
    furniture: "assets/images/effects/coin.png"
  };

  return fallbackMappings[category] || "assets/images/effects/coin.png";
}

/**
 * Asset path constants for consistency
 */
export const ASSET_PATHS = {
  BASE: "assets/images/",
  FOOD: "assets/images/food/",
  TOYS: "assets/images/ball/",
  CLEANING: "assets/images/broom/",
  PETS: "assets/images/pets/",
  BACKGROUNDS: "assets/images/backgrounds/",
  EFFECTS: "assets/images/effects/"
} as const;

/**
 * Pet variants mapping
 */
export const PET_VARIANTS = {
  IDLE: "idle",
  WALK: "walk",
  SLEEP: "sleep",
  EAT: "eat",
  CHEW: "chew",
  IDLEPLAY: "idleplay"
} as const;

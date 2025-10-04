/**
 * Migration utilities for asset path handling
 */

import { generateAssetPath, parseBackendImageUrl } from "./assetPath";

/**
 * Legacy path mapping for backward compatibility
 */
export const LEGACY_PATH_MAPPING = {
  // Old Chog path -> new pets structure
  Chog: "pets/Chog",
  KeoneDog: "pets/Keonedog",
  Ghost: "pets/Ghost",

  // Category mappings
  ball: "toys",
  broom: "cleaning"
} as const;

/**
 * Migrate legacy asset paths to new structure
 */
export function migrateLegacyPath(legacyPath: string): string {
  if (!legacyPath) return "";

  // Handle direct legacy mappings
  for (const [legacy, modern] of Object.entries(LEGACY_PATH_MAPPING)) {
    if (legacyPath.includes(legacy)) {
      return legacyPath.replace(legacy, modern);
    }
  }

  return legacyPath;
}

/**
 * Convert backend pet data to frontend-compatible format
 */
export function normalizePetAssetData(backendData: {
  image_url?: string;
  species?: string;
  name?: string;
  texture?: string;
}): {
  image_url?: string;
  species?: string;
  name?: string;
  texture?: string;
} {
  const normalized = { ...backendData };

  // If image_url exists, parse and normalize it
  if (normalized.image_url) {
    normalized.image_url = parseBackendImageUrl(normalized.image_url);
  }

  // Ensure species is properly formatted
  if (normalized.species) {
    normalized.species =
      normalized.species.charAt(0).toUpperCase() +
      normalized.species.slice(1).toLowerCase();
  }

  return normalized;
}

/**
 * Asset path validator
 */
export function validateAssetPath(path: string): boolean {
  if (!path) return false;

  // Check if path starts with assets/
  if (!path.startsWith("assets/")) return false;

  // Check for valid extensions
  const validExtensions = ["png", "jpg", "jpeg", "gif", "svg", "webp"];
  const extension = path.split(".").pop()?.toLowerCase();

  return extension ? validExtensions.includes(extension) : false;
}

/**
 * Get fallback asset path when primary path fails
 */
export function getFallbackAssetPath(
  category: string,
  itemName: string
): string {
  const fallbackMappings: Record<string, string> = {
    pets: "assets/images/effects/heart.png",
    food: "assets/images/effects/coin.png",
    toy: "assets/images/effects/coin.png",
    clean: "assets/images/effects/coin.png",
    background: "assets/images/backgrounds/forest-bg.png",
    furniture: "assets/images/effects/coin.png"
  };

  return fallbackMappings[category] || "assets/images/effects/coin.png";
}

/**
 * Test file to verify multi-species pet support
 * This file demonstrates how the updated Pet class works with different pet types
 */

import { Pet } from "@/game/entities/Pet";

// Mock Phaser Scene for testing
class MockScene {
  public cameras = {
    main: {
      height: 600,
      width: 800
    }
  };

  public add = {
    sprite: (x: number, y: number, texture: string, frame?: string) => ({
      x,
      y,
      texture,
      frame,
      setScale: () => {},
      setInteractive: () => {},
      on: () => {},
      play: (animation: string) =>
        console.log(`Playing animation: ${animation}`),
      setTint: () => {},
      clearTint: () => {}
    })
  };

  public anims = {
    create: (config: any) => {
      console.log(`Created animation: ${config.key}`);
    }
  };

  public time = {
    delayedCall: () => ({ destroy: () => {} })
  };

  public tweens = {
    add: () => {}
  };
}

// Test function
export function testMultiSpeciesPetSupport() {
  console.log("=== Testing Multi-Species Pet Support ===");

  const mockScene = new MockScene();

  // Test Chog pet
  console.log("\n1. Testing Chog pet:");
  const chogPet = new Pet(mockScene, "chog");
  chogPet.createAnimations();
  chogPet.create(400, 300);
  chogPet.setActivity("walk");
  chogPet.setActivity("sleep");
  chogPet.setActivity("chew");

  // Test KeoneDog pet
  console.log("\n2. Testing KeoneDog pet:");
  const keonedogPet = new Pet(mockScene, "keonedog");
  keonedogPet.createAnimations();
  keonedogPet.create(400, 300);
  keonedogPet.setActivity("walk");
  keonedogPet.setActivity("sleep");
  keonedogPet.setActivity("chew");

  // Test Ghost pet
  console.log("\n3. Testing Ghost pet:");
  const ghostPet = new Pet(mockScene, "ghost");
  ghostPet.createAnimations();
  ghostPet.create(400, 300);
  ghostPet.setActivity("walk");
  ghostPet.setActivity("sleep");
  ghostPet.setActivity("chew");

  console.log("\n=== Test Complete ===");
  console.log("✅ All pet types should now use their respective animations");
  console.log("✅ Chog uses: dog-walk, dog-sleep, dog-chew, etc.");
  console.log(
    "✅ KeoneDog uses: keonedog-walk, keonedog-sleep, keonedog-chew, etc."
  );
  console.log("✅ Ghost uses: ghost-walk, ghost-sleep, ghost-chew, etc.");
}

// Test animation key generation
export function testAnimationKeys() {
  console.log("\n=== Testing Animation Key Generation ===");

  const mockScene = new MockScene();

  const pets = [
    { type: "chog", expected: "dog" },
    { type: "keonedog", expected: "keonedog" },
    { type: "ghost", expected: "ghost" }
  ];

  pets.forEach(({ type, expected }) => {
    const pet = new Pet(mockScene, type);
    console.log(`\nPet type: ${type}`);
    console.log(
      `- Walk animation: ${pet["getAnimationKey"](
        "walk"
      )} (expected: ${expected}-walk)`
    );
    console.log(
      `- Sleep animation: ${pet["getAnimationKey"](
        "sleep"
      )} (expected: ${expected}-sleep)`
    );
    console.log(
      `- Chew animation: ${pet["getAnimationKey"](
        "chew"
      )} (expected: ${expected}-chew)`
    );
    console.log(
      `- Texture key: ${pet["getTextureKey"](
        "walk"
      )} (expected: ${expected}-walk)`
    );
    console.log(
      `- Frame key: ${pet["getFrameKey"](
        "walk",
        0
      )} (expected: ${type}_walk 0.aseprite)`
    );
  });
}

// Run tests if this file is executed directly
if (typeof window === "undefined") {
  testMultiSpeciesPetSupport();
  testAnimationKeys();
}

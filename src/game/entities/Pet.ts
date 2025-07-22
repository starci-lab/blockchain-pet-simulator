import Phaser from "phaser";
import { GamePositioning, GAME_LAYOUT } from "@/game/constants/gameConstants";

export class Pet {
  public sprite!: Phaser.GameObjects.Sprite;
  public direction: number = 1;
  public speed: number = 50;
  public currentActivity: string = "walk";
  public isMoving: boolean = true;
  public isUserControlled: boolean = false;
  public lastEdgeHit: string = "";
  public groundY: number = 0; // Ground line Y position

  // Cleanliness properties - thuộc tính riêng của mỗi pet
  public cleanlinessDecreaseMultiplier: number; // Tốc độ giảm riêng cho mỗi pet

  // Happiness properties - thuộc tính riêng của mỗi pet
  public happinessDecreaseMultiplier: number; // Tốc độ giảm riêng cho mỗi pet

  // Chasing properties
  public isChasing: boolean = false;
  public chaseTarget: { x: number; y: number } | null = null;

  // Callback for when pet stops chasing (to notify PetManager)
  public onStopChasing?: () => void;

  // Callback for when pet is clicked (to notify PetManager to switch active pet)
  public onPetClicked?: () => void;
  public onPetRightClicked?: () => void;

  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    // Khởi tạo tốc độ giảm cleanliness ngẫu nhiên cho mỗi pet (0.7x - 1.3x)
    this.cleanlinessDecreaseMultiplier = 0.7 + Math.random() * 0.6;

    // Khởi tạo tốc độ giảm happiness ngẫu nhiên cho mỗi pet (0.7x - 1.3x)
    this.happinessDecreaseMultiplier = 0.7 + Math.random() * 0.6;
  }

  create(x: number, y?: number) {
    // Nếu x/y chưa truyền vào, thử lấy từ _pendingX/_pendingY (random từ PetManager)
    let finalX = x;
    let finalY = y;
    if (typeof finalX !== "number" && (this as any)._pendingX)
      finalX = (this as any)._pendingX;
    if (typeof finalY !== "number" && (this as any)._pendingY)
      finalY = (this as any)._pendingY;
    // Nếu vẫn chưa có, fallback mặc định
    if (typeof finalX !== "number") finalX = 400;
    if (typeof finalY !== "number")
      finalY = GamePositioning.getPetY(this.scene.cameras.main.height);
    this.groundY = finalY; // Store ground line position

    this.sprite = this.scene.add.sprite(
      finalX,
      finalY,
      "dog-walk",
      "chog_walk 0.aseprite"
    );
    this.sprite.setScale(GAME_LAYOUT.PET_SCALE);

    // Make pet clickable to switch active pet
    this.sprite.setInteractive();
    this.sprite.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      console.log(`🖱️ Pet clicked with button: ${pointer.button}`);

      if (pointer.button === 0) {
        // Left click
        if (this.onPetClicked) {
          this.onPetClicked();
        }
      } else if (pointer.button === 2) {
        // Right click
        if (this.onPetRightClicked) {
          this.onPetRightClicked();
        }
      }
    });

    // Add hover effect for better UX
    this.sprite.on("pointerover", () => {
      // Only apply hover effect if not already active (no tint)
      if (this.sprite.tintTopLeft === 0xffffff) {
        this.sprite.setTint(0xdddddd); // Slightly darker when hovered
      }
    });

    this.sprite.on("pointerout", () => {
      // Only clear tint if it's the hover tint, not the active tint
      if (this.sprite.tintTopLeft === 0xdddddd) {
        this.sprite.clearTint();
      }
    });

    this.updateActivity();
  }

  createAnimations() {
    // Walk animation
    this.scene.anims.create({
      key: "dog-walk",
      frames: [
        { key: "dog-walk", frame: "chog_walk 0.aseprite" },
        { key: "dog-walk", frame: "chog_walk 1.aseprite" },
        { key: "dog-walk", frame: "chog_walk 2.aseprite" },
        { key: "dog-walk", frame: "chog_walk 3.aseprite" },
        { key: "dog-walk", frame: "chog_walk 4.aseprite" },
        { key: "dog-walk", frame: "chog_walk 5.aseprite" },
        { key: "dog-walk", frame: "chog_walk 6.aseprite" },
        { key: "dog-walk", frame: "chog_walk 7.aseprite" },
      ],
      frameRate: 8,
      repeat: -1,
    });

    // Sleep animations
    this.scene.anims.create({
      key: "dog-sleep",
      frames: [
        { key: "dog-sleep", frame: "chog_sleep 0.aseprite" },
        { key: "dog-sleep", frame: "chog_sleep 1.aseprite" },
        { key: "dog-sleep", frame: "chog_sleep 2.aseprite" },
        { key: "dog-sleep", frame: "chog_sleep 3.aseprite" },
        { key: "dog-sleep", frame: "chog_sleep 4.aseprite" },
        { key: "dog-sleep", frame: "chog_sleep 5.aseprite" },
      ],
      frameRate: 3,
      repeat: 14,
    });

    this.scene.anims.create({
      key: "dog-sleep-loop",
      frames: [
        { key: "dog-sleep", frame: "chog_sleep 0.aseprite" },
        { key: "dog-sleep", frame: "chog_sleep 1.aseprite" },
        { key: "dog-sleep", frame: "chog_sleep 2.aseprite" },
        { key: "dog-sleep", frame: "chog_sleep 3.aseprite" },
        { key: "dog-sleep", frame: "chog_sleep 4.aseprite" },
        { key: "dog-sleep", frame: "chog_sleep 5.aseprite" },
      ],
      frameRate: 3,
      repeat: -1,
    });

    // Play animations
    this.scene.anims.create({
      key: "dog-play",
      frames: [
        { key: "dog-play", frame: "chog_idleplay 0.aseprite" },
        { key: "dog-play", frame: "chog_idleplay 1.aseprite" },
        { key: "dog-play", frame: "chog_idleplay 2.aseprite" },
        { key: "dog-play", frame: "chog_idleplay 3.aseprite" },
        { key: "dog-play", frame: "chog_idleplay 4.aseprite" },
        { key: "dog-play", frame: "chog_idleplay 5.aseprite" },
        { key: "dog-play", frame: "chog_idleplay 6.aseprite" },
        { key: "dog-play", frame: "chog_idleplay 7.aseprite" },
        { key: "dog-play", frame: "chog_idleplay 8.aseprite" },
        { key: "dog-play", frame: "chog_idleplay 9.aseprite" },
        { key: "dog-play", frame: "chog_idleplay 10.aseprite" },
        { key: "dog-play", frame: "chog_idleplay 11.aseprite" },
        { key: "dog-play", frame: "chog_idleplay 12.aseprite" },
        { key: "dog-play", frame: "chog_idleplay 13.aseprite" },
        { key: "dog-play", frame: "chog_idleplay 14.aseprite" },
      ],
      frameRate: 10,
      repeat: 1,
    });

    this.scene.anims.create({
      key: "dog-play-loop",
      frames: [
        { key: "dog-play", frame: "chog_idleplay 0.aseprite" },
        { key: "dog-play", frame: "chog_idleplay 1.aseprite" },
        { key: "dog-play", frame: "chog_idleplay 2.aseprite" },
        { key: "dog-play", frame: "chog_idleplay 3.aseprite" },
        { key: "dog-play", frame: "chog_idleplay 4.aseprite" },
        { key: "dog-play", frame: "chog_idleplay 5.aseprite" },
        { key: "dog-play", frame: "chog_idleplay 6.aseprite" },
        { key: "dog-play", frame: "chog_idleplay 7.aseprite" },
        { key: "dog-play", frame: "chog_idleplay 8.aseprite" },
        { key: "dog-play", frame: "chog_idleplay 9.aseprite" },
        { key: "dog-play", frame: "chog_idleplay 10.aseprite" },
        { key: "dog-play", frame: "chog_idleplay 11.aseprite" },
        { key: "dog-play", frame: "chog_idleplay 12.aseprite" },
        { key: "dog-play", frame: "chog_idleplay 13.aseprite" },
        { key: "dog-play", frame: "chog_idleplay 14.aseprite" },
      ],
      frameRate: 10,
      repeat: -1,
    });

    // Chew animations
    this.scene.anims.create({
      key: "dog-chew",
      frames: [
        { key: "dog-chew", frame: "chog_chew 0.aseprite" },
        { key: "dog-chew", frame: "chog_chew 1.aseprite" },
        { key: "dog-chew", frame: "chog_chew 2.aseprite" },
        { key: "dog-chew", frame: "chog_chew 3.aseprite" },
        { key: "dog-chew", frame: "chog_chew 4.aseprite" },
        { key: "dog-chew", frame: "chog_chew 5.aseprite" },
      ],
      frameRate: 6,
      repeat: 1,
    });

    this.scene.anims.create({
      key: "dog-chew-loop",
      frames: [
        { key: "dog-chew", frame: "chog_chew 0.aseprite" },
        { key: "dog-chew", frame: "chog_chew 1.aseprite" },
        { key: "dog-chew", frame: "chog_chew 2.aseprite" },
        { key: "dog-chew", frame: "chog_chew 3.aseprite" },
        { key: "dog-chew", frame: "chog_chew 4.aseprite" },
        { key: "dog-chew", frame: "chog_chew 5.aseprite" },
      ],
      frameRate: 6,
      repeat: -1,
    });
  }

  updateActivity() {
    switch (this.currentActivity) {
      case "walk":
        this.sprite.play("dog-walk");
        this.isMoving = true;
        break;
      case "sleep":
        if (this.isUserControlled) {
          this.sprite.play("dog-sleep-loop");
        } else {
          this.sprite.play("dog-sleep");
        }
        this.isMoving = false;
        break;
      case "idleplay":
        if (this.isUserControlled) {
          this.sprite.play("dog-play-loop");
        } else {
          this.sprite.play("dog-play");
        }
        this.isMoving = false;
        break;
      case "chew":
        if (this.isUserControlled) {
          this.sprite.play("dog-chew-loop");
        } else {
          this.sprite.play("dog-chew");
        }
        this.isMoving = false;
        break;
      default:
        this.sprite.play("dog-walk");
        this.isMoving = true;
    }
  }

  setActivity(newActivity: string) {
    this.currentActivity = newActivity;
    this.updateActivity();
  }

  setUserActivity(newActivity: string) {
    this.currentActivity = newActivity;
    this.updateActivity();

    if (newActivity === "walk") {
      this.isUserControlled = false;
    } else {
      this.isUserControlled = true;
    }
  }

  startChasing(x: number, y: number) {
    this.isChasing = true;
    this.chaseTarget = { x, y };
    this.isUserControlled = true;
    this.setActivity("walk");
  }

  stopChasing() {
    this.isChasing = false;
    this.chaseTarget = null;

    // Reset edge detection to allow proper boundary flipping
    this.lastEdgeHit = "";

    // Notify PetManager about stopping chase
    if (this.onStopChasing) {
      this.onStopChasing();
    }

    // Ensure pet returns to proper walk animation when stopping chase
    if (this.currentActivity === "walk") {
      this.setActivity("walk");
    }

    console.log(
      `🛑 Pet stopped chasing, reset lastEdgeHit='${this.lastEdgeHit}'`
    );
  }

  // Ensure pet stays on ground line
  enforceGroundLine(): void {
    const correctGroundY = GamePositioning.getPetY(
      this.scene.cameras.main.height
    );
    if (this.sprite && this.sprite.y !== correctGroundY) {
      this.sprite.y = correctGroundY;
      this.groundY = correctGroundY; // Update stored ground Y
    }
  }

  // Set callback for when pet is clicked
  setOnPetClicked(callback: () => void): void {
    this.onPetClicked = callback;
  }

  // Set callback for when pet is right-clicked
  setOnPetRightClicked(callback: () => void): void {
    this.onPetRightClicked = callback;
  }

  // Cleanup method
  destroy(): void {
    if (this.sprite) {
      this.sprite.destroy();
    }
    console.log("🧹 Pet destroyed");
  }
}

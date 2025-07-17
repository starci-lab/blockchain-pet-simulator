import { PetManager } from "@/game/managers/PetManager";

const UI_FONT = "monospace";

export class InputManager {
  private scene: Phaser.Scene;
  private petManager: PetManager;
  private notificationUI: any;
  private shopUI: any;
  private isDroppingFood = false;
  private isUsingBroom = false;
  private dropHintText?: Phaser.GameObjects.Text;

  constructor(
    scene: Phaser.Scene,
    petManager: PetManager,
    notificationUI: any,
    shopUI: any
  ) {
    this.scene = scene;
    this.petManager = petManager;
    this.notificationUI = notificationUI;
    this.shopUI = shopUI;
  }

  setupInputHandlers() {
    console.log("⌨️ Setting up input handlers...");

    // Track click timing for double click detection
    let lastClickTime = 0;
    let pendingDrop: { x: number; y: number } | null = null;
    let dropTimeout: Phaser.Time.TimerEvent | null = null;
    const DOUBLE_CLICK_THRESHOLD = 300; // ms

    // Helper function to exit food dropping mode
    const exitFoodDropMode = () => {
      this.isDroppingFood = false;
      this.shopUI.setFoodDropState(false);
      this.scene.input.setDefaultCursor(
        "url(/assets/images/cursor/navigation_nw.png), pointer"
      );
      if (this.dropHintText) this.dropHintText.setVisible(false);

      // Clean up pending drop
      if (dropTimeout) {
        dropTimeout.destroy();
        dropTimeout = null;
      }
      pendingDrop = null;

      console.log("🚪 Exited food dropping mode");
    };

    // Helper function to exit broom mode
    const exitBroomMode = () => {
      this.isUsingBroom = false;
      this.shopUI.setBroomUseState(false);
      this.scene.input.setDefaultCursor(
        "url(/assets/images/cursor/navigation_nw.png), pointer"
      );
      if (this.dropHintText) this.dropHintText.setVisible(false);

      console.log("🚪 Exited broom mode");
    };

    // Set up food icon click callback
    this.shopUI.setOnFoodIconClick(() => {
      this.isDroppingFood = true;
      this.shopUI.setFoodDropState(true);

      // Change cursor
      this.scene.input.setDefaultCursor(
        "url(./src/assets/images/food/hambuger.png), pointer"
      );

      // Show drop hint text
      if (!this.dropHintText) {
        this.dropHintText = this.scene.add
          .text(
            this.scene.cameras.main.width / 2,
            10, // 10px from top
            "Left click to place, double click to cancel",
            {
              fontSize: "10px",
              color: "#fff",
              fontFamily: UI_FONT,
              stroke: "#000",
              strokeThickness: 3,
              align: "center",
            }
          )
          .setOrigin(0.5, 0);
      } else {
        this.dropHintText.setText(
          "Left click to place, double click to cancel"
        );
        this.dropHintText.setY(20);
        this.dropHintText.setVisible(true);
      }
    });

    // Set up broom icon click callback
    this.shopUI.setOnBroomIconClick(() => {
      this.isUsingBroom = true;
      this.shopUI.setBroomUseState(true);

      // Change cursor to broom icon
      this.scene.input.setDefaultCursor(
        "url(./src/assets/images/broom/broom.png), pointer"
      );

      // Show usage hint text
      if (!this.dropHintText) {
        this.dropHintText = this.scene.add
          .text(
            this.scene.cameras.main.width / 2,
            10,
            "Click on poop to clean it, double click to cancel",
            {
              fontSize: "10px",
              color: "#fff",
              fontFamily: UI_FONT,
              stroke: "#000",
              strokeThickness: 3,
              align: "center",
            }
          )
          .setOrigin(0.5, 0);
      } else {
        this.dropHintText.setText(
          "Click on poop to clean it, double click to cancel"
        );
        this.dropHintText.setY(20);
        this.dropHintText.setVisible(true);
      }
    });

    this.scene.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      // Handle broom usage
      if (this.isUsingBroom) {
        // Check if clicking on broom icon (ignore)
        const broomIconBounds = this.shopUI.getBroomIcon().getBounds();
        if (
          Phaser.Geom.Rectangle.Contains(broomIconBounds, pointer.x, pointer.y)
        ) {
          return;
        }

        const currentTime = Date.now();
        const timeDiff = currentTime - lastClickTime;
        lastClickTime = currentTime;

        if (timeDiff < DOUBLE_CLICK_THRESHOLD) {
          // Double click detected - exit broom mode
          exitBroomMode();
          return;
        }

        // Single click - try to clean poop at clicked location
        const hasInventory = this.petManager.getCleaningInventory() > 0;

        if (hasInventory) {
          // Check if clicked on any poop object
          const cleaned = this.cleanPoopAtLocation(pointer.x, pointer.y);
          if (cleaned) {
            const activePet = this.petManager.getActivePet();
            if (activePet) {
              activePet.cleanlinessSystem.cleaningInventory--;
            }
            this.notificationUI.showNotification(
              "🧹 Cleaned poop!",
              pointer.x,
              pointer.y
            );
          } else {
            this.notificationUI.showNotification(
              "No poop found at this location",
              pointer.x,
              pointer.y
            );
          }
        } else {
          // Try to buy broom first
          const success = this.petManager.buyBroom();
          if (success) {
            // Try to clean poop immediately after buying
            const cleaned = this.cleanPoopAtLocation(pointer.x, pointer.y);
            if (cleaned) {
              const activePet = this.petManager.getActivePet();
              if (activePet) {
                activePet.cleanlinessSystem.cleaningInventory--;
              }
              this.notificationUI.showNotification(
                "🧹 Bought broom and cleaned poop!",
                pointer.x,
                pointer.y
              );
            } else {
              this.notificationUI.showNotification(
                "🧹 Bought broom! No poop found at this location",
                pointer.x,
                pointer.y
              );
            }
          } else {
            this.notificationUI.showNotification(
              "You do not have enough NOM tokens!",
              pointer.x,
              pointer.y
            );
          }
        }

        return;
      }

      // Handle food dropping (existing logic)
      if (!this.isDroppingFood) return;

      // Check if clicking on food icon (ignore)
      const iconBounds = this.shopUI.getFoodIcon().getBounds();
      if (Phaser.Geom.Rectangle.Contains(iconBounds, pointer.x, pointer.y)) {
        return;
      }

      const currentTime = Date.now();
      const timeDiff = currentTime - lastClickTime;
      lastClickTime = currentTime;

      if (timeDiff < DOUBLE_CLICK_THRESHOLD && pendingDrop) {
        // Double click detected - cancel pending drop and exit mode
        exitFoodDropMode();
        return;
      }

      // Single click - prepare to drop food but wait for potential double click
      pendingDrop = { x: pointer.x, y: pointer.y };

      // Cancel any existing timeout
      if (dropTimeout) {
        dropTimeout.destroy();
      }

      // Set timer to actually drop food if no second click comes
      dropTimeout = this.scene.time.delayedCall(DOUBLE_CLICK_THRESHOLD, () => {
        if (pendingDrop && this.isDroppingFood) {
          // Use combined buy and drop operation for better reliability
          const success = this.petManager.buyAndDropFood(
            pendingDrop.x,
            pendingDrop.y
          );
          if (!success) {
            // Show toast at the position where user clicked (not center)
            this.notificationUI.showNotification(
              "You do not have enough NOM tokens!",
              pendingDrop.x,
              pendingDrop.y
            );
          }
        }

        // Clean up only the pending drop and timeout, keep dropping mode active
        pendingDrop = null;
        dropTimeout = null;
      });
    });

    console.log("✅ Input handlers set up successfully");
  }

  // Helper method to clean poop at specific location
  private cleanPoopAtLocation(x: number, y: number): boolean {
    const allPets = this.petManager.getAllPets();

    // Check all pets' cleanliness systems for poop at this location
    for (const petData of allPets) {
      const cleaned = petData.cleanlinessSystem.cleanPoop(x, y);
      if (cleaned) {
        return true;
      }
    }

    return false;
  }
}

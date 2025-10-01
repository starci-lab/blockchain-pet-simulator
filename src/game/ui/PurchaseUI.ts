import { eventBus, PurchaseEvents } from "@/game/systems/PurchaseSystem";

export interface PurchaseAnimationConfig {
  duration: number;
  easing: string;
  scale: number;
  bounce: boolean;
}

export interface PurchaseNotificationConfig {
  position: "top" | "center" | "bottom";
  duration: number;
  color: string;
  fontSize: number;
}

/**
 * PurchaseUI handles all visual feedback and animations for purchases.
 * Completely separated from economic logic - only handles UI/UX.
 */
export class PurchaseUI {
  private scene: Phaser.Scene;
  private notificationConfig: PurchaseNotificationConfig;
  private animationConfig: PurchaseAnimationConfig;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.notificationConfig = {
      position: "top",
      duration: 3000,
      color: "#00ff00",
      fontSize: 16
    };
    this.animationConfig = {
      duration: 1000,
      easing: "Power2",
      scale: 1.2,
      bounce: true
    };

    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Listen for purchase events
    eventBus.on(
      PurchaseEvents.PurchaseInitiated,
      (data: {
        itemId: string;
        itemType: string;
        quantity: number;
        price: number;
      }) => this.handlePurchaseInitiated(data)
    );
    eventBus.on(
      PurchaseEvents.PurchaseSuccess,
      (data: {
        itemId: string;
        itemType: string;
        quantity: number;
        newTokenBalance: number;
      }) => this.handlePurchaseSuccess(data)
    );
    eventBus.on(
      PurchaseEvents.PurchaseFailed,
      (data: { itemId: string; itemType: string; reason: string }) =>
        this.handlePurchaseFailed(data)
    );
  }

  private handlePurchaseInitiated(data: {
    itemId: string;
    itemType: string;
    quantity: number;
    price: number;
  }) {
    console.log("🎬 Purchase initiated:", data);

    // Show loading animation
    this.showLoadingAnimation(data.itemId);

    // Show pending notification
    this.showNotification("Processing purchase...", "#ffff00", 2000);
  }

  private handlePurchaseSuccess(data: {
    itemId: string;
    itemType: string;
    quantity: number;
    newTokenBalance: number;
  }) {
    console.log("🎉 Purchase successful:", data);

    // Hide loading animation
    this.hideLoadingAnimation(data.itemId);

    // Show success notification
    this.showNotification(
      `✅ Purchased ${data.quantity}x ${data.itemId}!`,
      "#00ff00",
      3000
    );

    // Play success animation
    this.playSuccessAnimation(data.itemType, data.itemId);

    // Update UI elements
    this.updateUIAfterPurchase(data);
  }

  private handlePurchaseFailed(data: {
    itemId: string;
    itemType: string;
    reason: string;
  }) {
    console.log("❌ Purchase failed:", data);

    // Hide loading animation
    this.hideLoadingAnimation(data.itemId);

    // Show error notification
    this.showNotification(
      `❌ Purchase failed: ${data.reason}`,
      "#ff0000",
      4000
    );

    // Play failure animation
    this.playFailureAnimation(data.itemType, data.itemId);
  }

  private showLoadingAnimation(itemId: string) {
    // Create loading indicator at cursor position
    const loadingText = this.scene.add.text(
      this.scene.input.activePointer.x,
      this.scene.input.activePointer.y - 30,
      "⏳",
      {
        fontSize: "24px",
        color: "#ffff00"
      }
    );

    // Animate loading indicator
    this.scene.tweens.add({
      targets: loadingText,
      alpha: 0.3,
      duration: 500,
      yoyo: true,
      repeat: -1
    });

    // Store reference for cleanup
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (loadingText as any).itemId = itemId;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (loadingText as any).isLoading = true;
  }

  private hideLoadingAnimation(itemId: string) {
    // Find and destroy loading animation for this item
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.scene.children.list.forEach((child: any) => {
      if (child.itemId === itemId && child.isLoading) {
        child.destroy();
      }
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private playSuccessAnimation(_itemType: string, _itemId: string) {
    // Parameters are prefixed with _ to indicate they're intentionally unused
    // Create success particle effect
    const particles = this.scene.add.particles(0, 0, "coin", {
      scale: { start: 0.3, end: 0 },
      speed: { min: 50, max: 100 },
      lifespan: 1000,
      quantity: 10
    });

    // Position particles at cursor
    particles.setPosition(
      this.scene.input.activePointer.x,
      this.scene.input.activePointer.y
    );

    // Emit particles
    particles.start();

    // Clean up after animation
    this.scene.time.delayedCall(2000, () => {
      particles.destroy();
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private playFailureAnimation(_itemType: string, _itemId: string) {
    // Parameters are prefixed with _ to indicate they're intentionally unused
    // Create failure shake effect
    const target = this.scene.input.activePointer;
    this.scene.tweens.add({
      targets: target,
      x: target.x + 10,
      duration: 100,
      yoyo: true,
      repeat: 3,
      ease: "Power2"
    });
  }

  private showNotification(message: string, color: string, duration: number) {
    const x = this.scene.cameras.main.width / 2;
    const y = 50;

    const notification = this.scene.add.text(x, y, message, {
      fontSize: `${this.notificationConfig.fontSize}px`,
      color: color,
      backgroundColor: "rgba(0,0,0,0.7)",
      padding: { x: 10, y: 5 }
    });

    // Center the text
    notification.setOrigin(0.5, 0.5);

    // Animate in
    notification.setAlpha(0);
    this.scene.tweens.add({
      targets: notification,
      alpha: 1,
      duration: 300,
      ease: "Power2"
    });

    // Animate out and destroy
    this.scene.tweens.add({
      targets: notification,
      alpha: 0,
      duration: 300,
      delay: duration - 300,
      onComplete: () => notification.destroy()
    });
  }

  private updateUIAfterPurchase(data: {
    itemType: string;
    itemId: string;
    newTokenBalance: number;
  }) {
    // Emit event to update shop UI, balance, etc.
    eventBus.emit("ui:update_balance", { newBalance: data.newTokenBalance });
    eventBus.emit("ui:update_inventory", {
      itemType: data.itemType,
      itemId: data.itemId
    });

    // Update any other UI elements that need refreshing
    this.scene.events.emit("purchase_completed", data);
  }

  /**
   * Configure notification appearance
   */
  setNotificationConfig(config: Partial<PurchaseNotificationConfig>) {
    this.notificationConfig = { ...this.notificationConfig, ...config };
  }

  /**
   * Configure animation behavior
   */
  setAnimationConfig(config: Partial<PurchaseAnimationConfig>) {
    this.animationConfig = { ...this.animationConfig, ...config };
  }

  /**
   * Clean up event listeners
   */
  destroy() {
    eventBus.off(PurchaseEvents.PurchaseInitiated);
    eventBus.off(PurchaseEvents.PurchaseSuccess);
    eventBus.off(PurchaseEvents.PurchaseFailed);
  }
}

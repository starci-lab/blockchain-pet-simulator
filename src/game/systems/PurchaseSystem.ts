import type { ColyseusClient } from "@/game/colyseus/client";
import { gameConfigManager } from "@/game/configs/gameConfig";
import { useUserStore } from "@/store/userStore";
import { eventBus } from "@/game/tilemap";

// Export eventBus for other modules
export { eventBus };

// Purchase events for UI feedback
export const PurchaseEvents = {
  PurchaseInitiated: "purchase:initiated",
  PurchaseSuccess: "purchase:success",
  PurchaseFailed: "purchase:failed",
  PurchasePending: "purchase:pending"
} as const;

export interface PurchaseRequest {
  itemType: "food" | "toy" | "clean" | "pet" | "background" | "furniture";
  itemId: string;
  quantity: number;
  price: number;
}

export interface PurchaseResponse {
  success: boolean;
  message: string;
  currentTokens?: number;
  itemData?: unknown;
}

/**
 * PurchaseSystem handles all item purchases with server-first approach.
 * Client only handles UI/animations, server handles all economic logic.
 */
export class PurchaseSystem {
  private colyseusClient: ColyseusClient;
  private pendingPurchases: Map<string, PurchaseRequest> = new Map();
  private purchaseIdCounter = 0;
  private retryTimers: Map<string, number> = new Map();

  constructor(colyseusClient: ColyseusClient) {
    this.colyseusClient = colyseusClient;
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Listen for server responses
    if (this.colyseusClient.room) {
      this.colyseusClient.room.onMessage(
        "purchase_response",
        (message: {
          purchaseId: string;
          success: boolean;
          message: string;
          currentTokens?: number;
          itemData?: unknown;
        }) => {
          this.handlePurchaseResponse(message);
        }
      );
    }

    // Also listen to forwarded responses from networking layer (e.g., when
    // the client receives "purchase_item_response" and forwards as eventBus)
    eventBus.on(
      "purchase_response",
      (message: {
        purchaseId: string;
        success: boolean;
        message: string;
        currentTokens?: number;
        itemData?: unknown;
      }) => this.handlePurchaseResponse(message)
    );
  }

  /**
   * Initiates a purchase request to the server.
   * Client only validates UI state, server handles all economic logic.
   */
  async initiatePurchase(
    itemType: PurchaseRequest["itemType"],
    itemId: string,
    quantity: number = 1
  ): Promise<boolean> {
    // Get item data for UI validation only
    const itemData = this.getItemData(itemType, itemId);
    if (!itemData) {
      this.emitPurchaseFailed(`Item ${itemId} not found`);
      return false;
    }

    // Create purchase request
    const purchaseId = `purchase_${++this.purchaseIdCounter}_${Date.now()}`;
    const request: PurchaseRequest = {
      itemType,
      itemId,
      quantity,
      price: itemData.price * quantity
    };

    // Store pending purchase for response handling
    this.pendingPurchases.set(purchaseId, request);

    // Emit UI event for loading state
    eventBus.emit(PurchaseEvents.PurchaseInitiated, {
      purchaseId,
      itemType,
      itemId,
      quantity,
      price: request.price
    });

    // Send to server - server will validate tokens, inventory, etc.
    this.sendPurchaseRequest(purchaseId, request);

    return true;
  }

  private getItemData(
    itemType: string,
    itemId: string
  ): {
    id: string;
    name: string;
    price: number;
    texture: string;
    image_url?: string;
  } | null {
    switch (itemType) {
      case "food":
        return gameConfigManager.getFoodItem(itemId) || null;
      case "toy":
        return gameConfigManager.getToyItem(itemId) || null;
      case "clean":
        return gameConfigManager.getCleaningItem(itemId) || null;
      case "pet":
        return gameConfigManager.getPetItem(itemId) || null;
      case "background":
        return gameConfigManager.getBackgroundItem(itemId) || null;
      case "furniture":
        return gameConfigManager.getFurnitureItems()[itemId] || null;
      default:
        return null;
    }
  }

  private sendPurchaseRequest(
    purchaseId: string,
    request: PurchaseRequest
  ): void {
    if (!this.colyseusClient.isConnected()) {
      // Retry sending a few times until connected
      let attempts = 0;
      const maxAttempts = 10;
      const intervalMs = 500;
      const timerId = window.setInterval(() => {
        attempts += 1;
        if (this.colyseusClient.isConnected()) {
          window.clearInterval(timerId);
          this.retryTimers.delete(purchaseId);
          this.colyseusClient.sendMessage("purchase_item", {
            purchaseId,
            itemType: request.itemType,
            itemId: request.itemId,
            quantity: request.quantity,
            price: request.price
          });
          console.log(
            `📤 Purchase request sent (after retry): ${purchaseId}`,
            request
          );
        } else if (attempts >= maxAttempts) {
          window.clearInterval(timerId);
          this.retryTimers.delete(purchaseId);
          this.emitPurchaseFailed("Not connected to server");
        }
      }, intervalMs);
      this.retryTimers.set(purchaseId, timerId);
      return;
    }

    // Send purchase request to server (connected)
    this.colyseusClient.sendMessage("purchase_item", {
      purchaseId,
      itemType: request.itemType,
      itemId: request.itemId,
      quantity: request.quantity,
      price: request.price
    });

    console.log(`📤 Purchase request sent: ${purchaseId}`, request);
  }

  private handlePurchaseResponse(message: {
    purchaseId: string;
    success: boolean;
    message: string;
    currentTokens?: number;
    itemData?: unknown;
  }) {
    const {
      purchaseId,
      success,
      message: responseMessage,
      currentTokens,
      itemData
    } = message;

    const pendingPurchase = this.pendingPurchases.get(purchaseId);
    if (!pendingPurchase) {
      console.warn(`⚠️ Received response for unknown purchase: ${purchaseId}`);
      return;
    }

    // Remove from pending
    this.pendingPurchases.delete(purchaseId);

    if (success) {
      // Update client state from server response
      if (currentTokens !== undefined) {
        useUserStore.getState().setNomToken(currentTokens);
        console.log(`💰 Tokens updated from server: ${currentTokens}`);
      }

      // Emit success event for UI animations
      eventBus.emit(PurchaseEvents.PurchaseSuccess, {
        purchaseId,
        itemType: pendingPurchase.itemType,
        itemId: pendingPurchase.itemId,
        quantity: pendingPurchase.quantity,
        newTokenBalance: currentTokens,
        itemData
      });

      console.log(`✅ Purchase successful: ${purchaseId}`);
    } else {
      // Emit failure event for UI feedback
      eventBus.emit(PurchaseEvents.PurchaseFailed, {
        purchaseId,
        itemType: pendingPurchase.itemType,
        itemId: pendingPurchase.itemId,
        reason: responseMessage
      });

      console.log(`❌ Purchase failed: ${purchaseId} - ${responseMessage}`);
    }
  }

  private emitPurchaseFailed(reason: string): void {
    eventBus.emit(PurchaseEvents.PurchaseFailed, {
      purchaseId: "unknown",
      itemType: "unknown",
      itemId: "unknown",
      reason
    });
  }

  /**
   * Get current pending purchases count for UI
   */
  getPendingPurchasesCount(): number {
    return this.pendingPurchases.size;
  }

  /**
   * Check if a specific item is currently being purchased
   */
  isItemBeingPurchased(itemId: string): boolean {
    for (const purchase of this.pendingPurchases.values()) {
      if (purchase.itemId === itemId) {
        return true;
      }
    }
    return false;
  }

  /**
   * Cancel a pending purchase (if server supports it)
   */
  cancelPurchase(purchaseId: string): boolean {
    if (this.pendingPurchases.has(purchaseId)) {
      this.pendingPurchases.delete(purchaseId);
      this.colyseusClient.sendMessage("cancel_purchase", { purchaseId });
      return true;
    }
    return false;
  }

  /** Public connection check for UI */
  isConnected(): boolean {
    return this.colyseusClient.isConnected();
  }
}

import type { GameScene } from "../../scenes/GameScene";
import type { PetManager } from "../../managers/PetManager";
import { gameConfigManager } from "../../configs/gameConfig";
// Removed unused imports
import { useUserStore } from "../../../store/userStore";
import { PurchaseSystem } from "../../systems/PurchaseSystem";
import { PurchaseUI } from "../PurchaseUI";
import { eventBus } from "@/game/tilemap";
import type { ColyseusClient } from "../../colyseus/client";

// Reuse existing styles from ShopModal.ts
const MODAL_STYLE = `
  position: fixed;
  top: 50%;
  right: 8%;
  transform: translateY(-50%);
  width: 25%;
  max-width: 450px;
  min-height: 200px;
  background: linear-gradient(180deg, #1D1D1D 0%, #141414 100%);
  border-radius: 21px;
  border: 0.84px solid transparent;
  background-clip: padding-box;
  box-shadow: 0px 0px 1.43px 0px rgba(0, 0, 0, 0.25), inset 0px 1.26px 1.26px 0px rgba(154, 154, 154, 0.45);
  display: none;
  flex-direction: column;
  padding: 16px;
  z-index: 100;
  color: #B3B3B3;
  font-family: 'Plus Jakarta Sans', sans-serif;
`;

const ITEM_CARD_STYLE = `
  background: rgba(60, 60, 60, 0.26);
  border: 1.25px solid rgba(0, 0, 0, 0.37);
  border-radius: 18.73px;
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6.42px;
  text-align: center;
  box-shadow: inset 0px 4.46px 5.95px 0px rgba(0, 0, 0, 0.3);
  cursor: pointer;
  transition: transform 0.2s ease;
  position: relative;
`;

const ITEM_CARD_LOADING_STYLE = `
  opacity: 0.6;
  cursor: not-allowed;
`;

const ITEM_CARD_DISABLED_STYLE = `
  opacity: 0.4;
  cursor: not-allowed;
  filter: grayscale(50%);
`;

const LOADING_OVERLAY_STYLE = `
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 18.73px;
  font-size: 12px;
  color: #ffff00;
`;

/**
 * Modern shop modal that uses server-first purchase system.
 * Separates UI/animation concerns from economic logic.
 */
export default class ModernShopModal {
  // Removed unused private fields
  private modal: HTMLElement;
  private itemsGrid: HTMLElement;
  private purchaseSystem: PurchaseSystem;
  private purchaseUI: PurchaseUI;
  private currentCategory: string = "food";
  private balanceValueElement: HTMLElement | null = null;

  constructor(_scene: GameScene, petManager: PetManager) {
    this.purchaseSystem = new PurchaseSystem(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (petManager as any).colyseusClient as ColyseusClient
    );
    this.purchaseUI = new PurchaseUI(_scene);
    this.modal = document.createElement("div");
    this.itemsGrid = document.createElement("div");
    this.create();
    this.setupEventListeners();
  }

  private create(): void {
    this.modal.style.cssText = MODAL_STYLE;
    document.body.appendChild(this.modal);

    // Create header
    const header = document.createElement("div");
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    `;

    const title = document.createElement("h2");
    title.textContent = "Modern Store";
    title.style.cssText = `
      font-size: 16px;
      font-weight: 700;
      color: #B3B3B3;
      margin: 0;
    `;

    const closeButton = document.createElement("button");
    closeButton.innerHTML = "✕";
    closeButton.style.cssText = `
      background: #323232;
      border: none;
      color: #E95151;
      font-size: 12px;
      cursor: pointer;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: flex;
      justify-content: center;
      align-items: center;
    `;
    closeButton.onclick = () => this.hide();

    header.appendChild(title);
    header.appendChild(closeButton);
    this.modal.appendChild(header);

    // Create balance section
    this.createBalanceSection();

    // Create category tabs
    this.createCategoryTabs();

    // Create items grid
    this.itemsGrid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
      gap: 8px;
      padding: 8px;
      overflow-y: auto;
      max-height: calc(100vh - 200px);
    `;
    this.modal.appendChild(this.itemsGrid);
  }

  private createBalanceSection(): void {
    const balanceSection = document.createElement("div");
    balanceSection.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      background: #101010;
      border-radius: 8px;
      margin-bottom: 16px;
    `;

    const balanceLabel = document.createElement("div");
    balanceLabel.textContent = "Balance:";
    balanceLabel.style.cssText = `
      font-size: 14px;
      color: #B3B3B3;
    `;

    const balanceValue = document.createElement("div");
    const userState = useUserStore.getState();
    balanceValue.textContent = `${userState.nomToken.toLocaleString()} NOM`;
    balanceValue.style.cssText = `
      font-size: 14px;
      font-weight: 600;
      color: #00ff00;
    `;

    this.balanceValueElement = balanceValue;
    balanceSection.appendChild(balanceLabel);
    balanceSection.appendChild(balanceValue);
    this.modal.appendChild(balanceSection);
  }

  private createCategoryTabs(): void {
    const tabsContainer = document.createElement("div");
    tabsContainer.style.cssText = `
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
    `;

    const categories = [
      { key: "food", label: "Food" },
      { key: "toy", label: "Toys" },
      { key: "clean", label: "Clean" },
      { key: "pets", label: "Pets" },
      { key: "backgrounds", label: "Backgrounds" }
    ];

    categories.forEach((category) => {
      const tab = document.createElement("button");
      tab.textContent = category.label;
      tab.style.cssText = `
        padding: 8px 16px;
        border: 1px solid #333;
        background: ${
          this.currentCategory === category.key ? "#4F8CFF" : "transparent"
        };
        color: ${this.currentCategory === category.key ? "#fff" : "#B3B3B3"};
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
      `;
      tab.onclick = () => this.switchCategory(category.key);
      tabsContainer.appendChild(tab);
    });

    this.modal.appendChild(tabsContainer);
  }

  private switchCategory(category: string): void {
    this.currentCategory = category;
    this.populateItems();
    this.updateCategoryTabs();
  }

  private updateCategoryTabs(): void {
    const tabs = this.modal.querySelectorAll("button");
    tabs.forEach((tab) => {
      const isActive = tab.textContent
        ?.toLowerCase()
        .includes(this.currentCategory);
      const htmlTab = tab as HTMLElement;
      htmlTab.style.background = isActive ? "#4F8CFF" : "transparent";
      htmlTab.style.color = isActive ? "#fff" : "#B3B3B3";
    });
  }

  private setupEventListeners(): void {
    // Listen for balance updates
    eventBus.on("ui:update_balance", (data: { newBalance: number }) => {
      this.updateBalance(data.newBalance);
    });

    // Listen for purchase events
    eventBus.on("purchase:initiated", (data: { itemId: string }) => {
      this.updateItemLoadingState(data.itemId, true);
    });

    eventBus.on(
      "purchase:success",
      (data: { itemId: string; newTokenBalance: number }) => {
        this.updateItemLoadingState(data.itemId, false);
        this.updateBalance(data.newTokenBalance);
      }
    );

    eventBus.on("purchase:failed", (data: { itemId: string }) => {
      this.updateItemLoadingState(data.itemId, false);
    });
  }

  private updateBalance(newBalance: number): void {
    if (this.balanceValueElement) {
      this.balanceValueElement.textContent = `${newBalance.toLocaleString()} NOM`;
    }
  }

  private updateItemLoadingState(itemId: string, isLoading: boolean): void {
    const itemCards = this.modal.querySelectorAll(`[data-item-id="${itemId}"]`);
    itemCards.forEach((card) => {
      const htmlCard = card as HTMLElement;
      if (isLoading) {
        htmlCard.classList.add("loading");
        htmlCard.style.cssText += ITEM_CARD_LOADING_STYLE;

        // Add loading overlay
        const overlay = document.createElement("div");
        overlay.style.cssText = LOADING_OVERLAY_STYLE;
        overlay.textContent = "⏳";
        htmlCard.appendChild(overlay);
      } else {
        htmlCard.classList.remove("loading");
        htmlCard.style.cssText = htmlCard.style.cssText.replace(
          ITEM_CARD_LOADING_STYLE,
          ""
        );

        // Remove loading overlay
        const overlay = htmlCard.querySelector(
          "div[style*='position: absolute']"
        );
        if (overlay) overlay.remove();
      }
    });
  }

  public show(category: string = "food"): void {
    this.currentCategory = category;
    this.updateCategoryTabs();
    this.populateItems();
    this.updateBalance(useUserStore.getState().nomToken);
    this.modal.style.display = "flex";
  }

  public hide(): void {
    this.modal.style.display = "none";
  }

  private populateItems(): void {
    this.itemsGrid.innerHTML = "";

    let items: Array<{
      id: string;
      name: string;
      price: number;
      texture: string;
      image_url?: string;
    }> = [];
    switch (this.currentCategory) {
      case "food":
        items = Object.values(gameConfigManager.getFoodItems());
        break;
      case "toy":
        items = Object.values(gameConfigManager.getToyItems());
        break;
      case "clean":
        items = Object.values(gameConfigManager.getCleaningItems());
        break;
      case "pets":
        items = Object.values(gameConfigManager.getPetItems());
        break;
      case "backgrounds":
        items = Object.values(gameConfigManager.getBackgroundItems());
        break;
    }

    items.forEach((item) => {
      const itemCard = this.createItemCard(item);
      this.itemsGrid.appendChild(itemCard);
    });
  }

  private createItemCard(item: {
    id: string;
    name: string;
    price: number;
    texture: string;
    image_url?: string;
  }): HTMLElement {
    const card = document.createElement("div");
    card.style.cssText = ITEM_CARD_STYLE;
    card.setAttribute("data-item-id", item.id);

    // Check if item is being purchased
    const isBeingPurchased = this.purchaseSystem.isItemBeingPurchased(item.id);
    if (isBeingPurchased) {
      card.style.cssText += ITEM_CARD_LOADING_STYLE;
    }

    // Check if user can afford item
    const canAfford = useUserStore.getState().nomToken >= item.price;
    if (!canAfford) {
      card.style.cssText += ITEM_CARD_DISABLED_STYLE;
    }

    // Item image
    const image = document.createElement("img");
    image.src =
      item.image_url ||
      `assets/images/${this.currentCategory}/${item.texture}.png`;
    image.style.cssText = `
      width: 48px;
      height: 48px;
      object-fit: cover;
      border-radius: 8px;
    `;

    // Item name
    const name = document.createElement("div");
    name.textContent = item.name;
    name.style.cssText = `
      font-size: 12px;
      font-weight: 600;
      color: #B3B3B3;
      text-align: center;
    `;

    // Item price
    const price = document.createElement("div");
    price.textContent = `${item.price} NOM`;
    price.style.cssText = `
      font-size: 10px;
      color: #B3B3B3;
      text-align: center;
    `;

    card.appendChild(image);
    card.appendChild(name);
    card.appendChild(price);

    // Click handler
    if (canAfford && !isBeingPurchased) {
      card.onclick = () => this.handleItemClick(item);
    }

    return card;
  }

  private async handleItemClick(item: {
    id: string;
    name: string;
    price: number;
    texture: string;
    image_url?: string;
  }): Promise<void> {
    try {
      const success = await this.purchaseSystem.initiatePurchase(
        this.currentCategory as
          | "food"
          | "toy"
          | "clean"
          | "pet"
          | "background"
          | "furniture",
        item.id,
        1
      );

      if (!success) {
        console.error("Failed to initiate purchase");
      }
    } catch (error) {
      console.error("Purchase error:", error);
    }
  }

  public destroy(): void {
    this.purchaseUI.destroy();
    if (this.modal.parentNode) {
      this.modal.parentNode.removeChild(this.modal);
    }
  }
}

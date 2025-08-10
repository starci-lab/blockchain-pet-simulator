import type { GameScene } from "../../scenes/GameScene";
import type { PetManager } from "../../managers/PetManager";
import { gameConfigManager } from "../../configs/gameConfig";
import type {
  FoodItem,
  ToyItem,
  PetItem,
  BackgroundItem,
  CleaningItem,
  FurnitureItem,
} from "../../configs/gameConfig";
import { useUserStore } from "../../../store/userStore";

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

const HEADER_STYLE = `
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  margin-bottom: 12px;
  position: relative;
`;

const TITLE_STYLE = `
  font-size: 12px;
  font-weight: 700;
  color: #B3B3B3;
  line-height: 1.26;
  text-align: center;
  margin: 0;
`;

const CLOSE_BUTTON_STYLE = `
  background: #323232;
  border: none;
  color: #E95151;
  font-size: 8px;
  cursor: pointer;
  width: 12px;
  aspect-ratio: 1;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: inset 0px 0.84px 0.42px 0px rgba(199, 199, 199, 0.19);
  position: absolute;
  top: 50%;
  right: 0;
  transform: translateY(-50%);
`;

const TABS_CONTAINER_STYLE = `
  background: transparent;
  border-radius: 0;
  border: none;
  box-shadow: none;
  padding: 8px ;
  margin-bottom: 0;
`;

const TABS_STYLE = `
  display: flex;
  justify-content: stretch;
  align-items: stretch;
  width: 100%;
  padding: 4px 0px;
`;

const TAB_STYLE = `
  flex: 1;
  padding: 4px;
  text-align: center;
  cursor: pointer;
  border-radius: 30px;
  font-weight: 500;
  font-size: 12px;
  color: #FFFFFF;
  background: transparent;
  border: none;
  position: relative;
  line-height: 1.26;
`;

const ACTIVE_TAB_STYLE = `
  background: transparent;
  opacity: 1;
  font-weight: 600;
  color: #878787;
`;

const ACTIVE_TAB_UNDERLINE_STYLE = `
  position: absolute;
  bottom: -15px;
  left: 50%;
  transform: translateX(-50%);
  width: 80%;
  height: 4.44px;
  background: rgba(135, 135, 135, 0.4);
  border-radius: 3px;
`;

const INACTIVE_TAB_STYLE = `
  background: transparent;
  opacity: 1;
  font-weight: 500;
  color: #5A5A5A;
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
`;

// Style cho card background active
const ITEM_CARD_ACTIVE_STYLE = `
  border: 2.5px solid #4F8CFF;
  box-shadow: 0 0 8px 2px #4F8CFF44;
`;

const ITEM_NAME_STYLE = `
  font-size: 16px;
  font-weight: 600;
  color: #B3B3B3;
  line-height: 1.26;
  margin: 0;
  font-family: 'Plus Jakarta Sans', sans-serif;
  text-align: center;
`;

const ITEM_PRICE_STYLE = `
  font-size: 14px;
  font-weight: 400;
  color: #B3B3B3;
  line-height: 1.26;
  margin: 0;
  font-family: 'Plus Jakarta Sans', sans-serif;
  text-align: center;
`;

const ITEM_IMAGE_STYLE = `
  width: 48px;
  height: 48px;
  object-fit: cover;
  border-radius: 8px;
`;

const ITEMS_GRID_STYLE = `
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 8.39px;
  padding: 8px;
  overflow-y: auto;
  max-height: calc(100vh - 200px);
`;

const CONTENT_WRAPPER_STYLE = `
  background: #101010;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.5);
  box-shadow: inset 0px 2.52px 3.35px 0px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const BALANCE_SECTION_STYLE = `
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 15px;
  padding: 16px 0px;
  width: 100%;
`;

const BALANCE_FIELD_STYLE = `
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
  flex: 1;
`;

const BALANCE_LABEL_STYLE = `
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-weight: 400;
  font-size: 12px;
  line-height: 1.26;
  color: #B3B3B3;
  margin: 0;
`;

const BALANCE_VALUE_CONTAINER_STYLE = `
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  padding: 9px 4px;
  background: #101010;
  border-radius: 5px;
  width: 100%;
`;

const COIN_ICON_STYLE = `
  width: 15.24px;
  height: 15.24px;
  border-radius: 50%;
  flex-shrink: 0;
`;

const BALANCE_VALUE_STYLE = `
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-weight: 600;
  font-size: 12px;
  line-height: 1.26;
  color: #EBEBEB;
  margin: 0;
  flex: 1;
`;

const CLAIM_BUTTON_STYLE = `
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 8px 16px;
  width: 70px;
  height: 38px;
  background: #242424;
  box-shadow: inset 0px 1px 0.5px 0px rgba(199, 199, 199, 0.19);
  border-radius: 9.84px;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s ease;
`;

const CLAIM_BUTTON_TEXT_STYLE = `
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-weight: 800;
  font-size: 10.42px;
  line-height: 1.26;
  color: #B3B3B3;
  text-align: center;
`;

const DIVIDER_STYLE = `
  width: 100%;
  height: 1px;
  background: rgba(179, 179, 179, 0.2);
  margin: 8px 0;
`;

const PAGINATION_CONTAINER_STYLE = `
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 8px;
  margin-bottom: 8px;
`;

const PAGINATION_BUTTON_STYLE = `
  background: #323232;
  border: none;
  color: #B3B3B3;
  font-size: 10px;
  cursor: pointer;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: inset 0px 0.84px 0.42px 0px rgba(199, 199, 199, 0.19);
  transition: all 0.2s ease;
`;

const PAGINATION_BUTTON_DISABLED_STYLE = `
  opacity: 0.3;
  cursor: not-allowed;
`;

const TABS_PAGINATION_CONTAINER_STYLE = `
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;
  flex: 1;
`;

export default class ShopModal {
  private scene: GameScene;
  private petManager: PetManager;
  private modal: HTMLElement;
  private itemsGrid: HTMLElement;
  private tabs: { [key: string]: HTMLElement } = {};
  private currentCategory: string = "food";
  private balanceValueElement: HTMLElement | null = null;

  // Pagination properties
  private allTabs: string[] = [
    "pets",
    "food",
    "toy",
    "clean",
    "furniture",
    "backgrounds",
  ];
  private currentTabPage: number = 0;
  private tabsPerPage: number = 3;
  private tabsContainer: HTMLElement | null = null;
  private prevButton: HTMLElement | null = null;
  private nextButton: HTMLElement | null = null;

  // State activeBackground, logic chọn/cancel background, chỉ 1 ảnh active, cập nhật UI card active
  private activeBackground: string | null = null;

  // Giả lập inventory background đã mua (bạn có thể thay bằng inventory thực tế)
  private ownedBackgrounds: Set<string> = new Set();

  constructor(scene: GameScene, petManager: PetManager) {
    this.scene = scene;
    this.petManager = petManager;
    this.modal = document.createElement("div");
    this.itemsGrid = document.createElement("div");
    this.create();
  }

  private create(): void {
    this.modal.style.cssText = MODAL_STYLE;
    document.body.appendChild(this.modal);

    const header = document.createElement("div");
    header.style.cssText = HEADER_STYLE;
    this.modal.appendChild(header);

    const title = document.createElement("h2");
    title.textContent = "Store";
    title.style.cssText = TITLE_STYLE;
    header.appendChild(title);

    // Right navigation button (close)
    const closeButton = document.createElement("button");
    closeButton.innerHTML = "✕";
    closeButton.style.cssText = CLOSE_BUTTON_STYLE;
    closeButton.onclick = () => this.hide();
    header.appendChild(closeButton);

    // Divider between Store title and balance section
    const divider = document.createElement("div");
    divider.style.cssText = DIVIDER_STYLE;
    this.modal.appendChild(divider);

    // Balance/Earnings section
    this.createBalanceSection();

    // Content wrapper that contains tabs and items grid
    const contentWrapper = document.createElement("div");
    contentWrapper.style.cssText = CONTENT_WRAPPER_STYLE;
    this.modal.appendChild(contentWrapper);

    // Tabs container with pagination
    this.createTabsWithPagination(contentWrapper);

    this.itemsGrid.style.cssText = ITEMS_GRID_STYLE;
    contentWrapper.appendChild(this.itemsGrid);
  }

  private createBalanceSection(): void {
    const balanceSection = document.createElement("div");
    balanceSection.style.cssText = BALANCE_SECTION_STYLE;
    this.modal.appendChild(balanceSection);

    // Balance field
    const balanceField = document.createElement("div");
    balanceField.style.cssText = BALANCE_FIELD_STYLE;
    balanceSection.appendChild(balanceField);

    const balanceLabel = document.createElement("div");
    balanceLabel.textContent = "Balance";
    balanceLabel.style.cssText = BALANCE_LABEL_STYLE;
    balanceField.appendChild(balanceLabel);

    const balanceContainer = document.createElement("div");
    balanceContainer.style.cssText = BALANCE_VALUE_CONTAINER_STYLE;
    balanceField.appendChild(balanceContainer);

    const balanceCoinIcon = document.createElement("img");
    balanceCoinIcon.src = "src/assets/images/coin/coin-e4dae5.png";
    balanceCoinIcon.style.cssText = COIN_ICON_STYLE;
    balanceContainer.appendChild(balanceCoinIcon);

    const balanceValue = document.createElement("div");
    const userState = useUserStore.getState();
    balanceValue.textContent = `${userState.nomToken.toLocaleString()} NOM`;
    balanceValue.style.cssText = BALANCE_VALUE_STYLE;
    balanceContainer.appendChild(balanceValue);

    // Store reference for updates
    this.balanceValueElement = balanceValue;

    // Earnings field
    const earningsField = document.createElement("div");
    earningsField.style.cssText = BALANCE_FIELD_STYLE;
    balanceSection.appendChild(earningsField);

    const earningsLabel = document.createElement("div");
    earningsLabel.textContent = "Earnings";
    earningsLabel.style.cssText = BALANCE_LABEL_STYLE;
    earningsField.appendChild(earningsLabel);

    const earningsContainer = document.createElement("div");
    earningsContainer.style.cssText = BALANCE_VALUE_CONTAINER_STYLE;
    earningsField.appendChild(earningsContainer);

    const earningsCoinIcon = document.createElement("img");
    earningsCoinIcon.src = "src/assets/images/coin/coin-e4dae5.png";
    earningsCoinIcon.style.cssText = COIN_ICON_STYLE;
    earningsContainer.appendChild(earningsCoinIcon);

    const earningsValue = document.createElement("div");
    earningsValue.textContent = "100.000 MON";
    earningsValue.style.cssText = BALANCE_VALUE_STYLE;
    earningsContainer.appendChild(earningsValue);

    // Claim button
    const claimButton = document.createElement("button");
    claimButton.style.cssText = CLAIM_BUTTON_STYLE;
    claimButton.onclick = () => this.handleClaim();
    balanceSection.appendChild(claimButton);

    const claimText = document.createElement("span");
    claimText.textContent = "Claim";
    claimText.style.cssText = CLAIM_BUTTON_TEXT_STYLE;
    claimButton.appendChild(claimText);
  }

  private createTabsWithPagination(container: HTMLElement): void {
    // Main tabs container
    this.tabsContainer = document.createElement("div");
    this.tabsContainer.style.cssText = TABS_CONTAINER_STYLE;
    container.appendChild(this.tabsContainer);

    // Pagination container
    const paginationContainer = document.createElement("div");
    paginationContainer.style.cssText = PAGINATION_CONTAINER_STYLE;
    this.tabsContainer.appendChild(paginationContainer);

    // Previous button
    this.prevButton = document.createElement("button");
    this.prevButton.innerHTML = "‹";
    this.prevButton.style.cssText = PAGINATION_BUTTON_STYLE;
    this.prevButton.onclick = () => this.previousTabPage();
    paginationContainer.appendChild(this.prevButton);

    // Tabs row container
    const tabsPaginationContainer = document.createElement("div");
    tabsPaginationContainer.style.cssText = TABS_PAGINATION_CONTAINER_STYLE;
    paginationContainer.appendChild(tabsPaginationContainer);

    const tabsRow = document.createElement("div");
    tabsRow.style.cssText = TABS_STYLE;
    tabsPaginationContainer.appendChild(tabsRow);

    // Create all tabs
    this.tabs.pets = this.createTab(tabsRow, "Pets", "pets");
    this.tabs.food = this.createTab(tabsRow, "Food", "food");
    this.tabs.toy = this.createTab(tabsRow, "Toys", "toy");
    this.tabs.clean = this.createTab(tabsRow, "Cleaning", "clean");
    this.tabs.furniture = this.createTab(tabsRow, "Furniture", "furniture");
    this.tabs.backgrounds = this.createTab(
      tabsRow,
      "Backgrounds",
      "backgrounds"
    );

    // Next button
    this.nextButton = document.createElement("button");
    this.nextButton.innerHTML = "›";
    this.nextButton.style.cssText = PAGINATION_BUTTON_STYLE;
    this.nextButton.onclick = () => this.nextTabPage();
    paginationContainer.appendChild(this.nextButton);

    // Initialize tab visibility
    this.updateTabVisibility();
  }

  private updateTabVisibility(): void {
    const startIndex = this.currentTabPage * this.tabsPerPage;
    const endIndex = startIndex + this.tabsPerPage;

    this.allTabs.forEach((tabKey, index) => {
      const tab = this.tabs[tabKey];
      if (tab) {
        if (index >= startIndex && index < endIndex) {
          tab.style.display = "block";
        } else {
          tab.style.display = "none";
        }
      }
    });

    // Update pagination buttons
    if (this.prevButton && this.nextButton) {
      const totalPages = Math.ceil(this.allTabs.length / this.tabsPerPage);

      if (this.currentTabPage === 0) {
        this.prevButton.style.cssText =
          PAGINATION_BUTTON_STYLE + PAGINATION_BUTTON_DISABLED_STYLE;
        this.prevButton.onclick = null;
      } else {
        this.prevButton.style.cssText = PAGINATION_BUTTON_STYLE;
        this.prevButton.onclick = () => this.previousTabPage();
      }

      if (this.currentTabPage >= totalPages - 1) {
        this.nextButton.style.cssText =
          PAGINATION_BUTTON_STYLE + PAGINATION_BUTTON_DISABLED_STYLE;
        this.nextButton.onclick = null;
      } else {
        this.nextButton.style.cssText = PAGINATION_BUTTON_STYLE;
        this.nextButton.onclick = () => this.nextTabPage();
      }
    }
  }

  private nextTabPage(): void {
    const totalPages = Math.ceil(this.allTabs.length / this.tabsPerPage);
    if (this.currentTabPage < totalPages - 1) {
      this.currentTabPage++;
      this.updateTabVisibility();
    }
  }

  private previousTabPage(): void {
    if (this.currentTabPage > 0) {
      this.currentTabPage--;
      this.updateTabVisibility();
    }
  }

  private createTab(
    container: HTMLElement,
    text: string,
    category: string
  ): HTMLElement {
    const tab = document.createElement("div");
    tab.textContent = text;
    tab.style.cssText = TAB_STYLE;
    tab.onclick = () => this.show(category);

    // Create underline element for active state
    const underline = document.createElement("div");
    underline.style.cssText = ACTIVE_TAB_UNDERLINE_STYLE;
    underline.style.display = "none";
    tab.appendChild(underline);

    // Initially hide all tabs, updateTabVisibility will show the correct ones
    tab.style.display = "none";

    container.appendChild(tab);
    return tab;
  }

  public show(category: string = "food"): void {
    this.currentCategory = category;
    this.updateActiveTab();
    this.populateItems();
    this.updateBalance(); // Update balance when showing modal
    this.updateTabVisibility(); // Ensure correct tab pagination is displayed
    this.modal.style.display = "flex";
  }

  public hide(): void {
    this.modal.style.display = "none";
  }

  private updateBalance(): void {
    if (this.balanceValueElement) {
      const userState = useUserStore.getState();
      this.balanceValueElement.textContent = `${userState.nomToken.toLocaleString()} NOM`;
    }
  }

  private updateActiveTab(): void {
    Object.keys(this.tabs).forEach((key) => {
      const tab = this.tabs[key];
      const underline = tab.querySelector("div") as HTMLElement;

      if (key === this.currentCategory) {
        // Apply active tab styling
        tab.style.cssText = TAB_STYLE + ACTIVE_TAB_STYLE;
        if (underline) {
          underline.style.display = "block";
        }
      } else {
        // Apply inactive tab styling
        tab.style.cssText = TAB_STYLE + INACTIVE_TAB_STYLE;
        if (underline) {
          underline.style.display = "none";
        }
      }
    });
  }

  private populateItems(): void {
    this.itemsGrid.innerHTML = "";
    let items: (
      | FoodItem
      | ToyItem
      | PetItem
      | BackgroundItem
      | CleaningItem
      | FurnitureItem
    )[] = [];
    this.itemsGrid.style.cssText = ITEMS_GRID_STYLE;
    if (this.currentCategory === "backgrounds") {
      items = Object.values(gameConfigManager.getBackgroundItems());
    } else if (this.currentCategory === "food") {
      items = Object.values(gameConfigManager.getFoodItems());
    } else if (this.currentCategory === "toy") {
      items = Object.values(gameConfigManager.getToyItems());
    } else if (this.currentCategory === "clean") {
      items = Object.values(gameConfigManager.getCleaningItems());
    } else if (this.currentCategory === "furniture") {
      items = Object.values(gameConfigManager.getFurnitureItems());
    } else if (this.currentCategory === "pets") {
      items = Object.values(gameConfigManager.getPetItems());
    }

    if (items.length === 0) {
      // Change display to flex for centering the message
      this.itemsGrid.style.display = "flex";
      this.itemsGrid.style.alignItems = "center";
      this.itemsGrid.style.justifyContent = "center";
      this.itemsGrid.style.minHeight = "150px"; // Ensure it has some space

      const noItemsMessage = document.createElement("div");
      noItemsMessage.textContent = "Items coming soon!";
      noItemsMessage.style.cssText = `
        color: #888;
        text-align: center;
        font-size: 14px;
      `;
      this.itemsGrid.appendChild(noItemsMessage);
      return;
    }

    items.forEach((item) => {
      const itemCard = document.createElement("div");
      const isBackground = this.currentCategory === "backgrounds";
      const isActive = isBackground && this.activeBackground === item.texture;
      const isOwned = isBackground && this.ownedBackgrounds.has(item.texture);
      itemCard.style.cssText =
        ITEM_CARD_STYLE + (isActive ? ITEM_CARD_ACTIVE_STYLE : "");

      const itemImage = document.createElement("img");
      let imagePath = item.image_url;
      if (!imagePath) {
        // Fallback image logic
        let basePath = "assets/images/";
        switch (this.currentCategory) {
          case "food":
            basePath += `food/${item.texture}.png`;
            break;
          case "toy":
            basePath += `ball/${item.texture}.png`;
            break;
          case "clean":
            basePath += `broom/${item.texture}.png`;
            break;
          case "pets":
            basePath += `Chog/${item.texture}_idle.png`;
            break;
          case "backgrounds":
            basePath += `backgrounds/${item.texture}.png`;
            break;
          default:
            basePath += ""; // No default image for furniture yet
        }
        imagePath = basePath;
      }
      itemImage.src = imagePath ?? "";
      itemImage.style.cssText = ITEM_IMAGE_STYLE;

      const itemName = document.createElement("div");
      itemName.textContent = item.name;
      itemName.style.cssText = ITEM_NAME_STYLE;

      const itemPrice = document.createElement("div");
      itemPrice.textContent = `${item.price} NOM`;
      itemPrice.style.cssText = ITEM_PRICE_STYLE;

      itemCard.appendChild(itemImage);
      itemCard.appendChild(itemName);
      itemCard.appendChild(itemPrice);

      if (isBackground) {
        if (isOwned) {
          // Đã mua: click để chọn/cancel
          itemCard.onclick = () => {
            if (this.activeBackground === item.texture) {
              this.activeBackground = null;
              this.scene.createBackground();
            } else {
              this.activeBackground = item.texture;
              this.scene.createBackground(item.texture);
            }
            this.populateItems();
          };
        } else {
          // Chưa mua: click để mua
          itemCard.onclick = () => this.handleBuy(item);
        }
      } else {
        itemCard.onclick = () => this.handleBuy(item);
      }

      this.itemsGrid.appendChild(itemCard);
    });
  }

  private handleBuy(
    item:
      | FoodItem
      | ToyItem
      | PetItem
      | BackgroundItem
      | CleaningItem
      | FurnitureItem
  ): void {
    const userState = useUserStore.getState();
    if (userState.nomToken >= item.price) {
      if (this.currentCategory === "food") {
        const success = this.petManager.buyFood(item.id);
        if (success) {
          this.scene.events.emit("showNotification", `Purchased ${item.name}!`);
          setTimeout(() => this.updateBalance(), 100);
        } else {
          this.scene.events.emit(
            "showNotification",
            "Failed to purchase food!"
          );
        }
      } else if (this.currentCategory === "toy") {
        const success = this.petManager.buyToy(item.id);
        if (success) {
          this.scene.events.emit("showNotification", `Purchased ${item.name}!`);
          setTimeout(() => this.updateBalance(), 100);
        } else {
          this.scene.events.emit("showNotification", "Failed to purchase toy!");
        }
      } else if (this.currentCategory === "clean") {
        const success = this.petManager.buyCleaning(item.id);
        if (success) {
          this.scene.events.emit("showNotification", `Purchased ${item.name}!`);
          setTimeout(() => this.updateBalance(), 100);
        } else {
          this.scene.events.emit(
            "showNotification",
            "Failed to purchase cleaning item!"
          );
        }
      } else if (this.currentCategory === "furniture") {
        // Placeholder for buying furniture
        this.scene.events.emit(
          "showNotification",
          `Buying furniture is not yet implemented.`
        );
      } else if (this.currentCategory === "pets") {
        userState.spendToken(item.price);
        this.petManager.buyPet(item.id);
        this.scene.events.emit(
          "showNotification",
          `Pet ${item.name} purchase sent to server!`
        );
        this.updateBalance();
      } else if (this.currentCategory === "backgrounds") {
        userState.spendToken(item.price);
        this.ownedBackgrounds.add(item.texture); // Đánh dấu đã mua
        this.activeBackground = item.texture;
        this.scene.createBackground(item.texture);
        this.scene.events.emit(
          "showNotification",
          `Background ${item.name} purchased!`
        );
        this.updateBalance();
        this.populateItems();
      }
    } else {
      this.scene.events.emit("showNotification", "Not enough NOM tokens!");
    }
  }

  private handleClaim(): void {
    // Handle claim earnings functionality
    this.scene.events.emit(
      "showNotification",
      "Claim functionality coming soon!"
    );
  }
}

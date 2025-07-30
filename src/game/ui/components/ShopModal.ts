import type { PetManager } from "../../managers/PetManager";
import { gameConfigManager } from "../../configs/gameConfig";
import type { FoodItem, ToyItem, PetItem } from "../../configs/gameConfig";
import { useUserStore } from "../../../store/userStore";

const MODAL_STYLE = `
  position: fixed;
  top: 50%;
  right: 8%;
  transform: translateY(-50%);
  width: 25%;
  max-width: 450px;
  min-height: 200px;
  background: linear-gradient(180deg, #292929 0%, #141414 100%);
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
  width: 100%;
  height: 100px;
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

export default class ShopModal {
  private scene: Phaser.Scene;
  private petManager: PetManager;
  private modal: HTMLElement;
  private itemsGrid: HTMLElement;
  private tabs: { [key: string]: HTMLElement } = {};
  private currentCategory: string = "food";

  constructor(scene: Phaser.Scene, petManager: PetManager) {
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

    // Content wrapper that contains tabs and items grid
    const contentWrapper = document.createElement("div");
    contentWrapper.style.cssText = CONTENT_WRAPPER_STYLE;
    this.modal.appendChild(contentWrapper);

    // Tabs container with styling matching Figma
    const tabsContainer = document.createElement("div");
    tabsContainer.style.cssText = TABS_CONTAINER_STYLE;
    contentWrapper.appendChild(tabsContainer);

    const tabsRow = document.createElement("div");
    tabsRow.style.cssText = TABS_STYLE;
    tabsContainer.appendChild(tabsRow);

    this.tabs.pets = this.createTab(tabsRow, "Pets", "pets");
    this.tabs.food = this.createTab(tabsRow, "Food", "food");
    this.tabs.items = this.createTab(tabsRow, "Items", "items");

    this.itemsGrid.style.cssText = ITEMS_GRID_STYLE;
    contentWrapper.appendChild(this.itemsGrid);
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

    container.appendChild(tab);
    return tab;
  }

  public show(category: string = "food"): void {
    this.currentCategory = category;
    this.updateActiveTab();
    this.populateItems();
    this.modal.style.display = "flex";
  }

  public hide(): void {
    this.modal.style.display = "none";
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
    let items: (FoodItem | ToyItem | PetItem)[] = [];

    if (this.currentCategory === "food") {
      items = Object.values(gameConfigManager.getFoodItems());
    } else if (this.currentCategory === "items") {
      items = Object.values(gameConfigManager.getToyItems());
    } else if (this.currentCategory === "pets") {
      items = Object.values(gameConfigManager.getPetItems());
    }

    items.forEach((item) => {
      const itemCard = document.createElement("div");
      itemCard.style.cssText = ITEM_CARD_STYLE;
      itemCard.onclick = () => this.handleBuy(item);

      const itemImage = document.createElement("img");
      let imagePath = "";
      if (this.currentCategory === "food") {
        imagePath = `assets/images/food/${item.texture}.png`;
      } else if (this.currentCategory === "items") {
        imagePath = `assets/images/ball/${item.texture}.png`;
      } else if (this.currentCategory === "pets") {
        imagePath = `assets/images/Chog/${item.texture}_idle.png`;
      }
      itemImage.src = imagePath;
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

      this.itemsGrid.appendChild(itemCard);
    });
  }

  private handleBuy(item: FoodItem | ToyItem | PetItem): void {
    const userState = useUserStore.getState();
    if (userState.nomToken >= item.price) {
      if (this.currentCategory === "food") {
        const success = this.petManager.buyFood(item.id);
        if (success) {
          this.scene.events.emit("showNotification", `Purchased ${item.name}!`);
        } else {
          this.scene.events.emit("showNotification", "Failed to purchase food!");
        }
      } else if (this.currentCategory === "items") {
        const success = this.petManager.buyToy(item.id);
        if (success) {
          this.scene.events.emit("showNotification", `Purchased ${item.name}!`);
        } else {
          this.scene.events.emit("showNotification", "Failed to purchase toy!");
        }
      } else if (this.currentCategory === "pets") {
        // Deduct tokens manually since existing buyPet only handles server communication
        userState.spendToken(item.price);
        
        // Use existing buyPet method (sends to server)
        this.petManager.buyPet(item.id);
        
        this.scene.events.emit("showNotification", `Pet ${item.name} purchase sent to server!`);
      }
    } else {
      this.scene.events.emit("showNotification", "Not enough NOM tokens!");
    }
  }
}

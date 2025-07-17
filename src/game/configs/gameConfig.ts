import http from "@/utils/http";

export interface GameConfig {
  food: {
    items: FoodItem[];
    defaultPrice: number;
  };
  cleaning: {
    items: CleaningItem[];
    defaultPrice: number;
  };
  toys: {
    items: ToyItem[];
    defaultPrice: number;
  };
  economy: {
    initialTokens: number;
    hungerDecreaseRate: number;
  };
  gameplay: {
    foodDespawnTime: number;
    maxFoodInventory: number;
    maxCleaningInventory: number;
    maxToyInventory: number;
  };
}

export interface FoodItem {
  id: string;
  name: string;
  price: number;
  hungerRestore: number;
  texture: string;
  rarity?: "common" | "rare" | "epic";
}

export interface CleaningItem {
  id: string;
  name: string;
  price: number;
  cleanlinessRestore: number;
  texture: string;
  rarity?: "common" | "rare" | "epic";
}

export interface ToyItem {
  id: string;
  name: string;
  price: number;
  happinessRestore: number;
  texture: string;
  rarity?: "common" | "rare" | "epic";
}

// Default local config (fallback)
export const DEFAULT_GAME_CONFIG: GameConfig = {
  food: {
    items: [
      {
        id: "hamburger",
        name: "Hamburger",
        price: 5,
        hungerRestore: 15,
        texture: "hamburger",
      },
      {
        id: "apple",
        name: "Apple",
        price: 3,
        hungerRestore: 10,
        texture: "apple",
      },
      {
        id: "bone",
        name: "Bone",
        price: 5,
        hungerRestore: 12,
        texture: "bone",
      },
      // More items will be loaded from API
    ],
    defaultPrice: 5,
  },
  cleaning: {
    items: [
      {
        id: "broom",
        name: "Broom",
        price: 10,
        cleanlinessRestore: 20,
        texture: "broom",
      },
    ],
    defaultPrice: 10,
  },
  toys: {
    items: [
      {
        id: "ball",
        name: "Ball",
        price: 8,
        happinessRestore: 25,
        texture: "ball",
      },
    ],
    defaultPrice: 8,
  },
  economy: {
    initialTokens: 100,
    hungerDecreaseRate: 2,
  },
  gameplay: {
    foodDespawnTime: 20000,
    maxFoodInventory: 10,
    maxCleaningInventory: 5,
    maxToyInventory: 5,
  },
};

class GameConfigManager {
  private config: GameConfig = DEFAULT_GAME_CONFIG;
  private isLoaded = false;

  async loadConfig(): Promise<GameConfig> {
    console.log("🔄 Starting loadConfig...");
    try {
      console.log("📞 Calling API /store-item...");
      const response = await http.get("/store-item");
      console.log("📥 Loaded game config from API:", response.data);

      // Transform API response to match our GameConfig format
      const storeItems = response.data;
      const foodItems: FoodItem[] = storeItems
        .filter((item: any) => item.type === "food")
        .map((item: any) => ({
          id: item.name.toLowerCase().replace(" ", "_"),
          name: item.name,
          price: item.cost_nom,
          hungerRestore: 15, // Default value, có thể adjust dựa vào item
          texture: item.name.toLowerCase().replace(" ", "_"),
          rarity: "common", // Default, có thể map từ API nếu có
        }));

      if (foodItems.length > 0) {
        const serverConfig: Partial<GameConfig> = {
          food: {
            items: foodItems,
            defaultPrice: foodItems[0]?.price || this.config.food.defaultPrice,
          },
        };

        this.config = { ...DEFAULT_GAME_CONFIG, ...serverConfig };
        console.log(
          "✅ Game config loaded from API:",
          foodItems.length,
          "food items"
        );

        // Log detailed food items
        // this.logFoodItems()
      } else {
        console.log("⚠️ No food items found in API, using default config");
      }
    } catch (error) {
      console.log("⚠️ Using default game config (API error):", error);
    }

    this.isLoaded = true;
    return this.config;
  }

  getConfig(): GameConfig {
    return this.config;
  }

  getFoodPrice(foodId: string = "hamburger"): number {
    const foodItem = this.config.food.items.find((item) => item.id === foodId);
    return foodItem?.price || this.config.food.defaultPrice;
  }

  getFoodItem(foodId: string): FoodItem | undefined {
    return this.config.food.items.find((item) => item.id === foodId);
  }

  getCleaningPrice(cleaningId: string = "broom"): number {
    const cleaningItem = this.config.cleaning.items.find(
      (item) => item.id === cleaningId
    );
    return cleaningItem?.price || this.config.cleaning.defaultPrice;
  }

  getCleaningItem(cleaningId: string): CleaningItem | undefined {
    return this.config.cleaning.items.find((item) => item.id === cleaningId);
  }

  getToyPrice(toyId: string = "ball"): number {
    const toyItem = this.config.toys.items.find(
      (item) => item.id === toyId
    );
    return toyItem?.price || this.config.toys.defaultPrice;
  }

  getToyItem(toyId: string): ToyItem | undefined {
    return this.config.toys.items.find((item) => item.id === toyId);
  }

  getToyItems(): { [key: string]: ToyItem } {
    const toyItems: { [key: string]: ToyItem } = {};
    this.config.toys.items.forEach(item => {
      toyItems[item.id] = item;
    });
    return toyItems;
  }

  updateConfig(newConfig: Partial<GameConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  isConfigLoaded(): boolean {
    return this.isLoaded;
  }

  // Debug method to log current food items
  logFoodItems(): void {
    console.log("🍔 Current Food Items Configuration:");
    console.log("================================");
    this.config.food.items.forEach((item, index) => {
      console.log(`${index + 1}. ${item.name}`);
      console.log(`   ID: ${item.id}`);
      console.log(`   Price: ${item.price} tokens`);
      console.log(`   Hunger Restore: ${item.hungerRestore}`);
      console.log(`   Texture: ${item.texture}`);
      console.log(`   Rarity: ${item.rarity || "common"}`);
      console.log("   ---");
    });
    console.log(`Total items: ${this.config.food.items.length}`);
    console.log(`Default price: ${this.config.food.defaultPrice}`);
    console.log(`Config loaded: ${this.isLoaded}`);
    console.log("================================");
  }
}

export const gameConfigManager = new GameConfigManager();

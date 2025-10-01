import { useEffect, useState } from "react";
import { GameScene } from "@/game/scenes/GameScene";
import { useUserStore } from "@/store/userStore";
import { gameConfigManager } from "@/game/configs/gameConfig";
import type {
  FoodItem,
  ToyItem,
  PetItem,
  BackgroundItem,
  CleaningItem,
  FurnitureItem
} from "@/game/configs/gameConfig";

type ShopItem =
  | FoodItem
  | ToyItem
  | PetItem
  | BackgroundItem
  | CleaningItem
  | FurnitureItem;

export function ReactShopModal({
  isOpen,
  onClose,
  scene
}: {
  isOpen: boolean;
  onClose: () => void;
  scene: GameScene;
}) {
  const [category, setCategory] = useState<string>("food");
  const [items, setItems] = useState<ShopItem[]>([]);
  const [balance, setBalance] = useState(
    () => useUserStore.getState().nomToken
  );

  const getItemImageSrc = (cat: string, shopItem: ShopItem): string => {
    const maybeUrl = (shopItem as { image_url?: string }).image_url;
    if (maybeUrl && maybeUrl.length > 0) return maybeUrl;
    const basePath = "assets/images/";
    const effectiveCategory =
      cat === "items" ? detectItemType(shopItem) : (cat as string);
    switch (effectiveCategory) {
      case "food":
        return `${basePath}food/${shopItem.texture}.png`;
      case "toy":
        return `${basePath}ball/${shopItem.texture}.png`;
      case "clean":
        return `${basePath}broom/${shopItem.texture}.png`;
      case "pets":
        return `${basePath}Chog/${shopItem.texture}_idle.png`;
      case "backgrounds":
        return `${basePath}backgrounds/${shopItem.texture}.png`;
      case "background":
        return `${basePath}backgrounds/${shopItem.texture}.png`;
      case "furniture":
        return `${basePath}effects/coin.png`;
      default:
        return "";
    }
  };

  const detectItemType = (
    shopItem: ShopItem
  ):
    | "food"
    | "toy"
    | "clean"
    | "pets"
    | "background"
    | "backgrounds"
    | "furniture" => {
    if ((shopItem as { hungerRestore?: number }).hungerRestore !== undefined) {
      return "food";
    }
    if (
      (shopItem as { happinessRestore?: number }).happinessRestore !== undefined
    ) {
      return "toy";
    }
    if (
      (shopItem as { cleanlinessRestore?: number }).cleanlinessRestore !==
      undefined
    ) {
      return "clean";
    }
    if ((shopItem as { theme?: string }).theme !== undefined) {
      return "background";
    }
    if ((shopItem as { species?: string }).species !== undefined) {
      return "pets";
    }
    return "furniture";
  };

  useEffect(() => {
    const unsub = useUserStore.subscribe((s) => setBalance(s.nomToken));
    return () => unsub();
  }, []);

  useEffect(() => {
    switch (category) {
      case "food":
        setItems(Object.values(gameConfigManager.getFoodItems()));
        break;
      case "toy":
        setItems(Object.values(gameConfigManager.getToyItems()));
        break;
      case "clean":
        setItems(Object.values(gameConfigManager.getCleaningItems()));
        break;
      case "furniture":
        setItems(Object.values(gameConfigManager.getFurnitureItems()));
        break;
      case "pets":
        setItems(Object.values(gameConfigManager.getPetItems()));
        break;
      case "backgrounds":
        setItems(Object.values(gameConfigManager.getBackgroundItems()));
        break;
      case "items": {
        const combined: ShopItem[] = [
          ...Object.values(gameConfigManager.getToyItems()),
          ...Object.values(gameConfigManager.getCleaningItems()),
          ...Object.values(gameConfigManager.getFurnitureItems()),
          ...Object.values(gameConfigManager.getBackgroundItems())
        ];
        setItems(combined);
        break;
      }
      default:
        setItems([]);
    }
  }, [category]);

  if (!isOpen) return null;

  const handleBuy = (item: ShopItem) => {
    const mappedCategory =
      category === "backgrounds"
        ? "background"
        : category === "pets"
        ? "pet"
        : category === "items"
        ? ((): "toy" | "clean" | "background" | "furniture" => {
            const t = detectItemType(item);
            if (t === "toy") return "toy";
            if (t === "clean") return "clean";
            if (t === "background" || t === "backgrounds") return "background";
            return "furniture";
          })()
        : (category as "food" | "toy" | "clean" | "furniture");
    // Use dedicated buy pet flow
    if (category === "pets") {
      try {
        const petType =
          (item as PetItem).texture || (item as PetItem).species || item.name;
        scene.getPetManager().buyPet(petType);
      } catch {
        // fallback to generic message
        scene.sendBuyFoodLegacy({
          itemType: "pet",
          itemName: item.name,
          quantity: 1,
          itemId: String((item as PetItem).id || "")
        });
      }
      return;
    }
    scene.sendBuyFoodLegacy({
      itemType: mappedCategory,
      itemName: item.name,
      quantity: 1,
      itemId: String(item.id)
    });
  };

  return (
    <div
      style={{
        width: 450,
        maxWidth: 450,
        minWidth: 450,
        height: "40vh",
        background: "linear-gradient(180deg, #1D1D1D 0%, #141414 100%)",
        borderRadius: 21,
        border: "0.84px solid transparent",
        padding: 16,
        color: "#B3B3B3",
        fontFamily: "Plus Jakarta Sans, sans-serif",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        boxShadow:
          "0px 0px 1.43px 0px rgba(0,0,0,0.25), inset 0px 1.26px 1.26px 0px rgba(154,154,154,0.45)"
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          position: "relative",
          marginBottom: 12
        }}
      >
        <h2
          style={{ fontSize: 12, fontWeight: 700, margin: 0, color: "#B3B3B3" }}
        >
          Store
        </h2>
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            right: 0,
            top: "50%",
            transform: "translateY(-50%)",
            background: "#323232",
            border: "none",
            color: "#E95151",
            fontSize: 8,
            width: 12,
            aspectRatio: "1 / 1",
            borderRadius: "50%",
            boxShadow: "inset 0px 0.84px 0.42px 0px rgba(199,199,199,0.19)",
            cursor: "pointer"
          }}
        >
          ✕
        </button>
      </div>
      <div
        style={{
          position: "relative",
          marginBottom: 8,
          padding: "8px 24px" // padding to make room for arrows
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 8,
            overflowX: "auto",
            scrollbarWidth: "none",
            msOverflowStyle: "none"
          }}
        >
          {[
            { k: "pets", t: "Pets" },
            { k: "food", t: "Food" },
            { k: "toy", t: "Toys" },
            { k: "clean", t: "Cleaning" },
            { k: "furniture", t: "Furniture" },
            { k: "backgrounds", t: "Backgrounds" }
          ].map((tab) => (
            <button
              key={tab.k}
              onClick={() => setCategory(tab.k)}
              style={{
                background: "transparent",
                color: category === tab.k ? "#878787" : "#5A5A5A",
                border: "none",
                cursor: "pointer",
                borderRadius: 30,
                fontWeight: category === tab.k ? 600 : 500,
                fontSize: 12,
                position: "relative",
                minWidth: 0,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}
            >
              {tab.t}
              {category === tab.k && (
                <div
                  style={{
                    position: "absolute",
                    bottom: -15,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "80%",
                    height: 4.44,
                    background: "rgba(135,135,135,0.4)",
                    borderRadius: 3
                  }}
                />
              )}
            </button>
          ))}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 8
        }}
      >
        <span>Balance</span>
        <strong>{balance.toLocaleString()} NOM</strong>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(100px,1fr))",
          gap: 8.39,
          overflowY: "auto",
          padding: 8,
          flex: 1,
          minHeight: 0
        }}
      >
        {items.length === 0 ? (
          <div style={{ color: "#888" }}>Items coming soon!</div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              onClick={() => handleBuy(item)}
              style={{
                background: "rgba(60,60,60,0.26)",
                border: "1.25px solid rgba(0,0,0,0.37)",
                borderRadius: 18.73,
                padding: "12px 8px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6.42,
                cursor: "pointer",
                opacity: 1,
                boxShadow: "inset 0px 4.46px 5.95px 0px rgba(0,0,0,0.3)"
              }}
            >
              <img
                src={getItemImageSrc(category, item)}
                style={{
                  width: 48,
                  height: 48,
                  objectFit: "cover",
                  borderRadius: 8
                }}
              />
              <div style={{ fontWeight: 600, fontSize: 16, color: "#B3B3B3" }}>
                {item.name}
              </div>
              <div style={{ fontSize: 14, color: "#B3B3B3" }}>
                {item.price} NOM
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Phaser from "phaser";
import http from "@/utils/http";
import { ROUTES } from "@/constants/routes";
import { GameScene } from "@/game/scenes/GameScene";
import { SceneName } from "@/constants/scene";
import { useUserStore } from "@/store/userStore";
import { GameRoomState } from "@/game/schema/ChatSchema";
import { createColyseus } from "@/hooks/createColyseus";
import { getConfig, CONTAINER_ID } from "@/game/configs/phaser-config";
import type { PurchaseSystem } from "@/game/systems/PurchaseSystem";
import { eventBus, PurchaseEvents } from "@/game/systems/PurchaseSystem";
import { gameConfigManager } from "@/game/configs/gameConfig";
import type {
  FoodItem,
  ToyItem,
  PetItem,
  BackgroundItem,
  CleaningItem,
  FurnitureItem
} from "@/game/configs/gameConfig";
// import { TilemapInput } from "@/components/TilemapInput"; // Disabled in favor of Phaser-native input

interface PhaserPetGameProps {
  publicKey: string;
  signMessage?: (message: string) => string | Promise<string>;
}

const PhaserPetGame = ({ publicKey, signMessage }: PhaserPetGameProps) => {
  const gameRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<GameScene | null>(null);
  const hasBootedRef = useRef(false);

  const [isGameInitialized, setIsGameInitialized] = useState(false);
  const addressWallet = useUserStore((state) => state.addressWallet);
  const setAddressWallet = useUserStore((state) => state.setAddressWallet);
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(
    !!addressWallet
  );

  // Setup Colyseus context (new approach). Use provided Schema class if available.
  const colyseusApi = useMemo(() => {
    const env = import.meta.env as { VITE_BASE_SOCKET?: string };
    return createColyseus<GameRoomState>(
      env.VITE_BASE_SOCKET || "ws://localhost:3002"
    );
  }, []);
  const hookRoom = colyseusApi.useColyseusRoom();

  useEffect(() => {
    console.log("🔍 Game initialization check:", {
      gameRef: !!gameRef.current,
      isUserAuthenticated,
      isGameInitialized
    });

    if (!gameRef.current || !isUserAuthenticated || isGameInitialized) {
      console.log("❌ Skipping game initialization");
      return;
    }
    // Ensure the container has the expected id for Phaser parent binding
    if (gameRef.current && gameRef.current.id !== CONTAINER_ID) {
      gameRef.current.id = CONTAINER_ID;
    }
    if (hasBootedRef.current || phaserGameRef.current) {
      console.log("❌ Game already booted, skipping new Phaser.Game()");
      return;
    }
    console.log("🎮 Starting Phaser game initialization...");

    try {
      phaserGameRef.current = new Phaser.Game(getConfig());
      hasBootedRef.current = true;
      console.log("✅ Phaser Game created successfully");

      // Poll for scene registration to be robust under Strict Mode double-mount
      let attempts = 0;
      const pollScene = () => {
        attempts += 1;
        sceneRef.current =
          (phaserGameRef.current?.scene.getScene(
            SceneName.Gameplay
          ) as GameScene) || null;
        if (sceneRef.current) {
          console.log("✅ GameScene loaded successfully");
          setIsGameInitialized(true);
          if (hookRoom) {
            sceneRef.current.attachColyseusRoom(hookRoom as unknown);
          }
          return;
        }
        if (attempts < 30) {
          setTimeout(pollScene, 200);
        } else {
          console.error("❌ GameScene still not available after polling");
        }
      };
      setTimeout(pollScene, 200);
    } catch (error) {
      console.error("❌ Failed to create Phaser Game:", error);
    }

    const handleResize = () => {
      if (phaserGameRef.current) {
        phaserGameRef.current.scale.resize(window.innerWidth, 120);
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      // In dev (React Strict Mode), avoid destroying immediately to prevent
      // double-mount teardown from killing the Phaser instance.
      const env = import.meta.env as { DEV?: boolean };
      if (!env.DEV && phaserGameRef.current) {
        phaserGameRef.current.destroy(true);
        phaserGameRef.current = null;
        hasBootedRef.current = false;
      }
    };
  }, [isUserAuthenticated, hookRoom, isGameInitialized]);

  // If the room becomes available after the scene is ready, attach it.
  useEffect(() => {
    if (sceneRef.current && hookRoom) {
      sceneRef.current.attachColyseusRoom(hookRoom as unknown);
    }
  }, [hookRoom]);

  // Connect to room only after scene emits 'assets-ready' to ensure assets/state are ready
  useEffect(() => {
    if (!isUserAuthenticated) return;
    const scene = sceneRef.current;
    if (!scene) return;
    if (hookRoom) return;

    const connect = () => {
      colyseusApi
        .connectToColyseus("single_player", {
          name: "Pet Game",
          addressWallet: addressWallet || undefined
        })
        .catch(() => {
          // ignore
        });
    };

    if (isGameInitialized) {
      connect();
      return;
    }

    scene.events.once("assets-ready", connect);
    return () => {
      // phaser's event emitter typings are broad; cast to unknown first
      scene.events.off(
        "assets-ready",
        connect as unknown as (...args: unknown[]) => void
      );
    };
  }, [
    isUserAuthenticated,
    isGameInitialized,
    hookRoom,
    addressWallet,
    colyseusApi
  ]);

  useEffect(() => {
    if (addressWallet) {
      setIsUserAuthenticated(true);
      return;
    }
    setIsUserAuthenticated(false);
    console.log("🔐 Authentication check:", {
      signMessage: !!signMessage,
      publicKey: !!publicKey
    });

    if (!signMessage || !publicKey) {
      return;
    }

    const handleSignMessage = async () => {
      try {
        const response = await http.get(ROUTES.getMessage);
        const messageToSign = response.data.message;
        const signedMessage = await signMessage(messageToSign);
        if (!signedMessage || signedMessage === "") {
          return;
        }

        const verifyResponse = await http.post(ROUTES.verify, {
          message: messageToSign,
          address: publicKey,
          signature: signedMessage
        });

        setAddressWallet(verifyResponse.data.wallet_address);
      } catch {
        // ignore
      }
    };
    handleSignMessage();
  }, [publicKey, signMessage, addressWallet, setAddressWallet]);
  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        width: "100vw",
        height: "120px",
        zIndex: 1000,
        border: "none",
        background: "transparent"
      }}
    >
      {!isUserAuthenticated && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
            color: "white",
            fontSize: "16px",
            fontWeight: "bold",
            background: "transparent"
          }}
        >
          Authenticating...
        </div>
      )}
      <div
        ref={gameRef}
        id={CONTAINER_ID}
        style={{
          width: "100%",
          height: "100%",
          display: isUserAuthenticated ? "block" : "none",
          background: "transparent"
        }}
      />
      {isUserAuthenticated && sceneRef.current && (
        <ShopPortal scene={sceneRef.current} />
      )}
      {/* React tilemap input overlay disabled in favor of Phaser-native input */}
    </div>
  );
};

export default PhaserPetGame;

// Inline lightweight portal to host React Shop component

function ShopPortal({ scene }: { scene: GameScene }) {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [purchaseSystem, setPurchaseSystem] = useState<
    PurchaseSystem | undefined
  >(undefined);

  useEffect(() => {
    setPurchaseSystem(scene.getPurchaseSystem());
    const el = document.createElement("div");
    el.style.position = "fixed";
    el.style.top = "50%";
    el.style.right = "8%";
    el.style.transform = "translateY(-50%)";
    el.style.zIndex = "1001";
    document.body.appendChild(el);
    setContainer(el);

    const openHandler = () => {
      setIsOpen(true);
      scene.registry.set("reactShopOpen", true);
    };
    const closeHandler = () => {
      setIsOpen(false);
      scene.registry.set("reactShopOpen", false);
    };
    // Mark React shop as available as soon as portal mounts
    scene.registry.set("reactShopReady", true);
    scene.events.on("open-react-shop", openHandler);
    scene.events.on("close-react-shop", closeHandler);
    const onPurchaseSuccess = (data: {
      itemType: string;
      itemId: string;
      itemData?: { texture?: string };
    }) => {
      if (
        data.itemType === "background" &&
        data.itemData &&
        data.itemData.texture
      ) {
        try {
          scene.createBackground(data.itemData.texture);
        } catch {
          // ignore
        }
      }
    };
    eventBus.on(
      PurchaseEvents.PurchaseSuccess,
      onPurchaseSuccess as unknown as (...args: unknown[]) => void
    );
    return () => {
      scene.events.off("open-react-shop", openHandler);
      scene.events.off("close-react-shop", closeHandler);
      eventBus.off(
        PurchaseEvents.PurchaseSuccess,
        onPurchaseSuccess as unknown as (...args: unknown[]) => void
      );
      scene.registry.set("reactShopReady", false);
      scene.registry.set("reactShopOpen", false);
      el.remove();
    };
  }, [scene]);

  // Keep PurchaseSystem reference in sync when it appears later
  useEffect(() => {
    const id = setInterval(() => {
      const ps = scene.getPurchaseSystem();
      if (ps) {
        setPurchaseSystem(ps);
      }
    }, 250);
    return () => clearInterval(id);
  }, [scene]);

  if (!container) return null;
  return createPortal(
    <ReactShopModal
      isOpen={isOpen}
      onClose={() => scene.events.emit("close-react-shop")}
      scene={scene}
      purchaseSystem={purchaseSystem}
    />,
    container
  );
}

type ShopItem =
  | FoodItem
  | ToyItem
  | PetItem
  | BackgroundItem
  | CleaningItem
  | FurnitureItem;

function ReactShopModal({
  isOpen,
  onClose,
  scene,
  purchaseSystem
}: {
  isOpen: boolean;
  onClose: () => void;
  scene: GameScene;
  purchaseSystem?: PurchaseSystem;
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
    switch (cat) {
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
      default:
        return "";
    }
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
      default:
        setItems([]);
    }
  }, [category]);

  if (!isOpen) return null;

  const handleBuy = (item: ShopItem) => {
    if (!purchaseSystem) {
      scene.events.emit("showNotification", "Shop is loading...");
      return;
    }
    const mappedCategory =
      category === "backgrounds"
        ? "background"
        : category === "pets"
        ? "pet"
        : (category as "food" | "toy" | "clean" | "furniture");
    // If user requests legacy path for food, send buy_food
    if (category === "food") {
      scene.sendBuyFoodLegacy({
        itemType: "food",
        itemName: item.name,
        quantity: 1,
        itemId: String(item.id)
      });
      return;
    }
    const success = purchaseSystem.initiatePurchase(
      mappedCategory,
      String(item.id),
      1
    );
    if (!success) {
      scene.events.emit("showNotification", "Purchase failed to start");
    }
  };

  return (
    <div
      style={{
        width: "25%",
        maxWidth: 450,
        minHeight: 200,
        background: "linear-gradient(180deg, #1D1D1D 0%, #141414 100%)",
        borderRadius: 21,
        border: "0.84px solid transparent",
        padding: 16,
        color: "#B3B3B3",
        fontFamily: "Plus Jakarta Sans, sans-serif",
        display: "flex",
        flexDirection: "column",
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
        style={{ display: "flex", gap: 8, marginBottom: 8, padding: "8px 0" }}
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
              flex: 1,
              background: "transparent",
              color: category === tab.k ? "#878787" : "#5A5A5A",
              border: "none",
              cursor: "pointer",
              borderRadius: 30,
              fontWeight: category === tab.k ? 600 : 500,
              fontSize: 12,
              position: "relative"
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
          maxHeight: "50vh",
          padding: 8
        }}
      >
        {items.length === 0 ? (
          <div style={{ color: "#888" }}>
            {purchaseSystem ? "Items coming soon!" : "Loading shop..."}
          </div>
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
                cursor: purchaseSystem ? "pointer" : "not-allowed",
                opacity: purchaseSystem ? 1 : 0.6,
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

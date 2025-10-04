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
import { ReactShopModal } from "./ReactShopModal";
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
        phaserGameRef.current.scale.resize(window.innerWidth, 160);
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
        height: "140px",
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

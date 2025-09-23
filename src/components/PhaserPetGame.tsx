import { useEffect, useMemo, useRef, useState } from "react";
import Phaser from "phaser";
import http from "@/utils/http";
import { ROUTES } from "@/constants/routes";
import { GameScene } from "@/game/scenes/GameScene";
import { SceneName } from "@/constants/scene";
import RexUIPlugin from "phaser3-rex-plugins/templates/ui/ui-plugin.js";
import { useUserStore } from "@/store/userStore";
import { GameRoomState } from "@/game/schema/ChatSchema";
import { createColyseus } from "@/hooks/createColyseus";

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
    if (hasBootedRef.current || phaserGameRef.current) {
      console.log("❌ Game already booted, skipping new Phaser.Game()");
      return;
    }
    console.log("🎮 Starting Phaser game initialization...");
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: window.innerWidth,
      height: 120,
      parent: gameRef.current,
      scene: GameScene,
      transparent: true,
      plugins: {
        scene: [
          {
            key: "rexUI",
            plugin: RexUIPlugin,
            mapping: "rexUI"
          }
        ]
      }
    };

    try {
      phaserGameRef.current = new Phaser.Game(config);
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
        style={{
          width: "100%",
          height: "100%",
          display: isUserAuthenticated ? "block" : "none",
          background: "transparent"
        }}
      />
    </div>
  );
};

export default PhaserPetGame;

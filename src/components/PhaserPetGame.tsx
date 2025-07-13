import { useEffect, useRef, useState } from "react";
import Phaser from "phaser";
import http from "@/utils/http";
import { ROUTES } from "@/constants/routes";
import { GameScene } from "@/game/scenes/GameScene";
import RexUIPlugin from "phaser3-rex-plugins/templates/ui/ui-plugin.js";
import { useUserStore } from "@/store/userStore";

interface PhaserPetGameProps {
  publicKey: string;
  signMessage?: (message: string) => string | Promise<string>;
}

const PhaserPetGame = ({ publicKey, signMessage }: PhaserPetGameProps) => {
  const gameRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<GameScene | null>(null);

  const [isGameInitialized, setIsGameInitialized] = useState(false);
  const addressWallet = useUserStore((state) => state.addressWallet);
  const setAddressWallet = useUserStore((state) => state.setAddressWallet);
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(
    !!addressWallet
  );

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
    console.log("🎮 Starting Phaser game initialization...");
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: window.innerWidth,
      height: 120,
      parent: gameRef.current,
      scene: GameScene,
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
      console.log("✅ Phaser Game created successfully");

      setTimeout(() => {
        sceneRef.current =
          (phaserGameRef.current?.scene.getScene("gameplay") as GameScene) ||
          null;

        if (sceneRef.current) {
          console.log("✅ GameScene loaded successfully");
          setIsGameInitialized(true); // Only set after GameScene is loaded
        } else {
          console.error("❌ Failed to get GameScene");
          // Retry after a longer delay
          setTimeout(() => {
            sceneRef.current =
              (phaserGameRef.current?.scene.getScene(
                "gameplay"
              ) as GameScene) || null;
            if (sceneRef.current) {
              console.log("✅ GameScene loaded successfully (retry)");
              setIsGameInitialized(true);
            } else {
              console.error("❌ GameScene still not available after retry");
            }
          }, 1000);
        }
      }, 500);
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
      if (phaserGameRef.current) {
        phaserGameRef.current.destroy(true);
        phaserGameRef.current = null;
      }
    };
  }, [isUserAuthenticated]);

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
      } catch (error) {
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
        border: "none"
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
            fontWeight: "bold"
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
          display: isUserAuthenticated ? "block" : "none"
        }}
      />
    </div>
  );
};

export default PhaserPetGame;

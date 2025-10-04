import { useEffect, useState } from "react";
import "./App.css";
import PhaserPetGame from "@/components/PhaserPetGame";
import { ethers } from "ethers";
import bg from "@/assets/images/backgrounds/x.png";

function App() {
  const [keyPair, setKeyPair] = useState<{
    privateKey: string;
    publicKey: string;
  } | null>(null);
  const [wallet, setWallet] = useState<ethers.Wallet | null>(null);

  useEffect(() => {
    const generateKeyPair = async () => {
      const wallet = ethers.Wallet.createRandom();
      setKeyPair({
        privateKey: wallet.privateKey,
        publicKey: wallet.address
      });
    };
    generateKeyPair();
  }, []);

  // Create wallet from keyPair
  useEffect(() => {
    if (keyPair) {
      const newWallet = new ethers.Wallet(keyPair.privateKey);
      setWallet(newWallet);
    }
  }, [keyPair]);

  return (
    <>
      <div
        style={{
          width: "100vw",
          height: "100vh",
          backgroundImage: `url(${bg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat"
        }}
      >
        <PhaserPetGame
          publicKey={keyPair?.publicKey || ""}
          signMessage={(message) =>
            wallet?.signMessage(message) || Promise.resolve("")
          }
        />
      </div>
    </>
  );
}

export default App;

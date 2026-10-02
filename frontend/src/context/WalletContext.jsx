import React, { createContext, useContext, useState, useEffect } from "react";
import { connectFreighterWallet } from "../services/freighter";

const defaultState = {
  walletAddress: null,
  isConnected: false,
  isConnecting: false,
  errorMessage: "",
  connect: async () => {},
  disconnect: () => {},
};

const WalletContext = createContext(defaultState);

export function WalletProvider({ children }) {
  const [walletAddress, setWalletAddress] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("scienstellar_wallet");
    if (saved) {
      setWalletAddress(saved);
    }
  }, []);

  const connect = async () => {
    setIsConnecting(true);
    setErrorMessage("");
    try {
      const address = await connectFreighterWallet();
      setWalletAddress(address);
      localStorage.setItem("scienstellar_wallet", address);
    } catch (err) {
      const msg = err.message || "Failed to connect to Freighter wallet.";
      setErrorMessage(msg);
      alert(msg);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setWalletAddress(null);
    localStorage.removeItem("scienstellar_wallet");
  };

  return (
    <WalletContext.Provider
      value={{
        walletAddress,
        isConnected: !!walletAddress,
        isConnecting,
        errorMessage,
        connect,
        disconnect,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  return context || defaultState;
}

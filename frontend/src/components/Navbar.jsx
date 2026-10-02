import React from "react";
import { useWallet } from "../context/WalletContext";

export default function Navbar({ onOpenPublishModal }) {
  const { walletAddress, isConnected, isConnecting, connect, disconnect } = useWallet();

  const handlePublishClick = () => {
    if (!isConnected) {
      alert("A connected Freighter wallet is required to submit research papers.");
      connect();
      return;
    }
    onOpenPublishModal();
  };

  const formatAddress = (addr) => addr ? `${addr.slice(0, 5)}...${addr.slice(-4)}` : "";

  return (
    <header className="border-b border-gray-800 bg-gray-900/90 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
            S
          </div>
          <div>
            <span className="text-xl font-bold text-white tracking-tight">Scienstellar</span>
            <span className="ml-2 text-xs uppercase px-2 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-800">
              Testnet
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={handlePublishClick}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/20"
          >
            + Submit Paper
          </button>

          {isConnected ? (
            <div className="flex items-center space-x-2 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-sm font-mono text-gray-300">{formatAddress(walletAddress)}</span>
              <button
                onClick={disconnect}
                className="ml-2 text-xs text-red-400 hover:text-red-300 font-medium"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={connect}
              disabled={isConnecting}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 transition-colors disabled:opacity-50"
            >
              {isConnecting ? "Connecting..." : "Connect Freighter"}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

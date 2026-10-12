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
    <header className="border-b-2 border-emerald-500/80 bg-black/95 backdrop-blur sticky top-0 z-40 shadow-[0_4px_20px_rgba(34,197,94,0.15)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-none bg-black border-2 border-emerald-400 flex items-center justify-center font-bold text-emerald-400 shadow-[0_0_10px_rgba(34,197,94,0.4)] overflow-hidden">
            <svg viewBox="0 0 512 512" className="w-6 h-6 fill-current text-emerald-400">
              <circle cx="256" cy="256" r="180" fill="none" stroke="currentColor" stroke-width="28" stroke-dasharray="12 8"/>
              <path d="M110 320L380 140" stroke="currentColor" stroke-width="26"/>
              <path d="M180 210h152v110H180z" fill="#000" stroke="currentColor" stroke-width="14"/>
            </svg>
          </div>
          <div>
            <span className="text-xl font-black text-emerald-400 tracking-wider drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]">Scienstellar</span>
            <span className="ml-2 text-xs uppercase px-1.5 py-0.5 rounded-none bg-emerald-950 text-emerald-300 border border-emerald-600 font-mono">
              Testnet
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3 sm:space-x-4">
          <button
            onClick={handlePublishClick}
            className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold uppercase rounded-none bg-emerald-500 hover:bg-emerald-400 text-black transition-all shadow-[0_0_12px_rgba(34,197,94,0.4)]"
          >
            + Submit
          </button>

          {isConnected ? (
            <div className="flex items-center space-x-2 bg-emerald-950/90 border border-emerald-500 rounded-none px-3 py-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs font-mono text-emerald-300">{formatAddress(walletAddress)}</span>
              <button
                onClick={disconnect}
                className="ml-2 text-xs text-red-400 hover:text-red-300 font-bold font-mono"
              >
                [Exit]
              </button>
            </div>
          ) : (
            <button
              onClick={connect}
              disabled={isConnecting}
              className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold uppercase rounded-none bg-black hover:bg-emerald-950 text-emerald-400 border border-emerald-500 transition-colors disabled:opacity-50 font-mono shadow-[0_0_8px_rgba(34,197,94,0.2)]"
            >
              {isConnecting ? "..." : "Connect"}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

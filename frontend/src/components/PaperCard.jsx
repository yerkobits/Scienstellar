import React, { useState, useEffect } from "react";
import { useWallet } from "../context/WalletContext";
import { donateAndUnlock } from "../services/freighter";

export default function PaperCard({ paper }) {
  const { walletAddress, isConnected, connect } = useWallet();

  const [isProcessing, setIsProcessing] = useState(false);
  const [unlockedData, setUnlockedData] = useState(null);
  const [txHash, setTxHash] = useState("");
  const [donationAmount, setDonationAmount] = useState(paper.minDonation || "5");
  const [showDonateModal, setShowDonateModal] = useState(false);

  useEffect(() => {
    if (!walletAddress) {
      setUnlockedData(null);
      return;
    }
    const storageKey = `scien_unlocked_${walletAddress}_${paper.id}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUnlockedData({
          downloadUrl: parsed.downloadUrl,
          decryptionKey: parsed.decryptionKey,
          sha256Hash: parsed.sha256Hash || paper.sha256Hash,
        });
        if (parsed.txHash) setTxHash(parsed.txHash);
      } catch (err) {
        console.error("Error restoring unlocked paper state:", err);
      }
    }
  }, [walletAddress, paper.id, paper.sha256Hash]);

  const handleDownloadClick = () => {
    if (!isConnected) {
      alert("A connected Freighter wallet is required to donate and download.");
      connect();
      return;
    }
    setShowDonateModal(true);
  };

  const handleConfirmDonation = async () => {
    if (parseFloat(donationAmount) < parseFloat(paper.minDonation)) {
      alert(`Minimum donation required is ${paper.minDonation} XLM.`);
      return;
    }

    setIsProcessing(true);
    try {
      const res = await donateAndUnlock({
        donorAddress: walletAddress,
        authorAddress: paper.authorAddress,
        amountXlm: donationAmount,
        paperId: paper.id,
      });

      const unlockedPayload = {
        downloadUrl: paper.downloadUrl,
        decryptionKey: paper.decryptionKey,
        sha256Hash: paper.sha256Hash,
        txHash: res.hash,
      };

      setTxHash(res.hash);
      setUnlockedData(unlockedPayload);

      const storageKey = `scien_unlocked_${walletAddress}_${paper.id}`;
      localStorage.setItem(storageKey, JSON.stringify(unlockedPayload));

      setShowDonateModal(false);
    } catch (err) {
      alert("Donation error: " + (err.message || "Transaction was rejected."));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col justify-between hover:border-gray-700 transition-all">
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-800/60">
            {paper.category || "General Science"}
          </span>
          <span className="text-xs text-gray-500 font-mono">
            Min: <span className="text-emerald-400 font-semibold">{paper.minDonation} XLM</span>
          </span>
        </div>

        <h3 className="text-lg font-bold text-white mb-2">{paper.title}</h3>
        <p className="text-xs text-gray-400 mb-3">
          By: <span className="text-gray-300 font-medium">{paper.authors}</span>
        </p>
        <p className="text-sm text-gray-300 mb-4 line-clamp-3 leading-relaxed">
          {paper.abstract}
        </p>
      </div>

      <div className="pt-4 border-t border-gray-800">
        {unlockedData ? (
          <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-lg p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-400">✓ Download Package Unlocked</span>
              {txHash && (
                <a
                  href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-indigo-400 underline hover:text-indigo-300"
                >
                  View on Explorer
                </a>
              )}
            </div>

            <div>
              <span className="text-xs text-gray-400 block mb-1">Decryption Secret Key:</span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={unlockedData.decryptionKey}
                  className="w-full bg-gray-950 border border-gray-700 rounded px-2 py-1 text-xs font-mono text-emerald-300"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(unlockedData.decryptionKey);
                    alert("Decryption key copied to clipboard!");
                  }}
                  className="px-2 py-1 text-xs rounded bg-gray-800 hover:bg-gray-700 text-gray-300"
                >
                  Copy
                </button>
              </div>
            </div>

            {unlockedData.sha256Hash && (
              <div>
                <span className="text-xs text-gray-400 block mb-1">Integrity Hash (SHA-256 Checksum):</span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={unlockedData.sha256Hash}
                    className="w-full bg-gray-950 border border-gray-700 rounded px-2 py-1 text-xs font-mono text-gray-300"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(unlockedData.sha256Hash);
                      alert("SHA-256 integrity hash copied!");
                    }}
                    className="px-2 py-1 text-xs rounded bg-gray-800 hover:bg-gray-700 text-gray-300"
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}

            <a
              href={unlockedData.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 block w-full text-center px-3 py-2 text-xs font-semibold rounded bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
            >
              Download Encrypted Research File
            </a>
          </div>
        ) : (
          <button
            onClick={handleDownloadClick}
            className="w-full py-2.5 px-4 rounded-lg bg-gray-800 hover:bg-indigo-600 hover:text-white text-gray-200 text-sm font-medium transition-colors border border-gray-700 flex items-center justify-center gap-2"
          >
            <span>Donate & Unlock Package</span>
            <span className="text-xs text-gray-400">({paper.minDonation} XLM)</span>
          </button>
        )}
      </div>

      {showDonateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-800 rounded-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">Support Research & Unlock Paper</h3>
            <p className="text-xs text-gray-400">
              Your donation is sent directly to the author on Stellar Testnet. You will receive the download link, decryption key, and the SHA-256 checksum to verify file integrity.
            </p>

            <div className="bg-gray-950 p-3 rounded border border-gray-800 space-y-1">
              <span className="text-xs text-gray-500">Author Stellar Address:</span>
              <p className="text-xs font-mono text-gray-300 truncate">{paper.authorAddress}</p>
            </div>

            <div>
              <label className="block text-xs uppercase text-gray-400 mb-1">
                Donation Amount (Min: {paper.minDonation} XLM)
              </label>
              <input
                type="number"
                step="0.5"
                min={paper.minDonation}
                value={donationAmount}
                onChange={(e) => setDonationAmount(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2.5 text-sm font-mono text-white"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowDonateModal(false)}
                disabled={isProcessing}
                className="px-4 py-2 text-sm rounded bg-gray-800 hover:bg-gray-700 text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDonation}
                disabled={isProcessing}
                className="px-4 py-2 text-sm font-medium rounded bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50"
              >
                {isProcessing ? "Confirming in Freighter..." : `Donate ${donationAmount} XLM`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

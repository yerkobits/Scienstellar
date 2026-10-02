import React, { useState } from "react";
import { useWallet } from "../context/WalletContext";
import { publishPaperOnChain } from "../services/contract";

const RESEARCH_CATEGORIES = [
  "Computer Science & AI",
  "Physics & Astronomy",
  "Mathematics & Logic",
  "Biology & Genetics",
  "Medicine & Healthcare",
  "Chemistry & Materials",
  "Economics & Finance",
  "Engineering & Robotics",
  "Environmental & Climate Science",
  "Social Sciences & Humanities",
  "Interdisciplinary Research",
];

export default function SubmitPaperModal({ isOpen, onClose, onPaperCreated }) {
  const { walletAddress, isConnected } = useWallet();

  const [formData, setFormData] = useState({
    title: "",
    abstract: "",
    authors: "",
    category: "Computer Science & AI",
    downloadUrl: "",
    sha256Hash: "",
    minDonation: "5",
    decryptionKey: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isConnected || !walletAddress) {
      alert("Unauthorized: Please connect your Freighter wallet to publish.");
      return;
    }

    if (!formData.downloadUrl || !formData.decryptionKey) {
      alert("Please provide both the download source URL and the decryption secret key.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await publishPaperOnChain({
        authorAddress: walletAddress,
        authorName: formData.authors,
        title: formData.title,
        abstractText: formData.abstract,
        category: formData.category,
        downloadUrl: formData.downloadUrl,
        sha256Hash: formData.sha256Hash,
        minDonation: formData.minDonation,
        decryptionKey: formData.decryptionKey,
      });

      alert(`✓ Paper successfully published on Stellar Testnet!\nTx Hash: ${res.hash}`);

      onPaperCreated();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to publish on-chain: " + (err.message || "Transaction rejected."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Publish Scientific Paper On-Chain</h2>
          <button onClick={onClose} disabled={isSubmitting} className="text-gray-400 hover:text-white">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase text-gray-400 mb-1">Author Stellar Address (Locked)</label>
            <input
              type="text"
              readOnly
              value={walletAddress || ""}
              className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2.5 text-sm font-mono text-emerald-400 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs uppercase text-gray-400 mb-1">Paper Title</label>
            <input
              type="text"
              required
              disabled={isSubmitting}
              placeholder="e.g. Scalable Consensus Protocols on Stellar"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2.5 text-sm text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase text-gray-400 mb-1">Research Field / Category</label>
              <select
                disabled={isSubmitting}
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                {RESEARCH_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase text-gray-400 mb-1">Authors & Institutions</label>
              <input
                type="text"
                required
                disabled={isSubmitting}
                placeholder="e.g. A. Vance (MIT), S. Nakamoto"
                value={formData.authors}
                onChange={(e) => setFormData({ ...formData, authors: e.target.value })}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2.5 text-sm text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase text-gray-400 mb-1">Abstract</label>
            <textarea
              required
              rows={3}
              disabled={isSubmitting}
              placeholder="Summary of research methods and contributions..."
              value={formData.abstract}
              onChange={(e) => setFormData({ ...formData, abstract: e.target.value })}
              className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2.5 text-sm text-white"
            />
          </div>

          <div>
            <label className="block text-xs uppercase text-gray-400 mb-1">Minimum Donation (XLM)</label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              required
              disabled={isSubmitting}
              value={formData.minDonation}
              onChange={(e) => setFormData({ ...formData, minDonation: e.target.value })}
              className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2.5 text-sm text-white font-mono"
            />
          </div>

          {/* Protected Download & Decryption Configuration */}
          <div className="bg-gray-950 border border-indigo-900/50 p-4 rounded-lg space-y-3">
            <h3 className="text-sm font-semibold text-indigo-400">Protected Download & Verification Package</h3>
            
            <div>
              <label className="block text-xs text-gray-400 mb-1">Download URL or Magnet Link</label>
              <input
                type="text"
                required
                disabled={isSubmitting}
                placeholder="https://ipfs.io/ipfs/... or magnet:?xt=urn:btih:..."
                value={formData.downloadUrl}
                onChange={(e) => setFormData({ ...formData, downloadUrl: e.target.value })}
                className="w-full bg-gray-900 border border-gray-800 rounded-lg p-2 text-sm text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Integrity Hash (SHA-256) <span className="text-gray-500 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                disabled={isSubmitting}
                placeholder="e.g. e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
                value={formData.sha256Hash}
                onChange={(e) => setFormData({ ...formData, sha256Hash: e.target.value })}
                className="w-full bg-gray-900 border border-gray-800 rounded-lg p-2 text-sm text-white font-mono"
              />
              <span className="text-xs text-gray-500 block mt-1">
                Delivered exclusively to verified donors to check file integrity after downloading.
              </span>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Decryption Secret Key / Password</label>
              <input
                type="text"
                required
                disabled={isSubmitting}
                placeholder="e.g. scien-aes-key-9f82d1c3a0..."
                value={formData.decryptionKey}
                onChange={(e) => setFormData({ ...formData, decryptionKey: e.target.value })}
                className="w-full bg-gray-900 border border-gray-800 rounded-lg p-2 text-sm text-white font-mono"
              />
              <span className="text-xs text-gray-500 block mt-1">
                Private key unlocked only after confirmed donation on Stellar Testnet.
              </span>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-800">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50"
            >
              {isSubmitting ? "Publishing On-Chain..." : "Sign & Publish to Testnet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

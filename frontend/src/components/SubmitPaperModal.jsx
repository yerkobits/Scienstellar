import React, { useState } from "react";
import { useWallet } from "../context/WalletContext";
import { publishPaperOnChain } from "../services/contract";
import { generateDecryptionKey, createPasswordProtectedZip } from "../services/crypto";
import { uploadToIPFS } from "../services/ipfs";

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
    decryptionKey: generateDecryptionKey(), // Clean password without prefix
    fileName: "",
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [fileStatus, setFileStatus] = useState("");
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Strict validation: ONLY .zip files allowed
    if (!file.name.toLowerCase().endsWith(".zip")) {
      alert("Invalid format: Only ZIP (.zip) archives are allowed.");
      e.target.value = "";
      return;
    }

    setSelectedFile(file);
    setIsProcessingFile(true);
    setFileStatus("Securing ZIP with password-protection (ZipCrypto standard)...");

    try {
      const password = formData.decryptionKey || generateDecryptionKey();

      // 1. Create native password-protected ZIP archive
      const { zipBlob, sha256Hash, fileName } = await createPasswordProtectedZip(file, password);

      setFileStatus(`Uploading protected archive (${fileName}) to external IPFS...`);

      // 2. Upload password-protected binary ZIP to IPFS
      const ipfsResult = await uploadToIPFS(zipBlob, fileName);

      // 3. Set locked system values
      setFormData((prev) => ({
        ...prev,
        sha256Hash,
        downloadUrl: ipfsResult.url,
        decryptionKey: password,
        fileName,
      }));

      setFileStatus(`✓ Protected ZIP uploaded to IPFS: ${ipfsResult.cid}`);
    } catch (err) {
      console.error(err);
      setFileStatus(`Upload error: ${err.message || "Failed to process ZIP."}`);
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isConnected || !walletAddress) {
      alert("Unauthorized: Please connect your Freighter wallet to publish.");
      return;
    }

    if (!formData.downloadUrl || !formData.decryptionKey) {
      alert("Please upload a ZIP research archive before publishing.");
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
        fileName: formData.fileName || (selectedFile ? selectedFile.name : "archive.zip"),
      });

      alert(`✓ Research ZIP successfully published on Stellar Testnet & IPFS!\nTx Hash: ${res.hash}`);
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
          <div>
            <h2 className="text-xl font-bold text-white">Publish Scientific Paper (ZIP Only)</h2>
            <p className="text-xs text-gray-400">Password-protected ZIP archive stored on live IPFS</p>
          </div>
          <button onClick={onClose} disabled={isSubmitting} className="text-gray-400 hover:text-white">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase text-gray-400 mb-1">Author Stellar Address (Locked)</label>
            <input
              type="text"
              readOnly
              value={walletAddress || ""}
              className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2.5 text-sm font-mono text-emerald-400 cursor-not-allowed select-none"
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
              placeholder="Summary of research methodology and contributions..."
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

          {/* ZIP Upload Box (Strictly ZIP only) */}
          <div className="bg-gray-950 border border-indigo-900/60 p-4 rounded-xl space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-indigo-400">Research Archive (Strictly .ZIP Only)</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                The archive is encrypted with password protection before uploading to IPFS.
              </p>
            </div>

            <div className="border-2 border-dashed border-gray-700 hover:border-indigo-500 rounded-lg p-4 text-center cursor-pointer transition-colors bg-gray-900/50">
              <input
                type="file"
                id="paper-file-upload"
                accept=".zip,application/zip,application/x-zip-compressed"
                onChange={handleFileChange}
                disabled={isProcessingFile || isSubmitting}
                className="hidden"
              />
              <label htmlFor="paper-file-upload" className="cursor-pointer block">
                <span className="text-indigo-400 text-sm font-medium hover:underline block">
                  {selectedFile ? `Selected: ${selectedFile.name}` : "Click to select ZIP Archive (.zip)"}
                </span>
                <span className="text-xs text-gray-500 block mt-1">
                  Automatic password protection and IPFS distribution
                </span>
              </label>
            </div>

            {fileStatus && (
              <div className="text-xs font-mono text-emerald-400 bg-emerald-950/30 p-2 rounded border border-emerald-900/40">
                {fileStatus}
              </div>
            )}

            {/* Read-Only System Metadata */}
            <div className="space-y-3 pt-2 border-t border-gray-800/80">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-gray-400 mb-1 flex items-center justify-between">
                  <span>IPFS Storage Link</span>
                  <span className="text-[10px] text-gray-500 font-mono">System-assigned</span>
                </label>
                <input
                  type="text"
                  readOnly
                  tabIndex="-1"
                  placeholder="Auto-generated upon ZIP upload"
                  value={formData.downloadUrl}
                  className="w-full bg-gray-900/90 border border-gray-800 rounded-lg p-2 text-xs text-indigo-300 font-mono cursor-not-allowed select-all"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-gray-400 mb-1 flex items-center justify-between">
                  <span>Archive Integrity Hash (SHA-256)</span>
                  <span className="text-[10px] text-gray-500 font-mono">System-assigned</span>
                </label>
                <input
                  type="text"
                  readOnly
                  tabIndex="-1"
                  placeholder="Calculated from original archive"
                  value={formData.sha256Hash}
                  className="w-full bg-gray-900/90 border border-gray-800 rounded-lg p-2 text-xs text-gray-300 font-mono cursor-not-allowed select-all"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-gray-400 mb-1 flex items-center justify-between">
                  <span>ZIP Password (No Prefix)</span>
                  <span className="text-[10px] text-gray-500 font-mono">System-assigned</span>
                </label>
                <input
                  type="text"
                  readOnly
                  tabIndex="-1"
                  value={formData.decryptionKey}
                  className="w-full bg-gray-900/90 border border-gray-800 rounded-lg p-2 text-xs text-emerald-400 font-mono cursor-not-allowed select-all"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-800">
            <button
              type="button"
              disabled={isSubmitting || isProcessingFile}
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isProcessingFile}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? "Publishing On-Chain..." : "Sign & Publish to Testnet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

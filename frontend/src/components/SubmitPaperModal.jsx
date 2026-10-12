import React, { useState } from "react";
import { useWallet } from "../context/WalletContext";
import { uploadEncryptedPaperToPinata } from "../services/pinata";
import { publishPaperOnChain } from "../services/contract";

export default function SubmitPaperModal({ isOpen, onClose, onPaperCreated }) {
  const { walletAddress, isConnected, connect } = useWallet();

  const [title, setTitle] = useState("");
  const [authors, setAuthors] = useState("");
  const [abstract, setAbstract] = useState("");
  const [category, setCategory] = useState("Computer Science & AI");
  const [minDonation, setMinDonation] = useState("5");
  const [file, setFile] = useState(null);
  const [encryptionPassword, setEncryptionPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isConnected || !walletAddress) {
      alert("Please connect your Freighter wallet first.");
      connect();
      return;
    }
    if (!file) {
      alert("Please select a research file (.zip or document) to upload.");
      return;
    }
    if (!encryptionPassword) {
      alert("Please specify an encryption password for the file.");
      return;
    }

    setIsSubmitting(true);
    setStatusMessage("Encrypting file locally in dApp & uploading to Pinata...");

    try {
      const uploadResult = await uploadEncryptedPaperToPinata(file, encryptionPassword, title);
      setStatusMessage("File uploaded to Pinata! Registering paper on Soroban Testnet...");

      await publishPaperOnChain({
        authorAddress: walletAddress,
        title,
        authors,
        abstract,
        category,
        minDonation,
        downloadUrl: uploadResult.downloadUrl,
        decryptionKey: encryptionPassword,
        sha256Hash: uploadResult.sha256Hash,
      });

      setStatusMessage("Success! Research paper successfully published.");
      setTimeout(() => {
        setIsSubmitting(false);
        setStatusMessage("");
        onPaperCreated();
        onClose();
      }, 1500);
    } catch (err) {
      console.error("Submission error:", err);
      alert("Error publishing paper: " + (err.message || err));
      setIsSubmitting(false);
      setStatusMessage("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="sci-folder-card max-w-xl w-full p-8 space-y-6 shadow-[0_0_50px_rgba(6,182,212,0.4)] rounded-3xl max-h-[90vh] overflow-y-auto font-mono text-cyan-300">
        <div className="flex items-center justify-between border-b border-cyan-500/40 pb-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse"></span>
            <h2 className="text-lg font-bold text-cyan-200 tracking-wide uppercase">&gt; Submit New Research Paper</h2>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-cyan-400 hover:text-cyan-200 text-sm px-3 py-1 border border-cyan-600 rounded-xl bg-slate-950"
          >
            [X]
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block uppercase text-cyan-400 mb-1 font-bold">Research Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-black border border-cyan-600 rounded-xl px-3 py-2 text-sm text-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              placeholder="e.g. Quantum Cryptography in Stellar L2"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block uppercase text-cyan-400 mb-1 font-bold">Authors</label>
              <input
                type="text"
                value={authors}
                onChange={(e) => setAuthors(e.target.value)}
                className="w-full bg-black border border-cyan-600 rounded-xl px-3 py-2 text-sm text-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                placeholder="Dr. J. Doe, A. Smith"
                required
              />
            </div>
            <div>
              <label className="block uppercase text-cyan-400 mb-1 font-bold">Category / Field</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-black border border-cyan-600 rounded-xl px-3 py-2 text-sm text-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              >
                <option value="Computer Science & AI">Computer Science & AI</option>
                <option value="Physics & Astronomy">Physics & Astronomy</option>
                <option value="Mathematics & Logic">Mathematics & Logic</option>
                <option value="Biology & Genetics">Biology & Genetics</option>
                <option value="Medicine & Healthcare">Medicine & Healthcare</option>
                <option value="Chemistry & Materials">Chemistry & Materials</option>
                <option value="Economics & Finance">Economics & Finance</option>
                <option value="Engineering & Robotics">Engineering & Robotics</option>
                <option value="Environmental & Climate Science">Environmental Science</option>
                <option value="Social Sciences & Humanities">Social Sciences</option>
                <option value="Interdisciplinary Research">Interdisciplinary</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block uppercase text-cyan-400 mb-1 font-bold">Abstract</label>
            <textarea
              rows="3"
              value={abstract}
              onChange={(e) => setAbstract(e.target.value)}
              className="w-full bg-black border border-cyan-600 rounded-xl p-3 text-xs text-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              placeholder="Brief summary of your research findings..."
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block uppercase text-cyan-400 mb-1 font-bold">Min Donation (XLM)</label>
              <input
                type="number"
                step="1"
                min="1"
                value={minDonation}
                onChange={(e) => setMinDonation(e.target.value)}
                className="w-full bg-black border border-cyan-600 rounded-xl px-3 py-2 text-sm text-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                required
              />
            </div>
            <div>
              <label className="block uppercase text-cyan-400 mb-1 font-bold">File Encryption Password</label>
              <input
                type="text"
                value={encryptionPassword}
                onChange={(e) => setEncryptionPassword(e.target.value)}
                className="w-full bg-black border border-cyan-600 rounded-xl px-3 py-2 text-sm text-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                placeholder="Secret key for reader decryption"
                required
              />
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-cyan-800 space-y-2">
            <label className="block uppercase text-cyan-400 font-bold">Research File (.zip or document)</label>
            <p className="text-[11px] text-cyan-500">
              * Note: The dApp automatically encrypts your file into an <code className="text-cyan-300">.zip.encrypted</code> package before uploading it to Pinata with your original filename.
            </p>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              className="w-full text-xs text-cyan-300 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-cyan-950 file:text-cyan-300 hover:file:bg-cyan-900"
              required
            />
          </div>

          {isSubmitting && (
            <div className="bg-cyan-950/60 p-3 rounded-xl border border-cyan-500 text-center text-cyan-300 animate-pulse">
              {statusMessage}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 uppercase rounded-xl bg-black hover:bg-slate-900 text-cyan-400 border border-cyan-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 uppercase font-bold rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-500/30 disabled:opacity-50"
            >
              {isSubmitting ? "Publishing..." : "Upload & Register Paper"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

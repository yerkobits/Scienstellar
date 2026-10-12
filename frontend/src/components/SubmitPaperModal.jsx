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
  const [minDonation, setMinDonation] = useState("5.0");
  const [file, setFile] = useState(null);
  const [encryptionPassword, setEncryptionPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) {
      setFile(null);
      return;
    }

    // 1. Validar extensión exclusivamente .zip
    const isZip = selected.name.toLowerCase().endsWith(".zip") || selected.type === "application/zip" || selected.type === "application/x-zip-compressed";
    if (!isZip) {
      alert("Invalid format: Only .zip compressed packages are permitted.");
      e.target.value = "";
      setFile(null);
      return;
    }

    // 2. Validar tamaño máximo (25 MB para el plan gratuito de Pinata)
    const MAX_SIZE_MB = 25;
    if (selected.size > MAX_SIZE_MB * 1024 * 1024) {
      alert(`File size exceeds the limit (${MAX_SIZE_MB} MB). Please compress your research data.`);
      e.target.value = "";
      setFile(null);
      return;
    }

    setFile(selected);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isConnected || !walletAddress) {
      alert("Please connect your Freighter wallet first.");
      connect();
      return;
    }
    if (!file) {
      alert("Please select a research .zip archive.");
      return;
    }
    if (!encryptionPassword) {
      alert("Please specify an encryption secret.");
      return;
    }

    // Validar formato decimal para la donación (máx 1 decimal)
    const parsedDonation = parseFloat(minDonation);
    if (isNaN(parsedDonation) || parsedDonation <= 0) {
      alert("Minimum donation must be greater than 0 XLM.");
      return;
    }

    setIsSubmitting(true);
    setStatusMessage("Encrypting archive in dApp & uploading to Pinata...");

    try {
      // Sube a Pinata conservando el nombre original del archivo
      const uploadResult = await uploadEncryptedPaperToPinata(file, encryptionPassword, title);
      setStatusMessage("Uploaded to Pinata! Broadcasting transaction to Soroban Testnet...");

      await publishPaperOnChain({
        authorAddress: walletAddress,
        authorName: authors,
        title,
        abstractText: abstract,
        category,
        minDonation: parsedDonation.toFixed(1),
        downloadUrl: uploadResult.downloadUrl,
        decryptionKey: encryptionPassword,
        sha256Hash: uploadResult.sha256Hash,
      });

      setStatusMessage("Success! Research paper published on Stellar Testnet.");
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
            <h2 className="text-lg font-bold text-cyan-200 tracking-wide uppercase">&gt; Register Research Paper</h2>
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
            <div className="flex justify-between items-center mb-1">
              <label className="uppercase text-cyan-400 font-bold">Research Title</label>
              <span className="text-[10px] text-cyan-600">{title.length} / 180</span>
            </div>
            <input
              type="text"
              maxLength={180}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-black border border-cyan-600 rounded-xl px-3 py-2 text-sm text-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              placeholder="e.g. Quantum Cryptography in Stellar L2"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="uppercase text-cyan-400 font-bold">Authors</label>
                <span className="text-[10px] text-cyan-600">{authors.length} / 120</span>
              </div>
              <input
                type="text"
                maxLength={120}
                value={authors}
                onChange={(e) => setAuthors(e.target.value)}
                className="w-full bg-black border border-cyan-600 rounded-xl px-3 py-2 text-sm text-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                placeholder="Dr. J. Doe, A. Smith"
                required
              />
            </div>
            <div>
              <label className="block uppercase text-cyan-400 mb-1 font-bold">Category</label>
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
            <div className="flex justify-between items-center mb-1">
              <label className="uppercase text-cyan-400 font-bold">Abstract</label>
              <span className="text-[10px] text-cyan-600">{abstract.length} / 1200</span>
            </div>
            <textarea
              rows="4"
              maxLength={1200}
              value={abstract}
              onChange={(e) => setAbstract(e.target.value)}
              className="w-full bg-black border border-cyan-600 rounded-xl p-3 text-xs text-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              placeholder="Summary of research methodology and outcomes (max 1200 characters)..."
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block uppercase text-cyan-400 mb-1 font-bold">
                Min Donation (XLM) <span className="text-[10px] text-cyan-500 font-normal">[1 decimal]</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={minDonation}
                onChange={(e) => setMinDonation(e.target.value)}
                className="w-full bg-black border border-cyan-600 rounded-xl px-3 py-2 text-sm text-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                required
              />
            </div>
            <div>
              <label className="block uppercase text-cyan-400 mb-1 font-bold">Encryption Secret</label>
              <input
                type="text"
                maxLength={64}
                value={encryptionPassword}
                onChange={(e) => setEncryptionPassword(e.target.value)}
                className="w-full bg-black border border-cyan-600 rounded-xl px-3 py-2 text-sm text-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                placeholder="Secret key for decryption"
                required
              />
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-cyan-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="uppercase text-cyan-400 font-bold">Research Archive (.zip only)</label>
              <span className="text-[10px] text-emerald-400 font-mono">Max: 25 MB</span>
            </div>
            <p className="text-[11px] text-cyan-500">
              * The dApp encrypts your file preserving its original filename for Pinata Cloud storage.
            </p>
            <input
              type="file"
              accept=".zip,application/zip,application/x-zip-compressed"
              onChange={handleFileChange}
              className="w-full text-xs text-cyan-300 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-cyan-950 file:text-cyan-300 hover:file:bg-cyan-900 cursor-pointer"
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
              {isSubmitting ? "Processing..." : "Publish on Stellar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { useWallet } from "../context/WalletContext";
import { donateAndUnlock } from "../services/freighter";

export default function PaperCard({ paper }) {
  const { walletAddress, isConnected, connect } = useWallet();

  const [isProcessing, setIsProcessing] = useState(false);
  const [unlockedData, setUnlockedData] = useState(null);
  const [txHash, setTxHash] = useState("");
  const [donationAmount, setDonationAmount] = useState(paper.minDonation || "5");
  
  const [includeDevTip, setIncludeDevTip] = useState(false);
  const [devTipAmount, setDevTipAmount] = useState("10");

  const [showDonateModal, setShowDonateModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");

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
    if (window.freighter && typeof window.freighter.getNetwork === "function") {
      try {
        const net = await window.freighter.getNetwork();
        if (net && net !== "TESTNET" && !String(net).toLowerCase().includes("test")) {
          alert(`SAFETY WARNING: Your Freighter wallet is currently set to [${net}]. Scienstellar Testnet requires TESTNET.`);
          return;
        }
      } catch (e) {
        console.warn("Could not verify Freighter network explicitly:", e);
      }
    }

    const minReq = parseFloat(paper.minDonation || "5");
    const userDonation = parseFloat(donationAmount || "0");
    if (userDonation < minReq) {
      alert(`Minimum donation required is ${minReq} XLM.`);
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

      if (includeDevTip && parseFloat(devTipAmount) > 0) {
        const devAddress = "GAZJMG663Z7P6V5X5M3N2J4K6V6Q6D7R8S9T0U1V2W3X4Y5Z6A7B8C9D";
        try {
          await donateAndUnlock({
            donorAddress: walletAddress,
            authorAddress: devAddress,
            amountXlm: devTipAmount,
            paperId: `${paper.id}-devtip`,
          });
        } catch (tipErr) {
          console.warn("Dev tip transfer notice:", tipErr);
        }
      }

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

  const handleReportSubmit = (e) => {
    e.preventDefault();
    if (!reportReason.trim()) return;

    try {
      const existingReports = JSON.parse(localStorage.getItem("scien_admin_reports") || "[]");
      const newReport = {
        paperId: paper.id,
        title: paper.title,
        reason: reportReason.trim(),
        reporter: walletAddress || "Anonymous",
        timestamp: new Date().toISOString(),
      };
      existingReports.push(newReport);
      localStorage.setItem("scien_admin_reports", JSON.stringify(existingReports));
      alert("Report successfully filed to Admin Console.");
      setShowReportModal(false);
      setReportReason("");
    } catch (err) {
      alert("Error submitting report.");
    }
  };

  const formatAuthorAddr = (addr) => addr ? `${addr.slice(0, 4)}...${addr.slice(-4)}` : "";

  return (
    <>
      <div className="sci-folder-card relative p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 hover:scale-[1.01] group">
        <div className="absolute -top-4 left-6 bg-slate-900 border-t-2 border-x-2 border-cyan-500/80 px-4 py-1 text-[11px] font-mono text-cyan-300 rounded-t-xl flex items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)] animate-pulse"></span>
            <span>FOLDER // {paper.id?.slice(0, 6) || "0001"}</span>
          </div>
          <button
            onClick={() => setShowReportModal(true)}
            className="text-[9px] text-red-400 hover:text-red-300 uppercase tracking-widest font-bold underline"
          >
            [Report]
          </button>
        </div>

        <div className="mt-3 mb-4 bg-slate-950/95 border border-cyan-500/40 rounded-2xl p-4 shadow-[inset_0_0_15px_rgba(6,182,212,0.1)] group-hover:border-cyan-400 transition-all">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700/60">
              {paper.category || "SCIENCE"}
            </span>
            <span className="text-xs text-cyan-400 font-mono bg-cyan-950/60 px-2 py-0.5 rounded-md border border-cyan-800">
              MIN: <strong className="text-emerald-400 font-bold">{paper.minDonation} XLM</strong>
            </span>
          </div>

          <h3 className="text-base font-bold text-cyan-200 mb-2 font-mono group-hover:text-cyan-100 transition-colors leading-snug">
            {paper.title}
          </h3>
          
          <div className="text-xs text-cyan-500/80 mb-3 font-mono flex items-center justify-between border-b border-cyan-900/60 pb-2">
            <span>AUTHOR: <span className="text-cyan-300">{paper.authors}</span></span>
            <a
              href={`https://stellar.expert/explorer/testnet/account/${paper.authorAddress}`}
              target="_blank"
              rel="noreferrer"
              title={paper.authorAddress}
              className="text-cyan-400 hover:text-cyan-200 underline text-[10px]"
            >
              [{formatAuthorAddr(paper.authorAddress)}]
            </a>
          </div>

          <p className="text-xs text-cyan-300/70 mb-2 line-clamp-3 leading-relaxed font-mono">
            {paper.abstract}
          </p>
        </div>

        <div className="pt-2">
          {unlockedData ? (
            <div className="bg-slate-950 border border-cyan-400 rounded-2xl p-3 space-y-2 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-cyan-300 font-mono">✓ ACCESS GRANTED</span>
                {txHash && (
                  <a
                    href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-cyan-400 underline hover:text-cyan-300 font-mono"
                  >
                    [TX_HASH]
                  </a>
                )}
              </div>

              <div>
                <span className="text-[10px] text-cyan-500 block mb-0.5 font-mono">DECRYPTION SECRET:</span>
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    readOnly
                    value={unlockedData.decryptionKey}
                    className="w-full bg-black border border-cyan-700 rounded-lg px-2 py-1 text-[11px] font-mono text-cyan-300"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(unlockedData.decryptionKey);
                      alert("Decryption key copied!");
                    }}
                    className="px-2 py-1 text-[10px] uppercase font-bold bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-600 rounded-lg"
                  >
                    Copy
                  </button>
                </div>
              </div>

              {unlockedData.sha256Hash && (
                <div>
                  <span className="text-[10px] text-cyan-500 block mb-0.5 font-mono">SHA-256 HASH:</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      readOnly
                      value={unlockedData.sha256Hash}
                      className="w-full bg-black border border-cyan-700 rounded-lg px-2 py-1 text-[10px] font-mono text-cyan-400"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(unlockedData.sha256Hash);
                        alert("Checksum copied!");
                      }}
                      className="px-2 py-1 text-[10px] uppercase font-bold bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-600 rounded-lg"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}

              <a
                href={unlockedData.downloadUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 block w-full text-center px-3 py-2 text-xs font-bold bg-cyan-400 hover:bg-cyan-300 text-slate-950 shadow-md transition-all uppercase tracking-wider font-mono rounded-xl"
              >
                &gt;&gt; DOWNLOAD ENCRYPTED ZIP
              </a>
            </div>
          ) : (
            <button
              onClick={handleDownloadClick}
              className="w-full py-3 px-4 bg-slate-950 hover:bg-cyan-950 text-cyan-300 text-xs font-bold uppercase tracking-wider transition-all border border-cyan-500/80 rounded-2xl flex items-center justify-center gap-2 shadow-[0_0_10px_rgba(6,182,212,0.1)] hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]"
            >
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              <span>DONATE & UNLOCK</span>
              <span className="text-[11px] text-emerald-400 font-mono">({paper.minDonation} XLM)</span>
            </button>
          )}
        </div>
      </div>

      {showDonateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <div className="sci-folder-card max-w-lg w-full p-6 space-y-4 shadow-[0_0_40px_rgba(6,182,212,0.4)] rounded-3xl font-mono">
            <div className="flex items-center justify-between border-b border-cyan-500/40 pb-3">
              <h3 className="text-base font-bold text-cyan-300 uppercase tracking-wide">&gt; UNLOCK RESEARCH DOCUMENT</h3>
              <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 border border-emerald-700">TESTNET VERIFIED</span>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-cyan-500/40 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-cyan-400">
                <span>{paper.category}</span>
                <span>MIN: {paper.minDonation} XLM</span>
              </div>
              <h4 className="text-sm font-bold text-cyan-200">{paper.title}</h4>
              <p className="text-xs text-cyan-300/80 line-clamp-3">{paper.abstract}</p>
              <div className="pt-2 border-t border-cyan-900/80 text-[11px] text-cyan-500 truncate">
                AUTHOR: {paper.authors} ({paper.authorAddress})
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase text-cyan-400 mb-1 font-bold">
                Donation Amount (Min: {paper.minDonation} XLM)
              </label>
              <input
                type="number"
                step="1"
                min={paper.minDonation}
                value={donationAmount}
                onChange={(e) => setDonationAmount(e.target.value)}
                className="w-full bg-black border border-cyan-500 rounded-xl px-3 py-2 text-sm text-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
            </div>

            <div className="bg-slate-950/80 p-3 rounded-2xl border border-cyan-900 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeDevTip}
                  onChange={(e) => setIncludeDevTip(e.target.checked)}
                  className="rounded bg-black border-cyan-500 text-cyan-400 focus:ring-cyan-400"
                />
                <span className="text-xs text-cyan-300">Include voluntary tip for Scienstellar Developer</span>
              </label>
              {includeDevTip && (
                <div className="pt-1">
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={devTipAmount}
                    onChange={(e) => setDevTipAmount(e.target.value)}
                    className="w-full bg-black border border-cyan-600 rounded-xl px-3 py-1.5 text-xs text-cyan-300"
                    placeholder="XLM amount for dev tip"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowDonateModal(false)}
                disabled={isProcessing}
                className="px-4 py-2 text-xs font-bold uppercase rounded-xl bg-black hover:bg-slate-900 text-cyan-400 border border-cyan-700"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDonation}
                disabled={isProcessing}
                className="px-4 py-2 text-xs font-bold uppercase rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-500/30 disabled:opacity-50"
              >
                {isProcessing ? "Processing Tx..." : `Confirm & Donate ${parseFloat(donationAmount) + (includeDevTip ? parseFloat(devTipAmount || 0) : 0)} XLM`}
              </button>
            </div>
          </div>
        </div>
      )}

      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <div className="sci-folder-card max-w-md w-full p-6 space-y-4 rounded-3xl font-mono">
            <h3 className="text-base font-bold text-red-400 uppercase tracking-wide">&gt; REPORT CORRUPTED OR MALICIOUS PAPER</h3>
            <p className="text-xs text-cyan-300/80">
              Submit a report to the admin console for paper ID: <span className="text-cyan-200">{paper.id}</span> ({paper.title}).
            </p>

            <form onSubmit={handleReportSubmit} className="space-y-3">
              <textarea
                rows="4"
                placeholder="Describe why this paper is corrupted, fraudulent, or malicious..."
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full bg-black border border-red-500/60 rounded-xl p-3 text-xs text-cyan-300 focus:outline-none focus:ring-2 focus:ring-red-400"
                required
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 text-xs bg-black text-cyan-400 border border-cyan-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-500 text-white rounded-xl uppercase shadow-lg shadow-red-600/30"
                >
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

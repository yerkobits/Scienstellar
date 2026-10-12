import React, { useState } from "react";

export default function HowItWorksModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="sci-folder-card max-w-2xl w-full p-8 space-y-6 shadow-[0_0_50px_rgba(6,182,212,0.4)] rounded-3xl max-h-[90vh] overflow-y-auto font-mono text-cyan-300">
        <div className="flex items-center justify-between border-b border-cyan-500/40 pb-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse"></span>
            <h2 className="text-lg font-bold text-cyan-200 tracking-wide uppercase">&gt; System Documentation // Scienstellar</h2>
          </div>
          <button
            onClick={onClose}
            className="text-cyan-400 hover:text-cyan-200 text-sm px-3 py-1 border border-cyan-600 rounded-xl bg-slate-950"
          >
            [X] CLOSE
          </button>
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-cyan-300/90 leading-relaxed">
          <p>
            <strong className="text-cyan-200">Scienstellar</strong> is the decentralized Web3 scientific catalog designed to replace legacy academic publishing models with a transparent, censorship-resistant, and creator-first ecosystem.
          </p>

          <div className="bg-slate-950 p-4 rounded-2xl border border-cyan-800/80 space-y-2">
            <h3 className="font-bold text-cyan-200 uppercase">&gt; 1. Storage Layer & Decentralized Nodes</h3>
            <p className="text-xs text-cyan-300/80">
              Files are stored as encrypted and obfuscated ZIP packages across a distributed node network. Node operators receive micro-donations in real-time based on actual uptime and proof-of-availability when readers unlock research.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-cyan-800/80 space-y-2">
            <h3 className="font-bold text-cyan-200 uppercase">&gt; 2. Web3 DOI & Intellectual Property</h3>
            <p className="text-xs text-cyan-300/80">
              Every paper registered on-chain via Stellar & Soroban smart contracts receives a cryptographic identifier leveraging blockchain traceability, immutability, and precise timestamping for first-to-publish priority.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-cyan-800/80 space-y-2">
            <h3 className="font-bold text-cyan-200 uppercase">&gt; 3. Instructions for Use (Testnet)</h3>
            <ul className="list-disc list-inside text-xs text-cyan-300/80 space-y-1">
              <li>Connect your <strong className="text-emerald-400">Freighter Wallet</strong> set to <strong>Testnet</strong>.</li>
              <li>Ensure you have Testnet XLM for paper submission or donation/unlocking.</li>
              <li>Click <strong>Donate & Unlock</strong> on any research folder to route funds directly to the author and instantly retrieve your decryption key and SHA-256 integrity hash.</li>
            </ul>
          </div>
        </div>

        <div className="pt-4 border-t border-cyan-500/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-xs font-bold uppercase rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-500/30 font-mono"
          >
            Acknowledge & Return
          </button>
        </div>
      </div>
    </div>
  );
}

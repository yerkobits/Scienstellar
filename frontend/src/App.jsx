import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import PaperCard from "./components/PaperCard";
import SubmitPaperModal from "./components/SubmitPaperModal";
import { WalletProvider } from "./context/WalletContext";
import { fetchOnChainPapers, CONTRACT_ID } from "./services/contract";

const FALLBACK_PAPERS = [
  {
    id: "demo-1",
    title: "Decentralized Storage Protocols for Peer-Reviewed Scientific Data",
    authors: "Dr. A. Vance, M. Sterling",
    abstract: "An analysis of BitTorrent, IPFS, and Stellar smart contracts to ensure immutability and perpetual availability of scientific papers.",
    category: "Computer Science & AI",
    sha256Hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    authorAddress: "GAZJMG663Z7P6V5X5M3N2J4K6V6Q6D7R8S9T0U1V2W3X4Y5Z6A7B8C9D",
    minDonation: "5",
    downloadUrl: "https://ipfs.io/ipfs/QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
    decryptionKey: "scien-aes256-vance-2026",
    isOnChain: false,
  },
];

function ScienstellarApp() {
  const [papers, setPapers] = useState(FALLBACK_PAPERS);
  const [isLoadingOnChain, setIsLoadingOnChain] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);

  const loadOnChainData = async () => {
    setIsLoadingOnChain(true);
    try {
      const onChainList = await fetchOnChainPapers();
      if (onChainList && onChainList.length > 0) {
        setPapers(onChainList);
      } else {
        setPapers(FALLBACK_PAPERS);
      }
    } catch (err) {
      console.error("Error loading on-chain papers:", err);
    } finally {
      setIsLoadingOnChain(false);
    }
  };

  useEffect(() => {
    loadOnChainData();
  }, []);

  const filteredPapers = papers.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.authors.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "All" || p.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col font-sans">
      <Navbar onOpenPublishModal={() => setIsPublishModalOpen(true)} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <section className="text-center py-8 mb-6">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
            Decentralized Scientific Catalog
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-base sm:text-lg">
            Verifiable research registry powered by Stellar & Soroban. Explore open publications, support authors directly, and access encrypted research.
          </p>

          <div className="mt-8 max-w-2xl mx-auto flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Search by title, author, or research field..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All">All Categories</option>
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
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">Registered Publications</h2>
              {isLoadingOnChain && (
                <span className="text-xs text-indigo-400 animate-pulse flex items-center gap-1">
                  ● Syncing with Soroban Testnet...
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 font-mono">{filteredPapers.length} papers listed</span>
              <button
                onClick={loadOnChainData}
                disabled={isLoadingOnChain}
                className="text-xs text-indigo-400 hover:text-indigo-300 underline disabled:opacity-50"
              >
                Sync Blockchain
              </button>
            </div>
          </div>

          {filteredPapers.length === 0 ? (
            <div className="text-center py-16 bg-gray-900/50 rounded-xl border border-gray-800">
              <p className="text-gray-400 text-sm">No research papers found matching your criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPapers.map((paper) => (
                <PaperCard key={paper.id} paper={paper} />
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="border-t border-gray-800 py-6 text-center text-xs text-gray-500 space-y-1">
        <div>Scienstellar dApp · Running on Stellar Testnet · Open Science Initiative</div>
        <div className="font-mono text-gray-600">Contract: {CONTRACT_ID}</div>
      </footer>

      <SubmitPaperModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        onPaperCreated={loadOnChainData}
      />
    </div>
  );
}

export default function App() {
  return (
    <WalletProvider>
      <ScienstellarApp />
    </WalletProvider>
  );
}

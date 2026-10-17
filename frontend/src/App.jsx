import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import PaperCard from "./components/PaperCard";
import SubmitPaperModal from "./components/SubmitPaperModal";
import HowItWorksModal from "./components/HowItWorksModal";
import AdminView from "./components/AdminView";
import { WalletProvider } from "./context/WalletContext";
import { fetchOnChainPapers, CONTRACT_ID } from "./services/contract";

function ScienstellarApp() {
  const [papers, setPapers] = useState([]);
  const [isLoadingOnChain, setIsLoadingOnChain] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const [isAdminRoute, setIsAdminRoute] = useState(false);

  const [blacklist, setBlacklist] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("scien_admin_blacklist") || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const handleRouteCheck = () => {
      const path = window.location.pathname;
      setIsAdminRoute(path.includes("/admin"));
    };
    handleRouteCheck();
    window.addEventListener("popstate", handleRouteCheck);
    return () => window.removeEventListener("popstate", handleRouteCheck);
  }, []);

  const loadOnChainData = async () => {
    setIsLoadingOnChain(true);
    try {
      const onChainList = await fetchOnChainPapers();
      setPapers((onChainList || []).slice().reverse());
    } catch (err) {
      console.error("Error loading on-chain papers:", err);
      setPapers([]);
    } finally {
      setIsLoadingOnChain(false);
    }
  };

  useEffect(() => {
    loadOnChainData();
  }, [blacklist]);

  const filteredPapers = papers.filter((p) => {
    if (blacklist.includes(p.id)) return false;
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.authors.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.sdoi && p.sdoi.toLowerCase().includes(searchQuery.toLowerCase())) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "All" || p.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  if (isAdminRoute) {
    return (
      <div className="min-h-screen bg-black text-cyan-300 font-mono scanline">
        <AdminView
          papers={papers}
          onUpdateBlacklist={(updated) => setBlacklist(updated)}
          onClearReports={() => {}}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-emerald-400 flex flex-col font-mono relative scanline">
      <Navbar onOpenPublishModal={() => setIsPublishModalOpen(true)} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <section className="text-center py-8 mb-6 border-b-2 border-emerald-500/40 pb-10">
          <div className="inline-block mb-3 px-3 py-1 bg-emerald-950 border border-emerald-500 text-xs text-emerald-300 font-bold uppercase tracking-widest shadow-[0_0_10px_rgba(34,197,94,0.3)]">
            [ Decentralized Scientific Knowledge Catalog ]
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-emerald-400 tracking-wider mb-4 drop-shadow-[0_0_15px_rgba(34,197,94,0.6)]">
            Scienstellar
          </h1>
          <p className="text-emerald-300/80 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed font-mono">
            Verifiable research registry powered by Stellar & Soroban. Featuring a dedicated decentralized storage layer for encrypted research ZIP packages, verifiable Web3 DOIs, and direct creator monetization.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs">
            <button
              onClick={() => setIsHowItWorksOpen(true)}
              className="text-emerald-400 hover:text-emerald-300 underline font-bold bg-emerald-950/60 px-3 py-1 border border-emerald-600 rounded-lg cursor-pointer"
            >
              &gt;&gt; How It Works
            </button>
          </div>

          <div className="mt-8 max-w-2xl mx-auto flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Search by title, author, S-DOI, or field..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-black border-2 border-emerald-600 rounded-xl px-4 py-3 text-sm text-emerald-300 placeholder-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 shadow-inner"
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-black border-2 border-emerald-600 rounded-xl px-4 py-3 text-sm text-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-400"
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
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-emerald-400 uppercase tracking-wide">&gt; Registered Publications</h2>
              {isLoadingOnChain && (
                <span className="text-xs text-emerald-500 animate-pulse flex items-center gap-1 font-mono">
                  ● Syncing with Soroban Testnet...
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-emerald-500 font-mono">{filteredPapers.length} papers indexed</span>
              <button
                onClick={loadOnChainData}
                disabled={isLoadingOnChain}
                className="text-xs text-emerald-400 hover:text-indigo-300 underline disabled:opacity-50 font-mono cursor-pointer"
              >
                [Sync Blockchain]
              </button>
            </div>
          </div>

          {filteredPapers.length === 0 ? (
            <div className="text-center py-16 bg-black/60 rounded-3xl border-2 border-emerald-800/80">
              <p className="text-emerald-600 text-sm font-mono">No research papers found on Stellar Testnet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-4">
              {filteredPapers.map((paper) => (
                <PaperCard key={paper.id} paper={paper} />
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="border-t-2 border-emerald-500/60 py-6 text-center text-xs text-emerald-600 space-y-2 mt-16 bg-black font-mono">
        <div>Scienstellar dApp · Running on Stellar Testnet · Decentralized Scientific Catalog</div>
        <div>
          Contract:{" "}
          <a
            href={`https://stellar.expert/explorer/testnet/contract/${CONTRACT_ID}`}
            target="_blank"
            rel="noreferrer"
            className="text-emerald-400 underline hover:text-emerald-300"
          >
            {CONTRACT_ID}
          </a>
        </div>
        <div className="pt-1 flex items-center justify-center gap-4 text-[11px]">
          <button onClick={() => setIsHowItWorksOpen(true)} className="text-emerald-400 hover:text-emerald-200 underline cursor-pointer">How It Works</button>
          <a href="https://github.com/yerkobits/Scienstellar" target="_blank" rel="noreferrer" className="text-cyan-500 hover:text-cyan-300 underline">Sourcecode</a>
          <a href="https://demo.stellarpassport.xyz/builder/yerkobits" target="_blank" rel="noreferrer" className="text-cyan-500 hover:text-cyan-300 underline">Dev Passport</a>
          <a href="/admin" onClick={(e) => { e.preventDefault(); window.history.pushState({}, "", "/admin"); window.dispatchEvent(new PopStateEvent('popstate')); }} className="text-amber-400 hover:text-amber-300 underline font-bold cursor-pointer">[Admin Panel]</a>
        </div>
      </footer>

      <SubmitPaperModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        onPaperCreated={loadOnChainData}
      />

      <HowItWorksModal
        isOpen={isHowItWorksOpen}
        onClose={() => setIsHowItWorksOpen(false)}
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

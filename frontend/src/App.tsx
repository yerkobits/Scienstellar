import React, { useState } from 'react';
import { Paper } from './types';
import { MOCK_PAPERS, connectWallet } from './stellar';
import { BookOpen, Download, Heart, PlusCircle, Search, ShieldCheck, Copy, Check } from 'lucide-react';

export default function App() {
  const [papers, setPapers] = useState<Paper[]>(MOCK_PAPERS);
  const [wallet, setWallet] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState("");
  const [newAuthor, setNewAuthor] = useState("");
  const [newCategory, setNewCategory] = useState("Blockchain");
  const [newAbstract, setNewAbstract] = useState("");
  const [newMagnet, setNewMagnet] = useState("");
  const [newHash, setNewHash] = useState("");

  const handleConnect = async () => {
    const addr = await connectWallet();
    if (addr) setWallet(addr);
  };

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    const newPaper: Paper = {
      id: papers.length + 1,
      authorAddress: wallet || "G_STELLAR_PUBKEY_ANONYMOUS",
      authorName: newAuthor,
      title: newTitle,
      abstractText: newAbstract,
      category: newCategory,
      totalDonations: "0.00",
      versions: [
        {
          version: 1,
          timestamp: Math.floor(Date.now() / 1000),
          magnetLink: newMagnet,
          contentHash: newHash,
          changelog: "Publicación registrada en red Stellar",
        }
      ]
    };

    setPapers([newPaper, ...papers]);
    setShowPublishModal(false);
    setNewTitle("");
    setNewAuthor("");
    setNewAbstract("");
    setNewMagnet("");
    setNewHash("");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const filtered = papers.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase()) ||
    p.authorName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="text-cyan-400 w-7 h-7" />
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
              Scienstellar
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowPublishModal(true)}
              className="flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-500 text-white px-3.5 py-1.5 rounded-lg text-sm font-medium transition"
            >
              <PlusCircle className="w-4 h-4" /> Publicar Paper
            </button>
            <button
              onClick={handleConnect}
              className="border border-slate-700 hover:border-slate-500 px-3.5 py-1.5 rounded-lg text-sm font-medium text-slate-300 transition"
            >
              {wallet ? `${wallet.slice(0, 5)}...${wallet.slice(-4)}` : "Conectar Wallet"}
            </button>
          </div>
        </div>
      </header>

      <section className="max-w-4xl mx-auto text-center px-4 py-12">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          Catálogo Científico P2P en Stellar
        </h1>
        <p className="mt-4 text-slate-400 text-base sm:text-lg">
          Registro inmutable en Soroban y distribución libre de papers científicos vía BitTorrent.
        </p>
        <div className="mt-6 max-w-lg mx-auto relative">
          <Search className="w-5 h-5 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por título, autor o categoría..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl focus:outline-none focus:border-cyan-500 text-sm"
          />
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 pb-20 flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        {filtered.map(paper => {
          const latestVersion = paper.versions[paper.versions.length - 1];
          return (
            <div key={paper.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between hover:border-slate-700 transition">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span className="bg-cyan-950 text-cyan-400 px-2.5 py-0.5 rounded-full font-medium">
                    {paper.category}
                  </span>
                  <span>Versión v{latestVersion.version}</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">{paper.title}</h3>
                <p className="text-xs text-slate-400 mb-4 font-mono">Por {paper.authorName} ({paper.authorAddress.slice(0, 6)}...)</p>
                <p className="text-slate-300 text-sm line-clamp-3 mb-6">{paper.abstractText}</p>
              </div>

              <div className="border-t border-slate-800/80 pt-4 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 text-pink-400 font-semibold">
                  <Heart className="w-4 h-4 fill-pink-400/20" /> {paper.totalDonations} XLM
                </div>
                <div className="flex gap-2">
                  <a
                    href={latestVersion.magnetLink}
                    className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg transition"
                  >
                    <Download className="w-3.5 h-3.5" /> Magnet
                  </a>
                  <button
                    onClick={() => setSelectedPaper(paper)}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1.5 rounded-lg transition"
                  >
                    Detalles
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </main>

      {selectedPaper && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-2">{selectedPaper.title}</h2>
            <p className="text-xs text-cyan-400 font-mono mb-4">Autor: {selectedPaper.authorName} | {selectedPaper.authorAddress}</p>
            <p className="text-sm text-slate-300 mb-6">{selectedPaper.abstractText}</p>

            <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Registro de Versiones e Integridad
            </h3>
            <div className="space-y-3 mb-6">
              {selectedPaper.versions.map((ver) => (
                <div key={ver.version} className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs">
                  <div className="flex justify-between font-semibold mb-1">
                    <span>Versión {ver.version} ({new Date(ver.timestamp * 1000).toLocaleDateString()})</span>
                    <a href={ver.magnetLink} className="text-cyan-400 hover:underline flex items-center gap-1">
                      <Download className="w-3 h-3" /> Descargar Magnet
                    </a>
                  </div>
                  <p className="text-slate-400 mb-1">{ver.changelog}</p>
                  <div className="flex items-center gap-2 text-slate-500 font-mono">
                    <span className="truncate">SHA-256: {ver.contentHash}</span>
                    <button onClick={() => copyToClipboard(ver.contentHash)} className="hover:text-slate-300">
                      {copiedHash === ver.contentHash ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setSelectedPaper(null)} className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg text-sm">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {showPublishModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <form onSubmit={handlePublish} className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4">
            <h2 className="text-xl font-bold">Publicar Artículo</h2>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Título</label>
              <input required value={newTitle} onChange={e => setNewTitle(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Nombre Autor</label>
                <input required value={newAuthor} onChange={e => setNewAuthor(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Categoría</label>
                <select value={newCategory} onChange={e => setNewCategory(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm">
                  <option>Blockchain</option>
                  <option>Distributed Systems</option>
                  <option>Cryptography</option>
                  <option>Artificial Intelligence</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Resumen (Abstract)</label>
              <textarea required rows={3} value={newAbstract} onChange={e => setNewAbstract(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Enlace Magnet BitTorrent</label>
              <input required placeholder="magnet:?xt=urn:btih:..." value={newMagnet} onChange={e => setNewMagnet(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono text-xs" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Hash SHA-256</label>
              <input required placeholder="Hash de integridad..." value={newHash} onChange={e => setNewHash(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono text-xs" />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowPublishModal(false)} className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg text-sm">Cancelar</button>
              <button type="submit" className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg text-sm font-medium">Registrar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

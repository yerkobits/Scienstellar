import React, { useState } from "react";

export default function AdminView({ papers, onUpdateBlacklist, onClearReports }) {
  const [currentBlacklist, setCurrentBlacklist] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("scien_admin_blacklist") || "[]");
    } catch {
      return [];
    }
  });

  const [reports, setReports] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("scien_admin_reports") || "[]");
    } catch {
      return [];
    }
  });

  const [searchQuery, setSearchQuery] = useState("");

  const handleToggleActive = (id) => {
    let updated;
    if (currentBlacklist.includes(id)) {
      updated = currentBlacklist.filter((item) => item !== id);
    } else {
      updated = [...currentBlacklist, id];
    }
    setCurrentBlacklist(updated);
    localStorage.setItem("scien_admin_blacklist", JSON.stringify(updated));
    if (onUpdateBlacklist) onUpdateBlacklist(updated);
  };

  const handleClearReportsList = () => {
    setReports([]);
    localStorage.removeItem("scien_admin_reports");
    if (onClearReports) onClearReports();
  };

  const filteredPapers = papers.filter((p) => {
    const q = searchQuery.toLowerCase();
    const sdoiStr = (p.sdoi || "").toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      p.authors.toLowerCase().includes(q) ||
      sdoiStr.includes(q) ||
      (p.category && p.category.toLowerCase().includes(q))
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-mono text-cyan-300">
      <div className="border-b-2 border-cyan-500/50 pb-6 mb-8 flex items-center justify-between">
        <div>
          <span className="text-xs uppercase px-2.5 py-1 bg-cyan-950 text-cyan-300 border border-cyan-600">
            [ADMIN & DEV CONSOLE]
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-cyan-200 mt-2">
            Scienstellar Moderation Panel
          </h1>
        </div>
        <a
          href="/"
          onClick={(e) => { e.preventDefault(); window.history.pushState({}, "", "/"); window.dispatchEvent(new PopStateEvent('popstate')); }}
          className="px-4 py-2 text-xs font-bold bg-slate-950 hover:bg-cyan-950 text-cyan-300 border border-cyan-600 rounded-xl"
        >
          &lt;&lt; Return to Catalog
        </a>
      </div>

      <div className="sci-folder-card p-6 space-y-4 rounded-3xl mb-8">
        <div className="flex items-center justify-between border-b border-cyan-500/30 pb-2">
          <h2 className="text-base font-bold text-cyan-200 uppercase">
            &gt; User Reports ({reports.length})
          </h2>
          {reports.length > 0 && (
            <button
              onClick={handleClearReportsList}
              className="text-[10px] text-red-400 hover:text-red-300 underline"
            >
              Clear Reports
            </button>
          )}
        </div>
        <p className="text-xs text-cyan-300/70">
          Reports submitted by users regarding corrupted files, incorrect metadata, or malicious content.
        </p>

        <div className="space-y-3 max-h-60 overflow-y-auto">
          {reports.length === 0 ? (
            <p className="text-xs text-cyan-600">No reports filed.</p>
          ) : (
            reports.map((rep, idx) => (
              <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-cyan-900 text-xs space-y-1">
                <div className="flex justify-between text-cyan-400 font-bold">
                  <span>Target: {rep.paperId}</span>
                  <span className="text-[10px] text-cyan-600">{new Date(rep.timestamp).toLocaleString()}</span>
                </div>
                <p className="text-cyan-300/80">Reason: {rep.reason}</p>
                <p className="text-[10px] text-cyan-500 truncate">Reporter: {rep.reporter || "Anonymous"}</p>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="sci-folder-card p-6 rounded-3xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-cyan-500/30 pb-4">
          <h2 className="text-base font-bold text-cyan-200 uppercase">
            &gt; Currently Indexed Papers ({filteredPapers.length} / {papers.length})
          </h2>
          <div className="w-full sm:w-72">
            <input
              type="text"
              placeholder="Search by title, author, S-DOI..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black border border-cyan-600 rounded-xl px-3 py-2 text-xs text-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-cyan-900 text-cyan-500">
                <th className="py-2 px-3">S-DOI</th>
                <th className="py-2 px-3">Title</th>
                <th className="py-2 px-3">Author</th>
                <th className="py-2 px-3">Min XLM</th>
                <th className="py-2 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredPapers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-6 text-cyan-600">No papers found matching search query.</td>
                </tr>
              ) : (
                filteredPapers.map((p) => {
                  const isBlocked = currentBlacklist.includes(p.id);
                  const isVisible = !isBlocked;
                  const sdoiNumberOnly = (p.sdoi || "").replace(/^S-DOI\s*/i, "");

                  return (
                    <tr key={p.id} className="border-b border-cyan-950 hover:bg-slate-950/50">
                      <td className="py-2 px-3 font-mono text-cyan-400 font-bold whitespace-nowrap">
                        {sdoiNumberOnly}
                      </td>
                      <td className="py-2 px-3 text-cyan-200">{p.title}</td>
                      <td className="py-2 px-3 text-cyan-400">{p.authors}</td>
                      <td className="py-2 px-3 text-emerald-400">{p.minDonation} XLM</td>
                      <td className="py-2 px-3 text-center">
                        <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isVisible}
                            onChange={() => handleToggleActive(p.id)}
                            className="w-4 h-4 rounded bg-black border-cyan-500 text-emerald-500 focus:ring-emerald-400 cursor-pointer"
                          />
                          <span className={`text-[10px] font-bold uppercase ${isVisible ? "text-emerald-400" : "text-red-400 line-through"}`}>
                            {isVisible ? "Visible" : "Hidden"}
                          </span>
                        </label>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from "react";

export default function AdminView({ papers, onUpdateBlacklist, onClearReports }) {
  const [blacklist, setBlacklist] = useState(() => {
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

  const [newBlockedId, setNewBlockedId] = useState("");

  const handleAddBlacklist = (e) => {
    e.preventDefault();
    if (!newBlockedId.trim()) return;
    const updated = [...blacklist, newBlockedId.trim()];
    setBlacklist(updated);
    localStorage.setItem("scien_admin_blacklist", JSON.stringify(updated));
    if (onUpdateBlacklist) onUpdateBlacklist(updated);
    setNewBlockedId("");
  };

  const handleRemoveBlacklist = (id) => {
    const updated = blacklist.filter((item) => item !== id);
    setBlacklist(updated);
    localStorage.setItem("scien_admin_blacklist", JSON.stringify(updated));
    if (onUpdateBlacklist) onUpdateBlacklist(updated);
  };

  const handleClearReportsList = () => {
    setReports([]);
    localStorage.removeItem("scien_admin_reports");
    if (onClearReports) onClearReports();
  };

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="sci-folder-card p-6 space-y-4 rounded-3xl">
          <h2 className="text-base font-bold text-cyan-200 uppercase border-b border-cyan-500/30 pb-2">
            &gt; Blacklist & Malicious Paper IDs
          </h2>
          <p className="text-xs text-cyan-300/70">
            Add paper IDs or faulty test hashes here to hide them from the public catalog or force them to safe demo content.
          </p>

          <form onSubmit={handleAddBlacklist} className="flex gap-2">
            <input
              type="text"
              placeholder="Paper ID (e.g. demo-1 or hash...)"
              value={newBlockedId}
              onChange={(e) => setNewBlockedId(e.target.value)}
              className="flex-1 bg-black border border-cyan-600 rounded-xl px-3 py-2 text-xs text-cyan-300"
            />
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl uppercase"
            >
              Block ID
            </button>
          </form>

          <div className="space-y-2 mt-4 max-h-60 overflow-y-auto">
            {blacklist.length === 0 ? (
              <p className="text-xs text-cyan-600">No blocked papers in registry.</p>
            ) : (
              blacklist.map((id) => (
                <div key={id} className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-cyan-900 text-xs">
                  <span className="text-red-400 truncate max-w-[250px]">{id}</span>
                  <button
                    onClick={() => handleRemoveBlacklist(id)}
                    className="text-[10px] text-cyan-400 hover:text-cyan-200 underline"
                  >
                    Unblock
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="sci-folder-card p-6 space-y-4 rounded-3xl">
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
                    <span>Paper ID: {rep.paperId}</span>
                    <span className="text-[10px] text-cyan-600">{new Date(rep.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="text-cyan-300/80">Reason: {rep.reason}</p>
                  <p className="text-[10px] text-cyan-500 truncate">Reporter: {rep.reporter || "Anonymous"}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 sci-folder-card p-6 rounded-3xl space-y-4">
        <h2 className="text-base font-bold text-cyan-200 uppercase border-b border-cyan-500/30 pb-2">
          &gt; Currently Indexed Papers ({papers.length})
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-cyan-900 text-cyan-500">
                <th className="py-2 px-3">ID</th>
                <th className="py-2 px-3">Title</th>
                <th className="py-2 px-3">Author</th>
                <th className="py-2 px-3">Min XLM</th>
                <th className="py-2 px-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {papers.map((p) => (
                <tr key={p.id} className="border-b border-cyan-950 hover:bg-slate-950/50">
                  <td className="py-2 px-3 font-mono text-cyan-400">{p.id}</td>
                  <td className="py-2 px-3 text-cyan-200">{p.title}</td>
                  <td className="py-2 px-3 text-cyan-400">{p.authors}</td>
                  <td className="py-2 px-3 text-emerald-400">{p.minDonation} XLM</td>
                  <td className="py-2 px-3">
                    <button
                      onClick={() => {
                        setNewBlockedId(p.id);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="text-[10px] bg-red-950 text-red-300 border border-red-800 px-2 py-1 rounded"
                    >
                      Block/Hide
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

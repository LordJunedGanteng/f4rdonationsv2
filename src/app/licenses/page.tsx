"use client";
import { useEffect, useState, useCallback } from "react";
import { api, type License, PLATFORM_LABEL } from "@/lib/api";
import { useLicenseKey } from "@/lib/use-license";
import { useAuth } from "@/lib/auth";

const statusBadge: Record<string, string> = {
  active:    "bg-emerald-500/20 text-emerald-400",
  expired:   "bg-error-container/20 text-error",
  suspended: "bg-tertiary-container/30 text-tertiary",
};

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).catch(() => {});
}

export default function LicensesPage() {
  const { user } = useAuth();
  const { key: currentKey, save: saveKey } = useLicenseKey();
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [gameName, setGameName] = useState("");
  const [gameId, setGameId] = useState("");
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState<number | "new" | null>(null);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editGameId, setEditGameId] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.license.list(user?.user_id ?? 1);
      setLicenses(res.licenses ?? []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [user?.user_id]);

  useEffect(() => { if (user?.user_id) load(); }, [load, user?.user_id]);

  const create = async () => {
    if (!gameName.trim() || !gameId.trim() || !user?.user_id) return;
    setCreating(true);
    try {
      const res = await api.license.create({ user_id: user.user_id, game_id: gameId.trim(), game_name: gameName.trim() });
      setNewKey(res.license_key);
      setShowCreate(false);
      setGameName(""); setGameId("");
      await load();
    } catch { /* silent */ }
    finally { setCreating(false); }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      await api.license.update(id, { status });
      setLicenses((prev) => prev.map((l) => l.id === id ? { ...l, status: status as License["status"] } : l));
    } catch { /* silent */ }
  };

  const startEdit = (lic: License) => {
    setEditingId(lic.id);
    setEditName(lic.game_name ?? "");
    setEditGameId(lic.game_id);
  };

  const saveEdit = async (id: number) => {
    if (!editGameId.trim()) return;
    setSaving(true);
    try {
      await api.license.update(id, { game_id: editGameId.trim(), game_name: editName.trim() });
      setLicenses((prev) => prev.map((l) =>
        l.id === id ? { ...l, game_id: editGameId.trim(), game_name: editName.trim() || null } : l
      ));
      setEditingId(null);
    } catch { /* silent */ }
    finally { setSaving(false); }
  };

  const handleCopy = (text: string, id: number | "new") => {
    copyToClipboard(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  if (user?.role === "admin") {
    return <AdminVault />;
  }

  if (!user) return null;


  const filtered = licenses.filter((l) =>
    !search || l.game_name?.toLowerCase().includes(search.toLowerCase()) || l.license_key.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="px-4 pb-8 max-w-lg mx-auto">
      {/* Header */}
      <section className="mb-8 mt-4">
        <div className="flex items-end justify-between gap-4">
          <div className="space-y-1">
            <p className="font-headline uppercase tracking-widest text-[10px] font-bold text-on-primary-container">System Management</p>
            <h2 className="text-3xl font-bold font-headline">Manage Access</h2>
          </div>
          <button onClick={() => setShowCreate(true)}
            className="bg-gradient-to-br from-primary to-primary-container text-on-primary font-semibold px-5 py-2.5 rounded-xl flex items-center gap-2 active:scale-95 transition-all shadow-[0_8px_16px_rgba(30,60,114,0.3)]">
            <span className="material-symbols-outlined text-sm">add</span>Generate
          </button>
        </div>
      </section>

      {/* New key banner */}
      {newKey && (
        <div className="mb-6 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <span className="material-symbols-outlined text-sm filled">check_circle</span>New License Created
          </div>
          <code className="font-mono text-sm text-emerald-300 break-all">{newKey}</code>
          <div className="flex gap-2">
            <button onClick={() => handleCopy(newKey, "new")}
              className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">{copied === "new" ? "check" : "content_copy"}</span>
              {copied === "new" ? "Copied!" : "Copy"}
            </button>
            <button onClick={() => { saveKey(newKey); setNewKey(null); }}
              className="text-xs px-3 py-1.5 rounded-lg bg-primary/20 text-primary font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">vpn_key</span>Use this key
            </button>
            <button onClick={() => setNewKey(null)}
              className="text-xs px-3 py-1.5 rounded-lg bg-surface-container text-on-surface-variant font-semibold ml-auto">
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <section className="space-y-4 mb-6">
        <div className="relative group">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">search</span>
          <input
            className="w-full bg-surface-container-lowest rounded-xl py-3.5 pl-12 pr-4 text-on-surface placeholder:text-outline-variant focus:ring-1 focus:ring-primary/40 transition-all text-sm outline-none"
            placeholder="Search keys or games…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </section>

      {/* License cards */}
      <section className="space-y-4">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="glass-panel p-5 rounded-xl h-36 animate-pulse border border-outline-variant/10" />
            ))
          : filtered.length === 0
          ? <div className="text-center text-on-surface-variant text-sm py-12">
              {licenses.length === 0 ? "No licenses yet — click Generate to create one" : "No matches"}
            </div>
          : filtered.map((lic) => (
              <div key={lic.id} className={`glass-panel p-5 rounded-xl border border-outline-variant/10 shadow-lg ${lic.status !== "active" ? "opacity-75" : ""}`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-1 flex-1 min-w-0">
                    {editingId === lic.id ? (
                      <div className="space-y-2">
                        <input
                          className="w-full bg-surface-container-lowest rounded-lg py-1.5 px-3 text-sm font-bold focus:ring-1 focus:ring-primary/40 outline-none"
                          placeholder="Game Name" value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                        />
                        <input
                          className="w-full bg-surface-container-lowest rounded-lg py-1.5 px-3 text-xs font-mono focus:ring-1 focus:ring-primary/40 outline-none"
                          placeholder="Experience ID (e.g. 123456789)" value={editGameId}
                          onChange={(e) => setEditGameId(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <button onClick={() => saveEdit(lic.id)} disabled={saving || !editGameId.trim()}
                            className="flex-1 py-1.5 rounded-lg bg-primary/20 text-primary text-xs font-bold disabled:opacity-50">
                            {saving ? "Saving…" : "Save"}
                          </button>
                          <button onClick={() => setEditingId(null)}
                            className="px-3 py-1.5 rounded-lg bg-surface-variant/40 text-on-surface-variant text-xs font-semibold">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`material-symbols-outlined text-xs ${lic.status === "active" ? "text-primary filled" : "text-outline"}`}>
                              {lic.status === "active" ? "stars" : lic.status === "expired" ? "schedule" : "warning"}
                            </span>
                            <h3 className="font-headline font-bold text-base truncate">{lic.game_name ?? lic.game_id}</h3>
                            {currentKey === lic.license_key && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-bold uppercase tracking-wider shrink-0">Current</span>
                            )}
                          </div>
                          <p className="text-[10px] text-outline font-mono tracking-wider">ID: {lic.game_id}</p>
                        </div>
                        <button onClick={() => startEdit(lic)}
                          className="shrink-0 p-1.5 rounded-lg hover:bg-surface-variant/40 text-outline hover:text-on-surface transition-colors">
                          <span className="material-symbols-outlined text-sm">edit</span>
                        </button>
                      </div>
                    )}
                  </div>
                  {editingId !== lic.id && (
                    <span className={`ml-2 px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 shrink-0 ${statusBadge[lic.status]}`}>
                      {lic.status === "active" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />}
                      {lic.status}
                    </span>
                  )}
                </div>

                <div className="bg-surface-container-lowest p-3 rounded-lg border border-outline-variant/5 mb-4">
                  <code className={`font-mono text-sm tracking-tight break-all ${lic.status === "expired" ? "text-outline" : "text-secondary-fixed"}`}>
                    {lic.license_key}
                  </code>
                </div>

                <div className="flex items-center justify-between border-t border-outline-variant/10 pt-4">
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => handleCopy(lic.license_key, lic.id)}
                      className="p-2 rounded-lg bg-surface-variant/40 hover:bg-surface-variant transition-colors text-on-surface-variant flex items-center gap-1.5 text-xs font-medium">
                      <span className="material-symbols-outlined text-sm">{copied === lic.id ? "check" : "content_copy"}</span>
                      {copied === lic.id ? "Copied!" : "Copy"}
                    </button>
                    {currentKey !== lic.license_key && lic.status === "active" && (
                      <button onClick={() => saveKey(lic.license_key)}
                        className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors text-primary flex items-center gap-1.5 text-xs font-medium">
                        <span className="material-symbols-outlined text-sm">vpn_key</span>Use
                      </button>
                    )}
                    {lic.status === "active" && (
                      <button onClick={() => updateStatus(lic.id, "suspended")}
                        className="p-2 rounded-lg bg-surface-variant/40 hover:bg-surface-variant transition-colors text-tertiary flex items-center gap-1.5 text-xs font-medium">
                        <span className="material-symbols-outlined text-sm">pause_circle</span>Suspend
                      </button>
                    )}
                    {lic.status === "suspended" && (
                      <button onClick={() => updateStatus(lic.id, "active")}
                        className="p-2 rounded-lg bg-surface-variant/40 hover:bg-surface-variant transition-colors text-emerald-400 flex items-center gap-1.5 text-xs font-medium">
                        <span className="material-symbols-outlined text-sm">play_circle</span>Restore
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] text-outline font-mono">
                    {new Date(lic.created_at).toLocaleDateString("id-ID")}
                  </span>
                </div>
              </div>
            ))
        }
      </section>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4"
          style={{ background: "rgba(11,19,38,0.85)", backdropFilter: "blur(16px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowCreate(false); }}>
          <div className="glass-panel rounded-2xl p-6 w-full max-w-sm border border-outline-variant/20 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold font-headline">Generate License</h3>
              <button onClick={() => setShowCreate(false)} className="text-outline hover:text-on-surface transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Game Name</label>
                <input className="w-full bg-surface-container-lowest rounded-xl py-3 px-4 text-sm focus:ring-1 focus:ring-primary/40 outline-none"
                  placeholder="My Awesome Game" value={gameName} onChange={(e) => setGameName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Game ID</label>
                <input className="w-full bg-surface-container-lowest rounded-xl py-3 px-4 text-sm font-mono focus:ring-1 focus:ring-primary/40 outline-none"
                  placeholder="123456789" value={gameId} onChange={(e) => setGameId(e.target.value)} />
              </div>
            </div>
            <button onClick={create} disabled={creating || !gameName.trim() || !gameId.trim()}
              className="w-full py-3.5 rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold text-sm active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              {creating ? "Generating…" : "Generate License Key"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminVault() {
  const [users, setUsers] = useState<import("@/lib/api").AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.admin.users();
      setUsers(res.users);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  const handleDelete = async (id: number, username: string) => {
    if (!confirm(`Hapus data buat "${username}"?`)) return;
    try {
      await api.admin.deleteUser(id);
      load();
    } catch (err: any) {
      alert(err.message || "Gagal menghapus user");
    }
  };

  useEffect(() => { load(); }, [load]);

  const handleCopy = (text: string, id: string) => {
    copyToClipboard(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const filtered = users.filter((u) => 
    !search || u.username.toLowerCase().includes(search.toLowerCase()) || (u.license_key && u.license_key.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="px-4 pb-8 max-w-2xl mx-auto">
      <section className="mb-8 mt-4">
        <div className="space-y-1">
          <p className="font-headline uppercase tracking-widest text-[10px] font-bold text-on-primary-container">Admin Archive</p>
          <h2 className="text-3xl font-bold font-headline">Generated Keys Vault</h2>
        </div>
      </section>

      <section className="space-y-4 mb-6">
        <div className="relative group">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">search</span>
          <input
            className="w-full bg-surface-container-lowest rounded-xl py-3.5 pl-12 pr-4 text-on-surface placeholder:text-outline-variant focus:ring-1 focus:ring-primary/40 transition-all text-sm outline-none"
            placeholder="Search accounts or license keys…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </section>

      <section className="space-y-6">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="glass-panel p-5 rounded-xl h-48 animate-pulse border border-outline-variant/10" />
            ))
          : filtered.map((u) => (
              <div key={u.id} className="glass-panel p-5 rounded-xl border border-outline-variant/10 shadow-lg space-y-4">
                <div className="flex justify-between items-start border-b border-outline-variant/10 pb-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <h3 className="font-headline font-bold text-lg text-primary">{u.username}</h3>
                      <p className="text-xs text-outline">{new Date(u.created_at).toLocaleString("id-ID")}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {u.role === 'admin' ? (
                        <span className="text-[10px] px-2 py-1 rounded bg-error-container/20 text-error font-bold uppercase tracking-wider">
                          Administrator
                        </span>
                      ) : (
                        <button onClick={() => handleDelete(u.id, u.username)}
                          className="p-1.5 rounded-lg bg-error/10 hover:bg-error/20 text-error transition-colors">
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-outline">License Key</label>
                    <div className="flex bg-surface-container-lowest border border-outline-variant/10 rounded-lg overflow-hidden">
                      <div className="flex-1 px-3 py-2 text-sm font-mono text-secondary-fixed break-all overflow-hidden text-ellipsis whitespace-nowrap">
                        {u.license_key || "No license generated"}
                      </div>
                      {u.license_key && (
                        <button onClick={() => handleCopy(u.license_key!, `lic_${u.id}`)}
                          className="px-3 bg-surface-variant/20 hover:bg-surface-variant/40 transition-colors border-l border-outline-variant/10 text-on-surface-variant flex items-center justify-center w-12">
                          <span className="material-symbols-outlined text-sm">{copied === `lic_${u.id}` ? "check" : "content_copy"}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-outline">Universe IDs</label>
                    <div className="flex flex-wrap gap-2">
                      {u.universe_ids?.length > 0 ? u.universe_ids.map((id, idx) => (
                        <span key={idx} className="bg-surface-container text-on-surface text-xs font-mono px-2 py-1 rounded">
                          {id}
                        </span>
                      )) : <span className="text-xs text-outline italic">None</span>}
                    </div>
                  </div>

                  <div className="border border-outline-variant/10 rounded-lg overflow-hidden">
                    <div className="bg-surface-container-lowest px-3 py-1.5 border-b border-outline-variant/10 flex items-center gap-2">
                       <span className="material-symbols-outlined text-[14px] text-tertiary">key</span>
                       <span className="text-[10px] uppercase font-bold tracking-widest text-outline">Roblox Config Keys</span>
                    </div>
                    {Object.entries(u.platform_api_keys || {}).length > 0 ? (
                      <div className="divide-y divide-outline-variant/5">
                        {Object.entries(PLATFORM_LABEL).map(([platId, platName]) => {
                          const apiKey = u.platform_api_keys[platId];
                          if (!apiKey) return null;
                          return (
                            <div key={platId} className="flex bg-surface-container-lowest overflow-hidden items-center group">
                              <div className="w-24 text-[11px] font-bold px-3 py-2 text-outline-variant uppercase">
                                {platName}
                              </div>
                              <div className="flex-1 text-xs font-mono text-on-surface/80 py-2 overflow-hidden text-ellipsis whitespace-nowrap">
                                {apiKey}
                              </div>
                              <button onClick={() => handleCopy(apiKey, `plat_${u.id}_${platId}`)}
                                className="px-3 py-2 bg-surface-variant/10 hover:bg-surface-variant/40 transition-colors border-l border-outline-variant/10 text-on-surface flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <span className="material-symbols-outlined text-[14px]">
                                  {copied === `plat_${u.id}_${platId}` ? "check" : "content_copy"}
                                </span>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="px-4 py-3 text-xs text-outline italic bg-surface-container-lowest">
                        No config keys generated yet
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
        }
      </section>
    </div>
  );
}

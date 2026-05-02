"use client";
import { useEffect, useState, useCallback } from "react";
import { api, type License, type AdminUser, PLATFORM_LABEL } from "@/lib/api";
import { useLicenseKey } from "@/lib/use-license";
import { useAuth } from "@/lib/auth";
import AuthGate from "@/components/AuthGate";

export default function LicensesPage() {
  return (
    <AuthGate>
      <LicensesContent />
    </AuthGate>
  );
}

function LicensesContent() {
  const { user } = useAuth();

  if (user?.role === "admin") return <AdminLicenseView />;
  return <UserLicenseView />;
}

/* ══════════════════════════════════════════════════════════════════════════════
   USER LICENSE VIEW
   ══════════════════════════════════════════════════════════════════════════════ */
function UserLicenseView() {
  const { user } = useAuth();
  const { key: currentKey, save: saveKey } = useLicenseKey();
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<number | "new" | null>(null);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [gameName, setGameName] = useState("");
  const [gameId, setGameId] = useState("");
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);

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

  const handleCopy = (text: string, id: number | "new") => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      await api.license.update(id, { status });
      setLicenses((prev) => prev.map((l) => l.id === id ? { ...l, status: status as License["status"] } : l));
    } catch { /* silent */ }
  };

  const filtered = licenses.filter((l) =>
    !search || l.game_name?.toLowerCase().includes(search.toLowerCase()) || l.license_key.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="flex-1 md:ml-64 min-h-screen bg-surface pt-16 md:pt-0">
      <div className="max-w-[1280px] mx-auto px-4 md:px-8 py-8 md:py-10 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h2 className="font-headline text-[40px] font-bold leading-[1.1] tracking-tight text-on-surface mb-2">License Management</h2>
            <p className="text-on-surface-variant">Manage integration keys and control access.</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-primary-container text-on-primary-container border border-primary shadow-[0_0_8px_rgba(128,131,255,0.4)] font-headline text-xs font-semibold uppercase tracking-wider py-2 px-4 rounded-lg hover:brightness-110 transition-all active:scale-95 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">key</span>
            Generate New Key
          </button>
        </div>

        {/* New key banner */}
        {newKey && (
          <div className="bg-secondary/10 border border-secondary/30 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-secondary font-headline text-xs font-semibold uppercase tracking-wider">
              <span className="material-symbols-outlined text-sm filled">check_circle</span>License Created
            </div>
            <code className="code-font text-lg text-primary break-all block">{newKey}</code>
            <div className="flex gap-2">
              <button onClick={() => handleCopy(newKey, "new")}
                className="text-xs px-3 py-1.5 rounded-lg bg-secondary/20 text-secondary font-headline font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">{copied === "new" ? "check" : "content_copy"}</span>
                {copied === "new" ? "Copied!" : "Copy"}
              </button>
              <button onClick={() => { saveKey(newKey); setNewKey(null); }}
                className="text-xs px-3 py-1.5 rounded-lg bg-primary/20 text-primary font-headline font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">vpn_key</span>Use this key
              </button>
              <button onClick={() => setNewKey(null)}
                className="text-xs px-3 py-1.5 rounded-lg bg-surface-container text-on-surface-variant font-headline font-semibold ml-auto">
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: "verified_user", label: "Active Licenses", value: String(licenses.filter(l => l.status === "active").length), color: "text-secondary" },
            { icon: "key", label: "Total Keys", value: String(licenses.length), color: "text-primary" },
            { icon: "gpp_bad", label: "Suspended", value: String(licenses.filter(l => l.status === "suspended").length), color: "text-error" },
          ].map((s) => (
            <div key={s.label} className="bg-surface-container border-t border-white/10 p-6 rounded-lg relative overflow-hidden group hover:border-primary/50 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <span className={`material-symbols-outlined ${s.color} bg-surface-container-high p-2 rounded`}>{s.icon}</span>
                <h3 className="font-headline text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{s.label}</h3>
              </div>
              <span className="font-headline text-[40px] font-bold text-on-surface">{s.value}</span>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-surface-container border-t border-white/10 rounded-lg flex flex-col overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
          <div className="p-4 border-b border-white/5 flex flex-col sm:flex-row gap-4 justify-between items-center bg-surface-container-high">
            <div className="relative w-full sm:w-96">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
              <input
                className="w-full bg-surface-container-highest border border-outline-variant rounded py-2 pl-10 pr-4 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder-on-surface-variant"
                placeholder="Search by Key or Game..."
                value={search} onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-white/5">
                  <th className="p-4 font-headline text-xs font-semibold uppercase tracking-wider text-on-surface-variant">License Key</th>
                  <th className="p-4 font-headline text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Game</th>
                  <th className="p-4 font-headline text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Created</th>
                  <th className="p-4 font-headline text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Status</th>
                  <th className="p-4 font-headline text-xs font-semibold uppercase tracking-wider text-on-surface-variant text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-white/5">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}><td colSpan={5} className="p-4"><div className="h-4 rounded bg-surface-container-high animate-pulse" /></td></tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-on-surface-variant">No licenses found</td></tr>
                ) : (
                  filtered.map((lic) => (
                    <tr key={lic.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <code className="font-mono text-primary bg-primary/10 px-2 py-1 rounded text-xs border border-primary/20">
                            {lic.license_key.slice(0, 20)}...
                          </code>
                          <button
                            onClick={() => handleCopy(lic.license_key, lic.id)}
                            className="text-outline hover:text-on-surface opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <span className="material-symbols-outlined text-[16px]">{copied === lic.id ? "check" : "content_copy"}</span>
                          </button>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-surface-container-highest border border-outline-variant flex items-center justify-center text-on-surface font-headline text-sm font-semibold">
                            {(lic.game_name ?? lic.game_id)[0]?.toUpperCase()}
                          </div>
                          <div>
                            <div className="text-on-surface font-medium">{lic.game_name ?? lic.game_id}</div>
                            <div className="text-on-surface-variant text-xs code-font">{lic.game_id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-on-surface-variant text-sm">
                        {new Date(lic.created_at).toLocaleDateString("id-ID", { year: "numeric", month: "short", day: "numeric" })}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {lic.status === "active" ? (
                            <>
                              <div className="w-2.5 h-2.5 bg-secondary rounded-full shadow-[0_0_8px_rgba(74,225,118,0.6)]" />
                              <span className="text-secondary text-xs font-headline font-semibold">Active</span>
                            </>
                          ) : lic.status === "suspended" ? (
                            <>
                              <div className="w-2.5 h-2.5 bg-tertiary rounded-full" />
                              <span className="text-tertiary text-xs font-headline font-semibold">Suspended</span>
                            </>
                          ) : (
                            <>
                              <div className="w-2.5 h-2.5 bg-outline rounded-full" />
                              <span className="text-outline text-xs font-headline font-semibold">Expired</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {currentKey !== lic.license_key && lic.status === "active" && (
                            <button onClick={() => saveKey(lic.license_key)} className="text-outline hover:text-primary transition-colors p-1" title="Use this key">
                              <span className="material-symbols-outlined text-[18px]">vpn_key</span>
                            </button>
                          )}
                          {lic.status === "active" && (
                            <button onClick={() => updateStatus(lic.id, "suspended")} className="text-outline hover:text-tertiary transition-colors p-1" title="Suspend">
                              <span className="material-symbols-outlined text-[18px]">pause_circle</span>
                            </button>
                          )}
                          {lic.status === "suspended" && (
                            <button onClick={() => updateStatus(lic.id, "active")} className="text-outline hover:text-secondary transition-colors p-1" title="Activate">
                              <span className="material-symbols-outlined text-[18px]">play_circle</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-white/5 bg-surface-container-low flex justify-between items-center">
            <span className="text-sm text-on-surface-variant">Showing {filtered.length} of {licenses.length} entries</span>
          </div>
        </div>

        {/* Create modal */}
        {showCreate && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center px-4"
            style={{ background: "rgba(13,13,21,0.85)", backdropFilter: "blur(16px)" }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowCreate(false); }}>
            <div className="bg-surface-container rounded-2xl p-6 w-full max-w-sm border border-outline-variant/50 shadow-2xl space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-headline text-xl font-semibold text-on-surface">Generate License</h3>
                <button onClick={() => setShowCreate(false)} className="text-outline hover:text-on-surface transition-colors">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="font-headline text-xs font-semibold uppercase tracking-wider text-on-surface">Game Name</label>
                  <input className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-3 px-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none text-on-surface"
                    placeholder="My Awesome Game" value={gameName} onChange={(e) => setGameName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="font-headline text-xs font-semibold uppercase tracking-wider text-on-surface">Universe ID</label>
                  <input className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-3 px-4 text-sm code-font focus:border-primary focus:ring-1 focus:ring-primary outline-none text-on-surface"
                    placeholder="123456789" value={gameId} onChange={(e) => setGameId(e.target.value)} />
                </div>
              </div>
              <button onClick={create} disabled={creating || !gameName.trim() || !gameId.trim()}
                className="w-full py-3.5 rounded-xl bg-primary text-on-primary font-headline text-xs font-semibold uppercase tracking-wider active:scale-[0.98] transition-all disabled:opacity-50 hover:bg-primary-fixed hover:shadow-[0_8px_20px_-4px_rgba(192,193,255,0.3)]">
                {creating ? "Generating..." : "Generate License Key"}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   ADMIN LICENSE VIEW
   ══════════════════════════════════════════════════════════════════════════════ */
function AdminLicenseView() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try { const res = await api.admin.users(); setUsers(res.users); }
    catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: number) => {
    try { await api.admin.deleteUser(id); load(); } catch { /* silent */ }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const filtered = users.filter((u) =>
    !search || u.username.toLowerCase().includes(search.toLowerCase()) || (u.license_key && u.license_key.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <main className="flex-1 md:ml-64 min-h-screen bg-surface pt-16 md:pt-0">
      <div className="max-w-[1280px] mx-auto px-4 md:px-8 py-8 md:py-10 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h2 className="font-headline text-[40px] font-bold leading-[1.1] tracking-tight text-on-surface mb-2">License Management</h2>
            <p className="text-on-surface-variant">Manage integration keys, monitor usage, and control access.</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: "verified_user", label: "Total Active", value: String(users.filter(u => u.license_key).length), color: "text-secondary" },
            { icon: "group", label: "Total Users", value: String(users.length), color: "text-primary" },
            { icon: "gpp_bad", label: "Admin Users", value: String(users.filter(u => u.role === "admin").length), color: "text-tertiary" },
          ].map((s) => (
            <div key={s.label} className="bg-surface-container border-t border-white/10 p-6 rounded-lg relative overflow-hidden group hover:border-primary/50 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <span className={`material-symbols-outlined ${s.color} bg-surface-container-high p-2 rounded`}>{s.icon}</span>
                <h3 className="font-headline text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{s.label}</h3>
              </div>
              <span className="font-headline text-[40px] font-bold text-on-surface">{s.value}</span>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-surface-container border-t border-white/10 rounded-lg flex flex-col overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
          <div className="p-4 border-b border-white/5 bg-surface-container-high">
            <div className="relative w-full sm:w-96">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
              <input className="w-full bg-surface-container-highest border border-outline-variant rounded py-2 pl-10 pr-4 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder-on-surface-variant"
                placeholder="Search by User or Key..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-white/5">
                  <th className="p-4 font-headline text-xs font-semibold uppercase tracking-wider text-on-surface-variant">User</th>
                  <th className="p-4 font-headline text-xs font-semibold uppercase tracking-wider text-on-surface-variant">License Key</th>
                  <th className="p-4 font-headline text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Role</th>
                  <th className="p-4 font-headline text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Created</th>
                  <th className="p-4 font-headline text-xs font-semibold uppercase tracking-wider text-on-surface-variant text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-white/5">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}><td colSpan={5} className="p-4"><div className="h-4 rounded bg-surface-container-high animate-pulse" /></td></tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-on-surface-variant">No users found</td></tr>
                ) : (
                  filtered.map((u) => (
                    <tr key={u.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="p-4 text-on-surface font-medium">{u.username}</td>
                      <td className="p-4">
                        {u.license_key ? (
                          <div className="flex items-center gap-2">
                            <code className="font-mono text-primary bg-primary/10 px-2 py-1 rounded text-xs border border-primary/20">
                              {u.license_key.slice(0, 20)}...
                            </code>
                            <button onClick={() => handleCopy(u.license_key!, `lic_${u.id}`)} className="text-outline hover:text-on-surface opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="material-symbols-outlined text-[16px]">{copied === `lic_${u.id}` ? "check" : "content_copy"}</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-outline text-xs">No license</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-headline font-semibold uppercase tracking-wider ${
                          u.role === "admin" ? "bg-primary/20 text-primary border border-primary/30" : "bg-surface-variant text-on-surface-variant border border-outline-variant"
                        }`}>{u.role}</span>
                      </td>
                      <td className="p-4 text-on-surface-variant">{new Date(u.created_at).toLocaleDateString("id-ID")}</td>
                      <td className="p-4 text-right">
                        {u.role !== "admin" && (
                          <button onClick={() => handleDelete(u.id)} className="text-outline hover:text-error transition-colors p-1">
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-white/5 bg-surface-container-low">
            <span className="text-sm text-on-surface-variant">Showing {filtered.length} of {users.length} entries</span>
          </div>
        </div>
      </div>
    </main>
  );
}

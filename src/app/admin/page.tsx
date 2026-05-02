"use client";

import { useState, useEffect } from "react";
import { apiCall, type AdminUser } from "@/lib/api";
import AuthGate from "@/components/AuthGate";

export default function AdminPage() {
  return (
    <AuthGate adminOnly>
      <AdminContent />
    </AuthGate>
  );
}

function AdminContent() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [genUsername, setGenUsername] = useState("");
  const [genPassword, setGenPassword] = useState("");
  const [genGameId, setGenGameId] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  const loadUsers = async () => {
    try {
      const res = await apiCall<{ users: AdminUser[] }>("/api/admin/users", { method: "GET" });
      setUsers(res.users ?? []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { loadUsers(); }, []);

  const generateLicense = async () => {
    if (!genUsername || !genPassword) return;
    setGenerating(true);
    try {
      // Single admin endpoint: creates user + license atomically
      const res = await apiCall<{ ok: boolean; user_id: number; username: string; license_key: string }>(
        "/api/admin/users",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: genUsername,
            password: genPassword,
            game_id: genGameId || "default",
            game_name: genGameId || undefined,
          }),
        }
      );
      setGeneratedKey(res.license_key);
      setGenUsername("");
      setGenPassword("");
      setGenGameId("");
      loadUsers();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed");
    } finally {
      setGenerating(false);
    }
  };

  const deleteUser = async (id: number) => {
    try {
      await apiCall(`/api/admin/users/${id}`, { method: "DELETE" });
      loadUsers();
    } catch { /* silent */ }
  };

  return (
    <main className="flex-1 md:ml-64 min-h-screen bg-surface pt-16 md:pt-0">
      <div className="max-w-[1280px] mx-auto px-4 md:px-8 py-8 md:py-10">
        {/* Header */}
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h2 className="font-headline text-[40px] font-bold leading-[1.1] tracking-tight text-primary">Global Monitoring</h2>
            <p className="text-lg text-on-surface-variant mt-2">Platform-wide overview of donation activity and user metrics.</p>
          </div>
          <div className="flex gap-4">
            <div className="bg-surface-container-high border border-outline-variant rounded px-4 py-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[20px]">circle</span>
              <span className="font-headline text-xs font-semibold uppercase tracking-wider text-on-surface">Bridge Status: Optimal</span>
            </div>
          </div>
        </header>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { icon: "public", label: "Total Users", value: String(users.length), trend: "Active", color: "text-secondary" },
            { icon: "group", label: "Active Licenses", value: String(users.filter(u => u.license_key).length), trend: "Licensed", color: "text-secondary" },
            { icon: "swap_horiz", label: "Avg. Bridge Time", value: "1.4s", trend: "Stable", color: "text-on-surface-variant" },
            { icon: "error", label: "System Status", value: "OK", trend: "All systems go", color: "text-secondary" },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-surface-container/50 border-t border-white/10 p-6 rounded-lg backdrop-blur-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <span className="material-symbols-outlined text-[64px]">{kpi.icon}</span>
              </div>
              <h3 className="font-headline text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2">{kpi.label}</h3>
              <p className="font-headline text-2xl font-semibold text-on-surface font-mono">{kpi.value}</p>
              <div className={`mt-4 flex items-center gap-1 ${kpi.color}`}>
                <span className="material-symbols-outlined text-[16px]">trending_up</span>
                <span className="font-headline text-xs font-semibold">{kpi.trend}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Generate New Key */}
        <section className="bg-surface-container/40 border border-outline-variant/30 rounded-xl p-6 mb-8 backdrop-blur-md">
          <h3 className="font-headline text-2xl font-semibold text-on-surface mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">key</span>
            Generate New License
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              placeholder="Username"
              value={genUsername}
              onChange={(e) => setGenUsername(e.target.value)}
              className="bg-surface-container-lowest border border-outline-variant rounded-lg py-2.5 px-4 text-on-surface text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
            <input
              placeholder="Password"
              type="password"
              value={genPassword}
              onChange={(e) => setGenPassword(e.target.value)}
              className="bg-surface-container-lowest border border-outline-variant rounded-lg py-2.5 px-4 text-on-surface text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
            <input
              placeholder="Game/Universe ID (optional)"
              value={genGameId}
              onChange={(e) => setGenGameId(e.target.value)}
              className="bg-surface-container-lowest border border-outline-variant rounded-lg py-2.5 px-4 text-on-surface text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
            <button
              onClick={generateLicense}
              disabled={generating || !genUsername || !genPassword}
              className="bg-primary-container text-on-primary-container border border-primary shadow-[0_0_8px_rgba(128,131,255,0.4)] font-headline text-xs font-semibold uppercase tracking-wider py-2.5 px-4 rounded-lg hover:brightness-110 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">key</span>
              {generating ? "Generating..." : "Generate"}
            </button>
          </div>
          {generatedKey && (
            <div className="mt-4 bg-secondary/10 border border-secondary/30 rounded-lg p-4">
              <p className="font-headline text-xs font-semibold uppercase tracking-wider text-secondary mb-2">Generated License Key</p>
              <code className="text-primary code-font text-lg break-all">{generatedKey}</code>
            </div>
          )}
        </section>

        {/* User Management Table */}
        <section className="bg-surface-container/40 border border-outline-variant/30 rounded-xl flex flex-col backdrop-blur-md overflow-hidden">
          <div className="p-4 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-high/50">
            <h3 className="font-headline text-lg font-semibold text-on-surface">User Management</h3>
            <span className="font-headline text-xs font-semibold text-on-surface-variant">{users.length} users</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/30 bg-surface-container-low text-on-surface-variant font-headline text-xs font-semibold uppercase tracking-wider">
                  <th className="p-4 font-normal">User</th>
                  <th className="p-4 font-normal">Role</th>
                  <th className="p-4 font-normal">License Key</th>
                  <th className="p-4 font-normal">Status</th>
                  <th className="p-4 font-normal text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="border-b border-outline-variant/10">
                      <td colSpan={5} className="p-4"><div className="h-4 rounded bg-surface-container animate-pulse" /></td>
                    </tr>
                  ))
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-on-surface-variant">No users yet</td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="border-b border-outline-variant/10 hover:bg-surface-container-high/30 transition-colors">
                      <td className="p-4 text-on-surface font-medium">{u.username}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-headline font-semibold uppercase tracking-wider ${
                          u.role === "admin"
                            ? "bg-primary/20 text-primary border border-primary/30"
                            : "bg-surface-variant text-on-surface-variant border border-outline-variant"
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-4">
                        {u.license_key ? (
                          <code className="font-mono text-primary bg-primary/10 px-2 py-1 rounded text-xs border border-primary/20">
                            {u.license_key.slice(0, 16)}...
                          </code>
                        ) : (
                          <span className="text-outline text-xs">—</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`text-xs font-headline font-semibold ${
                          u.status === "active" ? "text-secondary" : "text-outline"
                        }`}>
                          {u.status ?? "—"}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {u.role !== "admin" && (
                          <button
                            onClick={() => deleteUser(u.id)}
                            className="text-on-surface-variant hover:text-error transition-colors mx-1"
                          >
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
        </section>
      </div>
    </main>
  );
}

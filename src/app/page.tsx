"use client";

import { useEffect, useState, useCallback } from "react";
import {
  api, formatRp, PLATFORM_LABEL,
  type Donation, type LeaderboardEntry, type StatsResponse,
} from "@/lib/api";
import { getLicenseKey, useAuth } from "@/lib/auth";
import AuthGate from "@/components/AuthGate";

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function DashboardPage() {
  return (
    <AuthGate>
      <DashboardContent />
    </AuthGate>
  );
}

function DashboardContent() {
  const { user } = useAuth();
  const [key, setKey] = useState<string | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [recent, setRecent] = useState<Donation[]>([]);
  const [board, setBoard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { setKey(getLicenseKey()); }, []);

  useEffect(() => {
    if (!user?.user_id || !key) return;
    api.license.list(user.user_id).then((res) => {
      const lic = res.licenses?.find((l) => l.license_key === key);
      if (lic) setGameId(lic.game_id);
    }).catch(() => {});
  }, [user?.user_id, key]);

  const load = useCallback(async () => {
    if (!key) return;
    try {
      const [s, r, l] = await Promise.all([
        api.donations.stats(key),
        api.donations.recent(key, 7),
        api.leaderboard(key, "week"),
      ]);
      setStats(s);
      setRecent(r.donations ?? []);
      setBoard(l.leaderboard ?? []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [key]);

  useEffect(() => {
    if (key) { load(); const id = setInterval(load, 30_000); return () => clearInterval(id); }
    else setLoading(false);
  }, [key, load]);

  const t = stats?.totals;
  const bars = stats?.by_day ?? [];
  const maxBar = Math.max(...bars.map((b) => b.total), 1);

  return (
    <main className="flex-1 md:ml-64 min-h-screen bg-surface relative pt-16 md:pt-0">
      <div className="absolute top-0 left-1/4 w-1/2 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="max-w-[1280px] mx-auto px-4 md:px-8 py-8 md:py-10 space-y-6">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-surface-variant pb-6">
          <div>
            <h1 className="font-headline text-[40px] font-bold leading-[1.1] tracking-tight text-on-surface mb-2">
              Dashboard Overview
            </h1>
            <p className="text-on-surface-variant">Real-time metrics and system status.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 bg-surface-container-high px-3 py-1.5 rounded border border-surface-variant font-headline text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              <span className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_8px_rgba(74,225,118,0.5)]" />
              System Operational
            </span>
          </div>
        </header>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Total Donations Volume */}
          <div className="md:col-span-8 bg-surface-container-high rounded-xl border border-surface-variant p-6 relative overflow-hidden group hover:border-primary/30 transition-colors duration-300">
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-500" />
            <div className="flex justify-between items-start mb-6 relative z-10">
              <h2 className="font-headline text-xs font-semibold uppercase tracking-widest text-outline flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">monitoring</span>
                Total Donations Volume
              </h2>
              {t && (
                <div className="bg-secondary/10 text-secondary border border-secondary/20 px-2 py-1 rounded font-headline text-xs font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">trending_up</span>
                  Live
                </div>
              )}
            </div>
            <div className="relative z-10 flex flex-col md:flex-row items-baseline gap-4 md:gap-8">
              <div>
                <span className="text-4xl md:text-6xl font-headline tracking-tighter text-on-surface mono-nums block">
                  {loading ? "—" : `Rp ${formatRp(t?.total ?? 0)}`}
                </span>
                <span className="text-on-surface-variant mt-2 block text-sm">Lifetime processed</span>
              </div>
              {/* Mini Chart */}
              <div className="flex-1 h-24 w-full flex items-end gap-1.5 mt-4 md:mt-0">
                {loading
                  ? Array.from({ length: 7 }).map((_, i) => (
                      <div key={i} className="w-full bg-primary/10 rounded-t animate-pulse" style={{ height: `${30 + i * 8}%` }} />
                    ))
                  : bars.length > 0
                  ? bars.map((b, i) => {
                      const h = Math.max(10, Math.round((b.total / maxBar) * 100));
                      const isLast = i === bars.length - 1;
                      return (
                        <div
                          key={b.day}
                          className={`w-full rounded-t hover:bg-primary/60 transition-colors ${
                            isLast ? "bg-primary" : "bg-primary/20"
                          }`}
                          style={{ height: `${h}%` }}
                        />
                      );
                    })
                  : Array.from({ length: 7 }).map((_, i) => (
                      <div key={i} className="w-full bg-primary/10 rounded-t" style={{ height: `${15 + i * 5}%` }} />
                    ))
                }
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="md:col-span-4 flex flex-col gap-6">
            {/* Roblox Connection */}
            <div className="flex-1 bg-surface-container-high rounded-xl border border-surface-variant p-5 relative overflow-hidden">
              <h3 className="font-headline text-xs font-semibold uppercase tracking-widest text-outline mb-4">Roblox Connection</h3>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-surface-container-lowest border border-surface-variant flex items-center justify-center relative">
                  <span className="material-symbols-outlined text-on-surface">stadia_controller</span>
                  <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-surface-container-high rounded-full flex items-center justify-center">
                    <div className={`w-2.5 h-2.5 rounded-full ${gameId ? "bg-secondary shadow-[0_0_8px_rgba(74,225,118,0.6)]" : "bg-outline"}`} />
                  </div>
                </div>
                <div>
                  <div className="font-headline text-lg text-on-surface leading-tight">
                    {gameId ? "Connected" : "Not Connected"}
                  </div>
                  <div className="text-sm text-on-surface-variant">
                    {gameId ? `Game ID: ${gameId.slice(0, 8)}...` : "No game linked"}
                  </div>
                </div>
              </div>
            </div>

            {/* License Status */}
            <div className="flex-1 bg-surface-container-high rounded-xl border border-primary/30 shadow-[0_0_15px_rgba(192,193,255,0.05)] p-5 relative">
              <div className="absolute top-0 right-0 w-16 h-16 bg-primary/10 rounded-bl-full pointer-events-none" />
              <h3 className="font-headline text-xs font-semibold uppercase tracking-widest text-outline mb-4">License</h3>
              <div className="flex justify-between items-end">
                <div>
                  <div className="font-headline text-xl text-primary mb-1">{user?.role === "admin" ? "Admin" : "Active"}</div>
                  <div className="text-sm text-on-surface-variant flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px]">vpn_key</span>
                    {key ? `${key.slice(0, 12)}...` : "No key"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Donations Table */}
          <div className="md:col-span-12 bg-surface-container-high rounded-xl border border-surface-variant overflow-hidden">
            <div className="p-5 border-b border-surface-variant flex justify-between items-center bg-surface-container-highest/50">
              <h3 className="font-headline text-xs font-semibold uppercase tracking-widest text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">list_alt</span>
                Recent Live Donations
              </h3>
              <button onClick={load} className="font-headline text-xs font-semibold text-primary hover:text-primary-fixed transition-colors">
                Refresh
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-surface-variant/50 font-headline text-xs font-semibold uppercase tracking-wider text-outline bg-surface-container-low/50">
                    <th className="py-3 px-5 font-normal">Donor</th>
                    <th className="py-3 px-5 font-normal">Amount</th>
                    <th className="py-3 px-5 font-normal">Platform</th>
                    <th className="py-3 px-5 font-normal">Time</th>
                    <th className="py-3 px-5 font-normal text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-on-surface">
                  {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i} className="border-b border-surface-variant/30">
                        <td colSpan={5} className="py-3 px-5">
                          <div className="h-4 rounded bg-surface-container animate-pulse" />
                        </td>
                      </tr>
                    ))
                  ) : recent.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-on-surface-variant">No donations yet</td>
                    </tr>
                  ) : (
                    recent.map((d, i) => (
                      <tr key={d.donation_id ?? i} className="border-b border-surface-variant/30 hover:bg-surface-variant/20 transition-colors group">
                        <td className="py-3 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-surface-variant flex items-center justify-center text-outline group-hover:text-primary transition-colors">
                              <span className="material-symbols-outlined text-[18px]">person</span>
                            </div>
                            <span className="font-medium">{d.donor_name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-5 font-headline text-base text-secondary mono-nums">
                          Rp {formatRp(d.amount)}
                        </td>
                        <td className="py-3 px-5 text-on-surface-variant">
                          {PLATFORM_LABEL[d.platform] ?? d.platform}
                        </td>
                        <td className="py-3 px-5 text-outline">{timeAgo(d.timestamp)}</td>
                        <td className="py-3 px-5 text-right">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-headline font-semibold bg-secondary/10 text-secondary border border-secondary/20">
                            Processed
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

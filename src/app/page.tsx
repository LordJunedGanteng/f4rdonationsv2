"use client";
import { useEffect, useState, useCallback } from "react";
import {
  api, formatRp, PLATFORM_COLOR, PLATFORM_LABEL,
  type Donation, type LeaderboardEntry, type StatsResponse, type RobloxGameInfo,
} from "@/lib/api";
import { getLicenseKey, useAuth } from "@/lib/auth";
import AuthGate from "@/components/AuthGate";

// ── Shared helpers ────────────────────────────────────────────────────────────
const PLATFORM_ICON: Record<string, string> = {
  saweria: "volunteer_activism",
  socialbuzz: "payments",
  bagibagi: "card_giftcard",
};
const PLATFORM_ICON_CLS: Record<string, string> = {
  saweria: "text-secondary",
  socialbuzz: "text-tertiary",
  bagibagi: "text-primary",
};
function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ── StatCard ──────────────────────────────────────────────────────────────────
function StatCard({ label, value, trend, dir, prefix }: {
  label: string; value: string; trend: string; dir: 1 | 0 | -1; prefix?: string;
}) {
  return (
    <div className="bg-surface-container-highest rounded-xl p-5 flex flex-col gap-2 border border-outline-variant/10">
      <span className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant font-headline">{label}</span>
      <div className="flex items-baseline gap-1">
        {prefix && <span className="text-lg font-bold font-headline text-primary">{prefix}</span>}
        <span className="text-3xl font-extrabold font-headline tracking-tight">{value}</span>
      </div>
      <div className={`flex items-center gap-1 text-[10px] font-semibold ${dir === 1 ? "text-emerald-400" : dir === -1 ? "text-error" : "text-tertiary"}`}>
        <span className="material-symbols-outlined text-sm filled">
          {dir === 1 ? "trending_up" : dir === -1 ? "trending_down" : "horizontal_rule"}
        </span>
        <span>{trend}</span>
      </div>
    </div>
  );
}

// ── GamePreviewCard ───────────────────────────────────────────────────────────
function GamePreviewCard({ universeId, gameName }: { universeId: string; gameName: string | null }) {
  const [info, setInfo] = useState<RobloxGameInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    api.roblox.game(universeId)
      .then(setInfo)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [universeId]);

  const fmt = (n: number) =>
    n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000 ? `${(n / 1_000).toFixed(1)}K`
    : String(n);

  return (
    <section>
      <p className="font-headline uppercase tracking-widest text-[10px] font-bold text-on-primary-container mb-3">
        Connected Experience
      </p>
      {loading ? (
        <div className="h-40 rounded-2xl bg-surface-container-highest animate-pulse border border-outline-variant/10" />
      ) : error || !info ? (
        <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-highest p-4 flex items-center gap-3">
          <div className="w-16 h-16 rounded-xl bg-surface-container flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-3xl text-outline">videogame_asset</span>
          </div>
          <div>
            <p className="font-bold text-sm">{gameName ?? `Universe ${universeId}`}</p>
            <p className="text-[11px] text-outline mt-0.5 font-mono">ID: {universeId}</p>
            <p className="text-[11px] text-error mt-1">Could not fetch Roblox data</p>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-highest overflow-hidden shadow-lg">
          {/* Thumbnail */}
          <div className="relative h-36 w-full bg-surface-container">
            {info.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={info.thumbnailUrl} alt={info.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="material-symbols-outlined text-5xl text-outline">videogame_asset</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-3 flex items-end justify-between">
              <div>
                <h3 className="font-headline font-bold text-base leading-tight text-white drop-shadow">{info.name}</h3>
                <p className="text-[11px] text-white/60">by {info.creator}</p>
              </div>
              <span className="text-[9px] px-2 py-1 rounded-full bg-emerald-500/30 text-emerald-400 font-bold uppercase tracking-wider border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block shadow-[0_0_6px_#10b981]" />
                Active
              </span>
            </div>
          </div>
          {/* Stats row */}
          <div className="grid grid-cols-3 divide-x divide-outline-variant/10 border-t border-outline-variant/10">
            {[
              { icon: "person",    label: "Playing", val: fmt(info.playing) },
              { icon: "bar_chart", label: "Visits",  val: fmt(info.visits) },
              { icon: "group",     label: "Max",     val: fmt(info.maxPlayers) },
            ].map(({ icon, label, val }) => (
              <div key={label} className="flex flex-col items-center py-3 gap-0.5">
                <span className="material-symbols-outlined text-sm text-primary">{icon}</span>
                <span className="text-sm font-extrabold font-headline">{val}</span>
                <span className="text-[9px] text-outline uppercase tracking-widest">{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

// ── Page entry ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  return (
    <AuthGate>
      <DashboardContent />
    </AuthGate>
  );
}

function DashboardContent() {
  const { user } = useAuth();
  const [key,      setKey]      = useState<string | null>(null);
  const [gameId,   setGameId]   = useState<string | null>(null);
  const [gameName, setGameName] = useState<string | null>(null);
  const [stats,    setStats]    = useState<StatsResponse | null>(null);
  const [recent,   setRecent]   = useState<Donation[]>([]);
  const [board,    setBoard]    = useState<LeaderboardEntry[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => { setKey(getLicenseKey()); }, []);

  // Resolve game_id from current license key
  useEffect(() => {
    if (!user?.user_id || !key) return;
    api.license.list(user.user_id).then((res) => {
      const lic = res.licenses?.find((l) => l.license_key === key);
      if (lic) { setGameId(lic.game_id); setGameName(lic.game_name); }
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

  const t      = stats?.totals;
  const bars   = stats?.by_day ?? [];
  const maxBar = Math.max(...bars.map((b) => b.total), 1);

  return (
    <div className="px-4 pb-8 space-y-8 max-w-lg mx-auto">

      {/* Stats */}
      <section className="grid grid-cols-2 gap-3 pt-4">
        <StatCard label="Total Revenue" value={loading ? "—" : formatRp(t?.total ?? 0)}        trend={t ? "Live" : "—"}      dir={1} prefix="Rp " />
        <StatCard label="Unique Donors" value={loading ? "—" : String(t?.unique_donors ?? 0)}  trend={t ? "Live" : "—"}      dir={1} />
        <StatCard label="Donations"     value={loading ? "—" : String(t?.count ?? 0)}           trend="This license"           dir={0} />
        <StatCard label="Avg Donation"  value={loading ? "—" : formatRp(t?.avg ?? 0)}           trend={t ? "per donor" : "—"} dir={1} prefix="Rp " />
      </section>

      {/* Game Preview */}
      {gameId && <GamePreviewCard universeId={gameId} gameName={gameName} />}

      {/* Trend chart */}
      <section className="space-y-3">
        <div className="flex justify-between items-end">
          <h2 className="text-lg font-bold font-headline">Donation Trend</h2>
          <span className="text-[10px] text-on-surface-variant uppercase tracking-widest">Last {bars.length || 7} Days</span>
        </div>
        <div className="bg-surface-container-low rounded-xl p-6 h-44 relative overflow-hidden flex items-end gap-2 border border-outline-variant/5">
          {loading
            ? Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex-1 rounded-t-sm bg-primary/10 animate-pulse" style={{ height: `${30 + i * 10}%` }} />
              ))
            : bars.length > 0
            ? bars.map((b) => {
                const h = Math.max(4, Math.round((b.total / maxBar) * 100));
                const isMax = b.total === maxBar;
                return (
                  <div key={b.day} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full rounded-t-sm" style={{
                      height: `${h}%`,
                      background: isMax ? "linear-gradient(135deg,#aec6ff,#1e3c72)" : `rgba(174,198,255,${0.15 + h / 250})`,
                      boxShadow: isMax ? "0 -8px 16px rgba(174,198,255,0.2)" : undefined,
                    }} />
                  </div>
                );
              })
            : <div className="w-full text-center text-on-surface-variant text-sm self-center">No data yet</div>
          }
          <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent pointer-events-none" />
        </div>
        {bars.length > 0 && (
          <div className="flex justify-between px-1 text-[9px] text-on-surface-variant font-mono">
            {bars.map((b) => <span key={b.day}>{new Date(b.day).toLocaleDateString("id-ID", { weekday: "short" })}</span>)}
          </div>
        )}
      </section>

      {/* Recent */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold font-headline">Recent Stream</h2>
          <button onClick={load} className="text-secondary text-sm font-medium flex items-center gap-1">
            <span className="material-symbols-outlined text-base">refresh</span>Refresh
          </button>
        </div>
        <div className="space-y-3">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-surface-container-highest rounded-xl p-4 h-16 animate-pulse border border-outline-variant/10" />
              ))
            : recent.length === 0
            ? <div className="text-center text-on-surface-variant text-sm py-8">No donations yet</div>
            : recent.map((d, i) => (
                <div key={d.donation_id ?? i} className="bg-surface-container-highest rounded-xl p-4 flex items-center justify-between border border-outline-variant/10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-surface-container-low flex items-center justify-center">
                      <span className={`material-symbols-outlined filled ${PLATFORM_ICON_CLS[d.platform] ?? "text-primary"}`}>
                        {PLATFORM_ICON[d.platform] ?? "volunteer_activism"}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-on-surface text-sm">{d.donor_name}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-tight ${PLATFORM_COLOR[d.platform] ?? "text-primary"} bg-surface-container/60`}>
                          {PLATFORM_LABEL[d.platform] ?? d.platform}
                        </span>
                        <span className="text-xs text-on-surface-variant">{timeAgo(d.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-base font-extrabold font-headline text-primary">Rp {formatRp(d.amount)}</span>
                </div>
              ))
          }
        </div>
      </section>

      {/* Leaderboard */}
      <section className="space-y-4 pb-4">
        <h2 className="text-lg font-bold font-headline">Top Donors</h2>
        <div className="bg-surface-container rounded-xl overflow-hidden border border-outline-variant/10">
          <table className="w-full text-left">
            <thead className="bg-surface-container-high">
              <tr>
                {["Rank", "User", "Total"].map((h, i) => (
                  <th key={h} className={`px-4 py-3 text-[10px] uppercase tracking-widest font-bold text-on-surface-variant ${i === 2 ? "text-right" : ""}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}><td colSpan={3} className="px-4 py-3"><div className="h-4 rounded bg-surface-container-high animate-pulse" /></td></tr>
                  ))
                : board.length === 0
                ? <tr><td colSpan={3} className="px-4 py-6 text-center text-on-surface-variant text-sm">No donors this week</td></tr>
                : board.slice(0, 9).map((e) => (
                    <tr key={e.rank} className={e.rank === 1 ? "bg-primary/5" : ""}>
                      <td className={`px-4 py-3 text-sm font-bold ${e.rank === 1 ? "text-primary" : "text-on-surface-variant"}`}>
                        {String(e.rank).padStart(2, "0")}
                      </td>
                      <td className="px-4 py-3">
                        {e.rank === 1
                          ? <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-primary-container border border-primary/30 flex items-center justify-center text-[10px] font-bold text-on-primary-container">
                                {e.donor_name[0]}
                              </div>
                              <span className="text-sm font-semibold">{e.donor_name}</span>
                            </div>
                          : <span className="text-sm font-semibold">{e.donor_name}</span>
                        }
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-extrabold font-headline">
                        Rp {formatRp(e.total_amount)}
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

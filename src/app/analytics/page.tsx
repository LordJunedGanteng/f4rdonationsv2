"use client";
import { useState, useEffect, useCallback } from "react";
import { api, formatRp, formatRpFull, type StatsResponse, type LeaderboardEntry } from "@/lib/api";
import { useLicenseKey } from "@/lib/use-license";
import AuthGate from "@/components/AuthGate";

const PERIODS = [
  { label: "24H", timeframe: "week" },
  { label: "7D",  timeframe: "week" },
  { label: "30D", timeframe: "month" },
];

export default function AnalyticsPage() {
  return (
    <AuthGate>
      <AnalyticsContent />
    </AuthGate>
  );
}

function AnalyticsContent() {
  const { key } = useLicenseKey();
  const [periodIdx, setPeriodIdx] = useState(1);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [board, setBoard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!key) return;
    setLoading(true);
    try {
      const [s, l] = await Promise.all([
        api.donations.stats(key),
        api.leaderboard(key, PERIODS[periodIdx].timeframe),
      ]);
      setStats(s);
      setBoard(l.leaderboard ?? []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [key, periodIdx]);

  useEffect(() => { load(); }, [load]);

  const t = stats?.totals;
  const byPlatform = stats?.by_platform ?? [];
  const totalPlatform = byPlatform.reduce((s, p) => s + p.total, 0) || 1;
  const bars = stats?.by_day ?? [];
  const maxBar = Math.max(...bars.map((b) => b.total), 1);

  // SVG chart path
  const pts = bars.slice(-7);
  let svgPath = "";
  let svgArea = "";
  if (pts.length > 1) {
    const coords = pts.map((b, i) => ({
      x: (i / (pts.length - 1)) * 100,
      y: 100 - Math.round((b.total / maxBar) * 90),
    }));
    svgPath = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x},${c.y}`).join(" ");
    svgArea = `${svgPath} L100,100 L0,100 Z`;
  }

  return (
    <main className="flex-1 md:ml-64 min-h-screen bg-surface relative pt-16 md:pt-0">
      <div className="max-w-[1280px] mx-auto px-4 md:px-8 py-8 md:py-10 space-y-6">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-surface-variant pb-6">
          <div>
            <h1 className="font-headline text-[40px] font-bold leading-[1.1] tracking-tight text-primary">
              Analytics
            </h1>
            <p className="text-lg text-on-surface-variant mt-2">Donation metrics and platform performance.</p>
          </div>
          <div className="flex gap-2">
            {PERIODS.map((p, i) => (
              <button
                key={p.label}
                onClick={() => setPeriodIdx(i)}
                className={`px-3 py-1 rounded border font-headline text-xs font-semibold uppercase tracking-wider transition-colors ${
                  periodIdx === i
                    ? "bg-primary/20 border-primary/50 text-primary"
                    : "bg-surface-container border-outline-variant text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </header>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { icon: "public", label: "Total Volume", value: loading ? "—" : `Rp ${formatRp(t?.total ?? 0)}`, trend: t ? "+Live" : "—", color: "text-secondary" },
            { icon: "group", label: "Unique Donors", value: loading ? "—" : String(t?.unique_donors ?? 0), trend: "Active", color: "text-secondary" },
            { icon: "monitoring", label: "Total Donations", value: loading ? "—" : String(t?.count ?? 0), trend: "Processed", color: "text-secondary" },
            { icon: "payments", label: "Avg. Donation", value: loading ? "—" : `Rp ${formatRp(t?.avg ?? 0)}`, trend: "Per donor", color: "text-on-surface-variant" },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-surface-container/50 border-t border-white/10 p-6 rounded-lg backdrop-blur-sm relative overflow-hidden group hover:border-primary/30 transition-colors">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <span className="material-symbols-outlined text-[64px]">{kpi.icon}</span>
              </div>
              <h3 className="font-headline text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2">{kpi.label}</h3>
              <p className="font-headline text-2xl font-semibold text-on-surface mono-nums">{kpi.value}</p>
              <div className={`mt-4 flex items-center gap-1 ${kpi.color}`}>
                <span className="material-symbols-outlined text-[16px]">trending_up</span>
                <span className="font-headline text-xs font-semibold">{kpi.trend}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Chart Section */}
        <section className="bg-surface-container/40 border border-outline-variant/30 rounded-xl p-6 backdrop-blur-md">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-headline text-2xl font-semibold text-on-surface">Donation Velocity</h3>
          </div>
          <div className="h-64 w-full relative">
            <div className="absolute inset-0 border-b border-l border-outline-variant/30" />
            <div className="absolute w-full h-1/4 bottom-[25%] border-b border-outline-variant/10" />
            <div className="absolute w-full h-1/4 bottom-[50%] border-b border-outline-variant/10" />
            <div className="absolute w-full h-1/4 bottom-[75%] border-b border-outline-variant/10" />
            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="chartGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#c0c1ff" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#c0c1ff" stopOpacity="0" />
                </linearGradient>
              </defs>
              {svgPath ? (
                <>
                  <path d={svgArea} fill="url(#chartGrad)" />
                  <path d={svgPath} fill="none" stroke="#c0c1ff" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                </>
              ) : (
                <>
                  <path d="M0,80 Q10,70 20,75 T40,50 T60,60 T80,30 T100,20 L100,100 L0,100 Z" fill="url(#chartGrad)" opacity="0.3" />
                  <path d="M0,80 Q10,70 20,75 T40,50 T60,60 T80,30 T100,20" fill="none" stroke="#c0c1ff" strokeWidth="2" vectorEffect="non-scaling-stroke" opacity="0.3" />
                </>
              )}
            </svg>
          </div>
        </section>

        {/* Bottom grid: Platform breakdown + Leaderboard */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Platform Breakdown */}
          <section className="bg-surface-container/40 border border-outline-variant/30 rounded-xl p-6 backdrop-blur-md">
            <h3 className="font-headline text-lg font-semibold text-on-surface mb-6">Platform Breakdown</h3>
            <div className="space-y-4">
              {byPlatform.length > 0 ? (
                byPlatform.map((p) => {
                  const pct = Math.round((p.total / totalPlatform) * 100);
                  return (
                    <div key={p.platform}>
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-3">
                          <span className="w-2 h-2 rounded-full bg-primary" />
                          <span className="font-headline text-sm font-semibold capitalize">{p.platform}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-on-surface-variant code-font text-xs">Rp {formatRpFull(p.total)}</span>
                          <span className="font-headline text-xs font-semibold text-primary">{pct}%</span>
                        </div>
                      </div>
                      <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center text-on-surface-variant text-sm py-8">No platform data yet</div>
              )}
            </div>
          </section>

          {/* Leaderboard */}
          <section className="bg-surface-container/40 border border-outline-variant/30 rounded-xl flex flex-col backdrop-blur-md overflow-hidden">
            <div className="p-4 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-high/50">
              <h3 className="font-headline text-lg font-semibold text-on-surface">Top Donors</h3>
              <span className="font-headline text-xs font-semibold text-on-surface-variant">{PERIODS[periodIdx].label}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant/30 bg-surface-container-low text-on-surface-variant font-headline text-xs font-semibold uppercase tracking-wider">
                    <th className="p-4 font-normal">Rank</th>
                    <th className="p-4 font-normal">Donor</th>
                    <th className="p-4 font-normal text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b border-outline-variant/10">
                        <td colSpan={3} className="p-4"><div className="h-4 rounded bg-surface-container animate-pulse" /></td>
                      </tr>
                    ))
                  ) : board.length === 0 ? (
                    <tr><td colSpan={3} className="p-8 text-center text-on-surface-variant">No donors yet</td></tr>
                  ) : (
                    board.slice(0, 10).map((e) => (
                      <tr key={e.rank} className={`border-b border-outline-variant/10 hover:bg-surface-container-high/30 transition-colors ${e.rank === 1 ? "bg-primary/5" : ""}`}>
                        <td className={`p-4 font-headline font-semibold ${e.rank === 1 ? "text-primary" : "text-on-surface-variant"}`}>
                          #{String(e.rank).padStart(2, "0")}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {e.rank <= 3 && (
                              <div className={`w-8 h-8 rounded flex items-center justify-center text-[10px] font-bold ${
                                e.rank === 1 ? "bg-primary/20 text-primary border border-primary/30" : "bg-surface-variant text-on-surface-variant"
                              }`}>
                                {e.donor_name[0]?.toUpperCase()}
                              </div>
                            )}
                            <span className="font-medium text-on-surface">{e.donor_name}</span>
                          </div>
                        </td>
                        <td className="p-4 text-right font-headline font-semibold text-secondary mono-nums">
                          Rp {formatRpFull(e.total_amount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

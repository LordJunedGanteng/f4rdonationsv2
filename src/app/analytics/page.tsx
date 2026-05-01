"use client";
import { useState, useEffect, useCallback } from "react";
import { api, formatRp, formatRpFull, PLATFORM_COLOR, type StatsResponse, type LeaderboardEntry } from "@/lib/api";
import { useLicenseKey } from "@/lib/use-license";

const PERIODS = [
  { label: "7d",       timeframe: "week"    },
  { label: "30d",      timeframe: "month"   },
  { label: "All Time", timeframe: "alltime" },
];

const PLATFORM_DOT: Record<string, string> = {
  saweria:    "bg-primary",
  socialbuzz: "bg-secondary",
  bagibagi:   "bg-tertiary",
};

export default function AnalyticsPage() {
  const { key } = useLicenseKey();
  const [periodIdx, setPeriodIdx] = useState(0);
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
  const maxDonor = board[0]?.total_amount || 1;

  const bars = stats?.by_day ?? [];
  const maxBar = Math.max(...bars.map((b) => b.total), 1);

  // SVG path from by_day data (last 7 points)
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
    <div className="px-4 pb-12 flex flex-col gap-6 max-w-lg mx-auto">
      {/* Header + period tabs */}
      <section className="flex flex-col gap-4 pt-4">
        <div>
          <span className="font-headline uppercase tracking-widest text-[10px] font-bold text-primary">System Monitoring</span>
          <h2 className="text-3xl font-bold font-headline tracking-tight mt-1">Analytics Hub</h2>
        </div>
        <div className="flex p-1 bg-surface-container-low rounded-xl gap-1">
          {PERIODS.map((p, i) => (
            <button key={p.label} onClick={() => setPeriodIdx(i)}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg whitespace-nowrap transition-all ${
                periodIdx === i
                  ? "bg-gradient-to-br from-primary to-primary-container text-white shadow-lg"
                  : "text-on-surface-variant hover:bg-surface-container-highest"
              }`}
            >{p.label}</button>
          ))}
        </div>
      </section>

      {/* Bento stats */}
      <section className="grid grid-cols-2 gap-4">
        <div className="col-span-2 bg-surface-container-highest p-5 rounded-xl flex flex-col gap-1 border border-outline-variant/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-16 -mt-16 transition-transform group-hover:scale-125 duration-500" style={{ background: "rgba(174,198,255,0.1)" }} />
          <span className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">Total IDR Raised</span>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-black font-headline text-primary tracking-tighter">
              {loading ? "—" : formatRp(t?.total ?? 0)}
            </span>
            <span className="text-xs text-on-surface-variant font-bold mb-1.5">Rp</span>
          </div>
        </div>
        {[
          { label: "Unique Donors", value: loading ? "—" : String(t?.unique_donors ?? 0) },
          { label: "Avg Donation",  value: loading ? "—" : `Rp ${formatRp(t?.avg ?? 0)}` },
        ].map(({ label, value }) => (
          <div key={label} className="bg-surface-container p-4 rounded-xl flex flex-col gap-1 border border-outline-variant/5">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{label}</span>
            <span className="text-2xl font-bold font-headline">{value}</span>
          </div>
        ))}
      </section>

      {/* Trend chart */}
      <section className="bg-surface-container-low p-6 rounded-xl relative overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold font-headline tracking-tight">Donation Trend</h3>
          <span className="text-[10px] text-on-surface-variant uppercase tracking-widest">Last 7 days</span>
        </div>
        <div className="h-48 w-full relative">
          <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
            <defs>
              <linearGradient id="lineGrad" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#aec6ff" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#aec6ff" stopOpacity="0" />
              </linearGradient>
            </defs>
            {svgPath ? (
              <>
                <path d={svgArea} fill="url(#lineGrad)" />
                <path d={svgPath} fill="none" stroke="#aec6ff" strokeWidth="2" vectorEffect="non-scaling-stroke" />
              </>
            ) : (
              <>
                <path d="M0,80 Q10,75 20,60 T40,40 T60,50 T80,20 T100,30 V100 H0 Z" fill="url(#lineGrad)" opacity="0.3" />
                <path d="M0,80 Q10,75 20,60 T40,40 T60,50 T80,20 T100,30" fill="none" stroke="#aec6ff" strokeWidth="2" vectorEffect="non-scaling-stroke" opacity="0.3" />
              </>
            )}
          </svg>
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-10">
            {[0,1,2,3].map(i => <div key={i} className="w-full h-px bg-white" />)}
          </div>
        </div>
        <div className="flex justify-between mt-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest px-1">
          {pts.length > 0
            ? pts.map((b) => <span key={b.day}>{new Date(b.day).toLocaleDateString("id-ID", { weekday: "short" })}</span>)
            : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => <span key={d}>{d}</span>)
          }
        </div>
      </section>

      {/* Platform donut */}
      <section className="bg-surface-container-low p-6 rounded-xl">
        <h3 className="text-lg font-bold font-headline tracking-tight mb-6">Platform Breakdown</h3>
        <div className="flex items-center gap-8">
          <div className="relative w-32 h-32 flex-shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none" stroke="#1e3c72" strokeWidth="4" strokeDasharray="100,100" />
              {(() => {
                let offset = 0;
                const colors = ["#aec6ff", "#d2bbff", "#86efac"];
                return byPlatform.slice(0, 3).map((p, i) => {
                  const pct = Math.round((p.total / totalPlatform) * 100);
                  const el = (
                    <path key={p.platform}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none" stroke={colors[i]} strokeWidth="4"
                      strokeDasharray={`${pct},100`}
                      strokeDashoffset={`-${offset}`}
                      strokeLinecap="round" />
                  );
                  offset += pct;
                  return el;
                });
              })()}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-black font-headline leading-none">
                {byPlatform[0] ? Math.round((byPlatform[0].total / totalPlatform) * 100) + "%" : "—"}
              </span>
              <span className="text-[8px] font-bold text-on-surface-variant uppercase tracking-widest">
                {byPlatform[0]?.platform ?? "—"}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-3 flex-1">
            {byPlatform.length > 0
              ? byPlatform.map((p) => (
                  <div key={p.platform} className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${PLATFORM_DOT[p.platform] ?? "bg-primary"}`} />
                    <span className="text-xs font-semibold capitalize">{p.platform}</span>
                    <span className="text-xs text-on-surface-variant ml-auto">
                      {Math.round((p.total / totalPlatform) * 100)}%
                    </span>
                  </div>
                ))
              : [["Saweria","bg-primary"],["SocialBuzz","bg-secondary"],["BagiBagi","bg-tertiary"]].map(([l, cls]) => (
                  <div key={l} className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${cls}`} />
                    <span className="text-xs font-semibold text-on-surface-variant">{l}</span>
                    <span className="text-xs text-on-surface-variant ml-auto">—</span>
                  </div>
                ))
            }
          </div>
        </div>
      </section>

      {/* Top donors */}
      <section className="bg-surface-container-low p-6 rounded-xl">
        <h3 className="text-lg font-bold font-headline tracking-tight mb-6">Top Donors — {PERIODS[periodIdx].label}</h3>
        <div className="flex flex-col gap-5">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-8 rounded-lg bg-surface-container-high animate-pulse" />
              ))
            : board.length === 0
            ? <div className="text-center text-on-surface-variant text-sm py-4">No donors yet</div>
            : board.slice(0, 5).map((e) => {
                const pct = Math.round((e.total_amount / maxDonor) * 100);
                return (
                  <div key={e.rank} className="flex flex-col gap-2">
                    <div className="flex justify-between items-center px-1">
                      <span className="text-xs font-bold font-headline">{e.donor_name}</span>
                      <span className={`text-xs font-bold ${PLATFORM_COLOR[e.platform] ?? "text-primary"}`}>
                        Rp {formatRpFull(e.total_amount)}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-primary to-primary-container transition-all duration-700" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
          }
        </div>
      </section>
    </div>
  );
}

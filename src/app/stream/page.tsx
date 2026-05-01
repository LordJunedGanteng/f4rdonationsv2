"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { api, formatRpFull, PLATFORM_COLOR, PLATFORM_LABEL, type Donation } from "@/lib/api";
import { useLicenseKey } from "@/lib/use-license";

const PLATFORM_ICON: Record<string, string> = {
  saweria:    "volunteer_activism",
  socialbuzz: "payments",
  bagibagi:   "card_giftcard",
};

const PLATFORM_BG: Record<string, string> = {
  saweria:    "bg-primary/10 border-primary/20",
  socialbuzz: "bg-secondary/10 border-secondary/20",
  bagibagi:   "bg-tertiary/10 border-tertiary/20",
};

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export default function StreamPage() {
  const { key } = useLicenseKey();
  const [feed, setFeed] = useState<(Donation & { _new?: boolean })[]>([]);
  const [live, setLive] = useState(true);
  const [lastPoll, setLastPoll] = useState<string | null>(null);
  const seenIds = useRef(new Set<string>());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const poll = useCallback(async () => {
    if (!key || !live) return;
    try {
      const res = await api.donations.recent(key, 30);
      const incoming = (res.donations ?? []).filter((d) => {
        const id = d.donation_id ?? `${d.donor_name}_${d.timestamp}`;
        return !seenIds.current.has(id);
      });

      if (incoming.length > 0) {
        incoming.forEach((d) => {
          const id = d.donation_id ?? `${d.donor_name}_${d.timestamp}`;
          seenIds.current.add(id);
        });
        const tagged = incoming.map((d) => ({ ...d, _new: true }));
        setFeed((prev) => [...tagged, ...prev].slice(0, 50));

        // clear _new flag after 3s
        setTimeout(() => {
          setFeed((prev) => prev.map((d) => ({ ...d, _new: false })));
        }, 3000);
      }
      setLastPoll(new Date().toLocaleTimeString("id-ID"));
    } catch { /* silent */ }
  }, [key, live]);

  // Seed with initial data on mount
  useEffect(() => {
    if (!key) return;
    (async () => {
      try {
        const res = await api.donations.recent(key, 30);
        const list = res.donations ?? [];
        list.forEach((d) => {
          const id = d.donation_id ?? `${d.donor_name}_${d.timestamp}`;
          seenIds.current.add(id);
        });
        setFeed(list);
      } catch { /* silent */ }
    })();
  }, [key]);

  useEffect(() => {
    if (live) {
      intervalRef.current = setInterval(poll, 3000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [live, poll]);

  return (
    <div className="px-4 pb-12 max-w-lg mx-auto">
      {/* Header */}
      <section className="flex items-center justify-between pt-4 mb-6">
        <div>
          <p className="font-headline uppercase tracking-widest text-[10px] font-bold text-primary">Real-Time Feed</p>
          <h2 className="text-3xl font-bold font-headline tracking-tight mt-1">Live Stream</h2>
        </div>
        <div className="flex flex-col items-end gap-1">
          <button onClick={() => setLive((v) => !v)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
              live
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "bg-surface-container text-on-surface-variant border border-outline-variant/20"
            }`}>
            <span className={`w-2 h-2 rounded-full ${live ? "bg-emerald-400 shadow-[0_0_8px_#10b981] animate-pulse" : "bg-outline"}`} />
            {live ? "Live" : "Paused"}
          </button>
          {lastPoll && <span className="text-[9px] text-outline font-mono">Last: {lastPoll}</span>}
        </div>
      </section>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Total events", value: String(feed.length) },
          { label: "Platforms", value: String(new Set(feed.map((d) => d.platform)).size) },
          { label: "Donors", value: String(new Set(feed.map((d) => d.donor_name)).size) },
        ].map(({ label, value }) => (
          <div key={label} className="bg-surface-container-highest rounded-xl p-3 text-center border border-outline-variant/10">
            <div className="text-2xl font-black font-headline text-primary">{value}</div>
            <div className="text-[9px] text-on-surface-variant uppercase tracking-wider mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Feed */}
      <div className="space-y-3">
        {feed.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <span className="material-symbols-outlined text-4xl text-outline">stream</span>
            <p className="text-on-surface-variant text-sm">Waiting for donations…</p>
          </div>
        ) : (
          feed.map((d, i) => {
            const id = d.donation_id ?? `${d.donor_name}_${d.timestamp}_${i}`;
            return (
              <div key={id}
                className={`rounded-xl border p-4 flex items-center gap-4 transition-all duration-500 ${
                  d._new
                    ? "bg-primary/10 border-primary/30 shadow-[0_0_20px_rgba(174,198,255,0.1)]"
                    : `${PLATFORM_BG[d.platform] ?? "bg-surface-container-highest border-outline-variant/10"}`
                }`}>
                {/* Platform icon */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  d._new ? "bg-primary/20" : "bg-surface-container-low"
                }`}>
                  <span className={`material-symbols-outlined filled text-sm ${PLATFORM_COLOR[d.platform] ?? "text-primary"}`}>
                    {PLATFORM_ICON[d.platform] ?? "volunteer_activism"}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm">{d.donor_name}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full uppercase font-bold tracking-wide ${PLATFORM_COLOR[d.platform] ?? "text-primary"} bg-surface-container/60`}>
                      {PLATFORM_LABEL[d.platform] ?? d.platform}
                    </span>
                    {d._new && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold uppercase tracking-wide animate-pulse">
                        NEW
                      </span>
                    )}
                  </div>
                  {d.message && (
                    <p className="text-xs text-on-surface-variant mt-0.5 truncate">{d.message}</p>
                  )}
                </div>

                {/* Amount + time */}
                <div className="flex flex-col items-end flex-shrink-0">
                  <span className={`font-extrabold font-headline text-sm ${PLATFORM_COLOR[d.platform] ?? "text-primary"}`}>
                    Rp {formatRpFull(d.amount)}
                  </span>
                  <span className="text-[9px] text-outline mt-0.5">{timeAgo(d.timestamp)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

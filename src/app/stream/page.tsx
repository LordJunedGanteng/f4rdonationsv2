"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { api, formatRpFull, PLATFORM_LABEL, type Donation } from "@/lib/api";
import { useLicenseKey } from "@/lib/use-license";
import AuthGate from "@/components/AuthGate";

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export default function StreamPage() {
  return (
    <AuthGate>
      <StreamContent />
    </AuthGate>
  );
}

function StreamContent() {
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
        setTimeout(() => {
          setFeed((prev) => prev.map((d) => ({ ...d, _new: false })));
        }, 3000);
      }
      setLastPoll(new Date().toLocaleTimeString("id-ID"));
    } catch { /* silent */ }
  }, [key, live]);

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
    <main className="flex-1 md:ml-64 min-h-screen bg-surface relative pt-16 md:pt-0">
      <div className="absolute top-0 left-1/4 w-1/2 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="max-w-[1280px] mx-auto px-4 md:px-8 py-8 md:py-10 space-y-6">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-surface-variant pb-6">
          <div>
            <h1 className="font-headline text-[40px] font-bold leading-[1.1] tracking-tight text-on-surface mb-2">
              Live Donations
            </h1>
            <p className="text-on-surface-variant">Real-time donation feed from all connected platforms.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLive((v) => !v)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-headline text-xs font-semibold uppercase tracking-wider transition-all ${
                live
                  ? "bg-secondary/10 text-secondary border border-secondary/20"
                  : "bg-surface-container-high text-on-surface-variant border border-outline-variant"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${live ? "bg-secondary shadow-[0_0_8px_rgba(74,225,118,0.5)] animate-pulse" : "bg-outline"}`} />
              {live ? "Live" : "Paused"}
            </button>
            {lastPoll && (
              <span className="text-xs text-outline code-font">Last: {lastPoll}</span>
            )}
          </div>
        </header>

        {/* Stats row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: "receipt_long", label: "Total Events", value: String(feed.length) },
            { icon: "hub", label: "Platforms", value: String(new Set(feed.map((d) => d.platform)).size) },
            { icon: "group", label: "Unique Donors", value: String(new Set(feed.map((d) => d.donor_name)).size) },
          ].map((stat) => (
            <div key={stat.label} className="bg-surface-container/50 border-t border-white/10 p-6 rounded-lg backdrop-blur-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <span className="material-symbols-outlined text-[64px]">{stat.icon}</span>
              </div>
              <h3 className="font-headline text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2">{stat.label}</h3>
              <p className="font-headline text-2xl font-semibold text-on-surface mono-nums">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Donation Feed Table */}
        <div className="bg-surface-container-high rounded-xl border border-surface-variant overflow-hidden">
          <div className="p-5 border-b border-surface-variant flex justify-between items-center bg-surface-container-highest/50">
            <h3 className="font-headline text-xs font-semibold uppercase tracking-widest text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">stream</span>
              Donation Stream
            </h3>
            <span className="font-headline text-xs font-semibold text-on-surface-variant">{feed.length} events</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-surface-variant/50 font-headline text-xs font-semibold uppercase tracking-wider text-outline bg-surface-container-low/50">
                  <th className="py-3 px-5 font-normal">Donor</th>
                  <th className="py-3 px-5 font-normal">Amount</th>
                  <th className="py-3 px-5 font-normal">Platform</th>
                  <th className="py-3 px-5 font-normal">Message</th>
                  <th className="py-3 px-5 font-normal">Time</th>
                  <th className="py-3 px-5 font-normal text-right">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm text-on-surface">
                {feed.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-on-surface-variant">
                      <span className="material-symbols-outlined text-4xl text-outline block mb-2">stream</span>
                      Waiting for donations...
                    </td>
                  </tr>
                ) : (
                  feed.map((d, i) => {
                    const id = d.donation_id ?? `${d.donor_name}_${d.timestamp}_${i}`;
                    return (
                      <tr
                        key={id}
                        className={`border-b border-surface-variant/30 hover:bg-surface-variant/20 transition-all duration-500 group ${
                          d._new ? "bg-primary/5" : ""
                        }`}
                      >
                        <td className="py-3 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-surface-variant flex items-center justify-center text-outline group-hover:text-primary transition-colors">
                              <span className="material-symbols-outlined text-[18px]">person</span>
                            </div>
                            <span className="font-medium">{d.donor_name}</span>
                            {d._new && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-secondary/20 text-secondary font-headline font-semibold uppercase tracking-wider animate-pulse">
                                NEW
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-5 font-headline text-base text-secondary mono-nums">
                          Rp {formatRpFull(d.amount)}
                        </td>
                        <td className="py-3 px-5 text-on-surface-variant">
                          {PLATFORM_LABEL[d.platform] ?? d.platform}
                        </td>
                        <td className="py-3 px-5 text-on-surface-variant max-w-xs truncate">
                          {d.message || "—"}
                        </td>
                        <td className="py-3 px-5 text-outline">{timeAgo(d.timestamp)}</td>
                        <td className="py-3 px-5 text-right">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-headline font-semibold bg-secondary/10 text-secondary border border-secondary/20">
                            Processed
                          </span>
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
    </main>
  );
}

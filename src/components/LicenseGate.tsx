"use client";
import { useState } from "react";
import { useLicenseKey } from "@/lib/use-license";

export default function LicenseGate({ children }: { children: React.ReactNode }) {
  const { key, ready, save } = useLicenseKey();
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="material-symbols-outlined text-primary animate-spin text-4xl">progress_activity</span>
      </div>
    );
  }

  if (!key) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-6"
        style={{ background: "rgba(11,19,38,0.92)", backdropFilter: "blur(24px)" }}>
        <div className="glass-panel rounded-2xl p-8 max-w-sm w-full border border-outline-variant/20 shadow-2xl space-y-6">
          <div className="space-y-2">
            <span className="material-symbols-outlined text-primary text-3xl filled">vpn_key</span>
            <h2 className="text-2xl font-bold font-headline">Enter License Key</h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Paste your Ethereal Command license key to access the dashboard.
            </p>
          </div>
          <div className="space-y-3">
            <input
              className="w-full bg-surface-container-lowest rounded-xl py-3.5 px-4 font-mono text-sm text-primary placeholder:text-outline-variant focus:ring-1 focus:ring-primary/40 outline-none"
              placeholder="ETH-CMD-XXXX-XXXX-XXXX"
              value={input}
              onChange={(e) => { setInput(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
            {error && <p className="text-xs text-error px-1">{error}</p>}
            <button
              onClick={handleSave}
              className="w-full py-3.5 rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold text-sm active:scale-95 transition-all shadow-[0_8px_16px_rgba(30,60,114,0.3)]"
            >
              Unlock Dashboard
            </button>
          </div>
          <p className="text-[10px] text-outline text-center">
            No license? Create one via the API or contact your admin.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;

  function handleSave() {
    if (!input.trim()) { setError("Please enter a license key"); return; }
    save(input.trim());
  }
}

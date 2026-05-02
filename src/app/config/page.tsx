"use client";

import { useEffect, useState } from "react";
import { api, getWebhookUrls, type GameEntry } from "@/lib/api";
import { getLicenseKey, useAuth } from "@/lib/auth";
import AuthGate from "@/components/AuthGate";

export default function ConfigPage() {
  return (
    <AuthGate>
      <ConfigContent />
    </AuthGate>
  );
}

function ConfigContent() {
  const { user } = useAuth();
  const [game, setGame] = useState<GameEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState(false);
  const [testStatus, setTestStatus] = useState<Record<string, { status: string; time: string }>>({});

  useEffect(() => {
    const key = getLicenseKey();
    if (!key || !user?.user_id) { setLoading(false); return; }
    api.license.list(user.user_id).then((res) => {
      const lic = res.licenses?.find((l) => l.license_key === key);
      if (lic?.game_id) {
        api.games.get(lic.game_id).then((g) => setGame(g.game)).catch(() => {});
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user?.user_id]);

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const webhookUrls = game ? getWebhookUrls(game.game_id) : null;

  const testWebhook = async (platform: string) => {
    if (!game) return;
    const url = webhookUrls?.[platform];
    if (!url) return;
    const start = Date.now();
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ donor_name: "TestUser", amount: 10000, message: `Test from dashboard (${platform})` }),
      });
      const ms = Date.now() - start;
      setTestStatus((prev) => ({
        ...prev,
        [platform]: { status: res.ok ? `${res.status} OK` : `${res.status} Error`, time: `${ms}ms` },
      }));
    } catch {
      setTestStatus((prev) => ({ ...prev, [platform]: { status: "Failed", time: "—" } }));
    }
  };

  return (
    <main className="flex-1 md:ml-64 min-h-screen bg-surface pt-16 md:pt-0">
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <header className="mb-8">
          <h2 className="font-headline text-[40px] font-bold leading-[1.1] tracking-tight text-on-surface mb-2">
            Integration & Testing
          </h2>
          <p className="text-lg text-on-surface-variant max-w-2xl">
            Manage your active webhooks and test donation triggers directly from the portal.
          </p>
        </header>

        {loading ? (
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="glass-panel rounded-xl p-6 h-32 animate-pulse" />
            ))}
          </div>
        ) : !game ? (
          <div className="glass-panel rounded-xl p-8 text-center">
            <span className="material-symbols-outlined text-4xl text-outline mb-4 block">hub</span>
            <p className="text-on-surface-variant">No game linked to your license. Contact admin to set up your integration.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Secret Key Management */}
            <section className="glass-panel rounded-xl p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">key</span>
                  <h3 className="font-headline text-2xl font-semibold text-on-surface">Secret Key</h3>
                </div>
                <span className="px-2 py-1 rounded bg-secondary/10 text-secondary border border-secondary/20 font-headline text-[10px] font-semibold uppercase tracking-wider">
                  ACTIVE
                </span>
              </div>
              <p className="text-on-surface-variant mb-4">
                Use this key to authenticate requests from f4r Services to your application endpoint.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <input
                    className="w-full bg-surface-container-highest border border-outline-variant rounded-lg py-3 px-4 text-on-surface code-font text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                    readOnly
                    type={showSecret ? "text" : "password"}
                    value={game.secret_key}
                  />
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors"
                    onClick={() => setShowSecret(!showSecret)}
                  >
                    <span className="material-symbols-outlined text-sm">{showSecret ? "visibility_off" : "visibility"}</span>
                  </button>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => copy(game.secret_key, "secret")}
                    className="bg-surface-container-high hover:bg-surface-variant border border-outline-variant rounded-lg py-2 px-4 flex items-center gap-2 transition-all text-on-surface"
                  >
                    <span className="material-symbols-outlined text-sm">{copied === "secret" ? "check" : "content_copy"}</span>
                    <span className="font-headline text-xs font-semibold uppercase tracking-wider">{copied === "secret" ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>
              <div className="mt-4 text-xs text-outline flex items-start gap-2">
                <span className="material-symbols-outlined text-[14px]">info</span>
                <p>Keep your secret key confidential. Do not expose it in client-side code.</p>
              </div>
            </section>

            {/* Webhook URLs */}
            <section className="glass-panel rounded-xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <span className="material-symbols-outlined text-primary">link</span>
                <h3 className="font-headline text-2xl font-semibold text-on-surface">Webhook URLs</h3>
              </div>
              <div className="flex flex-col gap-3">
                {webhookUrls && Object.entries(webhookUrls).map(([platform, url]) => (
                  <div key={platform} className="bg-surface-container-highest/50 border border-outline-variant rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-headline text-[10px] text-primary uppercase font-semibold tracking-wider">{platform}</p>
                      <button
                        onClick={() => copy(url, platform)}
                        className="text-outline hover:text-primary transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {copied === platform ? "check" : "content_copy"}
                        </span>
                      </button>
                    </div>
                    <code className="text-on-surface code-font text-xs break-all">{url}</code>
                  </div>
                ))}
              </div>
            </section>

            {/* Webhook Testing Suite */}
            <section className="glass-panel rounded-xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <span className="material-symbols-outlined text-primary">bug_report</span>
                <h3 className="font-headline text-2xl font-semibold text-on-surface">Webhook Testing Suite</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {["saweria", "socialbuzz", "bagibagi", "trakteer"].map((platform) => {
                  const result = testStatus[platform];
                  const isOk = result?.status.includes("OK");
                  return (
                    <div key={platform} className="border border-outline-variant rounded-lg p-4 bg-surface-container-low hover:border-primary/50 transition-colors">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-headline text-xs font-semibold uppercase tracking-wider text-on-surface capitalize">{platform} Event</h4>
                        <span className="px-2 py-0.5 rounded-full bg-surface-variant text-outline text-[10px] code-font border border-outline-variant">POST</span>
                      </div>
                      <p className="text-xs text-outline mb-4">
                        Simulate a donation from {platform} with test payload.
                      </p>
                      {result && (
                        <div className={`mb-3 text-xs code-font flex items-center gap-2 ${isOk ? "text-secondary" : "text-error"}`}>
                          <span className="material-symbols-outlined text-[14px]">{isOk ? "check_circle" : "error"}</span>
                          {result.status} — {result.time}
                        </div>
                      )}
                      <button
                        onClick={() => testWebhook(platform)}
                        className="w-full bg-primary text-on-primary font-headline text-xs font-semibold uppercase tracking-wider py-2 rounded flex items-center justify-center gap-2 hover:bg-primary-container transition-colors shadow-[0_0_10px_rgba(192,193,255,0.2)]"
                      >
                        <span className="material-symbols-outlined text-[16px]">send</span>
                        Test {platform}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Setup Guide */}
            <section className="glass-panel rounded-xl p-6 border-l-4 border-l-primary">
              <h3 className="font-headline text-2xl font-semibold text-on-surface mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">menu_book</span>
                Setup Guide
              </h3>
              <ol className="space-y-4 relative before:absolute before:inset-y-0 before:left-[11px] before:w-[2px] before:bg-outline-variant/30">
                {[
                  { title: "Copy Webhook URL", desc: "Paste the webhook URL for your platform (e.g., Saweria) into the platform's webhook settings." },
                  { title: "Set Up Roblox Script", desc: "Add the polling script to ServerScriptService — it fetches pending donations every 5 seconds." },
                  { title: "Test & Deploy", desc: "Use the testing suite above to verify your webhook is receiving and processing events correctly." },
                ].map((step, i) => (
                  <li key={i} className="relative pl-8">
                    <div className="absolute left-0 top-0 w-6 h-6 rounded-full bg-surface-container-highest border border-outline-variant flex items-center justify-center font-headline text-[10px] font-semibold text-primary">
                      {i + 1}
                    </div>
                    <h4 className="font-headline text-xs font-semibold uppercase tracking-wider text-on-surface mb-1">{step.title}</h4>
                    <p className="text-xs text-outline">{step.desc}</p>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}

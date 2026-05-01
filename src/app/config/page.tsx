"use client";
import { useState, useEffect, useCallback } from "react";
import { api, PlatformConfig } from "@/lib/api";
import AuthGate from "@/components/AuthGate";

// Hardcoded DEMO_USER_ID removed as AuthGate uses JWT auth using headers.

type PlatformDef = {
  id:        string;
  name:      string;
  color:     string;
  borderCls: string;
  badgeCls:  string;
  saveCls:   string;
  ringCls:   string;
};

const PLATFORMS: PlatformDef[] = [
  {
    id: "saweria", name: "Saweria",
    color: "text-primary", borderCls: "gradient-border-saweria",
    badgeCls: "bg-primary-container/20 text-primary-fixed",
    saveCls: "from-primary to-primary-container text-on-primary shadow-[0_8px_16px_rgba(30,60,114,0.3)]",
    ringCls: "focus:ring-primary/40",
  },
  {
    id: "socialbuzz", name: "SocialBuzz",
    color: "text-secondary", borderCls: "gradient-border-socialbuzz",
    badgeCls: "bg-secondary-container/20 text-secondary-fixed",
    saveCls: "from-secondary to-secondary-container text-white shadow-[0_8px_16px_rgba(90,0,198,0.3)]",
    ringCls: "focus:ring-secondary/40",
  },
  {
    id: "bagibagi", name: "BagiBagi",
    color: "text-tertiary", borderCls: "gradient-border-bagibagi",
    badgeCls: "bg-tertiary-container/20 text-tertiary-fixed",
    saveCls: "from-tertiary to-tertiary-container text-on-tertiary-fixed shadow-[0_8px_16px_rgba(96,50,0,0.3)]",
    ringCls: "focus:ring-tertiary/40",
  },
  {
    id: "trakteer", name: "Trakteer",
    color: "text-error", borderCls: "border-error/20 hover:border-error/40 transition-colors",
    badgeCls: "bg-error/10 text-error",
    saveCls: "from-error to-error/80 text-white shadow-[0_8px_16px_rgba(192,21,21,0.3)]",
    ringCls: "focus:ring-error/40",
  },
];

function PlatformCard({
  p,
  config,
  onRefresh,
}: {
  p: PlatformDef;
  config: PlatformConfig | undefined;
  onRefresh: () => void;
}) {
  const [show, setShow] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [savingKey, setSavingKey] = useState(false);
  const [generatingSecret, setGeneratingSecret] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"ok" | "fail" | null>(null);
  const [copied, setCopied] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);

  const isActive    = config?.is_active ?? false;
  const webhookUrl  = config?.webhook_url ?? null;
  const hasSecret   = !!config?.webhook_secret;
  const platformApiKey = config?.platform_api_key ?? null;

  // ── Generate/regenerate secret ────────────────────────────────────────────
  const handleGenerateSecret = async () => {
    setGeneratingSecret(true);
    try {
      await api.platform.generateSecret(p.id);
      onRefresh();
    } catch { /* ignore */ }
    finally { setGeneratingSecret(false); }
  };

  // ── Save API key ──────────────────────────────────────────────────────────
  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) return;
    setSavingKey(true);
    try {
      await api.platform.saveApiKey(p.id, apiKey.trim());
      setApiKey("");
      onRefresh();
    } catch { /* ignore */ }
    finally { setSavingKey(false); }
  };

  // ── Toggle active state ───────────────────────────────────────────────────
  const handleToggle = async () => {
    setToggleLoading(true);
    try {
      await api.platform.toggle(p.id, !isActive);
      onRefresh();
    } catch { /* ignore */ }
    finally { setToggleLoading(false); }
  };

  // ── Copy webhook URL ──────────────────────────────────────────────────────
  const copyWebhook = () => {
    if (!webhookUrl) return;
    navigator.clipboard.writeText(webhookUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  const copyPlatformApiKey = () => {
    if (!platformApiKey) return;
    navigator.clipboard.writeText(platformApiKey).then(() => {
    }).catch(() => {});
  };

  // ── Test connection ───────────────────────────────────────────────────────
  const handleTest = async () => {
    if (!webhookUrl) return;
    setTesting(true);
    setTestResult(null);
    try {
      const payload = p.id === 'trakteer' ? {
        tr_id: "test_" + Math.random().toString(36).slice(2,8),
        supporter_name: "Test User",
        unit_value: 1000,
        quantity: 1,
        supporter_message: "Test ping"
      } : {
        donation_id: "test_" + Math.random().toString(36).slice(2,8),
        donor_name: "Test User",
        amount: 1000,
        currency: "IDR",
        message: "Test ping",
      };

      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setTestResult(res.ok ? "ok" : "fail");
    } catch {
      setTestResult("fail");
    } finally {
      setTesting(false);
      setTimeout(() => setTestResult(null), 4000);
    }
  };

  return (
    <section className={`${p.borderCls} rounded-xl overflow-hidden shadow-2xl`}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h3 className={`text-xl font-bold font-headline ${p.color}`}>{p.name}</h3>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isActive ? "bg-emerald-400 shadow-[0_0_8px_#10b981]" : "bg-error shadow-[0_0_8px_rgba(255,180,171,0.5)]"}`} />
              <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                {isActive ? "System Online" : "System Offline"}
              </span>
            </div>
          </div>
          <button
            onClick={handleToggle}
            disabled={toggleLoading}
            className="relative inline-flex items-center cursor-pointer"
            title={isActive ? "Disable" : "Enable"}
          >
            <div className={`w-11 h-6 rounded-full transition-colors duration-200 ${isActive ? "bg-primary-container" : "bg-surface-container-highest"}`}>
              <div className={`absolute top-[2px] left-[2px] bg-white border border-gray-200 rounded-full h-5 w-5 transition-all duration-200 ${isActive ? "translate-x-5" : "translate-x-0"}`} />
            </div>
          </button>
        </div>

        {/* Webhook URL with Generate button */}
        <div className="space-y-2">
          <div className="flex items-center justify-between ml-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              Webhook URL
            </label>
            <button
              onClick={handleGenerateSecret}
              disabled={generatingSecret}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md transition-all active:scale-95 flex items-center gap-1 ${
                hasSecret
                  ? "bg-surface-variant/40 text-on-surface-variant hover:bg-surface-variant/70"
                  : `${p.badgeCls} hover:opacity-80`
              }`}
            >
              {generatingSecret
                ? <><span className="material-symbols-outlined text-xs animate-spin">progress_activity</span>Generating…</>
                : hasSecret
                  ? <><span className="material-symbols-outlined text-xs">refresh</span>Regenerate</>
                  : <><span className="material-symbols-outlined text-xs">key</span>Generate Secret</>
              }
            </button>
          </div>

          {webhookUrl ? (
            <div className="relative">
              <input
                className="w-full bg-surface-container-lowest rounded-lg py-3 px-4 font-mono text-xs text-on-surface-variant truncate pr-12 outline-none"
                type="text"
                readOnly
                value={webhookUrl}
              />
              <button
                onClick={copyWebhook}
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:opacity-80 transition-all active:scale-90 ${p.badgeCls}`}
                title="Copy to clipboard"
              >
                <span className="material-symbols-outlined text-lg">
                  {copied ? "check" : "content_copy"}
                </span>
              </button>
            </div>
          ) : (
            <div className="bg-surface-container-lowest rounded-lg py-3 px-4 text-xs text-outline/60 italic">
              Click &quot;Generate Secret&quot; to create your unique webhook URL
            </div>
          )}

          {webhookUrl && (
            <p className="text-[10px] text-outline px-1">
              Paste this URL into your {p.name} webhook settings. Incoming donations trigger real-time notifications.
            </p>
          )}
        </div>

        {/* API Key */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">
            API Key
            {config?.has_api_key && (
               <span className="ml-2 text-emerald-400 normal-case font-normal text-xs">✓ saved</span>
            )}
          </label>
          <div className="relative">
            <input
              className={`w-full bg-surface-container-lowest rounded-lg py-3 px-4 font-mono text-sm ${p.color} focus:ring-1 ${p.ringCls} outline-none`}
              type={show ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={config?.has_api_key ? "Enter new key to update…" : `Enter ${p.name} API Key (optional)`}
              onKeyDown={(e) => e.key === "Enter" && handleSaveApiKey()}
            />
            <button
              onClick={() => setShow(!show)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined text-lg">{show ? "visibility_off" : "visibility"}</span>
            </button>
          </div>
        </div>

        {/* Roblox API Key */}
        <div className="space-y-2">
          <div className="flex items-center justify-between ml-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              Roblox Config Key
            </label>
          </div>

          <div className="relative">
            <input
              className="w-full bg-surface-container-lowest rounded-lg py-3 px-4 font-mono text-xs text-on-surface-variant truncate pr-16 outline-none"
              type="text"
              readOnly
              value={platformApiKey || "N/A (Generate key first)"}
            />
            {platformApiKey && (
              <button
                onClick={copyPlatformApiKey}
                className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase px-2 py-1 rounded-md hover:opacity-80 transition-all active:scale-90 ${p.badgeCls}`}
              >
                Copy
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 flex flex-col gap-3">
          {testResult && (
            <div className={`flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-lg ${
              testResult === "ok" ? "bg-emerald-500/20 text-emerald-400" : "bg-error/20 text-error"
            }`}>
              <span className="material-symbols-outlined text-sm filled">
                {testResult === "ok" ? "check_circle" : "error"}
              </span>
              {testResult === "ok" ? "Webhook reachable ✓" : "Connection failed — check worker deployment"}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleTest}
              disabled={testing || !webhookUrl}
              className="py-3 px-4 rounded-lg bg-surface-variant/40 border border-outline-variant/15 text-sm font-semibold hover:bg-surface-variant/60 transition-all active:scale-95 disabled:opacity-40 flex items-center justify-center gap-1.5"
            >
              {testing && <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>}
              Test Connection
            </button>
            <button
              onClick={handleSaveApiKey}
              disabled={savingKey || !apiKey.trim()}
              className={`py-3 px-4 rounded-lg bg-gradient-to-br text-sm font-bold active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 ${p.saveCls}`}
            >
              {savingKey && <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>}
              {savingKey ? "Saving…" : "Save API Key"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function ConfigPage() {
  return (
    <AuthGate>
      <ConfigContent />
    </AuthGate>
  )
}

function ConfigContent() {
  const [configs, setConfigs] = useState<PlatformConfig[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConfigs = useCallback(async () => {
    try {
      const res = await api.platform.getConfigs();
      setConfigs(res.configs);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchConfigs(); }, [fetchConfigs]);

  const getConfig = (platformId: string) =>
    configs.find(c => c.platform === platformId);

  return (
    <div className="px-4 pb-12 max-w-lg mx-auto space-y-8">
      <div className="space-y-2 pt-6 px-2">
        <h2 className="text-3xl font-bold font-headline tracking-tight text-primary">Integration Vault</h2>
        <p className="text-on-surface-variant text-sm leading-relaxed">
          Securely manage your donation stream endpoints and platform authentication keys.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 gap-3 text-on-surface-variant">
          <span className="material-symbols-outlined animate-spin">progress_activity</span>
          Loading platform configs…
        </div>
      ) : (
        PLATFORMS.map((p) => (
          <PlatformCard
            key={p.id}
            p={p}
            config={getConfig(p.id)}
            onRefresh={fetchConfigs}
          />
        ))
      )}
    </div>
  );
}


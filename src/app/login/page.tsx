"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setToken, setLicenseKey } from "@/lib/auth";
import { apiCall } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [licenseKey, setLicenseKeyInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await apiCall<{ token: string; role: "admin" | "user"; user_id: number }>("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: email, password }),
      });
      setToken(res.token);

      if (res.role === "user") {
        const licRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/licenses?user_id=${res.user_id}`);
        const licData = await licRes.json();
        const activeLic = licData.licenses?.find((l: { status: string }) => l.status === "active");
        if (activeLic) setLicenseKey(activeLic.license_key);
      }

      router.push(res.role === "admin" ? "/admin" : "/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!licenseKey.trim()) {
      setError("A valid license key is required for registration.");
      return;
    }
    setLoading(true);
    try {
      const res = await apiCall<{ token: string; role: "admin" | "user"; user_id: number }>("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: regUsername, password, license_key: licenseKey }),
      });
      setToken(res.token);
      setLicenseKey(licenseKey);
      router.push("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative selection:bg-primary/30 selection:text-primary">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-grid-pattern opacity-50" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[500px] bg-primary/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-inverse-primary/10 blur-[120px] rounded-full" />
      </div>

      {/* Header */}
      <header className="relative z-50 bg-surface/50 backdrop-blur-xl border-b border-outline-variant/30 flex justify-between items-center px-8 py-4 w-full">
        <div className="text-2xl font-bold font-headline tracking-tighter text-primary flex items-center gap-2">
          <span className="material-symbols-outlined">layers</span>
          f4r Services
        </div>
      </header>

      {/* Main */}
      <main className="flex-grow flex items-center justify-center p-6 relative z-10 my-8">
        <div className="bg-surface-container rounded-2xl w-full max-w-[480px] p-10 relative border border-outline-variant/50 shadow-2xl shadow-black/50">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-surface-container-high border border-outline-variant/50 mb-6 shadow-inner">
              <span className="material-symbols-outlined text-3xl text-primary filled">vpn_key</span>
            </div>
            <h1 className="font-headline text-2xl font-semibold text-on-surface mb-3">Welcome Back</h1>
            <p className="text-on-surface-variant">Sign in or create a new account to access professional tooling.</p>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-outline-variant/50 mb-8">
            <button
              onClick={() => { setTab("login"); setError(""); }}
              className={`flex-1 pb-3 font-headline text-xs font-semibold uppercase tracking-wider text-center transition-colors ${
                tab === "login"
                  ? "text-primary border-b-2 border-primary"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              LOGIN
            </button>
            <button
              onClick={() => { setTab("register"); setError(""); }}
              className={`flex-1 pb-3 font-headline text-xs font-semibold uppercase tracking-wider text-center transition-colors ${
                tab === "register"
                  ? "text-primary border-b-2 border-primary"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              REGISTER
            </button>
          </div>

          {error && (
            <div className="bg-error/10 border border-error/30 text-error p-3 rounded-xl mb-6 text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              {error}
            </div>
          )}

          <form onSubmit={tab === "login" ? handleLogin : handleRegister} className="flex flex-col gap-6">
            {/* Username/Email */}
            <div className="flex flex-col gap-2">
              <label className="font-headline text-xs font-semibold uppercase tracking-wider text-on-surface">
                {tab === "login" ? "Username" : "Email Address"}
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[20px] group-focus-within:text-primary transition-colors">
                  {tab === "login" ? "person" : "mail"}
                </span>
                <input
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-3.5 pr-4 pl-11 text-on-surface focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all placeholder-on-surface-variant/50"
                  placeholder={tab === "login" ? "admin" : "dev@f4r.services"}
                  type="text"
                  value={tab === "login" ? email : regUsername}
                  onChange={(e) => tab === "login" ? setEmail(e.target.value) : setRegUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-2">
              <label className="font-headline text-xs font-semibold uppercase tracking-wider text-on-surface">Password</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[20px] group-focus-within:text-primary transition-colors">lock</span>
                <input
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-3.5 pr-4 pl-11 text-on-surface focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all placeholder-on-surface-variant/50"
                  placeholder="••••••••"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Register: License Key */}
            {tab === "register" && (
              <>
                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-outline-variant/30" />
                  <span className="flex-shrink-0 mx-4 font-headline text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                    LICENSE KEY REQUIRED
                  </span>
                  <div className="flex-grow border-t border-outline-variant/30" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-headline text-xs font-semibold uppercase tracking-wider text-on-surface">
                    License Key <span className="text-error">*</span>
                  </label>
                  <div className="relative group">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-error/70 text-[20px] group-focus-within:text-error transition-colors">key</span>
                    <input
                      className="w-full bg-surface-container-lowest border border-error/50 rounded-xl py-3 pr-4 pl-11 text-on-surface focus:outline-none focus:border-error focus:ring-4 focus:ring-error/10 transition-all placeholder-on-surface-variant/50 text-sm"
                      placeholder="F4R-XXXX-XXXX"
                      type="text"
                      value={licenseKey}
                      onChange={(e) => setLicenseKeyInput(e.target.value)}
                    />
                  </div>
                  <span className="font-headline text-xs font-semibold text-error mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">info</span>
                    Valid License Key is required for new registrations.
                  </span>
                </div>
              </>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full bg-primary text-on-primary font-headline text-xs font-semibold uppercase tracking-wider py-3.5 rounded-xl transition-all hover:bg-primary-fixed hover:shadow-[0_8px_20px_-4px_rgba(192,193,255,0.3)] active:scale-[0.98] duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? "Processing..." : "Authenticate"}</span>
              {!loading && <span className="material-symbols-outlined text-[18px]">arrow_forward</span>}
            </button>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-50 bg-surface/80 backdrop-blur-md border-t border-outline-variant/30 font-headline text-xs uppercase tracking-widest flex flex-col md:flex-row justify-between items-center px-12 py-6 w-full mt-auto">
        <div className="text-sm font-bold text-primary mb-4 md:mb-0 flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">layers</span>
          f4r Services
        </div>
        <div className="text-on-surface-variant/70 lowercase normal-case tracking-normal text-sm">
          &copy; 2024 f4r Services. Professional Donation Bridging.
        </div>
      </footer>
    </div>
  );
}

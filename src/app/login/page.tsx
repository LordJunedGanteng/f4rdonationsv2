"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setToken, setLicenseKey } from "@/lib/auth";
import { apiCall } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
        const licRes = await fetch(`${baseUrl}/api/licenses?user_id=${res.user_id}`);
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
            <p className="text-on-surface-variant">Sign in to access your professional donation tooling.</p>
          </div>

          {error && (
            <div className="bg-error/10 border border-error/30 text-error p-3 rounded-xl mb-6 text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-6">
            {/* Username/Email */}
            <div className="flex flex-col gap-2">
              <label className="font-headline text-xs font-semibold uppercase tracking-wider text-on-surface">
                Username
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[20px] group-focus-within:text-primary transition-colors">
                  person
                </span>
                <input
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-3.5 pr-4 pl-11 text-on-surface focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all placeholder-on-surface-variant/50"
                  placeholder="username"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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

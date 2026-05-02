"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";

const NAV_ITEMS = [
  { href: "/",          icon: "dashboard",          label: "Dashboard"    },
  { href: "/config",    icon: "hub",                label: "Integrations" },
  { href: "/stream",    icon: "receipt_long",       label: "Donations"    },
  { href: "/licenses",  icon: "vpn_key",            label: "Licenses"     },
];

const ADMIN_ITEM = { href: "/admin", icon: "admin_panel_settings", label: "Admin" };

const FOOTER_ITEMS = [
  { href: "#", icon: "help",     label: "Support"  },
  { href: "#", icon: "settings", label: "Settings" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  if (pathname === "/login") return null;

  const items = user?.role === "admin" ? [...NAV_ITEMS, ADMIN_ITEM] : NAV_ITEMS;

  return (
    <>
      {/* Desktop sidebar */}
      <nav className="hidden md:flex flex-col justify-between py-6 bg-slate-950/80 backdrop-blur-2xl fixed left-0 top-0 h-full w-64 border-r border-white/5 z-50">
        <div>
          <div className="px-6 mb-8 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-on-primary-container text-sm font-bold">terminal</span>
            </div>
            <div>
              <div className="text-xl font-black text-white tracking-widest leading-none font-headline">f4r Services</div>
              <div className="font-headline text-sm font-medium text-slate-400 mt-1">Developer Portal</div>
            </div>
          </div>

          <div className="px-6 mb-6">
            <Link
              href="/config"
              className="w-full bg-primary-container hover:bg-primary-fixed-dim text-on-primary-container font-headline text-xs font-semibold tracking-wider uppercase py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 border border-primary/20 shadow-[0_0_8px_rgba(192,193,255,0.15)] hover:shadow-[0_0_12px_rgba(192,193,255,0.3)]"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              New Integration
            </Link>
          </div>

          <ul className="space-y-1 font-headline text-sm font-medium mt-4">
            {items.map((item) => {
              const active = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={
                      active
                        ? "flex items-center gap-3 bg-indigo-500/10 text-indigo-400 border-r-2 border-indigo-500 py-3 px-6 duration-200"
                        : "flex items-center gap-3 text-slate-500 py-3 px-6 hover:bg-white/5 hover:text-slate-200 transition-colors duration-200"
                    }
                  >
                    <span
                      className="material-symbols-outlined text-[20px]"
                      style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
                    >
                      {item.icon}
                    </span>
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="mt-auto">
          <ul className="space-y-1 font-headline text-sm font-medium">
            {FOOTER_ITEMS.map((item) => (
              <li key={item.label}>
                <a
                  href={item.href}
                  className="flex items-center gap-3 text-slate-500 py-3 px-6 hover:bg-white/5 hover:text-slate-200 transition-colors duration-200"
                >
                  <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>

          {user && (
            <div className="px-6 mt-6 pt-6 border-t border-white/5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center border border-outline-variant text-primary font-headline text-sm font-bold">
                {user.username[0]?.toUpperCase()}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium text-on-surface truncate">{user.username}</p>
                <p className="text-xs text-on-surface-variant truncate capitalize">{user.role}</p>
              </div>
              <button
                onClick={logout}
                className="text-slate-500 hover:text-error transition-colors"
                title="Sign Out"
              >
                <span className="material-symbols-outlined text-[20px]">logout</span>
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 w-full bg-slate-950/90 backdrop-blur-xl border-b border-white/10 z-50 flex items-center justify-between px-4 py-3">
        <div className="text-xl font-black text-white tracking-widest font-headline">f4r Services</div>
        {user && (
          <button onClick={logout} className="text-on-surface">
            <span className="material-symbols-outlined">logout</span>
          </button>
        )}
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-slate-950/90 backdrop-blur-xl border-t border-white/10 z-50 flex justify-around items-center py-2">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-1 px-2 ${active ? "text-indigo-400" : "text-slate-500"}`}
            >
              <span
                className="material-symbols-outlined text-[20px]"
                style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {item.icon}
              </span>
              <span className="text-[9px] font-headline font-semibold uppercase tracking-wider">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useAuth } from "@/lib/auth";

const NAV = [
  { href: "/",          icon: "dashboard",     label: "Dashboard"   },
  { href: "/stream",    icon: "payments",      label: "Stream"    },
  { href: "/analytics", icon: "query_stats",   label: "Analytics", fab: true },
  { href: "/licenses",  icon: "verified_user", label: "Vault"     },
  { href: "/config",    icon: "settings",      label: "Config"    },
];

export default function BottomNav() {
  const path = usePathname();
  const { user } = useAuth();
  
  if (path === '/login') return null;

  const items = [...NAV];
  if (user?.role === 'admin') {
    items.push({ href: "/admin", icon: "admin_panel_settings", label: "Admin", fab: false });
  }

  return (
    <nav
      className="fixed bottom-0 w-full flex justify-between items-center px-4 py-3 z-50 border-t border-outline-variant/10"
      style={{ background: "rgba(11,19,38,0.85)", backdropFilter: "blur(24px)" }}
    >
      {items.map(({ href, icon, label, fab }) => {
        const active = path === href;
        if (fab) {
          return (
            <Link key={href} href={href} className="flex flex-col items-center gap-0.5">
              <div className={clsx(
                "-mt-8 mb-0.5 p-3.5 rounded-2xl shadow-[0_8px_24px_rgba(30,60,114,0.4)] transition-transform active:scale-95",
                active
                  ? "bg-gradient-to-br from-primary to-primary-container"
                  : "bg-surface-container-high border border-outline-variant/20"
              )}>
                <span className={clsx("material-symbols-outlined", active && "filled text-on-primary", !active && "text-on-surface-variant")}>
                  {icon}
                </span>
              </div>
              <span className={clsx("text-[8px] font-bold uppercase tracking-widest font-headline", active ? "text-primary" : "text-outline")}>
                {label}
              </span>
            </Link>
          );
        }
        return (
          <Link key={href} href={href} className="flex flex-col items-center gap-1 transition-colors">
            <span className={clsx("material-symbols-outlined text-xl transition-colors", active ? "filled text-primary" : "text-slate-500")}>
              {icon}
            </span>
            <span className={clsx("text-[8px] font-bold uppercase tracking-widest font-headline", active ? "text-primary" : "text-slate-500")}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

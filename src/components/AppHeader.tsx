'use client';

import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';

export default function AppHeader() {
  const { user, logout } = useAuth();
  const router = useRouter();

  return (
    <header className="fixed top-0 w-full flex justify-between items-center px-6 py-4 z-40"
      style={{ background: "rgba(11,19,38,0.7)", backdropFilter: "blur(20px)" }}>
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-primary">hub</span>
        <h1 className="text-xl font-extrabold font-headline tracking-tight bg-gradient-to-br from-primary to-primary-container bg-clip-text text-transparent">
          F4R Donations Service's
        </h1>
      </div>
      
      {user && (
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs font-bold text-primary">{user.username}</p>
            <p className="text-[10px] text-outline uppercase">{user.role}</p>
          </div>
          <button 
            onClick={logout}
            className="w-9 h-9 rounded-full bg-surface-container-highest border border-outline-variant/20 flex items-center justify-center hover:bg-error/20 hover:text-error transition-colors"
            title="Sign Out"
          >
            <span className="material-symbols-outlined text-lg">logout</span>
          </button>
        </div>
      )}
    </header>
  );
}

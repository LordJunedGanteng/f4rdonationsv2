'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export interface UserPayload {
  user_id:  number;
  username: string;
  role:     'admin' | 'user';
  exp:      number;
}

const TOKEN_KEY = 'f4r_token';
const LIC_KEY   = 'f4r_license'; // we'll store the license too

export function setToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export function getToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(TOKEN_KEY);
  }
  return null;
}

export function clearAuth() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(LIC_KEY);
  }
}

export function setLicenseKey(lic: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LIC_KEY, lic);
  }
}

export function getLicenseKey(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(LIC_KEY);
  }
  return null;
}

// Custom hook for auth state
export function useAuth() {
  const [user, setUser] = useState<UserPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadUser = useCallback(() => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      // Very basic JWT decode (doesn't verify signature, just reads payload)
      // Signature is verified by the backend on actual API calls.
      const payloadStr = atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'));
      const payload = JSON.parse(payloadStr) as UserPayload;
      
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp < now) {
        clearAuth();
        setUser(null);
      } else {
        setUser(payload);
      }
    } catch {
      clearAuth();
      setUser(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const logout = () => {
    clearAuth();
    setUser(null);
    router.push('/login');
  };

  return { user, loading, logout, reloadAttr: loadUser };
}

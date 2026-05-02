"use client";
import { useState, useEffect } from "react";

const LIC_KEY = "f4r_license";

export function useLicenseKey() {
  const [key, setKey] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setKey(localStorage.getItem(LIC_KEY));
    setReady(true);
  }, []);

  const save = (k: string) => {
    const trimmed = k.trim();
    localStorage.setItem(LIC_KEY, trimmed);
    setKey(trimmed);
  };

  const clear = () => {
    localStorage.removeItem(LIC_KEY);
    setKey(null);
  };

  return { key, ready, save, clear };
}

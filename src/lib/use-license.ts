"use client";
import { useState, useEffect } from "react";

export function useLicenseKey() {
  const [key, setKey] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setKey(localStorage.getItem("ethereal_license_key"));
    setReady(true);
  }, []);

  const save = (k: string) => {
    const trimmed = k.trim();
    localStorage.setItem("ethereal_license_key", trimmed);
    setKey(trimmed);
  };

  const clear = () => {
    localStorage.removeItem("ethereal_license_key");
    setKey(null);
  };

  return { key, ready, save, clear };
}

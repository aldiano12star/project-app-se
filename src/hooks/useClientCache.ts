"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// In-memory fallback untuk SSR atau private browsing
const memoryStore = new Map<string, { data: any; timestamp: number }>();

/**
 * Hook untuk menyimpan dan memulihkan state UI (filter tab, mode tampilan, query pencarian)
 * antar navigasi halaman agar tidak me-reset UI saat pengguna berpindah halaman dan kembali lagi.
 */
export function useCachedState<T>(
  key: string,
  defaultValue: T,
  options: { ttlMs?: number; persistSession?: boolean } = {}
): [T, (value: T | ((prev: T) => T)) => void, boolean] {
  const { ttlMs = 1000 * 60 * 30, persistSession = true } = options; // Default 30 menit
  const [state, setState] = useState<T>(defaultValue);
  const [isHydrated, setIsHydrated] = useState(false);
  const keyRef = useRef(key);
  keyRef.current = key;

  // Baca dari sessionStorage atau in-memory saat mount
  useEffect(() => {
    try {
      const storageKey = `se_cache_${keyRef.current}`;
      let cached: { data: T; timestamp: number } | null = null;

      if (persistSession && typeof window !== "undefined" && window.sessionStorage) {
        const raw = window.sessionStorage.getItem(storageKey);
        if (raw) {
          cached = JSON.parse(raw);
        }
      }

      if (!cached && memoryStore.has(keyRef.current)) {
        cached = memoryStore.get(keyRef.current) as any;
      }

      if (cached) {
        const isExpired = Date.now() - cached.timestamp > ttlMs;
        if (!isExpired) {
          setState(cached.data);
        }
      }
    } catch {
      // Abaikan error parse atau sandbox
    } finally {
      setIsHydrated(true);
    }
  }, [ttlMs, persistSession]);

  // Setter dengan sinkronisasi ke storage
  const setCachedState = useCallback(
    (valueOrFn: T | ((prev: T) => T)) => {
      setState((prev) => {
        const nextValue =
          typeof valueOrFn === "function"
            ? (valueOrFn as (prev: T) => T)(prev)
            : valueOrFn;

        const record = { data: nextValue, timestamp: Date.now() };
        memoryStore.set(keyRef.current, record);

        if (persistSession && typeof window !== "undefined" && window.sessionStorage) {
          try {
            window.sessionStorage.setItem(
              `se_cache_${keyRef.current}`,
              JSON.stringify(record)
            );
          } catch {
            // QuotaExceededError fallback
          }
        }

        return nextValue;
      });
    },
    [persistSession]
  );

  return [state, setCachedState, isHydrated];
}

/**
 * Utilitas Cache Stale-While-Revalidate untuk fetch client-side
 */
export const clientSWR = {
  get<T>(key: string): T | null {
    try {
      if (typeof window !== "undefined" && window.sessionStorage) {
        const raw = window.sessionStorage.getItem(`se_swr_${key}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          return parsed.data as T;
        }
      }
    } catch {}
    const mem = memoryStore.get(`swr_${key}`);
    return mem ? (mem.data as T) : null;
  },

  set<T>(key: string, data: T) {
    const record = { data, timestamp: Date.now() };
    memoryStore.set(`swr_${key}`, record);
    try {
      if (typeof window !== "undefined" && window.sessionStorage) {
        window.sessionStorage.setItem(`se_swr_${key}`, JSON.stringify(record));
      }
    } catch {}
  },

  clear(keyPrefix?: string) {
    if (!keyPrefix) {
      memoryStore.clear();
      try {
        if (typeof window !== "undefined" && window.sessionStorage) {
          window.sessionStorage.clear();
        }
      } catch {}
      return;
    }

    for (const k of Array.from(memoryStore.keys())) {
      if (k.includes(keyPrefix)) memoryStore.delete(k);
    }
    try {
      if (typeof window !== "undefined" && window.sessionStorage) {
        for (let i = window.sessionStorage.length - 1; i >= 0; i--) {
          const k = window.sessionStorage.key(i);
          if (k && k.includes(keyPrefix)) {
            window.sessionStorage.removeItem(k);
          }
        }
      }
    } catch {}
  },
};

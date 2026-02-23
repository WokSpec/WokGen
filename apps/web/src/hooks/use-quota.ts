'use client';
import { useState, useEffect, useCallback } from 'react';

export interface QuotaData {
  used:      number;
  limit:     number;   // -1 = unlimited
  remaining: number;   // -1 = unlimited
  tier:      string;
  resetsIn:  number;   // seconds until midnight UTC
}

export interface UseQuotaResult extends Partial<QuotaData> {
  isLoading: boolean;
  refresh:   () => void;
}

/**
 * Fetches the caller's daily generation quota from GET /api/quota.
 * Re-fetches whenever `refresh()` is called (e.g. after a successful generation).
 */
export function useQuota(): UseQuotaResult {
  const [data, setData]           = useState<QuotaData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tick, setTick]           = useState(0);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    fetch('/api/quota', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((json: QuotaData) => {
        if (!cancelled) {
          setData(json);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [tick]);

  return {
    isLoading,
    refresh,
    ...(data ?? {}),
  };
}

'use client';
import { useEffect, useRef } from 'react';

/**
 * Auto-saves studio preferences to the backend when they change.
 * Debounced to prevent excessive API calls. Silently fails if user isn't authed.
 */
export function usePreferenceSync(mode: string, prefs: Record<string, unknown>) {
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();
  const prevPrefsRef = useRef<string>('');

  useEffect(() => {
    const serialized = JSON.stringify(prefs);
    if (serialized === prevPrefsRef.current) return;
    prevPrefsRef.current = serialized;

    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await fetch('/api/preferences', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode, prefs }),
        });
      } catch {
        // Silent fail — preferences are nice-to-have, not critical
      }
    }, 2000); // 2 second debounce

    return () => clearTimeout(saveTimer.current);
  }, [mode, prefs]);
}

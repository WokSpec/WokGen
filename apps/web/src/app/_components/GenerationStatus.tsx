'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';

// ── Types ─────────────────────────────────────────────────────────────────────

type JobStatus = 'running' | 'done' | 'failed';

interface GenJob {
  jobId:    string;
  mode:     string;
  prompt:   string;
  status:   JobStatus;
  imageUrl?: string;
  error?:   string;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * GenerationStatus — fixed top-of-screen banner that tracks in-progress jobs.
 *
 * Listens for:
 *   wokgen:generation-start    → { jobId, mode, prompt }
 *   wokgen:generation-complete → { jobId, imageUrl? }
 *   wokgen:generation-failed   → { jobId, error }
 *
 * Fires via helpers in @/lib/generation-events.ts
 */
export function GenerationStatus() {
  const [jobs, setJobs]             = useState<Record<string, GenJob>>({});
  const [flashState, setFlashState] = useState<'done' | 'failed' | null>(null);
  const timers                      = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const scheduleRemove = useCallback((jobId: string) => {
    if (timers.current[jobId]) clearTimeout(timers.current[jobId]);
    timers.current[jobId] = setTimeout(() => {
      setJobs(prev => {
        const next = { ...prev };
        delete next[jobId];
        return next;
      });
      setFlashState(null);
    }, 3000);
  }, []);

  useEffect(() => {
    const onStart = (e: Event) => {
      const { jobId, mode, prompt } = (e as CustomEvent).detail as GenJob;
      setJobs(prev => ({ ...prev, [jobId]: { jobId, mode, prompt, status: 'running' } }));
      setFlashState(null);
    };

    const onComplete = (e: Event) => {
      const { jobId, imageUrl } = (e as CustomEvent).detail as { jobId: string; imageUrl?: string };
      setJobs(prev =>
        prev[jobId] ? { ...prev, [jobId]: { ...prev[jobId], status: 'done', imageUrl } } : prev,
      );
      setFlashState('done');
      scheduleRemove(jobId);
    };

    const onFailed = (e: Event) => {
      const { jobId, error } = (e as CustomEvent).detail as { jobId: string; error: string };
      setJobs(prev =>
        prev[jobId] ? { ...prev, [jobId]: { ...prev[jobId], status: 'failed', error } } : prev,
      );
      setFlashState('failed');
      scheduleRemove(jobId);
    };

    window.addEventListener('wokgen:generation-start',    onStart);
    window.addEventListener('wokgen:generation-complete', onComplete);
    window.addEventListener('wokgen:generation-failed',   onFailed);

    return () => {
      window.removeEventListener('wokgen:generation-start',    onStart);
      window.removeEventListener('wokgen:generation-complete', onComplete);
      window.removeEventListener('wokgen:generation-failed',   onFailed);
    };
  }, [scheduleRemove]);

  const runningJobs = Object.values(jobs).filter(j => j.status === 'running');
  const bannerMode  = runningJobs.length > 0 ? 'active' : (flashState ?? 'hidden');

  if (bannerMode === 'hidden') return null;

  return (
    <div
      className={`gen-status gen-status--${bannerMode}`}
      role="status"
      aria-live="polite"
    >
      {bannerMode === 'active' && (
        <>
          <div className="gen-status__spinner" aria-hidden="true" />
          {runningJobs.length > 1 ? (
            <span>{runningJobs.length} in progress</span>
          ) : (
            <span>
              <strong className="gen-status__mode">{runningJobs[0].mode}</strong>
              {' · '}
              {runningJobs[0].prompt.slice(0, 55)}
              {runningJobs[0].prompt.length > 55 ? '…' : ''}
              {' · Generating…'}
            </span>
          )}
        </>
      )}

      {bannerMode === 'done' && (
        <>
          <span className="gen-status__icon" aria-hidden="true">✓</span>
          <span>Done! </span>
          <Link href="/gallery" className="gen-status__link">View in Gallery →</Link>
        </>
      )}

      {bannerMode === 'failed' && (
        <>
          <span className="gen-status__icon" aria-hidden="true">✕</span>
          <span>Generation failed. Try again.</span>
        </>
      )}
    </div>
  );
}

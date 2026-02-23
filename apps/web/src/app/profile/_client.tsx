'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { toast } from 'sonner';
import Link from 'next/link';

interface Props {
  user: { id: string; name: string | null; email: string | null; image: string | null; createdAt: string };
  plan: { id: string; name: string } | null;
  hdCredits: { monthlyAlloc: number; monthlyUsed: number; monthlyRemaining: number; topUp: number };
  stats: { total: number; hd: number; standard: number };
  recentJobs: { id: string; prompt: string; tool: string; mode: string; resultUrl: string; createdAt: string; isHD: boolean }[];
}

const PLAN_COLORS: Record<string, string> = {
  free:  '#52525b',
  plus:  '#6d28d9',
  pro:   '#a78bfa',
  max:   '#f59e0b',
};

const MODE_LABELS: Record<string, string> = {
  pixel:    'Pixel',
  business: 'Business',
  vector:   'Vector',
  emoji:    'Emoji',
  uiux:     'UI/UX',
};

function fmt(n: number) { return n.toLocaleString(); }

function timeAgo(iso: string) {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60)  return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

function joinDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
}

export default function ProfileClient({ user, plan, hdCredits, stats, recentJobs }: Props) {
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const planId    = plan?.id ?? 'free';
  const planColor = PLAN_COLORS[planId] ?? '#52525b';
  const initial   = (user.name ?? user.email ?? 'U')[0].toUpperCase();

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch('/api/user/delete', { method: 'DELETE' });
      if (res.ok) {
        await signOut({ callbackUrl: '/' });
      } else {
        toast.error('Failed to delete account. Please contact support.');
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <main className="profile-page">

      {/* ── Identity card ─────────────────────────────────────────── */}
      <section className="profile-hero">
        <div className="profile-hero-inner">
          <div className="profile-avatar-wrap">
            {user.image ? (
              <img src={user.image} alt={user.name ?? 'Avatar'} className="profile-avatar" width={72} height={72} />
            ) : (
              <div className="profile-avatar profile-avatar--initials">{initial}</div>
            )}
          </div>
          <div className="profile-identity">
            <h1 className="profile-name">{user.name ?? 'Anonymous'}</h1>
            {user.email && <p className="profile-email">{user.email}</p>}
            <div className="profile-meta">
              <span
                className="profile-plan-badge"
                style={{ ['--plan-color' as string]: planColor, background: `${planColor}22`, color: planColor, borderColor: `${planColor}44` }}
              >
                {plan?.name ?? 'Free'}
              </span>
              <span className="profile-joined">Joined {joinDate(user.createdAt)}</span>
            </div>
          </div>
          <div className="profile-hero-actions">
            <Link href="/billing" className="btn-primary btn-sm">Upgrade Plan</Link>
            <Link href="/account" className="btn-ghost btn-sm">Account Settings</Link>
          </div>
        </div>
      </section>

      <div className="profile-body">

        {/* ── Stats ─────────────────────────────────────────────────── */}
        <section className="profile-section">
          <h2 className="profile-section-title">Generation Stats</h2>
          <div className="profile-stats-grid">
            <div className="profile-stat-card">
              <span className="profile-stat-value">{fmt(stats.total)}</span>
              <span className="profile-stat-label">Total Generations</span>
            </div>
            <div className="profile-stat-card">
              <span className="profile-stat-value">{fmt(stats.standard)}</span>
              <span className="profile-stat-label">Standard (Free)</span>
            </div>
            <div className="profile-stat-card">
              <span className="profile-stat-value profile-stat-value--hd">{fmt(stats.hd)}</span>
              <span className="profile-stat-label">HD Generations</span>
            </div>
            {hdCredits.monthlyAlloc > 0 && (
              <div className="profile-stat-card">
                <span className="profile-stat-value profile-stat-value--credits">{hdCredits.monthlyRemaining}</span>
                <span className="profile-stat-label">HD Credits Left</span>
              </div>
            )}
          </div>
        </section>

        {/* ── Recent generations ────────────────────────────────────── */}
        {recentJobs.length > 0 && (
          <section className="profile-section">
            <div className="profile-section-header">
              <h2 className="profile-section-title">Recent Generations</h2>
              <Link href="/pixel/gallery?mine=true" className="profile-see-all">View all →</Link>
            </div>
            <div className="profile-recents-grid">
              {recentJobs.map(job => (
                <div key={job.id} className="profile-recent-card">
                  <div className="profile-recent-thumb">
                    <img src={job.resultUrl} alt={job.prompt} className="profile-recent-img" loading="lazy" />
                    {job.isHD && <span className="profile-recent-hd">HD</span>}
                    <span className="profile-recent-mode">{MODE_LABELS[job.mode] ?? job.mode}</span>
                  </div>
                  <p className="profile-recent-prompt">{job.prompt.slice(0, 48)}{job.prompt.length > 48 ? '…' : ''}</p>
                  <p className="profile-recent-time">{timeAgo(job.createdAt)}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Danger zone ───────────────────────────────────────────── */}
        <section className="profile-section profile-danger-zone">
          <h2 className="profile-section-title profile-section-title--danger">Danger Zone</h2>
          <p className="profile-danger-desc">
            Permanently delete your account and all generation history. This cannot be undone.
          </p>
          {!deleteConfirm ? (
            <button
              className="btn-outline btn-sm btn-outline--danger"
              onClick={() => setDeleteConfirm(true)}
            >
              Delete my account
            </button>
          ) : (
            <div className="profile-danger-confirm">
              <p className="profile-danger-warning">
                Are you absolutely sure? This will delete all your data permanently.
              </p>
              <div className="profile-danger-actions">
                <button
                  className="btn-danger btn-sm"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? 'Deleting…' : 'Yes, delete everything'}
                </button>
                <button
                  className="btn-ghost btn-sm"
                  onClick={() => setDeleteConfirm(false)}
                  disabled={deleting}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </section>

      </div>
    </main>
  );
}

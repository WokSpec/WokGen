'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DayBucket { date: string; total: number; hd: number; standard: number }
interface LogItem {
  id: string; mode: string; tool: string; provider: string;
  status: string; prompt: string; resultUrl: string | null;
  createdAt: string; hd: boolean;
}
interface UsageData {
  allTime:   { total: number; hd: number; standard: number };
  thisMonth: { total: number; hd: number; standard: number };
  today:     { total: number; hd: number; standard: number };
  quota: {
    planId: string; dailyLimit: number; todayUsed: number;
    hdAlloc: number; hdUsed: number; hdTopUp: number; hdAvailable: number;
  };
  modeToday:  Record<string, number>;
  modeMonth:  Record<string, number>;
  daily: DayBucket[];
  log: { items: LogItem[]; total: number; page: number; limit: number; pages: number };
}

// ─── Constants ───────────────────────────────────────────────────────────────

const MODE_LABELS: Record<string, string> = {
  pixel: 'Pixel', business: 'Business', vector: 'Vector',
  emoji: 'Emoji', uiux: 'UI/UX', voice: 'Voice', text: 'Text',
};

const MODE_COLORS: Record<string, string> = {
  pixel: '#a78bfa', business: '#60a5fa', vector: '#34d399',
  emoji: '#fbbf24', uiux: '#f472b6', voice: '#fb923c', text: '#94a3b8',
};

const STATUS_STYLE: Record<string, string> = {
  succeeded: 'status-dot status-dot--green',
  failed:    'status-dot status-dot--red',
  pending:   'status-dot status-dot--yellow',
  running:   'status-dot status-dot--yellow',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pct(used: number, limit: number) {
  if (limit <= 0) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function fmtDay(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// ─── Bar chart (last 7 days) ──────────────────────────────────────────────────

function MiniBarChart({ data }: { data: DayBucket[] }) {
  const last7 = data.slice(-7);
  const max   = Math.max(...last7.map(d => d.total), 1);
  return (
    <div className="usage-chart">
      {last7.map((d) => (
        <div key={d.date} className="usage-chart__col">
          <div className="usage-chart__bar-wrap">
            <div
              className="usage-chart__bar usage-chart__bar--hd"
              style={{ height: `${(d.hd / max) * 100}%` }}
            />
            <div
              className="usage-chart__bar usage-chart__bar--std"
              style={{ height: `${(d.standard / max) * 100}%` }}
            />
          </div>
          <span className="usage-chart__label">{fmtDay(d.date)}</span>
          <span className="usage-chart__total">{d.total}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Quota meter ─────────────────────────────────────────────────────────────

function QuotaMeter({
  label, used, limit, color = '#a78bfa',
}: { label: string; used: number; limit: number; color?: string }) {
  const p = pct(used, limit);
  const unlimited = limit < 0;
  return (
    <div className="quota-meter">
      <div className="quota-meter__header">
        <span className="quota-meter__label">{label}</span>
        <span className="quota-meter__value">
          {unlimited ? `${used} / ∞` : `${used} / ${limit}`}
        </span>
      </div>
      {!unlimited && (
        <div className="quota-meter__track">
          <div
            className="quota-meter__fill"
            style={{ width: `${p}%`, background: p >= 90 ? '#f87171' : p >= 70 ? '#fbbf24' : color }}
          />
        </div>
      )}
    </div>
  );
}

// ─── Mode breakdown ───────────────────────────────────────────────────────────

function ModeBreakdown({ data, total }: { data: Record<string, number>; total: number }) {
  const modes = Object.entries(data).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  if (modes.length === 0) return <p className="usage-empty">No generations today.</p>;
  return (
    <div className="mode-breakdown">
      {modes.map(([mode, count]) => (
        <div key={mode} className="mode-breakdown__row">
          <span className="mode-breakdown__label">{MODE_LABELS[mode] ?? mode}</span>
          <div className="mode-breakdown__track">
            <div
              className="mode-breakdown__fill"
              style={{ width: `${total > 0 ? (count / total) * 100 : 0}%`, background: MODE_COLORS[mode] ?? '#a78bfa' }}
            />
          </div>
          <span className="mode-breakdown__count">{count}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Request log ─────────────────────────────────────────────────────────────

function RequestLog({ items, page, pages, onPage }: {
  items: LogItem[]; page: number; pages: number; onPage: (p: number) => void;
}) {
  if (items.length === 0) return <p className="usage-empty">No requests yet.</p>;
  return (
    <div className="request-log">
      <table className="request-log__table">
        <thead>
          <tr>
            <th>Status</th>
            <th>Mode</th>
            <th>Tool</th>
            <th>Provider</th>
            <th>Prompt</th>
            <th>When</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>
                <span className={STATUS_STYLE[item.status] ?? STATUS_STYLE['pending']} />
                {item.status}
              </td>
              <td>
                <span className="mode-pill" style={{ '--mode-color': MODE_COLORS[item.mode] ?? '#a78bfa' } as React.CSSProperties}>
                  {MODE_LABELS[item.mode] ?? item.mode}
                </span>
              </td>
              <td>{item.tool}</td>
              <td>
                <span className={item.hd ? 'hd-badge' : 'std-badge'}>
                  {item.hd ? 'HD' : 'STD'}
                </span>
                {' '}{item.provider}
              </td>
              <td className="request-log__prompt" title={item.prompt}>
                {item.prompt}
              </td>
              <td className="request-log__date">{fmtDate(item.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {pages > 1 && (
        <div className="request-log__pagination">
          <button
            className="btn btn--ghost btn--sm"
            disabled={page <= 1}
            onClick={() => onPage(page - 1)}
          >← Prev</button>
          <span className="request-log__page-info">Page {page} / {pages}</span>
          <button
            className="btn btn--ghost btn--sm"
            disabled={page >= pages}
            onClick={() => onPage(page + 1)}
          >Next →</button>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function UsageClient() {
  const [data, setData]       = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [logPage, setLogPage] = useState(1);

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/usage?page=${page}&limit=20`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(logPage); }, [load, logPage]);

  if (loading && !data) {
    return (
      <div className="usage-page">
        <div className="usage-page__header">
          <h1 className="usage-page__title">Usage</h1>
        </div>
        <div className="usage-skeleton">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton-block" />)}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { quota, today, thisMonth, allTime, daily, modeToday, modeMonth, log } = data;
  const dailyPct = pct(quota.todayUsed, quota.dailyLimit);

  return (
    <div className="usage-page">
      <div className="usage-page__header">
        <div>
          <h1 className="usage-page__title">Usage</h1>
          <p className="usage-page__sub">
            Transparent view of everything you&apos;ve generated.
            Plan: <strong className="usage-plan-badge">{quota.planId}</strong>
          </p>
        </div>
        <Link href="/billing" className="btn btn--ghost btn--sm">Upgrade plan</Link>
      </div>

      {/* Quota alert at 80%+ */}
      {quota.dailyLimit > 0 && dailyPct >= 80 && (
        <div className="usage-alert">
          <span className="usage-alert__icon">!</span>
          {dailyPct >= 100
            ? 'You\'ve used your daily generation limit. Resets at midnight UTC.'
            : `You've used ${dailyPct}% of today's limit (${quota.todayUsed}/${quota.dailyLimit}).`}
          {' '}<Link href="/billing" className="usage-alert__link">See plans →</Link>
        </div>
      )}

      {/* Stat cards */}
      <div className="usage-stats">
        <div className="usage-stat-card">
          <span className="usage-stat-card__label">Today</span>
          <span className="usage-stat-card__value">{today.total}</span>
          <span className="usage-stat-card__sub">{today.hd} HD · {today.standard} std</span>
        </div>
        <div className="usage-stat-card">
          <span className="usage-stat-card__label">This month</span>
          <span className="usage-stat-card__value">{thisMonth.total}</span>
          <span className="usage-stat-card__sub">{thisMonth.hd} HD · {thisMonth.standard} std</span>
        </div>
        <div className="usage-stat-card">
          <span className="usage-stat-card__label">All time</span>
          <span className="usage-stat-card__value">{allTime.total}</span>
          <span className="usage-stat-card__sub">{allTime.hd} HD · {allTime.standard} std</span>
        </div>
        <div className="usage-stat-card">
          <span className="usage-stat-card__label">HD credits left</span>
          <span className="usage-stat-card__value">{quota.hdAvailable}</span>
          <span className="usage-stat-card__sub">{quota.hdTopUp} top-up · {quota.hdAlloc}/mo alloc</span>
        </div>
      </div>

      {/* Quota meters */}
      <div className="usage-section">
        <h2 className="usage-section__title">Limits</h2>
        <div className="quota-meters">
          <QuotaMeter
            label={quota.dailyLimit < 0 ? 'Daily generations (unlimited)' : `Daily generations (${quota.dailyLimit}/day)`}
            used={quota.todayUsed}
            limit={quota.dailyLimit}
            color="#a78bfa"
          />
          <QuotaMeter
            label={`HD credits this month`}
            used={quota.hdUsed}
            limit={quota.hdAlloc}
            color="#60a5fa"
          />
        </div>
      </div>

      {/* Activity chart */}
      <div className="usage-section">
        <h2 className="usage-section__title">Last 7 days</h2>
        <div className="usage-chart-legend">
          <span className="usage-chart-legend__hd">■ HD</span>
          <span className="usage-chart-legend__std">■ Standard</span>
        </div>
        <MiniBarChart data={daily} />
      </div>

      {/* Mode breakdown */}
      <div className="usage-section usage-section--split">
        <div>
          <h2 className="usage-section__title">Today by mode</h2>
          <ModeBreakdown data={modeToday} total={today.total} />
        </div>
        <div>
          <h2 className="usage-section__title">This month by mode</h2>
          <ModeBreakdown data={modeMonth} total={thisMonth.total} />
        </div>
      </div>

      {/* Request log */}
      <div className="usage-section">
        <h2 className="usage-section__title">
          Request log
          <span className="usage-section__count">{log.total} total</span>
        </h2>
        <RequestLog
          items={log.items}
          page={log.page}
          pages={log.pages}
          onPage={(p) => { setLogPage(p); load(p); }}
        />
      </div>
    </div>
  );
}

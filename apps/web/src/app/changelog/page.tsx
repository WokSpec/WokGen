import { execSync } from 'child_process';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Changelog — WokGen',
  description: 'What changed, when, and why.',
};

interface ChangeEntry {
  hash: string;
  date: string;
  subject: string;
  type: 'feat' | 'fix' | 'perf' | 'refactor' | 'chore' | 'docs' | 'other';
  scope?: string;
  body: string;
}

function parseCommitType(subject: string): ChangeEntry['type'] {
  const m = subject.match(/^(feat|fix|perf|refactor|chore|docs)(\(.+?\))?[!:]?:/i);
  if (!m) return 'other';
  return m[1].toLowerCase() as ChangeEntry['type'];
}

function parseScope(subject: string): string | undefined {
  const m = subject.match(/^(?:feat|fix|perf|refactor|chore|docs)\((.+?)\):/i);
  return m ? m[1] : undefined;
}

function parseSubjectBody(subject: string): string {
  return subject.replace(/^(?:feat|fix|perf|refactor|chore|docs)(?:\(.+?\))?[!:]?\s*/i, '').trim();
}

function getChangelog(): ChangeEntry[] {
  try {
    const raw = execSync(
      'git log --pretty=format:"%H|%as|%s" --no-merges -n 120',
      { cwd: process.cwd(), encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] },
    );
    return raw
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const [hash, date, ...rest] = line.split('|');
        const subject = rest.join('|');
        return {
          hash: hash.slice(0, 7),
          date,
          subject,
          type: parseCommitType(subject),
          scope: parseScope(subject),
          body: parseSubjectBody(subject),
        };
      })
      .filter((e) => e.type !== 'chore' && e.body.length > 2);
  } catch {
    return [];
  }
}

const TYPE_LABELS: Record<ChangeEntry['type'], string> = {
  feat:     'Feature',
  fix:      'Fix',
  perf:     'Performance',
  refactor: 'Refactor',
  chore:    'Maintenance',
  docs:     'Docs',
  other:    'Change',
};

const TYPE_COLOR: Record<ChangeEntry['type'], string> = {
  feat:     'cl-tag cl-tag--feat',
  fix:      'cl-tag cl-tag--fix',
  perf:     'cl-tag cl-tag--perf',
  refactor: 'cl-tag cl-tag--refactor',
  chore:    'cl-tag cl-tag--chore',
  docs:     'cl-tag cl-tag--docs',
  other:    'cl-tag cl-tag--other',
};

function groupByMonth(entries: ChangeEntry[]): Map<string, ChangeEntry[]> {
  const map = new Map<string, ChangeEntry[]>();
  for (const e of entries) {
    const key = e.date.slice(0, 7); // YYYY-MM
    const arr = map.get(key) ?? [];
    arr.push(e);
    map.set(key, arr);
  }
  return map;
}

function formatMonth(yyyyMM: string): string {
  const [y, m] = yyyyMM.split('-');
  return new Date(parseInt(y), parseInt(m) - 1, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

export default function ChangelogPage() {
  const entries = getChangelog();
  const grouped = groupByMonth(entries);

  return (
    <div className="cl-page">
      <div className="cl-header">
        <p className="cl-eyebrow">What changed</p>
        <h1 className="cl-title">Changelog</h1>
        <p className="cl-subtitle">
          Every significant feature, fix, and improvement — pulled directly from git history.
        </p>
      </div>

      {entries.length === 0 ? (
        <p className="cl-empty">No changelog entries available.</p>
      ) : (
        <div className="cl-timeline">
          {Array.from(grouped.entries()).map(([month, monthEntries]) => (
            <section key={month} className="cl-month">
              <h2 className="cl-month-label">{formatMonth(month)}</h2>
              <ul className="cl-entries">
                {monthEntries.map((e) => (
                  <li key={e.hash} className="cl-entry">
                    <div className="cl-entry-meta">
                      <span className={TYPE_COLOR[e.type]}>{TYPE_LABELS[e.type]}</span>
                      {e.scope && <span className="cl-scope">{e.scope}</span>}
                      <span className="cl-hash">{e.hash}</span>
                      <time className="cl-date" dateTime={e.date}>{e.date}</time>
                    </div>
                    <p className="cl-entry-body">{e.body}</p>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

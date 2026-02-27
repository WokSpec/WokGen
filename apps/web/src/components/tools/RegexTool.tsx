'use client';

import { useState, useMemo } from 'react';

const PRESETS = [
  { label: 'Email',       pattern: '[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}',   flags: 'gi' },
  { label: 'URL',         pattern: 'https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\\.[a-z]{2,6}\\b([-a-zA-Z0-9@:%_+.~#?&/=]*)', flags: 'gi' },
  { label: 'IPv4',        pattern: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b',                         flags: 'g' },
  { label: 'Hex Color',   pattern: '#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})\\b',                      flags: 'g' },
  { label: 'Date (YYYY-MM-DD)', pattern: '\\b\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])\\b', flags: 'g' },
  { label: 'Phone (US)',  pattern: '\\+?1?[-.]?\\(?[2-9]\\d{2}\\)?[-.]?\\d{3}[-.]?\\d{4}',     flags: 'g' },
  { label: 'Markdown Bold', pattern: '\\*\\*(.+?)\\*\\*',                                        flags: 'g' },
  { label: 'Hashtag',     pattern: '#\\w+',                                                       flags: 'gi' },
];

const DEFAULT_TEST = `Hello world! Contact us at support@wokspec.org or visit https://wokgen.wokspec.org
Created on 2024-01-15. Server IP: 192.168.1.100. Color: #ff5500
Phone: +1 (555) 123-4567 or 555.987.6543
**Bold text** and #hashtag support`;

interface Match {
  index: number;
  length: number;
  text: string;
  groups: Record<string, string>;
  captures: string[];
}

export default function RegexTool() {
  const [pattern, setPattern] = useState('');
  const [flags, setFlags] = useState('gm');
  const [testStr, setTestStr] = useState(DEFAULT_TEST);

  const { matches, error, segments } = useMemo(() => {
    if (!pattern) return { matches: [] as Match[], error: null, segments: [] as Segment[] };
    let re: RegExp;
    try {
      re = new RegExp(pattern, flags);
    } catch (e) {
      return { matches: [], error: (e as Error).message, segments: [] };
    }

    const found: Match[] = [];
    let m: RegExpExecArray | null;
    re.lastIndex = 0;
    let limit = 0;
    while ((m = re.exec(testStr)) !== null && limit++ < 500) {
      found.push({
        index: m.index,
        length: m[0].length,
        text: m[0],
        groups: m.groups ?? {},
        captures: Array.prototype.slice.call(m, 1) as string[],
      });
      if (!flags.includes('g')) break;
      if (m[0].length === 0) re.lastIndex++; // avoid infinite loop on zero-length match
    }

    // Build highlighted segments
    const segs: Segment[] = [];
    let pos = 0;
    for (const fm of found) {
      if (fm.index > pos) segs.push({ text: testStr.slice(pos, fm.index), highlight: false });
      segs.push({ text: testStr.slice(fm.index, fm.index + fm.length), highlight: true });
      pos = fm.index + fm.length;
    }
    if (pos < testStr.length) segs.push({ text: testStr.slice(pos), highlight: false });

    return { matches: found, error: null, segments: segs };
  }, [pattern, flags, testStr]);

  const toggleFlag = (f: string) => {
    setFlags(prev => prev.includes(f) ? prev.replace(f, '') : prev + f);
  };

  return (
    <div className="regex-tool">
      {/* Pattern input */}
      <div className="regex-input-row">
        <span className="regex-slash">/</span>
        <input
          className={`regex-pattern-input${error ? ' error' : ''}`}
          value={pattern}
          onChange={e => setPattern(e.target.value)}
          placeholder="Enter pattern…"
          spellCheck={false}
          autoComplete="off"
        />
        <span className="regex-slash">/</span>
        <input
          className="regex-flags-input"
          value={flags}
          onChange={e => setFlags(e.target.value)}
          placeholder="gim"
          maxLength={6}
          spellCheck={false}
        />
      </div>

      {error && <p className="regex-error-msg">{error}</p>}

      {/* Flag toggles */}
      <div className="regex-flags-row">
        {[
          { f: 'g', label: 'g — global' },
          { f: 'i', label: 'i — case insensitive' },
          { f: 'm', label: 'm — multiline' },
          { f: 's', label: 's — dotAll' },
            { f: 'u', label: 'u — unicode' },
        ].map(({ f, label }) => (
          <button
            key={f}
            className={`regex-flag-chip${flags.includes(f) ? ' active' : ''}`}
            onClick={() => toggleFlag(f)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Presets */}
      <div className="regex-presets">
        <span className="regex-presets-label">Presets:</span>
        {PRESETS.map(p => (
          <button
            key={p.label}
            className="btn-ghost-xs"
            onClick={() => { setPattern(p.pattern); setFlags(p.flags); }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Test string with highlights */}
      <div className="regex-section">
        <div className="regex-section-header">
          <span className="regex-section-label">Test String</span>
          <span className="regex-match-count">
            {pattern && !error ? `${matches.length} match${matches.length === 1 ? '' : 'es'}` : ''}
          </span>
        </div>

        {/* Highlighted display overlay */}
        <div className="regex-highlighted-wrap">
          {segments.length > 0 ? (
            <span className="regex-highlighted-text">
              {segments.map((seg, i) =>
                seg.highlight
                  ? <mark key={i} className="regex-match-mark">{seg.text}</mark>
                  : <span key={i}>{seg.text}</span>
              )}
            </span>
          ) : null}
          <textarea
            className="regex-test-textarea"
            value={testStr}
            onChange={e => setTestStr(e.target.value)}
            spellCheck={false}
            style={{ opacity: segments.length > 0 ? 0 : 1 }}
          />
          {segments.length > 0 && (
            <textarea
              className="regex-test-textarea regex-test-overlay"
              value={testStr}
              onChange={e => setTestStr(e.target.value)}
              spellCheck={false}
            />
          )}
        </div>
      </div>

      {/* Match list */}
      {matches.length > 0 && (
        <div className="regex-section">
          <p className="regex-section-label">Matches</p>
          <div className="regex-matches-list">
            {matches.slice(0, 50).map((m, i) => (
              <div key={i} className="regex-match-item">
                <span className="regex-match-num">#{i + 1}</span>
                <code className="regex-match-text">{m.text}</code>
                <span className="regex-match-pos">pos {m.index}–{m.index + m.length}</span>
                        {(m.groups && Object.keys(m.groups).length > 0) && (
                    <span className="regex-match-groups">
                      {Object.entries(m.groups).map(([k, v]) => (
                        <span key={k} className="regex-group-tag">{k}: {v}</span>
                      ))}
                    </span>
                  )}
                  {m.captures && m.captures.length > 0 && (
                    <span className="regex-match-groups">
                      {m.captures.map((c, idx) => (
                        <span key={idx} className="regex-group-tag">#{idx + 1}: {c}</span>
                      ))}
                    </span>
                  )}
              </div>
            ))}
            {matches.length > 50 && (
              <p className="regex-truncated">… and {matches.length - 50} more matches</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface Segment { text: string; highlight: boolean }

'use client';

import { useState, useEffect, useMemo } from 'react';

interface Snippet {
  id: string;
  title: string;
  language: string;
  code: string;
  tags: string[];
  createdAt: number;
}

const LANGUAGES = ['plaintext', 'javascript', 'typescript', 'python', 'bash', 'rust', 'go', 'css', 'html', 'json', 'sql', 'c', 'cpp', 'java', 'php', 'ruby', 'swift', 'kotlin', 'yaml', 'toml', 'dockerfile', 'graphql'];

const STORAGE_KEY = 'wokgen_snippets';

function load(): Snippet[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch { return []; }
}

function save(snippets: Snippet[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snippets));
}

// Minimal syntax highlighting (keyword coloring via CSS classes)
function highlight(code: string, lang: string): string {
  const esc = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const keywords: Record<string, string[]> = {
    javascript: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'class', 'import', 'export', 'default', 'async', 'await', 'new', 'this', 'typeof', 'instanceof', 'null', 'undefined', 'true', 'false', 'try', 'catch', 'throw', 'from', 'of', 'in'],
    typescript: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'class', 'interface', 'type', 'import', 'export', 'default', 'async', 'await', 'new', 'this', 'typeof', 'null', 'undefined', 'true', 'false', 'from', 'extends', 'implements', 'enum', 'namespace', 'string', 'number', 'boolean', 'void', 'any', 'never', 'unknown'],
    python: ['def', 'class', 'import', 'from', 'return', 'if', 'elif', 'else', 'for', 'while', 'with', 'as', 'in', 'not', 'and', 'or', 'is', 'None', 'True', 'False', 'try', 'except', 'finally', 'raise', 'lambda', 'yield', 'pass', 'break', 'continue', 'global', 'nonlocal', 'async', 'await'],
    rust: ['fn', 'let', 'mut', 'pub', 'use', 'mod', 'struct', 'enum', 'impl', 'trait', 'return', 'if', 'else', 'for', 'while', 'match', 'in', 'self', 'Self', 'true', 'false', 'None', 'Some', 'Ok', 'Err', 'async', 'await', 'move', 'const', 'static', 'type', 'where', 'dyn', 'Box', 'Vec', 'String'],
    go: ['func', 'var', 'const', 'type', 'struct', 'interface', 'return', 'if', 'else', 'for', 'range', 'switch', 'case', 'default', 'import', 'package', 'nil', 'true', 'false', 'go', 'chan', 'select', 'defer', 'map', 'make', 'new', 'append', 'len', 'cap', 'error'],
  };

  const kws = keywords[lang] || keywords.javascript;
  let result = esc;

  // Comments
  result = result.replace(/(\/\/[^\n]*)$/gm, '<span class="snip-comment">$1</span>');
  result = result.replace(/(#[^\n]*)$/gm, '<span class="snip-comment">$1</span>');
  // Strings
  result = result.replace(/(&quot;[^&]*?&quot;|&#39;[^&]*?&#39;|`[^`]*?`)/g, '<span class="snip-string">$1</span>');
  // Keywords
  kws.forEach(kw => {
    result = result.replace(new RegExp(`\\b(${kw})\\b`, 'g'), '<span class="snip-keyword">$1</span>');
  });
  // Numbers
  result = result.replace(/\b(\d+\.?\d*)\b/g, '<span class="snip-number">$1</span>');

  return result;
}

export default function SnippetsTool() {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [view, setView] = useState<'list' | 'edit'>('list');
  const [editing, setEditing] = useState<Snippet | null>(null);
  const [search, setSearch] = useState('');
  const [filterLang, setFilterLang] = useState('all');
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => { setSnippets(load()); }, []);

  const filtered = useMemo(() => snippets.filter(s => {
    const q = search.toLowerCase();
    const matchQ = !q || s.title.toLowerCase().includes(q) || s.code.toLowerCase().includes(q) || s.tags.some(t => t.includes(q));
    const matchL = filterLang === 'all' || s.language === filterLang;
    return matchQ && matchL;
  }), [snippets, search, filterLang]);

  const newSnippet = (): Snippet => ({
    id: crypto.randomUUID(),
    title: '',
    language: 'javascript',
    code: '',
    tags: [],
    createdAt: Date.now(),
  });

  const startNew = () => { setEditing(newSnippet()); setView('edit'); };

  const startEdit = (s: Snippet) => { setEditing({ ...s }); setView('edit'); };

  const saveSnippet = () => {
    if (!editing) return;
    const next = snippets.some(s => s.id === editing.id)
      ? snippets.map(s => s.id === editing.id ? editing : s)
      : [editing, ...snippets];
    setSnippets(next);
    save(next);
    setView('list');
    setEditing(null);
  };

  const deleteSnippet = (id: string) => {
    const next = snippets.filter(s => s.id !== id);
    setSnippets(next);
    save(next);
  };

  const copySnippet = async (s: Snippet) => {
    await navigator.clipboard.writeText(s.code);
    setCopied(s.id);
    setTimeout(() => setCopied(null), 2000);
  };

  const exportAll = () => {
    const blob = new Blob([JSON.stringify(snippets, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'wokgen-snippets.json';
    a.click();
  };

  const importJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const parsed = JSON.parse(r.result as string) as Snippet[];
        const merged = [...parsed, ...snippets].filter((s, i, arr) => arr.findIndex(x => x.id === s.id) === i);
        setSnippets(merged);
        save(merged);
      } catch { /* ignore bad import */ }
    };
    r.readAsText(f);
  };

  if (view === 'edit' && editing) {
    return (
      <div className="snippets-editor">
        <div className="snippets-editor-header">
          <button className="btn-ghost-xs" onClick={() => { setView('list'); setEditing(null); }}>Back</button>
          <h3 className="snippets-editor-title">{editing.id ? 'Edit Snippet' : 'New Snippet'}</h3>
          <button className="btn-primary btn-sm" onClick={saveSnippet}>Save</button>
        </div>

        <div className="snippets-editor-body">
          <input
            className="tool-input"
            placeholder="Title…"
            value={editing.title}
            onChange={e => setEditing(prev => prev ? { ...prev, title: e.target.value } : null)}
          />
          <div className="snippets-meta-row">
            <select
              className="tool-select"
              value={editing.language}
              onChange={e => setEditing(prev => prev ? { ...prev, language: e.target.value } : null)}
            >
              {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <input
              className="tool-input"
              placeholder="Tags (comma separated)"
              value={editing.tags.join(', ')}
              onChange={e => setEditing(prev => prev ? { ...prev, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) } : null)}
              style={{ flex: 1 }}
            />
          </div>
          <textarea
            className="json-textarea snippets-code-input"
            spellCheck={false}
            placeholder="Paste your code here…"
            value={editing.code}
            onChange={e => setEditing(prev => prev ? { ...prev, code: e.target.value } : null)}
            rows={20}
          />
        </div>

        {/* Live preview */}
        {editing.code && (
          <div className="snippets-preview">
            <div className="json-panel-header">
              <span className="json-panel-label">Preview — {editing.language}</span>
            </div>
            <pre
              className="snippets-code-block"
              dangerouslySetInnerHTML={{ __html: highlight(editing.code, editing.language) }}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="snippets-tool">
      {/* Header */}
      <div className="snippets-header">
        <div style={{ display: 'flex', gap: '0.5rem', flex: 1 }}>
          <input className="tool-input" placeholder="Search snippets…" value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1 }} />
          <select className="tool-select" value={filterLang} onChange={e => setFilterLang(e.target.value)}>
            <option value="all">All languages</option>
            {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn-ghost-xs" onClick={exportAll} title="Export all">Export</button>
          <label className="btn-ghost-xs" title="Import JSON">
            Import
            <input type="file" accept=".json" onChange={importJson} style={{ display: 'none' }} />
          </label>
          <button className="btn-primary btn-sm" onClick={startNew}>+ New Snippet</button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="snippets-empty">
          {snippets.length === 0
            ? <><p>No snippets yet.</p><button className="btn-primary btn-sm" onClick={startNew}>Create your first snippet</button></>
            : <p>No snippets match your search.</p>
          }
        </div>
      ) : (
        <div className="snippets-grid">
          {filtered.map(s => (
            <div key={s.id} className="snippet-card">
              <div className="snippet-card-header">
                <div>
                  <p className="snippet-card-title">{s.title || 'Untitled'}</p>
                  <span className="snippet-card-lang">{s.language}</span>
                  {s.tags.map(t => <span key={t} className="snippet-card-tag">{t}</span>)}
                </div>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  <button className="tilemap-tool-btn" onClick={() => copySnippet(s)} title="Copy">
                    {copied === s.id ? 'Copied!' : 'Copy'}
                  </button>
                  <button className="tilemap-tool-btn" onClick={() => startEdit(s)} title="Edit">Edit</button>
                  <button className="tilemap-tool-btn" onClick={() => deleteSnippet(s.id)} title="Delete">Delete</button>
                </div>
              </div>
              <pre
                className="snippet-card-preview"
                dangerouslySetInnerHTML={{ __html: highlight(s.code.slice(0, 300), s.language) }}
              />
              {s.code.length > 300 && <p className="snippet-card-more">…{Math.max(0, s.code.split('\n').length - 5)} more lines</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

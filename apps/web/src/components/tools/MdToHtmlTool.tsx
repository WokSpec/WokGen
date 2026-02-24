'use client';

import { useState, useEffect } from 'react';

// Basic Markdown → HTML parser (no external deps)
function mdToHtml(md: string): string {
  let html = md;

  // Escape HTML entities in code blocks first, then restore
  const codeBlocks: string[] = [];
  html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
    const idx = codeBlocks.length;
    const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    codeBlocks.push(`<pre><code${lang ? ` class="language-${lang}"` : ''}>${escaped}</code></pre>`);
    return `\x00CODE${idx}\x00`;
  });

  // Inline code
  const inlineCodes: string[] = [];
  html = html.replace(/`([^`]+)`/g, (_, code) => {
    const idx = inlineCodes.length;
    const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    inlineCodes.push(`<code>${escaped}</code>`);
    return `\x00INLINE${idx}\x00`;
  });

  // Headers
  html = html.replace(/^###### (.+)$/gm, '<h6>$1</h6>');
  html = html.replace(/^##### (.+)$/gm, '<h5>$1</h5>');
  html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Images (before links)
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img alt="$1" src="$2" />');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  // Bold & Italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/___(.+?)___/g, '<strong><em>$1</em></strong>');
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
  html = html.replace(/_(.+?)_/g, '<em>$1</em>');

  // Unordered lists
  html = html.replace(/((?:^[ \t]*[-*+] .+\n?)+)/gm, (block) => {
    const items = block.trim().split('\n').map(l => `<li>${l.replace(/^[ \t]*[-*+] /, '')}</li>`).join('');
    return `<ul>${items}</ul>`;
  });

  // Ordered lists
  html = html.replace(/((?:^[ \t]*\d+\. .+\n?)+)/gm, (block) => {
    const items = block.trim().split('\n').map(l => `<li>${l.replace(/^[ \t]*\d+\. /, '')}</li>`).join('');
    return `<ol>${items}</ol>`;
  });

  // Blockquotes
  html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');

  // Horizontal rule
  html = html.replace(/^---+$/gm, '<hr />');

  // Paragraphs: wrap bare lines
  html = html.replace(/^(?!<[a-z]|\x00)(.*\S.*)$/gm, '<p>$1</p>');

  // Restore code blocks and inline codes
  html = html.replace(/\x00CODE(\d+)\x00/g, (_, i) => codeBlocks[Number(i)]);
  html = html.replace(/\x00INLINE(\d+)\x00/g, (_, i) => inlineCodes[Number(i)]);

  return html;
}

const SAMPLE = `# Hello, World!

This is **bold** and _italic_ text.

## Features

- Item one
- Item two
- Item three

1. First
2. Second

\`\`\`javascript
const greet = (name) => \`Hello, \${name}!\`;
\`\`\`

> A blockquote example.

[Visit WokGen](https://wokgen.dev)
`;

export default function MdToHtmlTool() {
  const [md, setMd] = useState(SAMPLE);
  const [html, setHtml] = useState('');
  const [tab, setTab] = useState<'preview' | 'code'>('preview');
  const [copied, setCopied] = useState(false);

  useEffect(() => { setHtml(mdToHtml(md)); }, [md]);

  const copy = () => {
    navigator.clipboard.writeText(html).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className="md2h-tool">
      <div className="md2h-tool__panes">
        <div className="md2h-tool__pane">
          <div className="md2h-tool__pane-header">Markdown Input</div>
          <textarea
            className="md2h-tool__textarea"
            value={md}
            onChange={e => setMd(e.target.value)}
            spellCheck={false}
          />
        </div>

        <div className="md2h-tool__pane">
          <div className="md2h-tool__pane-header">
            <div className="md2h-tool__tabs">
              <button className={`md2h-tool__tab ${tab === 'preview' ? 'active' : ''}`} onClick={() => setTab('preview')}>Preview</button>
              <button className={`md2h-tool__tab ${tab === 'code' ? 'active' : ''}`} onClick={() => setTab('code')}>HTML Code</button>
            </div>
            <button className="btn btn-sm" onClick={copy}>{copied ? '✓ Copied' : 'Copy HTML'}</button>
          </div>
          {tab === 'preview' ? (
            <div className="md2h-tool__preview" dangerouslySetInnerHTML={{ __html: html }} />
          ) : (
            <pre className="md2h-tool__code">{html}</pre>
          )}
        </div>
      </div>

      <style>{`
        .md2h-tool { display: flex; flex-direction: column; gap: 12px; }
        .md2h-tool__panes { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        @media (max-width: 700px) { .md2h-tool__panes { grid-template-columns: 1fr; } }
        .md2h-tool__pane {
          background: var(--bg-surface); border: 1px solid var(--surface-border);
          border-radius: 8px; overflow: hidden; display: flex; flex-direction: column;
        }
        .md2h-tool__pane-header {
          padding: 8px 12px; background: var(--bg); border-bottom: 1px solid var(--surface-border);
          font-size: 12px; font-weight: 600; color: var(--text-secondary);
          display: flex; justify-content: space-between; align-items: center;
        }
        .md2h-tool__tabs { display: flex; gap: 4px; }
        .md2h-tool__tab {
          padding: 3px 10px; font-size: 12px; border-radius: 4px; cursor: pointer;
          background: none; border: 1px solid transparent; color: var(--text-muted);
        }
        .md2h-tool__tab.active { background: rgba(129,140,248,0.15); border-color: #818cf8; color: #818cf8; }
        .md2h-tool__textarea {
          flex: 1; padding: 14px; font-size: 13px; font-family: 'Menlo','Consolas',monospace;
          background: var(--bg-surface); color: var(--text); border: none; outline: none;
          resize: none; min-height: 420px;
        }
        .md2h-tool__preview {
          padding: 16px; min-height: 420px; overflow-y: auto; color: var(--text);
          line-height: 1.6; font-size: 14px;
        }
        .md2h-tool__preview h1,.md2h-tool__preview h2,.md2h-tool__preview h3,
        .md2h-tool__preview h4,.md2h-tool__preview h5,.md2h-tool__preview h6 {
          margin: 12px 0 6px; font-weight: 700;
        }
        .md2h-tool__preview h1 { font-size: 1.6em; }
        .md2h-tool__preview h2 { font-size: 1.3em; }
        .md2h-tool__preview h3 { font-size: 1.1em; }
        .md2h-tool__preview p { margin: 0 0 8px; }
        .md2h-tool__preview ul,.md2h-tool__preview ol { padding-left: 20px; margin: 0 0 8px; }
        .md2h-tool__preview li { margin: 2px 0; }
        .md2h-tool__preview code {
          background: rgba(129,140,248,0.12); padding: 2px 5px; border-radius: 3px;
          font-family: 'Menlo','Consolas',monospace; font-size: 12px;
        }
        .md2h-tool__preview pre {
          background: var(--bg); padding: 12px; border-radius: 6px; overflow-x: auto;
          margin: 0 0 10px;
        }
        .md2h-tool__preview pre code { background: none; padding: 0; }
        .md2h-tool__preview blockquote {
          border-left: 3px solid #818cf8; padding-left: 12px; color: var(--text-secondary);
          margin: 0 0 10px;
        }
        .md2h-tool__preview a { color: #818cf8; text-decoration: underline; }
        .md2h-tool__preview hr { border: none; border-top: 1px solid var(--surface-border); margin: 12px 0; }
        .md2h-tool__code {
          padding: 14px; font-size: 12px; font-family: 'Menlo','Consolas',monospace;
          color: var(--text); white-space: pre-wrap; word-break: break-all;
          overflow-y: auto; min-height: 420px; margin: 0;
        }
        .btn.btn-sm { padding: 4px 10px; font-size: 11px; cursor: pointer; background: rgba(255,255,255,0.06); border: 1px solid var(--surface-border); color: var(--text); border-radius: 4px; white-space: nowrap; }
        .btn.btn-sm:hover { background: rgba(255,255,255,0.1); }
      `}</style>
    </div>
  );
}

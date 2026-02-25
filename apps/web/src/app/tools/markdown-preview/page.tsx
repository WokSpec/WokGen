'use client';
import { useState } from 'react';

const SAMPLE = `# Markdown Previewer

A **bold** statement and _italic_ text.

## Features
- Live preview
- Syntax support
- Copy output

### Code example
\`\`\`js
const hello = "world";
console.log(hello);
\`\`\`

> Blockquote text here.

[Link to WokGen](https://wokgen.wokspec.org)
`;

function markdownToHtml(md: string): string {
  return md
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/```[\w]*\n([\s\S]+?)```/g, '<pre><code>$1</code></pre>')
    .replace(/\n{2,}/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
}

export default function MarkdownPreviewPage() {
  const [md, setMd] = useState(SAMPLE);

  return (
    <div className="tool-page-root">
      <div className="tool-page-header">
        <h1 className="tool-page-title">Markdown Previewer</h1>
        <p className="tool-page-desc">Write Markdown and see a live preview. Runs entirely in your browser.</p>
      </div>
      <div className="tool-section" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', minHeight: '400px' }}>
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Input</div>
          <textarea value={md} onChange={e => setMd(e.target.value)} style={{ width: '100%', height: '380px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.875rem', color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: '0.875rem', outline: 'none', resize: 'vertical', lineHeight: 1.6 }} />
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Preview</div>
          <div className="markdown-preview" dangerouslySetInnerHTML={{ __html: markdownToHtml(md) }} style={{ height: '380px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.875rem', background: 'rgba(255,255,255,0.02)', fontSize: '0.9375rem', lineHeight: 1.6 }} />
        </div>
      </div>
    </div>
  );
}

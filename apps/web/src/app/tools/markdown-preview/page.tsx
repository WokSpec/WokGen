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
      <div className="tool-section mdpv-editor-grid">
        <div>
          <div className="mdpv-col-label">Input</div>
          <textarea value={md} onChange={e => setMd(e.target.value)} className="mdpv-textarea" />
        </div>
        <div>
          <div className="mdpv-col-label">Preview</div>
          <div className="markdown-preview mdpv-preview-box" dangerouslySetInnerHTML={{ __html: markdownToHtml(md) }} />
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useCallback, useRef } from 'react';
import { marked } from 'marked';

marked.setOptions({ gfm: true, breaks: true });

type MobileTab = 'edit' | 'preview';

const TOOLBAR = [
  { label: 'B',    title: 'Bold',        wrap: ['**', '**'],     placeholder: 'bold text' },
  { label: 'I',    title: 'Italic',      wrap: ['*', '*'],       placeholder: 'italic text' },
  { label: '`',    title: 'Inline Code', wrap: ['`', '`'],       placeholder: 'code' },
  { label: 'H1',   title: 'Heading 1',   prefix: '# ',           placeholder: 'Heading' },
  { label: 'H2',   title: 'Heading 2',   prefix: '## ',          placeholder: 'Heading' },
  { label: 'H3',   title: 'Heading 3',   prefix: '### ',         placeholder: 'Heading' },
  { label: 'Link',  title: 'Link',        wrap: ['[', '](url)'],  placeholder: 'link text' },
  { label: 'Img',   title: 'Image',       wrap: ['![', '](url)'], placeholder: 'alt text' },
  { label: '```',  title: 'Code Block',  block: true,            placeholder: 'code' },
  { label: 'Quote',    title: 'Quote',       prefix: '> ',           placeholder: undefined },
  { label: 'List',     title: 'List',        prefix: '- ',           placeholder: undefined },
  { label: 'Table',    title: 'Table',       table: true },
] as const;

const EXAMPLE = `# Hello, Markdown!

**Bold**, *italic*, and \`inline code\`.

## Code Block

\`\`\`js
const greet = name => \`Hello, \${name}!\`;
\`\`\`

## Table

| Column A | Column B | Column C |
|----------|----------|----------|
| row 1    | data     | data     |
| row 2    | data     | data     |

## Quote

> The only way to do great work is to love what you do.

- Item one
- Item two
- Item three
`;

function wordCount(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export default function MarkdownTool() {
  const [md, setMd] = useState(EXAMPLE);
  const [mobileTab, setMobileTab] = useState<MobileTab>('edit');
  const [copied, setCopied] = useState<'html' | 'md' | null>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const html = marked(md) as string;

  const insertAtCursor = useCallback((action: typeof TOOLBAR[number]) => {
    const ta = taRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = md.slice(start, end);

    let newText = '';
    let cursorPos = start;

    if ('table' in action && action.table) {
      const tbl = '\n| Header 1 | Header 2 | Header 3 |\n|----------|----------|----------|\n| Cell     | Cell     | Cell     |\n';
      newText = md.slice(0, start) + tbl + md.slice(end);
      cursorPos = start + tbl.length;
    } else if ('block' in action && action.block) {
      const inner = selected || 'code here';
      const block = `\`\`\`\n${inner}\n\`\`\``;
      newText = md.slice(0, start) + block + md.slice(end);
      cursorPos = start + block.length;
    } else if ('prefix' in action && action.prefix) {
      const line = md.slice(0, start).lastIndexOf('\n') + 1;
      newText = md.slice(0, line) + action.prefix + md.slice(line);
      cursorPos = start + action.prefix.length;
    } else if ('wrap' in action && action.wrap) {
      const [before, after] = action.wrap;
      const inner = selected || action.placeholder || 'text';
      newText = md.slice(0, start) + before + inner + after + md.slice(end);
      cursorPos = start + before.length + inner.length + after.length;
    } else {
      return;
    }

    setMd(newText);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(cursorPos, cursorPos);
    });
  }, [md]);

  const copyHtml = useCallback(async () => {
    await navigator.clipboard.writeText(html);
    setCopied('html');
    setTimeout(() => setCopied(null), 2000);
  }, [html]);

  const copyMd = useCallback(async () => {
    await navigator.clipboard.writeText(md);
    setCopied('md');
    setTimeout(() => setCopied(null), 2000);
  }, [md]);

  const words = wordCount(md);
  const chars = md.length;

  return (
    <div className="md-tool">
      {/* Toolbar */}
      <div className="md-toolbar">
        {TOOLBAR.map((btn, i) => (
          <button
            key={i}
            className="md-tb-btn"
            title={btn.title}
            onClick={() => insertAtCursor(btn)}
          >
            {btn.label}
          </button>
        ))}
        <div className="md-toolbar-spacer" />
        <button className="btn-ghost-xs" onClick={() => setMd('')}>Clear</button>
        <button className="btn-ghost-xs" onClick={() => setMd(EXAMPLE)}>Example</button>
      </div>

      {/* Mobile tabs */}
      <div className="md-mobile-tabs">
        <button
          className={`md-mobile-tab${mobileTab === 'edit' ? ' active' : ''}`}
          onClick={() => setMobileTab('edit')}
        >
          Edit
        </button>
        <button
          className={`md-mobile-tab${mobileTab === 'preview' ? ' active' : ''}`}
          onClick={() => setMobileTab('preview')}
        >
          Preview
        </button>
      </div>

      {/* Split pane */}
      <div className="md-panes">
        <div className={`md-pane${mobileTab !== 'edit' ? ' md-pane-hidden-mobile' : ''}`}>
          <div className="md-pane-label">Markdown</div>
          <textarea
            ref={taRef}
            className="md-textarea"
            value={md}
            onChange={e => setMd(e.target.value)}
            placeholder="Start typing Markdown…"
            spellCheck={false}
          />
        </div>
        <div className={`md-pane${mobileTab !== 'preview' ? ' md-pane-hidden-mobile' : ''}`}>
          <div className="md-pane-label">Preview</div>
          <div
            className="md-preview"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>

      {/* Status bar */}
      <div className="md-statusbar">
        <span>{words} word{words !== 1 ? 's' : ''}</span>
        <span>{chars} char{chars !== 1 ? 's' : ''}</span>
        <div className="md-statusbar-spacer" />
        <button className="btn-ghost-xs" onClick={copyMd}>
          {copied === 'md' ? 'Copied!' : 'Copy Markdown'}
        </button>
        <button className="btn-ghost-xs" onClick={copyHtml}>
          {copied === 'html' ? 'Copied!' : 'Copy HTML'}
        </button>
      </div>
    </div>
  );
}

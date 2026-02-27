'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import CodeBlock from '@tiptap/extension-code-block';
import NextLink from 'next/link';

interface Props {
  projectId: string;
  projectName: string;
  docId: string;
  initialTitle: string;
  initialContent: string;
  initialEmoji: string;
}

const TOOLBAR_ACTIONS = [
  { label: 'B',   title: 'Bold',          cmd: (e: ReturnType<typeof useEditor>) => e?.chain().focus().toggleBold().run() },
  { label: 'I',   title: 'Italic',        cmd: (e: ReturnType<typeof useEditor>) => e?.chain().focus().toggleItalic().run() },
  { label: 'U',   title: 'Underline',     cmd: (e: ReturnType<typeof useEditor>) => e?.chain().focus().toggleUnderline().run() },
  { label: 'H1',  title: 'Heading 1',     cmd: (e: ReturnType<typeof useEditor>) => e?.chain().focus().toggleHeading({ level: 1 }).run() },
  { label: 'H2',  title: 'Heading 2',     cmd: (e: ReturnType<typeof useEditor>) => e?.chain().focus().toggleHeading({ level: 2 }).run() },
  { label: 'H3',  title: 'Heading 3',     cmd: (e: ReturnType<typeof useEditor>) => e?.chain().focus().toggleHeading({ level: 3 }).run() },
  { label: '—',   title: 'Divider',       cmd: (e: ReturnType<typeof useEditor>) => e?.chain().focus().setHorizontalRule().run() },
  { label: '</>',  title: 'Code Block',   cmd: (e: ReturnType<typeof useEditor>) => e?.chain().focus().toggleCodeBlock().run() },
  { label: '• —', title: 'Bullet list',  cmd: (e: ReturnType<typeof useEditor>) => e?.chain().focus().toggleBulletList().run() },
  { label: '1.—', title: 'Ordered list', cmd: (e: ReturnType<typeof useEditor>) => e?.chain().focus().toggleOrderedList().run() },
];

export default function DocumentEditorClient({
  projectId, projectName, docId, initialTitle, initialContent, initialEmoji,
}: Props) {
  const [title, setTitle] = useState(initialTitle);
  const [emoji, setEmoji] = useState(initialEmoji);
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback(async (updates: { title?: string; content?: string; emoji?: string }) => {
    setSaveState('saving');
    try {
      await fetch(`/api/projects/${projectId}/documents/${docId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      setSaveState('saved');
    } catch {
      setSaveState('unsaved');
    }
  }, [projectId, docId]);

  const debounceSave = useCallback((updates: { title?: string; content?: string }) => {
    setSaveState('unsaved');
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => save(updates), 1200);
  }, [save]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Image.configure({ inline: false }),
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: 'noopener noreferrer' } }),
      Underline,
      CodeBlock,
      Placeholder.configure({ placeholder: 'Start writing, or type / for commands…' }),
    ],
    content: (() => {
      try { return JSON.parse(initialContent); } catch { return initialContent; }
    })(),
    onUpdate: ({ editor }) => {
      debounceSave({ content: JSON.stringify(editor.getJSON()) });
    },
  });

  const handleTitleChange = (val: string) => {
    setTitle(val);
    debounceSave({ title: val });
  };

  // Export as Markdown (simplified — just get plain text)
  const handleExportMd = () => {
    const text = editor?.getText() ?? '';
    const blob = new Blob([`# ${title}\n\n${text}`], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="doc-editor">
      {/* Breadcrumb */}
      <div className="doc-editor__breadcrumb">
        <NextLink href={`/projects/${projectId}`} className="doc-editor__bc-link">
          {projectName}
        </NextLink>
        <span className="doc-editor__bc-sep">/</span>
        <span className="doc-editor__bc-current">{title || 'Untitled'}</span>
        <div className="doc-editor__save-state">
          {saveState === 'saving' && <span>Saving…</span>}
          {saveState === 'saved'  && <span>Saved</span>}
          {saveState === 'unsaved' && <span>Unsaved changes</span>}
        </div>
        <button type="button" className="doc-editor__export-btn" onClick={handleExportMd} title="Export as Markdown">
          ↓ .md
        </button>
      </div>

      {/* Toolbar */}
      <div className="doc-editor__toolbar">
        {TOOLBAR_ACTIONS.map(({ label, title: t, cmd }) => (
          <button type="button"
            key={label}
            className="doc-editor__toolbar-btn"
            title={t}
            onMouseDown={e => { e.preventDefault(); cmd(editor); }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Document area */}
      <div className="doc-editor__body">
        <div className="doc-editor__meta">
          <button type="button"
            className="doc-editor__emoji"
            title="Click to change emoji"
            onClick={() => {
              const e = window.prompt('Enter an emoji:', emoji);
              if (e) { setEmoji(e); save({ emoji: e }); }
            }}
          >
            {emoji}
          </button>
          <input
            className="doc-editor__title"
            value={title}
            onChange={e => handleTitleChange(e.target.value)}
            placeholder="Untitled"
          />
        </div>
        <EditorContent editor={editor} className="doc-editor__content" />
      </div>

      <style>{`
        .doc-editor {
          display: flex;
          flex-direction: column;
          height: calc(100dvh - var(--nav-height, 56px));
          background: var(--surface-base, #0d0d14);
          color: var(--text);
        }

        .doc-editor__breadcrumb {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 20px;
          border-bottom: 1px solid var(--border);
          font-size: 0.72rem;
          color: var(--text-faint);
          flex-shrink: 0;
        }
        .doc-editor__bc-link {
          color: var(--text-muted);
          text-decoration: none;
        }
        .doc-editor__bc-link:hover { color: var(--accent); }
        .doc-editor__bc-sep { opacity: 0.3; }
        .doc-editor__bc-current { color: var(--text-secondary); }
        .doc-editor__save-state {
          margin-left: auto;
          font-size: 0.68rem;
          color: var(--text-faint);
        }
        .doc-editor__export-btn {
          background: none;
          border: 1px solid var(--surface-raised);
          color: var(--text-faint);
          font-size: 0.68rem;
          padding: 3px 8px;
          border-radius: 2px;
          cursor: pointer;
          transition: color 0.1s, border-color 0.1s;
        }
        .doc-editor__export-btn:hover { color: var(--text-secondary); border-color: var(--text-faint); }

        .doc-editor__toolbar {
          display: flex;
          align-items: center;
          gap: 2px;
          padding: 6px 12px;
          border-bottom: 1px solid var(--surface-hover);
          flex-shrink: 0;
          background: var(--surface-card);
          flex-wrap: wrap;
        }
        .doc-editor__toolbar-btn {
          background: none;
          border: none;
          color: var(--text-faint);
          font-size: 0.7rem;
          font-family: ui-monospace, monospace;
          font-weight: 600;
          padding: 4px 8px;
          border-radius: 2px;
          cursor: pointer;
          transition: background 0.1s, color 0.1s;
          line-height: 1;
          min-width: 28px;
          text-align: center;
        }
        .doc-editor__toolbar-btn:hover {
          background: var(--border);
          color: var(--text);
        }

        .doc-editor__body {
          flex: 1;
          overflow-y: auto;
          padding: 40px 20px 80px;
          max-width: 780px;
          margin: 0 auto;
          width: 100%;
        }

        .doc-editor__meta {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 16px;
        }
        .doc-editor__emoji {
          font-size: 2.5rem;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          line-height: 1;
          flex-shrink: 0;
          opacity: 0.9;
          transition: opacity 0.1s;
        }
        .doc-editor__emoji:hover { opacity: 1; }
        .doc-editor__title {
          flex: 1;
          background: none;
          border: none;
          font-size: 2rem;
          font-weight: 700;
          color: var(--text);
          outline: none;
          padding: 0;
          line-height: 1.2;
          letter-spacing: -0.02em;
          width: 100%;
        }
        .doc-editor__title::placeholder { color: var(--border); }

        /* Tiptap content styles */
        .doc-editor__content .ProseMirror {
          outline: none;
          font-size: 1rem;
          line-height: 1.7;
          color: var(--text);
        }
        .doc-editor__content .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          color: var(--border);
          pointer-events: none;
          float: left;
          height: 0;
        }
        .doc-editor__content .ProseMirror h1 {
          font-size: 1.6rem; font-weight: 700; margin: 1.5em 0 0.5em; letter-spacing: -0.02em;
        }
        .doc-editor__content .ProseMirror h2 {
          font-size: 1.25rem; font-weight: 600; margin: 1.25em 0 0.4em; letter-spacing: -0.01em;
        }
        .doc-editor__content .ProseMirror h3 {
          font-size: 1.05rem; font-weight: 600; margin: 1em 0 0.35em;
        }
        .doc-editor__content .ProseMirror ul,
        .doc-editor__content .ProseMirror ol {
          padding-left: 1.5em; margin: 0.5em 0;
        }
        .doc-editor__content .ProseMirror li { margin: 0.2em 0; }
        .doc-editor__content .ProseMirror code {
          font-family: ui-monospace, monospace;
          font-size: 0.85em;
          background: var(--surface-raised);
          padding: 0.1em 0.35em;
          border-radius: 2px;
        }
        .doc-editor__content .ProseMirror pre {
          background: var(--overlay-30);
          border: 1px solid var(--surface-raised);
          border-radius: 3px;
          padding: 1em;
          overflow-x: auto;
          margin: 1em 0;
        }
        .doc-editor__content .ProseMirror pre code {
          background: none; padding: 0; font-size: 0.85rem;
        }
        .doc-editor__content .ProseMirror blockquote {
          border-left: 3px solid var(--border);
          padding-left: 1em;
          margin: 0.75em 0;
          color: var(--text-muted);
        }
        .doc-editor__content .ProseMirror hr {
          border: none;
          border-top: 1px solid var(--border);
          margin: 1.5em 0;
        }
        .doc-editor__content .ProseMirror a {
          color: var(--accent); text-decoration: underline;
        }
        .doc-editor__content .ProseMirror img {
          max-width: 100%; height: auto; border-radius: 2px; margin: 0.5em 0;
        }
        .doc-editor__content .ProseMirror strong { color: var(--text); }
      `}</style>
    </div>
  );
}

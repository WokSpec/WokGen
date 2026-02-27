'use client';

/**
 * EralCompanion — site-wide floating Eral 7c companion panel.
 *
 * A persistent 44px button fixed bottom-right (above the voice button).
 * Clicking opens a 360x600 slide-over panel with a focused Eral chat view.
 * The panel knows which page/project you're on (reads URL).
 */

import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { usePathname } from 'next/navigation';

interface Message { role: 'user' | 'assistant'; content: string; id: string }

// ── minimal inline styles — use CSS variables for theming ───────────────────
const S = {
  btn: {
    position: 'fixed' as const,
    bottom: 24,
    right: 24,
    zIndex: 9998,
    width: 44,
    height: 44,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--grad-from) 0%, var(--accent) 100%)',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 20px var(--accent-glow)',
    transition: 'transform 0.15s, box-shadow 0.15s',
    color: 'var(--text)',
  },
  panel: (open: boolean) => ({
    position: 'fixed' as const,
    bottom: 80,
    right: 24,
    zIndex: 9997,
    width: 360,
    height: 560,
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: 6,
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
    transform: open ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.97)',
    opacity: open ? 1 : 0,
    pointerEvents: (open ? 'all' : 'none') as 'all' | 'none',
    transition: 'transform 0.18s ease, opacity 0.18s ease',
    boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
  }),
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 14px',
    borderBottom: '1px solid var(--border-subtle)',
    background: 'var(--bg-surface)',
    flexShrink: 0,
  },
  msgList: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '12px 14px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
  },
  bubble: (role: 'user' | 'assistant') => ({
    maxWidth: '85%',
    padding: '7px 11px',
    borderRadius: role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
    background: role === 'user' ? 'var(--accent-subtle)' : 'var(--surface-raised)',
    border: '1px solid',
    borderColor: role === 'user' ? 'var(--accent-glow)' : 'var(--border-subtle)',
    alignSelf: role === 'user' ? 'flex-end' : 'flex-start',
    fontSize: 13,
    lineHeight: 1.45,
    color: 'var(--text-primary)',
    whiteSpace: 'pre-wrap' as const,
    wordBreak: 'break-word' as const,
  }),
  inputRow: {
    display: 'flex',
    gap: 8,
    padding: '10px 14px',
    borderTop: '1px solid var(--border-subtle)',
    background: 'var(--bg-surface)',
    flexShrink: 0,
  },
  input: {
    flex: 1,
    background: 'var(--surface-raised)',
    border: '1px solid var(--border)',
    borderRadius: 4,
    padding: '7px 10px',
    color: 'var(--text)',
    fontSize: 13,
    outline: 'none',
    resize: 'none' as const,
    fontFamily: 'inherit',
  },
  sendBtn: {
    background: 'var(--accent-muted)',
    border: 'none',
    borderRadius: 4,
    width: 34,
    cursor: 'pointer',
    color: 'var(--text)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'background 0.1s',
  },
};

// ── Main component ─────────────────────────────────────────────────────────

function EralCompanionInner() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [convId, setConvId]     = useState<string | null>(null);
  const [unread, setUnread]     = useState(0);
  const endRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const scrollToEnd = () => endRef.current?.scrollIntoView({ behavior: 'smooth' });

  useEffect(() => { scrollToEnd(); }, [messages]);

  // Don't show on Eral page itself (all hooks called above)
  if (pathname?.startsWith('/eral')) return null;

  const handleOpen = () => {
    setOpen(o => !o);
    if (!open) setUnread(0);
  };

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setLoading(true);

    const userMsg: Message = { role: 'user', content: text, id: `u-${Date.now()}` };
    setMessages(prev => [...prev, userMsg]);

    try {
      const projectId = new URLSearchParams(window.location.search).get('projectId') ?? undefined;
      const res = await fetch('/api/eral/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          conversationId: convId ?? undefined,
          modelVariant: 'standard',
          stream: false,
          context: { projectId, mode: 'companion', pathname },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const reply = data.reply ?? data.message ?? data.content ?? '…';
        setMessages(prev => [...prev, { role: 'assistant', content: reply, id: `a-${Date.now()}` }]);
        if (data.conversationId && !convId) setConvId(data.conversationId);
        if (!open) setUnread(n => n + 1);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Try again.', id: `err-${Date.now()}` }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Could not reach Eral 7c.', id: `err-${Date.now()}` }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, convId, open, pathname]);

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <>
      {/* Slide-over panel */}
      <div style={S.panel(open)} role="dialog" aria-modal aria-label="Eral 7c companion" aria-hidden={!open}>
        {/* Header */}
        <div style={S.header}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--grad-from), var(--accent))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, color: 'var(--text)', flexShrink: 0,
          }}>E</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', lineHeight: 1 }}>Eral 7c</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>AI creative director</div>
          </div>
          <a
            href={`/eral${convId ? `?restore=${convId}` : ''}`}
            style={{ fontSize: 11, color: 'var(--text-muted)', textDecoration: 'none', padding: '3px 6px',
              border: '1px solid var(--border-subtle)', borderRadius: 3, transition: 'color 0.1s' }}
          >
            Full view
          </a>
          <button
            onClick={() => setOpen(false)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
              padding: 4, marginLeft: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            aria-label="Close Eral companion"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>

        {/* Message list */}
        <div style={S.msgList}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: 12 }}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>Eral 7c</div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Eral 7c</div>
              <div>Your AI creative director.</div>
              <div>Ask about your project, get help generating assets, or brainstorm ideas.</div>
            </div>
          )}
          {messages.map(m => (
            <div key={m.id} style={S.bubble(m.role)}>{m.content}</div>
          ))}
          {loading && (
            <div style={{ ...S.bubble('assistant'), color: 'var(--text-secondary)' }}>
              <span style={{ display: 'inline-flex', gap: 3 }}>
                <span style={{ animation: 'pulse 1s infinite' }}>·</span>
                <span style={{ animation: 'pulse 1s infinite 0.2s' }}>·</span>
                <span style={{ animation: 'pulse 1s infinite 0.4s' }}>·</span>
              </span>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Input row */}
        <div style={S.inputRow}>
          <textarea
            style={S.input}
            rows={2}
            placeholder="Ask Eral 7c anything…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKey}
            disabled={loading}
          />
          <button
            style={{ ...S.sendBtn, opacity: loading || !input.trim() ? 0.5 : 1 }}
            onClick={send}
            disabled={loading || !input.trim()}
            aria-label="Send"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M13 1L1 7l4 2 2 4 1.5-4.5L13 1z" fill="currentColor"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Toggle button */}
      <button
        style={S.btn}
        onClick={handleOpen}
        aria-label={open ? 'Close Eral companion' : 'Open Eral companion'}
        title="Eral 7c — AI creative director (⌘⇧E)"
      >
        {open ? (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M2 2l14 14M16 2L2 16" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        ) : (
          <>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 2.5a7.5 7.5 0 1 1 0 15 7.5 7.5 0 0 1 0-15zM7 10h6M10 7v6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span style={{
              position: 'absolute', top: -1, right: -1,
              fontSize: 8, fontWeight: 800, color: 'var(--text)',
              background: 'var(--accent-dim)',
              width: 14, height: 14, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              letterSpacing: '-0.02em',
              border: '1.5px solid var(--bg)',
            }}>7c</span>
          </>
        )}
        {unread > 0 && !open && (
          <span style={{
            position: 'absolute', top: -4, right: -4,
            background: 'var(--danger)', borderRadius: '50%',
            width: 16, height: 16, fontSize: 9, fontWeight: 700, color: 'var(--text)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid var(--bg)',
          }}>{unread}</span>
        )}
      </button>
    </>
  );
}

export const EralCompanion = memo(EralCompanionInner);

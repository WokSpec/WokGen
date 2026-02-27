'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NoteTag { tag: string }

interface EralNoteData {
  id: string;
  title: string;
  content: string;
  color: NoteColor;
  pinned: boolean;
  tags: NoteTag[];
  updatedAt: string;
}

type NoteColor = 'default' | 'purple' | 'blue' | 'green' | 'amber' | 'red';

const COLOR_SWATCHES: { value: NoteColor; bg: string; border: string }[] = [
  { value: 'default', bg: 'var(--bg-surface)',      border: 'var(--surface-border)' },
  { value: 'purple',  bg: 'var(--accent-subtle)', border: 'var(--accent-glow)' },
  { value: 'blue',    bg: 'var(--info-bg)', border: 'var(--info)' },
  { value: 'green',   bg: 'var(--success-bg)', border: 'var(--success-glow)' },
  { value: 'amber',   bg: 'var(--warning-bg)', border: 'var(--warning)' },
  { value: 'red',     bg: 'var(--danger-bg)', border: 'var(--danger-border)' },
];

const GUEST_KEY = 'wokgen-eral-notes-guest';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function loadGuestNotes(): EralNoteData[] {
  try {
    return JSON.parse(localStorage.getItem(GUEST_KEY) ?? '[]');
  } catch { return []; }
}

function saveGuestNotes(notes: EralNoteData[]) {
  try { localStorage.setItem(GUEST_KEY, JSON.stringify(notes)); } catch {}
}

// ---------------------------------------------------------------------------
// EralNotepad component
// ---------------------------------------------------------------------------

interface EralNotepadProps {
  /** Called when user clicks "Send to Eral" — passes note content */
  onSendToEral?: (content: string, title: string) => void;
  /** Called when user clicks "Generate from note" — passes content as prompt */
  onGenerateFromNote?: (content: string) => void;
  /** Active note context — the calling page can pre-populate a context tag */
  contextTag?: string;
}

export function EralNotepad({ onSendToEral, onGenerateFromNote, contextTag }: EralNotepadProps) {
  const { data: session } = useSession();
  const isLoggedIn = Boolean(session?.user?.id);

  const [notes, setNotes] = useState<EralNoteData[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();

  const activeNote = notes.find((n) => n.id === activeId) ?? null;

  // Load notes
  useEffect(() => {
    if (isLoggedIn) {
      setLoading(true);
      fetch('/api/eral/notes')
        .then((r) => r.json())
        .then((d) => { setNotes(d.notes ?? []); })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setNotes(loadGuestNotes());
    }
  }, [isLoggedIn]);

  // Create new note
  const createNote = useCallback(async () => {
    const newNote: EralNoteData = {
      id: `local-${Date.now()}`,
      title: 'Untitled',
      content: '',
      color: 'default',
      pinned: false,
      tags: contextTag ? [{ tag: contextTag }] : [],
      updatedAt: new Date().toISOString(),
    };

    if (isLoggedIn) {
      const res = await fetch('/api/eral/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newNote.title, content: newNote.content, tags: newNote.tags.map(t => t.tag) }),
      }).then((r) => r.json()).catch(() => null);
      if (res?.note) {
        setNotes((prev) => [res.note, ...prev]);
        setActiveId(res.note.id);
        return;
      }
    }
    const updated = [newNote, ...notes];
    setNotes(updated);
    if (!isLoggedIn) saveGuestNotes(updated);
    setActiveId(newNote.id);
  }, [isLoggedIn, notes, contextTag]);

  // Delete note
  const deleteNote = useCallback(async (id: string) => {
    if (isLoggedIn) {
      await fetch(`/api/eral/notes/${id}`, { method: 'DELETE' }).catch(() => {});
    }
    const updated = notes.filter((n) => n.id !== id);
    setNotes(updated);
    if (!isLoggedIn) saveGuestNotes(updated);
    if (activeId === id) setActiveId(updated[0]?.id ?? null);
  }, [isLoggedIn, notes, activeId]);

  // Toggle pin
  const togglePin = useCallback(async (id: string) => {
    const note = notes.find((n) => n.id === id);
    if (!note) return;
    const pinned = !note.pinned;
    const updated = notes.map((n) => n.id === id ? { ...n, pinned } : n)
      .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
    setNotes(updated);
    if (!isLoggedIn) saveGuestNotes(updated);
    if (isLoggedIn) {
      await fetch(`/api/eral/notes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinned }),
      }).catch(() => {});
    }
  }, [isLoggedIn, notes]);

  // Save note content (debounced)
  const updateNoteField = useCallback((id: string, field: 'title' | 'content' | 'color', value: string) => {
    const updated = notes.map((n) => n.id === id ? { ...n, [field]: value, updatedAt: new Date().toISOString() } : n);
    setNotes(updated);
    if (!isLoggedIn) saveGuestNotes(updated);

    clearTimeout(saveTimer.current);
    setSaving(true);
    saveTimer.current = setTimeout(async () => {
      if (isLoggedIn) {
        await fetch(`/api/eral/notes/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [field]: value }),
        }).catch(() => {});
      }
      setSaving(false);
    }, 500);
  }, [isLoggedIn, notes]);

  const filteredNotes = notes.filter((n) =>
    !search ||
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.content.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="eral-notepad">
      {/* List panel */}
      <div className="eral-notepad__list">
        <div className="eral-notepad__list-header">
          <span className="eral-notepad__list-title">Notes</span>
          <button className="eral-notepad__new-btn" onClick={createNote} title="New note">+</button>
        </div>
        <input
          className="eral-notepad__search"
          type="text"
          placeholder="Search notes…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {!isLoggedIn && (
          <div className="eral-notepad__guest-banner">
            Notes saved locally.{' '}
            <a href="/login" className="eral-notepad__guest-link">Sign in</a> to sync across devices.
          </div>
        )}
        <div className="eral-notepad__items">
          {loading && <div className="eral-notepad__loading">Loading…</div>}
          {!loading && filteredNotes.length === 0 && (
            <div className="eral-notepad__empty">No notes yet. Click + to create one.</div>
          )}
          {filteredNotes.map((note) => (
            <button
              key={note.id}
              className={`eral-notepad__item${activeId === note.id ? ' eral-notepad__item--active' : ''}`}
              onClick={() => setActiveId(note.id)}
            >
              <span className="eral-notepad__item-title">{note.title || 'Untitled'}</span>
              {note.pinned && <span className="eral-notepad__item-pin" title="Pinned">·</span>}
              <span className="eral-notepad__item-preview">
                {note.content.slice(0, 60)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Editor panel */}
      <div className="eral-notepad__editor">
        {activeNote ? (
          <>
            <div className="eral-notepad__editor-toolbar">
              <input
                className="eral-notepad__title-input"
                type="text"
                value={activeNote.title}
                onChange={(e) => updateNoteField(activeNote.id, 'title', e.target.value)}
                placeholder="Title"
              />
              <div className="eral-notepad__editor-actions">
                <button
                  className={`eral-notepad__pin-btn${activeNote.pinned ? ' eral-notepad__pin-btn--active' : ''}`}
                  onClick={() => togglePin(activeNote.id)}
                  title={activeNote.pinned ? 'Unpin' : 'Pin'}
                >
                  {activeNote.pinned ? 'Pinned' : 'Pin'}
                </button>
                {onSendToEral && (
                  <button
                    className="eral-notepad__action-btn"
                    onClick={() => onSendToEral(activeNote.content, activeNote.title)}
                    title="Send this note to Eral 7c as context"
                  >
                    Send to Eral
                  </button>
                )}
                {onGenerateFromNote && (
                  <button
                    className="eral-notepad__action-btn eral-notepad__action-btn--primary"
                    onClick={() => onGenerateFromNote(activeNote.content)}
                    title="Use note content as generation prompt"
                  >
                    Generate
                  </button>
                )}
                <button
                  className="eral-notepad__delete-btn"
                  onClick={() => deleteNote(activeNote.id)}
                  title="Delete note"
                >
                  Delete
                </button>
              </div>
            </div>
            <div className="eral-notepad__color-row">
              {COLOR_SWATCHES.map((s) => (
                <button
                  key={s.value}
                  className={`eral-notepad__color-swatch${activeNote.color === s.value ? ' eral-notepad__color-swatch--active' : ''}`}
                  style={{ background: s.bg, borderColor: s.border }}
                  onClick={() => updateNoteField(activeNote.id, 'color', s.value)}
                  title={s.value}
                />
              ))}
              {saving && <span className="eral-notepad__saving">Saving…</span>}
            </div>
            <textarea
              className="eral-notepad__textarea"
              value={activeNote.content}
              onChange={(e) => updateNoteField(activeNote.id, 'content', e.target.value)}
              placeholder="Write anything — ideas, prompts, references, plans…"
            />
          </>
        ) : (
          <div className="eral-notepad__editor-empty">
            <p>Select a note or create a new one.</p>
            <button className="eral-notepad__new-btn-lg" onClick={createNote}>New Note</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default EralNotepad;

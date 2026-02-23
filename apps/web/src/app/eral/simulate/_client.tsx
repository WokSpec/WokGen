'use client';

import { useState, useRef, useCallback } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Persona {
  id: string;
  name: string;
  personality: string;
  role: string;
}

interface TurnMessage {
  turn: number;
  agent: string;
  message: string;
}

const TONE_OPTIONS = [
  { id: 'roast',      label: '🔥 Roast Battle',   desc: 'Brutal, comedic burns between personas' },
  { id: 'debate',     label: '⚖️ Debate',           desc: 'Structured argument with positions' },
  { id: 'brainstorm', label: '💡 Brainstorm',       desc: 'Collaborative ideation session' },
  { id: 'interview',  label: '🎤 Interview',        desc: 'Q&A — first persona is the interviewer' },
  { id: 'casual',     label: '☕ Casual Chat',      desc: 'Natural free-flowing conversation' },
];

const PRESET_PERSONAS: Persona[][] = [
  [
    { id: '1', name: 'Alex',   personality: 'Sarcastic tech bro who thinks they know everything', role: '' },
    { id: '2', name: 'Maya',   personality: 'Sharp-tongued designer who hates bad UX', role: '' },
    { id: '3', name: 'Jordan', personality: 'Overly optimistic startup founder on their third pivot', role: '' },
  ],
  [
    { id: '1', name: 'The Skeptic',  personality: 'Questions everything with data and logic', role: 'Devil\'s advocate' },
    { id: '2', name: 'The Visionary', personality: 'Thinks 10 years ahead, often unrealistic', role: 'Big picture thinker' },
  ],
  [
    { id: '1', name: 'Senior Dev', personality: 'Seen it all, deeply pragmatic, slightly jaded', role: '' },
    { id: '2', name: 'Junior Dev', personality: 'Enthusiastic about new frameworks, learns fast', role: '' },
    { id: '3', name: 'PM',         personality: 'Speaks only in OKRs and user stories', role: '' },
  ],
];

const MODEL_OPTIONS = [
  { id: 'eral-7c',       label: 'Eral 7C (Groq — fast)' },
  { id: 'eral-creative', label: 'Eral Creative (Mixtral)' },
  { id: 'eral-mini',     label: 'Eral Mini (fastest)' },
];

const AGENT_COLORS = [
  '#a78bfa', '#60a5fa', '#34d399', '#fbbf24', '#f87171', '#fb923c',
];

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

// ─── Persona editor row ───────────────────────────────────────────────────────

function PersonaRow({
  persona,
  color,
  onUpdate,
  onRemove,
  canRemove,
}: {
  persona: Persona;
  color: string;
  onUpdate: (p: Persona) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  return (
    <div className="simulate-persona-row">
      <span className="simulate-persona-row__dot" style={{ background: color }} />
      <input
        className="input simulate-persona-row__name"
        value={persona.name}
        onChange={e => onUpdate({ ...persona, name: e.target.value })}
        placeholder="Name"
        maxLength={32}
      />
      <input
        className="input simulate-persona-row__personality"
        value={persona.personality}
        onChange={e => onUpdate({ ...persona, personality: e.target.value })}
        placeholder="Personality / description"
        maxLength={120}
      />
      <input
        className="input simulate-persona-row__role"
        value={persona.role}
        onChange={e => onUpdate({ ...persona, role: e.target.value })}
        placeholder="Role (optional)"
        maxLength={60}
      />
      {canRemove && (
        <button className="simulate-persona-row__remove btn btn--ghost btn--sm" onClick={onRemove} aria-label="Remove persona">
          ✕
        </button>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SimulateClient() {
  const [personas, setPersonas]   = useState<Persona[]>([
    { id: uid(), name: 'Alex',   personality: 'Sarcastic tech bro who thinks they know everything', role: '' },
    { id: uid(), name: 'Maya',   personality: 'Sharp-tongued designer who hates bad UX', role: '' },
  ]);
  const [topic, setTopic]         = useState('');
  const [tone, setTone]           = useState('roast');
  const [turns, setTurns]         = useState(8);
  const [model, setModel]         = useState('eral-7c');
  const [running, setRunning]     = useState(false);
  const [transcript, setTranscript] = useState<TurnMessage[]>([]);
  const [error, setError]         = useState('');
  const [done, setDone]           = useState(false);
  const abortRef                  = useRef<AbortController | null>(null);
  const feedEndRef                = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const updatePersona = (id: string, updated: Persona) => {
    setPersonas(prev => prev.map(p => p.id === id ? updated : p));
  };

  const removePersona = (id: string) => {
    setPersonas(prev => prev.filter(p => p.id !== id));
  };

  const addPersona = () => {
    if (personas.length >= 6) return;
    setPersonas(prev => [...prev, { id: uid(), name: `Agent ${prev.length + 1}`, personality: '', role: '' }]);
  };

  const loadPreset = (preset: Persona[]) => {
    setPersonas(preset.map(p => ({ ...p, id: uid() })));
  };

  const stop = () => {
    abortRef.current?.abort();
    setRunning(false);
  };

  const run = async () => {
    if (running) return;
    if (!topic.trim()) { setError('Enter a topic first.'); return; }
    if (personas.some(p => !p.name.trim())) { setError('All personas need a name.'); return; }

    setError('');
    setTranscript([]);
    setDone(false);
    setRunning(true);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch('/api/eral/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personas, topic, tone, turns, model }),
        signal: ctrl.signal,
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? `HTTP ${res.status}`);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) { setError('Stream unavailable'); return; }

      const decoder = new TextDecoder();
      let buf = '';

      while (true) {
        const { value, done: streamDone } = await reader.read();
        if (streamDone) break;

        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;
          try {
            const msg = JSON.parse(raw);
            if (msg.done) {
              setDone(true);
              if (msg.error) setError(msg.error);
            } else if (msg.agent) {
              setTranscript(prev => [...prev, msg as TurnMessage]);
              setTimeout(scrollToBottom, 50);
            }
          } catch {}
        }
      }
    } catch (err: unknown) {
      if ((err as Error).name !== 'AbortError') {
        setError((err as Error).message ?? 'Simulation failed');
      }
    } finally {
      setRunning(false);
      ctrl.abort();
    }
  };

  const copyTranscript = async () => {
    const text = transcript
      .map(t => `[${t.agent}]\n${t.message}`)
      .join('\n\n');
    await navigator.clipboard.writeText(text);
  };

  const colorFor = (name: string) => {
    const idx = personas.findIndex(p => p.name === name);
    return AGENT_COLORS[idx >= 0 ? idx % AGENT_COLORS.length : 0];
  };

  return (
    <div className="simulate-page">
      <div className="simulate-page__header">
        <h1 className="simulate-page__title">Agent Simulate</h1>
        <p className="simulate-page__subtitle">
          Set up personas, choose a tone, and watch AI agents go at it.
        </p>
      </div>

      <div className="simulate-page__layout">
        {/* ─ Config panel ─ */}
        <div className="simulate-config">
          {/* Presets */}
          <div className="simulate-config__section">
            <label className="simulate-config__label">Quick presets</label>
            <div className="simulate-config__presets">
              {PRESET_PERSONAS.map((preset, i) => (
                <button
                  key={i}
                  className="btn btn--ghost btn--sm simulate-config__preset-btn"
                  onClick={() => loadPreset(preset)}
                >
                  {preset.map(p => p.name).join(' · ')}
                </button>
              ))}
            </div>
          </div>

          {/* Personas */}
          <div className="simulate-config__section">
            <label className="simulate-config__label">Personas ({personas.length}/6)</label>
            <div className="simulate-personas">
              {personas.map((p, i) => (
                <PersonaRow
                  key={p.id}
                  persona={p}
                  color={AGENT_COLORS[i % AGENT_COLORS.length]}
                  onUpdate={updated => updatePersona(p.id, updated)}
                  onRemove={() => removePersona(p.id)}
                  canRemove={personas.length > 2}
                />
              ))}
            </div>
            {personas.length < 6 && (
              <button className="btn btn--ghost btn--sm simulate-config__add-persona" onClick={addPersona}>
                + Add persona
              </button>
            )}
          </div>

          {/* Topic */}
          <div className="simulate-config__section">
            <label className="simulate-config__label">Topic / scenario</label>
            <input
              className="input"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder='e.g. "Why Tailwind CSS is a mistake" or "Should AI replace designers?"'
              maxLength={300}
            />
          </div>

          {/* Tone */}
          <div className="simulate-config__section">
            <label className="simulate-config__label">Tone</label>
            <div className="simulate-config__tone-grid">
              {TONE_OPTIONS.map(t => (
                <button
                  key={t.id}
                  className={`simulate-tone-btn ${tone === t.id ? 'simulate-tone-btn--active' : ''}`}
                  onClick={() => setTone(t.id)}
                >
                  <span className="simulate-tone-btn__label">{t.label}</span>
                  <span className="simulate-tone-btn__desc">{t.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Turns + model */}
          <div className="simulate-config__row">
            <div className="simulate-config__section">
              <label className="simulate-config__label">Turns: {turns}</label>
              <input
                type="range"
                min={2}
                max={20}
                value={turns}
                onChange={e => setTurns(Number(e.target.value))}
                className="simulate-range"
              />
            </div>
            <div className="simulate-config__section">
              <label className="simulate-config__label">Model</label>
              <select className="input" value={model} onChange={e => setModel(e.target.value)}>
                {MODEL_OPTIONS.map(m => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>

          {error && <p className="simulate-config__error">{error}</p>}

          <div className="simulate-config__actions">
            {running ? (
              <button className="btn btn--ghost" onClick={stop}>⏹ Stop</button>
            ) : (
              <button className="btn btn--primary" onClick={run} disabled={!topic.trim()}>
                ▶ Start simulation
              </button>
            )}
            {transcript.length > 0 && !running && (
              <button className="btn btn--ghost btn--sm" onClick={copyTranscript}>
                📋 Copy transcript
              </button>
            )}
          </div>
        </div>

        {/* ─ Transcript feed ─ */}
        <div className="simulate-feed">
          {transcript.length === 0 && !running && (
            <div className="simulate-feed__empty">
              <div className="simulate-feed__empty-icon">🎭</div>
              <p>Set up your personas and hit <strong>Start simulation</strong> to begin.</p>
            </div>
          )}

          {running && transcript.length === 0 && (
            <div className="simulate-feed__loading">
              <span className="simulate-feed__spinner" />
              Warming up agents…
            </div>
          )}

          <div className="simulate-feed__messages">
            {transcript.map((t, i) => (
              <div
                key={i}
                className="simulate-message"
                style={{ '--agent-color': colorFor(t.agent) } as React.CSSProperties}
              >
                <div className="simulate-message__header">
                  <span className="simulate-message__agent">{t.agent}</span>
                  <span className="simulate-message__turn">Turn {t.turn}</span>
                </div>
                <p className="simulate-message__body">{t.message}</p>
              </div>
            ))}

            {running && (
              <div className="simulate-message simulate-message--typing">
                <span className="simulate-message__typing-dot" />
                <span className="simulate-message__typing-dot" />
                <span className="simulate-message__typing-dot" />
              </div>
            )}
          </div>

          <div ref={feedEndRef} />

          {done && transcript.length > 0 && (
            <div className="simulate-feed__done">
              Simulation complete — {transcript.length} turns
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

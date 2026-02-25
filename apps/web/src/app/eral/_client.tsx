'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { safeMarkdown, sanitizeHtml } from '@/lib/safe-markdown';
import { parseWAPFromResponse, executeWAP, logWAPAction, getWAPLog, type WAPResponse, type WAPLogEntry } from '@/lib/wap';

// ── SpeechRecognition type shim (not in all TS libs) ─────────────────────────

interface ISpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface ISpeechRecognitionResult {
  readonly length: number;
  readonly isFinal: boolean;
  item(index: number): ISpeechRecognitionAlternative;
  [index: number]: ISpeechRecognitionAlternative;
}

interface ISpeechRecognitionResultList {
  readonly length: number;
  item(index: number): ISpeechRecognitionResult;
  [index: number]: ISpeechRecognitionResult;
}

interface ISpeechRecognitionEvent extends Event {
  readonly results: ISpeechRecognitionResultList;
  readonly resultIndex: number;
}

interface ISpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface ISpeechRecognition {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: ISpeechRecognitionEvent) => void) | null;
  onerror: ((event: ISpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => ISpeechRecognition;
    webkitSpeechRecognition?: new () => ISpeechRecognition;
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ModelVariant = 'eral-7c' | 'eral-mini' | 'eral-code' | 'eral-creative';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  modelUsed?: string;
  durationMs?: number;
  wap?: WAPResponse | null;
  createdAt: number;
  directorMode?: boolean;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

interface PlanItem {
  id: string;
  week: string;
  items: { text: string; studio: string }[];
}

interface EralMemory {
  style?: string;
  project?: string;
  palette?: string;
  mostUsed?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MODEL_OPTIONS: { value: ModelVariant; label: string; desc: string }[] = [
  { value: 'eral-7c',       label: 'Eral 7c',       desc: 'Best overall · 70B · all 7 capabilities' },
  { value: 'eral-mini',     label: 'Eral Mini',     desc: 'Fast · 8B · quick answers & chat' },
  { value: 'eral-code',     label: 'Eral Code',     desc: 'DeepSeek · code, debugging, scaffolding' },
  { value: 'eral-creative', label: 'Eral Creative', desc: 'Mixtral · copywriting, creative writing' },
];

const SUGGESTED_PROMPTS: { text: string }[] = [
  { text: 'Write a pixel art prompt for a fire mage character' },
  { text: 'Generate a pricing page component for a SaaS app' },
  { text: "What's the best way to create a cohesive icon set?" },
  { text: 'Write a product description for a minimal SaaS tool' },
  { text: 'How do I export game assets for Unity?' },
  { text: 'Critique my logo prompt: [paste your prompt]' },
  { text: 'Generate a Discord emoji pack theme for a gaming community' },
  { text: 'Help me write a hero section headline for a startup' },
];

const LS_KEY = 'eral_conversations';
const MEMORY_KEY = 'wokgen:eral_memory';

const DIRECTOR_SYSTEM_PROMPT = `You are in Director Mode. Structure your response as:
1. Your creative direction and answer
2. A structured asset checklist organized by Week (format: **Week 1: Phase Name**)
3. For each item, specify which WokGen mode in parentheses: (Mode: Pixel), (Mode: Business), etc.
Available modes: Pixel, Business, Voice, Vector, UI/UX, Text, Whiteboard.

`;

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------

function loadConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as Conversation[]) : [];
  } catch {
    return [];
  }
}

function saveConversations(convs: Conversation[]): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(convs));
  } catch {}
}

function loadMemory(): EralMemory {
  try {
    const raw = localStorage.getItem(MEMORY_KEY);
    return raw ? (JSON.parse(raw) as EralMemory) : {};
  } catch { return {}; }
}

function saveMemory(mem: EralMemory): void {
  try { localStorage.setItem(MEMORY_KEY, JSON.stringify(mem)); } catch {}
}

function updateMemoryFromContent(content: string, prev: EralMemory): EralMemory {
  const updated = { ...prev };
  const styleMatch = content.match(/\b(dark fantasy|cyberpunk|pixel art|minimalist|retro|anime|synthwave|vaporwave|gothic|neon)\b/i);
  if (styleMatch) updated.style = styleMatch[1];
  const colorMatch = content.match(/\b(dark purples? and greens?|neon blues? and pinks?|warm earth tones?|muted pastels?|bold primaries?)\b/i);
  if (colorMatch) updated.palette = colorMatch[1];
  const projectMatch = content.match(/project\s+(?:called|named|titled)\s+["']?([A-Z][a-zA-Z0-9 ]+)["']?/i);
  if (projectMatch) updated.project = projectMatch[1].trim();
  return updated;
}

function parsePlanItems(content: string): PlanItem[] {
  const items: PlanItem[] = [];
  const lines = content.split('\n');
  let current: PlanItem | null = null;
  for (const line of lines) {
    const weekMatch = line.match(/^\*{0,2}((?:week|phase)\s+\d+)[:\s]+([^\n*]+?)\*{0,2}$/i);
    if (weekMatch) {
      if (current) items.push(current);
      current = { id: `plan-${Date.now()}-${Math.random().toString(36).slice(2)}`, week: `${weekMatch[1]}: ${weekMatch[2].trim()}`, items: [] };
    } else if (current && /^\s*[-*]\s+/.test(line)) {
      const text = line.trim().replace(/^[-*]\s+/, '');
      const studioMatch = text.match(/\(Studio:\s*([^)]+)\)/i) || text.match(/→\s*(.+)$/);
      current.items.push({ text: text.replace(/\s*\(Studio:[^)]+\)/gi, '').replace(/\s*→.*$/, '').trim(), studio: studioMatch ? studioMatch[1].trim() : '' });
    }
  }
  if (current) items.push(current);
  return items;
}

function studioHref(studio: string): string {
  const lower = studio.toLowerCase();
  if (lower.includes('pixel')) return '/studio/pixel';
  if (lower.includes('business')) return '/studio/business';
  if (lower.includes('voice')) return '/voice/studio';
  if (lower.includes('logo')) return '/studio/logo';
  if (lower.includes('whiteboard')) return '/tools/whiteboard';
  return '/studio';
}

function newConversation(): Conversation {
  return {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    title: 'New conversation',
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateTitle(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length <= 40) return trimmed;
  const cut = trimmed.slice(0, 40);
  const lastSpace = cut.lastIndexOf(' ');
  return lastSpace > 0 ? cut.slice(0, lastSpace) : cut;
}

function addCopyButtons(html: string): string {
  return html.replace(
    /<pre class="eral-code-block" data-lang="([^"]*)"><code>([\s\S]*?)<\/code><\/pre>/g,
    (_match: string, lang: string, code: string) => {
      const langLabel = lang || 'text';
      const rawCode = code
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
      const encoded = encodeURIComponent(rawCode);
      return `<div class="eral-code-block"><div class="eral-code-header"><span class="eral-code-lang">${langLabel}</span><button class="eral-copy-btn" data-code="${encoded}">Copy</button></div><pre><code class="language-${langLabel}">${code}</code></pre></div>`;
    }
  );
}

function getFollowUpSuggestions(content: string): string[] {
  if (/```|`[^`]/.test(content)) return ['Explain this code', 'Show an alternative approach'];
  if (/wokgen|wokspec/i.test(content)) return ['Show me how to do this in the studio', 'What settings should I use?'];
  if (/(?:^|\n)[-*] |\d+\. /.test(content)) return ['Tell me more about #1', 'Compare these options'];
  return ['Tell me more', 'Give me an example', 'What else should I know?'];
}

// ---------------------------------------------------------------------------
// Tool suggestions
// ---------------------------------------------------------------------------

interface ToolSuggestionItem {
  action: string;
  name: string;
  href: string;
}

function getToolSuggestions(content: string): ToolSuggestionItem[] {
  const c = content.toLowerCase();
  if (/pixel art|sprite|icon set/.test(c)) {
    return [
      { action: 'Remove the background', name: 'Remove BG', href: '/tools/background-remover' },
      { action: 'Pack your sprites', name: 'Sprite Packer', href: '/tools/sprite-packer' },
    ];
  }
  if (/\blogo\b|\bbrand\b|\bbusiness asset/.test(c)) {
    return [
      { action: 'Remove the background', name: 'Remove BG', href: '/tools/background-remover' },
      { action: 'Create mockups', name: 'Mockup Generator', href: '/tools/mockup' },
    ];
  }
  if (/\bcolor\b|\bpalette\b|\bcolour\b/.test(c)) {
    return [
      { action: 'Explore color tools', name: 'Color Tools', href: '/tools/color-tools' },
      { action: 'Generate CSS', name: 'CSS Generator', href: '/tools/css-generator' },
    ];
  }
  if (/\bvoice\b|\baudio\b|\bsound\b/.test(c)) {
    return [
      { action: 'Work with audio', name: 'Audio Tools', href: '/tools/audio-tools' },
    ];
  }
  if (/\bwrite\b|\bcopy\b|\btext\b|\bmarkdown\b/.test(c)) {
    return [
      { action: 'Edit in Markdown', name: 'Markdown Editor', href: '/tools/markdown' },
      { action: 'Polish your text', name: 'Text Tools', href: '/tools/text-tools' },
    ];
  }
  if (/\bfont\b|\btypography\b/.test(c)) {
    return [
      { action: 'Pair fonts', name: 'Font Pairer', href: '/tools/font-pairer' },
    ];
  }
  return [];
}

function ToolSuggestion({
  suggestions,
  onDismiss,
}: {
  suggestions: ToolSuggestionItem[];
  onDismiss: () => void;
}) {
  if (suggestions.length === 0) return null;
  return (
    <div className="eral-tool-suggestion">
      <span className="eral-tool-suggestion-links">
        {suggestions.map((s, i) => (
          <span key={s.href}>
            {i > 0 && <span className="eral-tool-suggestion-sep">·</span>}
            {s.action}?{' '}
            <a href={s.href} className="eral-tool-suggestion-link">→ {s.name}</a>
          </span>
        ))}
      </span>
      <button className="eral-tool-suggestion-dismiss" onClick={onDismiss} title="Dismiss" aria-label="Dismiss suggestion">×</button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Message bubble
// ---------------------------------------------------------------------------

function MessageBubble({
  msg,
  isStreaming,
  showSuggestions,
  onFollowUp,
}: {
  msg: Message;
  isStreaming?: boolean;
  showSuggestions?: boolean;
  onFollowUp?: (text: string) => void;
}) {
  const isUser = msg.role === 'user';
  const [copied, setCopied] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Event delegation for code block copy buttons
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('eral-copy-btn') && target.dataset.code) {
        const code = decodeURIComponent(target.dataset.code);
        navigator.clipboard.writeText(code).catch(() => {});
        target.textContent = 'Copied!';
        target.classList.add('copied');
        setTimeout(() => {
          target.textContent = 'Copy';
          target.classList.remove('copied');
        }, 1500);
      }
    };
    el.addEventListener('click', handler);
    return () => el.removeEventListener('click', handler);
  }, []);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(msg.content).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const renderedHtml = isUser ? '' : sanitizeHtml(addCopyButtons(safeMarkdown(msg.content)));
  const followUps =
    showSuggestions && !isUser && onFollowUp ? getFollowUpSuggestions(msg.content) : [];

  return (
    <div className={`eral-msg-row ${isUser ? 'eral-msg-user' : 'eral-msg-assistant'}`}>
      {!isUser && (
        <div className="eral-avatar">
          <span>AI</span>
        </div>
      )}
      <div className="eral-bubble-wrap">
        <div className={`eral-bubble ${isUser ? 'eral-bubble-user' : 'eral-bubble-assistant'}`}>
          {isUser ? (
            <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{msg.content}</p>
          ) : (
            <div
              ref={contentRef}
              className="eral-message-content"
              dangerouslySetInnerHTML={{ __html: renderedHtml }}
            />
          )}
          {isStreaming && (
            <span className="eral-cursor" aria-hidden="true" />
          )}
        </div>
        {!isUser && !isStreaming && (
          <div className="eral-bubble-meta">
            {msg.directorMode && (
              <span className="eral-v2-director-badge">✦</span>
            )}
            {msg.modelUsed && (
              <span className="eral-model-tag">{msg.modelUsed.split('/').pop()}</span>
            )}
            {msg.durationMs != null && (
              <span className="eral-time-tag">{(msg.durationMs / 1000).toFixed(1)}s</span>
            )}
            <button className="eral-copy-msg-btn" onClick={handleCopy} title="Copy message">
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        )}
        {!isUser && !isStreaming && msg.wap && (
          <div style={{
            background: 'rgba(129,140,248,0.1)',
            border: '1px solid rgba(129,140,248,0.2)',
            borderRadius: 6,
            padding: '6px 12px',
            marginTop: 4,
            fontSize: 12,
            color: '#818cf8',
          }}>
            {msg.wap.confirmation}
          </div>
        )}
        {followUps.length > 0 && (
          <div className="eral-followup-chips">
            {followUps.map((s) => (
              <button key={s} className="eral-followup-chip" onClick={() => onFollowUp!(s)}>
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
      {isUser && (
        <div className="eral-avatar eral-avatar-user">
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>You</span>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sidebar conversation item
// ---------------------------------------------------------------------------

function ConvItem({
  conv,
  active,
  onSelect,
  onDelete,
}: {
  conv: Conversation;
  active: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={`eral-conv-item ${active ? 'eral-conv-item-active' : ''}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect()}
    >
      <span className="eral-conv-title">{conv.title}</span>
      <button
        className="eral-conv-delete"
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        title="Delete conversation"
        aria-label="Delete conversation"
      >
        ×
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Eral page client component
// ---------------------------------------------------------------------------

interface Project { id: string; name: string; }

export function EralPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [model, setModel] = useState<ModelVariant>('eral-7c');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [modelPickerOpen, setModelPickerOpen] = useState(false);
  const [conversationsLoaded, setConversationsLoaded] = useState(false);
  const [actionConfirmation, setActionConfirmation] = useState<string | null>(null);
  const [wapLog, setWapLog] = useState<WAPLogEntry[]>([]);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);

  // ── Director Mode & Panel ──────────────────────────────────────────────────
  const [directorMode, setDirectorMode] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [currentPlan, setCurrentPlan] = useState<PlanItem[]>([]);
  const [memory, setMemory] = useState<EralMemory>({});
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [planForm, setPlanForm] = useState<{ name: string; type: string; description: string }>({ name: '', type: 'Game', description: '' });
  const [sessionMsgCount, setSessionMsgCount] = useState(0);

  // ── Call Mode state ────────────────────────────────────────────────────────
  const [callActive, setCallActive] = useState(false);
  const [callState, setCallState] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle');
  const [callTranscript, setCallTranscript] = useState<{ user: string; eral: string } | null>(null);
  const [callVoiceId, setCallVoiceId] = useState('21m00Tcm4TlvDq8ikWAM');
  const [callConvId, setCallConvId] = useState<string | undefined>();
  const callAudioRef = useRef<HTMLAudioElement | null>(null);
  const callRecognitionRef = useRef<ISpeechRecognition | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = loadConversations();
    if (saved.length > 0) {
      setConversations(saved);
      setActiveId(saved[0].id);
    } else {
      const conv = newConversation();
      setConversations([conv]);
      setActiveId(conv.id);
    }
    setConversationsLoaded(true);
    setMemory(loadMemory());
    // Restore project selection from sessionStorage
    const storedProject = sessionStorage.getItem('eral-project');
    if (storedProject) setSelectedProjectId(storedProject);
    // Fetch user projects
    fetch('/api/projects').then(r => r.ok ? r.json() : null).then(d => {
      if (d?.projects) setProjects(d.projects as Project[]);
    }).catch(() => {});
  }, []);

  // Persist to localStorage whenever conversations change
  useEffect(() => {
    if (conversations.length > 0) saveConversations(conversations);
  }, [conversations]);

  const activeConv = conversations.find((c) => c.id === activeId) ?? null;

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [activeConv?.messages, streamingContent, scrollToBottom]);

  // Auto-resize textarea
  useEffect(() => {
    if (!inputRef.current) return;
    inputRef.current.style.height = 'auto';
    inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 200)}px`;
  }, [input]);

  // ── Conversation management ────────────────────────────────────────────────

  const createNewConv = useCallback(() => {
    const conv = newConversation();
    setConversations((prev) => [conv, ...prev]);
    setActiveId(conv.id);
    setInput('');
    setStreamingContent('');
    inputRef.current?.focus();
  }, []);

  // Cmd+K / Ctrl+K → new chat
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        createNewConv();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [createNewConv]);

  const deleteConv = useCallback((id: string) => {
    setConversations((prev) => {
      const next = prev.filter((c) => c.id !== id);
      if (next.length === 0) {
        const fresh = newConversation();
        setActiveId(fresh.id);
        return [fresh];
      }
      if (activeId === id) setActiveId(next[0].id);
      return next;
    });
  }, [activeId]);

  const updateConv = useCallback((id: string, updater: (c: Conversation) => Conversation) => {
    setConversations((prev) => prev.map((c) => c.id === id ? updater(c) : c));
  }, []);

  // ── Send message ──────────────────────────────────────────────────────────

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading || !activeId) return;

    const currentConvId = activeId;

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      createdAt: Date.now(),
    };

    updateConv(currentConvId, (c) => ({
      ...c,
      messages: [...c.messages, userMsg],
      updatedAt: Date.now(),
    }));

    setInput('');
    setLoading(true);
    setStreamingContent('');

    const abort = new AbortController();
    abortRef.current = abort;

    try {
      const res = await fetch('/api/eral/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abort.signal,
        body: JSON.stringify({
          message: directorMode ? DIRECTOR_SYSTEM_PROMPT + text.trim() : text.trim(),
          conversationId: undefined, // use local-only for now
          modelVariant: model,
          stream: true,
          context: { projectId: selectedProjectId || undefined, mode: 'eral' },
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';
      const start = Date.now();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data:')) continue;
          const data = trimmed.slice(5).trim();
          if (data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.token) {
              fullContent += parsed.token;
              setStreamingContent(fullContent);
            }
          } catch {}
        }
      }

      const durationMs = Date.now() - start;

      // Parse WAP from collected content
      const { cleanReply, wap } = parseWAPFromResponse(fullContent);

      // Update memory from response content
      const newMemory = updateMemoryFromContent(cleanReply, memory);
      if (JSON.stringify(newMemory) !== JSON.stringify(memory)) {
        saveMemory(newMemory);
        setMemory(newMemory);
      }

      // Parse plan items if response contains structured plan
      const planItems = parsePlanItems(fullContent);
      if (planItems.length > 0) {
        setCurrentPlan(planItems);
        setRightPanelOpen(true);
      }

      setSessionMsgCount((n) => n + 1);

      const assistantMsg: Message = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: cleanReply,
        modelUsed: model,
        durationMs,
        wap,
        createdAt: Date.now(),
        directorMode,
      };

      updateConv(currentConvId, (c) => {
        const isFirstAssistant = !c.messages.some((m) => m.role === 'assistant');
        const firstUserMsg = c.messages.find((m) => m.role === 'user');
        const title = isFirstAssistant && firstUserMsg ? generateTitle(firstUserMsg.content) : c.title;
        return {
          ...c,
          messages: [...c.messages, assistantMsg],
          title,
          updatedAt: Date.now(),
        };
      });

      if (wap) {
        setTimeout(() => executeWAP(wap, router), 500);
        logWAPAction(wap);
        setWapLog(getWAPLog());
        setActionConfirmation(wap.confirmation);
        setTimeout(() => setActionConfirmation(null), 3000);
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;

      const errMsg: Message = {
        id: `msg-err-${Date.now()}`,
        role: 'assistant',
        content: `${(err as Error).message ?? 'Something went wrong. Please try again.'}`,
        createdAt: Date.now(),
      };
      updateConv(currentConvId, (c) => ({
        ...c,
        messages: [...c.messages, errMsg],
        updatedAt: Date.now(),
      }));
    } finally {
      setLoading(false);
      setStreamingContent('');
      abortRef.current = null;
      inputRef.current?.focus();
    }
  }, [loading, activeId, model, updateConv, directorMode, memory]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleStop = () => {
    abortRef.current?.abort();
  };

  // ── Call Mode: send voice message to /api/eral/speak ──────────────────────

  const sendCallMessage = useCallback(async (transcript: string) => {
    setCallState('processing');
    setCallTranscript((prev) => ({ user: transcript, eral: prev?.eral ?? '' }));

    try {
      const res = await fetch('/api/eral/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: transcript,
          conversationId: callConvId,
          context: { mode: 'eral' },
          voiceId: callVoiceId,
        }),
      });

      if (!res.ok) {
        setCallState('idle');
        return;
      }

      const newConvId = res.headers.get('X-Eral-Conversation-Id');
      if (newConvId) setCallConvId(newConvId);
      const respText = res.headers.get('X-Eral-Response-Text');
      const eralText = respText ? decodeURIComponent(respText) : '';
      if (eralText) setCallTranscript({ user: transcript, eral: eralText });

      const contentType = res.headers.get('Content-Type') ?? '';

      if (contentType.includes('audio/mpeg')) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        callAudioRef.current = audio;
        setCallState('speaking');
        audio.onended = () => { URL.revokeObjectURL(url); callAudioRef.current = null; setCallState('idle'); };
        audio.onerror = () => { URL.revokeObjectURL(url); callAudioRef.current = null; setCallState('idle'); };
        await audio.play();
      } else {
        const data = await res.json() as { text?: string };
        const text = data.text ?? eralText;
        if (!text) { setCallState('idle'); return; }
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.onend = () => setCallState('idle');
        utterance.onerror = () => setCallState('idle');
        setCallState('speaking');
        window.speechSynthesis.speak(utterance);
      }
    } catch {
      setCallState('idle');
    }
  }, [callConvId, callVoiceId]);

  const startCallListening = useCallback(() => {
    const SpeechRecognitionCtor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return;

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event: ISpeechRecognitionEvent) => {
      const transcript = event.results[0]?.[0]?.transcript ?? '';
      if (transcript.trim()) sendCallMessage(transcript.trim());
      else setCallState('idle');
    };
    recognition.onerror = () => setCallState('idle');
    recognition.onend = () => {
      setCallState((s) => s === 'listening' ? 'idle' : s);
    };
    callRecognitionRef.current = recognition;
    recognition.start();
    setCallState('listening');
  }, [sendCallMessage]);

  const endCall = useCallback(() => {
    callAudioRef.current?.pause();
    callAudioRef.current = null;
    callRecognitionRef.current?.stop();
    callRecognitionRef.current = null;
    window.speechSynthesis?.cancel();
    setCallActive(false);
    setCallState('idle');
    setCallTranscript(null);
  }, []);

  const activeModel = MODEL_OPTIONS.find((m) => m.value === model)!;
  const isEmpty = !activeConv || activeConv.messages.length === 0;

  // ── Streaming assembly for display ────────────────────────────────────────

  const streamingMsg: Message | null = streamingContent
    ? { id: 'streaming', role: 'assistant', content: streamingContent, createdAt: Date.now() }
    : null;

  return (
    <div className="eral-root eral-v2-layout">
      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <aside className={`eral-sidebar eral-v2-sidebar ${sidebarOpen ? 'eral-sidebar-open' : 'eral-sidebar-closed'}`}>
        <div className="eral-sidebar-header">
          <div className="eral-brand">
            <span className="eral-brand-name">Eral</span>
            <span className="eral-brand-by">by WokSpec</span>
          </div>
          <button
            className="eral-sidebar-toggle"
            onClick={() => setSidebarOpen((v) => !v)}
            title="Toggle sidebar"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? '←' : '→'}
          </button>
        </div>

        {sidebarOpen && (
          <>
            <button className="eral-new-chat-btn" onClick={createNewConv}>
              <span>+</span> New chat
            </button>

            {/* Memory Panel */}
            <div className="eral-v2-memory-panel">
              <p className="eral-v2-memory-panel__title">Memory</p>
              {memory.style && (
                <div className="eral-v2-memory-item">
                  <span className="eral-v2-memory-item__label">Style</span>
                  <span className="eral-v2-memory-item__value">{memory.style}</span>
                </div>
              )}
              {memory.project && (
                <div className="eral-v2-memory-item">
                  <span className="eral-v2-memory-item__label">Project</span>
                  <span className="eral-v2-memory-item__value">{memory.project}</span>
                </div>
              )}
              {memory.palette && (
                <div className="eral-v2-memory-item">
                  <span className="eral-v2-memory-item__label">Palette</span>
                  <span className="eral-v2-memory-item__value">{memory.palette}</span>
                </div>
              )}
              {!memory.style && !memory.project && !memory.palette && (
                <p className="eral-v2-memory-panel__empty">Chat with Eral to build memory…</p>
              )}
            </div>

            {/* Quick actions */}
            <div className="eral-v2-quick-actions">
              <button className="eral-v2-quick-btn" onClick={() => setPlanModalOpen(true)}>
                ✦ Plan Project
              </button>
              <button className="eral-v2-quick-btn" onClick={() => { window.location.href = '/studio'; }}>
                Generate Assets
              </button>
              <button className="eral-v2-quick-btn" onClick={() => { window.location.href = '/eral/simulate'; }}>
                Simulate
              </button>
            </div>

            <div className="eral-conv-list">
              {!conversationsLoaded ? (
                <>
                  <div className="eral-conv-skeleton" />
                  <div className="eral-conv-skeleton" />
                  <div className="eral-conv-skeleton" />
                </>
              ) : (
                conversations.map((conv) => (
                  <ConvItem
                    key={conv.id}
                    conv={conv}
                    active={conv.id === activeId}
                    onSelect={() => { setActiveId(conv.id); setStreamingContent(''); }}
                    onDelete={() => deleteConv(conv.id)}
                  />
                ))
              )}
            </div>

            {/* WAP Action Log */}
            {wapLog.length > 0 && (
              <div className="eral-wap-log">
                <p className="eral-wap-log-title">Recent actions</p>
                {wapLog.map(entry => (
                  <div key={entry.id} className="eral-wap-log-item">
                    <span className="eral-wap-log-type">{entry.type}</span>
                    <span className="eral-wap-log-msg">{entry.confirmation}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Tools quick-launch */}
            <div className="eral-tools-section">
              <p className="eral-tools-title">Free Tools</p>
              <div className="eral-tools-grid">
                {[
                  { id: 'background-remover', icon: '', label: 'BG Remove' },
                  { id: 'image-compress', icon: '', label: 'Compress' },
                  { id: 'color-tools', icon: '', label: 'Colors' },
                  { id: 'json-tools', icon: '', label: 'JSON' },
                  { id: 'font-pairer', icon: '', label: 'Fonts' },
                  { id: 'whiteboard', icon: '', label: 'Board' },
                ].map(t => (
                  <a key={t.id} href={`/tools/${t.id}`} className="eral-tool-chip" title={t.label}>
                    <span>{t.icon}</span>
                    <span>{t.label}</span>
                  </a>
                ))}
              </div>
              <a href="/tools" className="eral-tools-all">All 30+ tools →</a>
            </div>

            <div className="eral-sidebar-footer">
              <a
                href="https://wokgen.wokspec.org"
                target="_blank"
                rel="noopener noreferrer"
                className="eral-footer-link"
              >
                wokgen.wokspec.org ↗
              </a>
            </div>
          </>
        )}
      </aside>

      {/* ── Main area ──────────────────────────────────────────────── */}
      <div className="eral-main">
        {/* Top bar */}
        <div className="eral-topbar">
          {!sidebarOpen && (
            <button
              className="eral-sidebar-toggle-inline"
              onClick={() => setSidebarOpen(true)}
              title="Open sidebar"
            >
              ☰
            </button>
          )}

          {/* Model selector */}
          <div className="eral-model-selector" style={{ position: 'relative' }}>
            <button
              className="eral-model-pill"
              onClick={() => setModelPickerOpen((v) => !v)}
            >
              <span className="eral-model-dot" />
              {activeModel.label}
              <span style={{ opacity: 0.5, fontSize: 10 }}>▾</span>
            </button>

            {modelPickerOpen && (
              <div className="eral-model-dropdown">
                {MODEL_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    className={`eral-model-option ${model === opt.value ? 'eral-model-option-active' : ''}`}
                    onClick={() => { setModel(opt.value); setModelPickerOpen(false); }}
                  >
                    <span className="eral-model-option-label">{opt.label}</span>
                    <span className="eral-model-option-desc">{opt.desc}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ flex: 1 }} />

          {/* Project selector */}
          {projects.length > 0 && (
            <select
              value={selectedProjectId || ''}
              onChange={e => {
                const val = e.target.value || null;
                setSelectedProjectId(val);
                if (val) sessionStorage.setItem('eral-project', val);
                else sessionStorage.removeItem('eral-project');
              }}
              className="eral-project-select"
              title="Select project context"
            >
              <option value="">No project context</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}

          {/* Director Mode toggle */}
          <button
            className={`eral-v2-director-toggle${directorMode ? ' eral-v2-director-toggle--on' : ''}`}
            onClick={() => setDirectorMode((v) => !v)}
            title={directorMode ? 'Director Mode ON — click to disable' : 'Enable Director Mode'}
          >
            {directorMode ? '✦ Director ON' : '✦ Director'}
          </button>

          {!rightPanelOpen && (
            <button
              className="eral-v2-panel-open-btn"
              onClick={() => setRightPanelOpen(true)}
              title="Open Director Panel"
            >
              Panel ›
            </button>
          )}

          {/* Share (future) */}
          <button className="eral-share-btn" disabled title="Share (coming soon)">
            Share
          </button>

          {/* Call Mode toggle */}
          <button
            className={`eral-call-btn${callActive ? ' eral-call-btn-active' : ''}`}
            onClick={() => callActive ? endCall() : setCallActive(true)}
            title={callActive ? 'Exit Call Mode' : 'Call Mode — talk to Eral'}
          >
            {callActive ? 'End Call' : 'Call'}
          </button>
        </div>

        {/* Messages */}
        <div className="eral-messages">
          {isEmpty ? (
            <div className="eral-empty">
              <div className="eral-empty-logo">
                <span className="eral-empty-icon"><span style={{fontSize:'24px',opacity:0.5}}>AI</span></span>
                <h1 className="eral-empty-title">Eral 7c</h1>
                <p className="eral-empty-sub">AI companion for creative work · by WokSpec</p>
              </div>

              <div className="eral-suggestions">
                {SUGGESTED_PROMPTS.map((s) => (
                  <button
                    key={s.text}
                    className="eral-suggestion"
                    onClick={() => sendMessage(s.text)}
                  >
                    <span>{s.text}</span>
                  </button>
                ))}
              </div>

              <div className="eral-commands-section">
                <p className="eral-commands-label">Commands — Eral can actually do these</p>
                <div className="eral-commands-grid">
                  {[
                    { text: '"Take me to Pixel mode"' },
                    { text: '"Set size to 64×64"' },
                    { text: '"Write a prompt for a fire mage"' },
                    { text: '"Go to Business mode"' },
                    { text: '"Open my gallery"' },
                    { text: '"Explain what HD mode does"' },
                  ].map((c) => (
                    <button key={c.text} className="eral-command-chip" onClick={() => sendMessage(c.text.replace(/"/g, ''))}>
                      {c.text}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              {(() => {
                const lastAssistantIdx = activeConv.messages.reduce(
                  (acc, m, i) => (m.role === 'assistant' ? i : acc), -1
                );
                return activeConv.messages.map((msg, idx) => {
                  const isLast = !loading && idx === lastAssistantIdx;
                  const toolSuggestions = isLast && msg.role === 'assistant'
                    ? getToolSuggestions(msg.content)
                    : [];
                  return (
                    <React.Fragment key={msg.id}>
                      <MessageBubble
                        msg={msg}
                        showSuggestions={isLast}
                        onFollowUp={sendMessage}
                      />
                      {toolSuggestions.length > 0 && !dismissedSuggestions.has(msg.id) && (
                        <div className="eral-tool-suggestion-wrap">
                          <ToolSuggestion
                            suggestions={toolSuggestions}
                            onDismiss={() => setDismissedSuggestions((prev) => new Set([...prev, msg.id]))}
                          />
                        </div>
                      )}
                    </React.Fragment>
                  );
                });
              })()}
              {streamingMsg && (
                <MessageBubble msg={streamingMsg} isStreaming />
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="eral-input-area">
          <div className={`eral-input-box${directorMode ? ' eral-input-box--director' : ''}`}>
            <textarea
              ref={inputRef}
              className="eral-textarea"
              placeholder="Ask Eral anything…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={loading}
            />
            {loading ? (
              <button className="eral-send-btn eral-stop-btn" onClick={handleStop} title="Stop">
                ■ Stop
              </button>
            ) : (
              <button
                className="eral-send-btn"
                onClick={() => sendMessage(input)}
                disabled={!input.trim()}
                title="Send (Enter)"
              >
                ↑
              </button>
            )}
          </div>
          <p className="eral-input-hint">
            {directorMode
              ? '✦ Director Mode active · Enter to send · Shift+Enter for newline · ⌘K new chat'
              : 'Enter to send · Shift+Enter for newline · ⌘K new chat · Eral can make mistakes'}
          </p>
        </div>
      </div>

      {/* ── Right Director Panel ────────────────────────────────────── */}
      {rightPanelOpen && (
        <aside className="eral-v2-plan-panel">
          <div className="eral-v2-plan-panel__header">
            <span className="eral-v2-plan-panel__title">✦ Director Panel</span>
            <button
              className="eral-v2-plan-panel__close"
              onClick={() => setRightPanelOpen(false)}
              title="Close panel"
            >×</button>
          </div>

          {/* Current Plan */}
          <div className="eral-v2-plan-panel__section">
            <p className="eral-v2-plan-panel__section-title">Current Plan</p>
            {currentPlan.length === 0 ? (
              <p className="eral-v2-plan-panel__empty">No plan yet. Click <strong>✦ Plan Project</strong> to create one.</p>
            ) : (
              <div className="eral-v2-plan-items">
                {currentPlan.map((phase) => (
                  <div key={phase.id} className="eral-v2-plan-item">
                    <p className="eral-v2-plan-item__week">{phase.week}</p>
                    {phase.items.map((item, i) => (
                      <div key={i} className="eral-v2-plan-item__row">
                        <span className="eral-v2-plan-item__text">{item.text}</span>
                        {item.studio && (
                          <a href={studioHref(item.studio)} className="eral-v2-plan-item__gen">Generate →</a>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Studio Suggestions */}
          <div className="eral-v2-plan-panel__section">
            <p className="eral-v2-plan-panel__section-title">Modes</p>
            <div className="eral-v2-panel-suggestions">
              <a href="/pixel/studio" className="eral-v2-panel-suggestion-btn">Pixel mode</a>
              <a href="/business/studio" className="eral-v2-panel-suggestion-btn">Business mode</a>
              <a href="/voice/studio" className="eral-v2-panel-suggestion-btn">Voice mode</a>
              <a href="/tools" className="eral-v2-panel-suggestion-btn">All Tools</a>
            </div>
          </div>

          {/* Session Stats */}
          <div className="eral-v2-plan-panel__section">
            <p className="eral-v2-plan-panel__section-title">Session Stats</p>
            <div className="eral-v2-session-stats">
              <div className="eral-v2-stat">
                <span className="eral-v2-stat__value">{sessionMsgCount}</span>
                <span className="eral-v2-stat__label">Messages</span>
              </div>
              <div className="eral-v2-stat">
                <span className="eral-v2-stat__value">{currentPlan.reduce((acc, p) => acc + p.items.length, 0)}</span>
                <span className="eral-v2-stat__label">Assets planned</span>
              </div>
              <div className="eral-v2-stat">
                <span className="eral-v2-stat__value">{conversations.length}</span>
                <span className="eral-v2-stat__label">Conversations</span>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* ── Plan Project Modal ──────────────────────────────────────── */}
      {planModalOpen && (
        <div className="eral-v2-plan-modal-overlay" onClick={() => setPlanModalOpen(false)}>
          <div className="eral-v2-plan-modal" onClick={(e) => e.stopPropagation()}>
            <div className="eral-v2-plan-modal__header">
              <h2 className="eral-v2-plan-modal__title">✦ Plan Project</h2>
              <button className="eral-v2-plan-modal__close" onClick={() => setPlanModalOpen(false)}>×</button>
            </div>
            <div className="eral-v2-plan-modal__body">
              <div className="eral-v2-plan-modal__field">
                <label className="eral-v2-plan-modal__label">Project Name</label>
                <input
                  className="eral-v2-plan-modal__input"
                  placeholder="e.g. Dungeon Crawler"
                  value={planForm.name}
                  onChange={(e) => setPlanForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="eral-v2-plan-modal__field">
                <label className="eral-v2-plan-modal__label">Project Type</label>
                <div className="eral-v2-plan-modal__type-grid">
                  {['Game', 'Brand', 'Website', 'App'].map((type) => (
                    <button
                      key={type}
                      className={`eral-v2-plan-modal__type-btn${planForm.type === type ? ' eral-v2-plan-modal__type-btn--active' : ''}`}
                      onClick={() => setPlanForm((f) => ({ ...f, type }))}
                    >{type}</button>
                  ))}
                </div>
              </div>
              <div className="eral-v2-plan-modal__field">
                <label className="eral-v2-plan-modal__label">Describe your project (1–2 sentences)</label>
                <textarea
                  className="eral-v2-plan-modal__textarea"
                  placeholder="e.g. A top-down dungeon crawler with dark fantasy aesthetics and pixel art visuals…"
                  value={planForm.description}
                  onChange={(e) => setPlanForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                />
              </div>
            </div>
            <div className="eral-v2-plan-modal__footer">
              <button className="eral-v2-plan-modal__cancel" onClick={() => setPlanModalOpen(false)}>Cancel</button>
              <button
                className="eral-v2-plan-modal__submit"
                disabled={!planForm.name.trim() || !planForm.description.trim()}
                onClick={() => {
                  const prompt = `Create a complete asset creation plan for my ${planForm.type} project called "${planForm.name}".

Project description: ${planForm.description}

Please provide a week-by-week asset checklist using this exact format:
**Week 1: [Phase Name]**
- Asset item (Mode: Pixel)
- Asset item (Mode: Business)

Use these WokGen Studio modes: Pixel (sprites/pixel art/icons), Business (branding/UI/marketing), Voice (audio/narration/SFX), Vector (icons/illustrations), UI/UX (components/templates), Text (copy/content), Whiteboard (planning/wireframes).`;
                  setPlanModalOpen(false);
                  setRightPanelOpen(true);
                  sendMessage(prompt);
                }}
              >
                ✦ Generate Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Call Mode overlay ──────────────────────────────────────── */}
      {callActive && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 100,
          background: 'rgba(10,10,20,0.96)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 24, backdropFilter: 'blur(12px)',
        }}>
          {/* Avatar */}
          <div style={{ position: 'relative' }}>
            {callState === 'speaking' && (
              <span style={{
                position: 'absolute', inset: -12, borderRadius: '50%',
                border: '2px solid rgba(129,140,248,0.4)',
                animation: 'call-ring 1.2s ease-out infinite',
              }} />
            )}
            <div style={{
              width: 120, height: 120, borderRadius: '50%',
              background: 'linear-gradient(135deg,#312e81,#4c1d95)',
              border: '3px solid rgba(129,140,248,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 52, boxShadow: '0 0 40px rgba(129,140,248,0.2)',
            }}>
              Eral
            </div>
          </div>

          {/* Status */}
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#c7d2fe', fontSize: 18, fontWeight: 600, margin: 0 }}>
              {callState === 'idle'       ? 'Ready to talk'  :
               callState === 'listening'  ? 'Listening…'     :
               callState === 'processing' ? 'Thinking…'      : 'Speaking…'}
            </p>
            <p style={{ color: 'rgba(167,139,250,0.6)', fontSize: 13, marginTop: 4 }}>
              Eral 7c · Voice Mode
            </p>
          </div>

          {/* Transcript */}
          {callTranscript && (
            <div style={{
              background: 'rgba(30,27,75,0.7)', borderRadius: 12,
              padding: '14px 20px', maxWidth: 420, width: '90%',
              border: '1px solid rgba(129,140,248,0.2)',
            }}>
              {callTranscript.user && (
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: '0 0 8px' }}>
                  <span style={{ color: '#818cf8', fontWeight: 600 }}>You: </span>
                  {callTranscript.user}
                </p>
              )}
              {callTranscript.eral && (
                <p style={{ color: '#e0e7ff', fontSize: 13, margin: 0 }}>
                  <span style={{ color: '#a78bfa', fontWeight: 600 }}>Eral: </span>
                  {callTranscript.eral}
                </p>
              )}
            </div>
          )}

          {/* Voice selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'rgba(167,139,250,0.7)', fontSize: 12 }}>Voice:</span>
            <select
              value={callVoiceId}
              onChange={(e) => setCallVoiceId(e.target.value)}
              style={{
                background: 'rgba(30,27,75,0.8)', border: '1px solid rgba(129,140,248,0.25)',
                borderRadius: 6, color: '#c7d2fe', fontSize: 12, padding: '4px 8px', cursor: 'pointer',
              }}
            >
              <option value="21m00Tcm4TlvDq8ikWAM">Rachel</option>
              <option value="pNInz6obpgDQGcFmaJgB">Adam</option>
              <option value="EXAVITQu4vr4xnSDxMaL">Bella</option>
              <option value="TxGEqnHWrfWFTfGW9XjX">Josh</option>
            </select>
          </div>

          {/* Mic button */}
          <button
            onClick={() => {
              if (callState === 'idle') startCallListening();
              else if (callState === 'listening') { callRecognitionRef.current?.stop(); setCallState('idle'); }
              else if (callState === 'speaking') {
                callAudioRef.current?.pause();
                callAudioRef.current = null;
                window.speechSynthesis?.cancel();
                setCallState('idle');
              }
            }}
            disabled={callState === 'processing'}
            style={{
              width: 72, height: 72, borderRadius: '50%',
              background: callState === 'listening' ? 'Listening…' :
                          callState === 'speaking' ? 'Speaking' : 'Call',
              border: '2px solid rgba(129,140,248,0.4)',
              cursor: callState === 'processing' ? 'default' : 'pointer',
              fontSize: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(129,140,248,0.3)',
              transition: 'background 0.2s',
            }}
            title={callState === 'idle' ? 'Tap to speak' : 'Tap to stop'}
          >
            {callState === 'processing' ? '⏳' :
             callState === 'listening' ? 'Listening…' :
             callState === 'speaking' ? 'Speaking' : 'Call'}
          </button>

          {/* End Call */}
          <button
            onClick={endCall}
            style={{
              padding: '8px 24px', borderRadius: 999,
              background: '#991b1b', border: '1px solid #dc2626',
              color: 'white', fontSize: 14, cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            End Call
          </button>
        </div>
      )}

      {/* ── Action confirmation toast ─────────────────────────────── */}
      {actionConfirmation && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 200,
          background: '#1e1b4b', border: '1px solid #818cf8',
          borderRadius: 8, padding: '10px 18px',
          color: '#a5b4fc', fontSize: 13,
          maxWidth: 320,
          pointerEvents: 'none',
        }}>
          {actionConfirmation}
        </div>
      )}

      {/* ── Styles ─────────────────────────────────────────────────── */}
      <style>{`
        /* Layout */
        .eral-root {
          display: flex;
          height: calc(100vh - var(--nav-height, 56px) - var(--mode-switcher-height, 41px));
          background: var(--bg);
          color: var(--text);
          overflow: hidden;
          position: relative;
        }

        /* Sidebar */
        .eral-sidebar {
          display: flex;
          flex-direction: column;
          background: var(--bg-surface);
          border-right: 1px solid var(--border);
          transition: width 0.2s ease;
          overflow: hidden;
          flex-shrink: 0;
        }
        .eral-sidebar-open  { width: 260px; }
        .eral-sidebar-closed { width: 44px; }

        .eral-sidebar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 10px;
          border-bottom: 1px solid var(--border);
          min-height: 48px;
        }
        .eral-brand {
          display: flex;
          align-items: baseline;
          gap: 5px;
          overflow: hidden;
        }
        .eral-brand-name {
          font-family: var(--font-heading, 'Space Grotesk', sans-serif);
          font-size: 15px;
          font-weight: 600;
          color: #818cf8;
          white-space: nowrap;
        }
        .eral-brand-by {
          font-size: 10px;
          color: var(--text-faint);
          white-space: nowrap;
        }
        .eral-sidebar-toggle {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 4px 6px;
          font-size: 13px;
          border-radius: 3px;
          flex-shrink: 0;
        }
        .eral-sidebar-toggle:hover { color: var(--text); background: rgba(255,255,255,0.05); }

        .eral-new-chat-btn {
          margin: 10px 10px 6px;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 7px 10px;
          background: rgba(129,140,248,0.12);
          border: 1px solid rgba(129,140,248,0.25);
          border-radius: 4px;
          color: #818cf8;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s;
        }
        .eral-new-chat-btn:hover {
          background: rgba(129,140,248,0.2);
          border-color: rgba(129,140,248,0.4);
        }

        .eral-conv-list {
          flex: 1;
          overflow-y: auto;
          padding: 4px 6px;
        }
        .eral-conv-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 8px;
          border-radius: 4px;
          cursor: pointer;
          gap: 6px;
          transition: background 0.1s;
        }
        .eral-conv-item:hover { background: rgba(255,255,255,0.04); }
        .eral-conv-item-active { background: rgba(129,140,248,0.1) !important; }
        .eral-conv-title {
          font-size: 12px;
          color: var(--text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          flex: 1;
        }
        .eral-conv-item-active .eral-conv-title { color: var(--text); }
        .eral-conv-delete {
          background: none;
          border: none;
          color: var(--text-faint);
          cursor: pointer;
          font-size: 14px;
          padding: 0 2px;
          opacity: 0;
          transition: opacity 0.15s;
          flex-shrink: 0;
        }
        .eral-conv-item:hover .eral-conv-delete { opacity: 1; }
        .eral-conv-delete:hover { color: var(--danger); }

        .eral-sidebar-footer {
          padding: 10px 10px 12px;
          border-top: 1px solid var(--border);
        }
        .eral-footer-link {
          font-size: 11px;
          color: var(--text-faint);
          text-decoration: none;
        }
        .eral-footer-link:hover { color: var(--text-muted); }

        /* Tools section */
        .eral-tools-section {
          padding: 8px 10px;
          border-top: 1px solid var(--border);
        }
        .eral-tools-title {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .06em;
          color: var(--text-faint);
          margin: 0 0 6px;
        }
        .eral-tools-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 4px;
          margin-bottom: 6px;
        }
        .eral-tool-chip {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          padding: 5px 4px;
          background: rgba(255,255,255,0.04);
          border: 1px solid var(--border);
          border-radius: 6px;
          text-decoration: none;
          color: var(--text-muted);
          font-size: 10px;
          line-height: 1.2;
          text-align: center;
          transition: all .12s;
        }
        .eral-tool-chip:hover {
          background: rgba(99,102,241,.12);
          border-color: rgba(99,102,241,.4);
          color: #a5b4fc;
        }
        .eral-tool-chip span:first-child { font-size: 14px; }
        .eral-tools-all {
          display: block;
          font-size: 11px;
          color: #818cf8;
          text-decoration: none;
          text-align: center;
        }
        .eral-tools-all:hover { color: #a5b4fc; }

        /* Main */
        .eral-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          min-width: 0;
        }

        /* Top bar */
        .eral-topbar {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border-bottom: 1px solid var(--border);
          background: var(--bg);
          min-height: 48px;
          flex-shrink: 0;
        }
        .eral-sidebar-toggle-inline {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          font-size: 16px;
          padding: 4px 6px;
          border-radius: 3px;
        }
        .eral-sidebar-toggle-inline:hover { color: var(--text); }

        .eral-model-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          background: rgba(129,140,248,0.08);
          border: 1px solid rgba(129,140,248,0.2);
          border-radius: 20px;
          color: #818cf8;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s;
        }
        .eral-model-pill:hover { background: rgba(129,140,248,0.15); }
        .eral-model-dot {
          width: 6px; height: 6px;
          background: #818cf8;
          border-radius: 50%;
        }

        .eral-model-dropdown {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: 6px;
          width: 280px;
          z-index: 50;
          box-shadow: var(--shadow-lg);
          overflow: hidden;
        }
        .eral-model-option {
          display: flex;
          flex-direction: column;
          gap: 2px;
          width: 100%;
          padding: 10px 14px;
          background: none;
          border: none;
          border-bottom: 1px solid var(--border-subtle);
          color: var(--text);
          cursor: pointer;
          text-align: left;
          transition: background 0.1s;
        }
        .eral-model-option:last-child { border-bottom: none; }
        .eral-model-option:hover { background: rgba(255,255,255,0.04); }
        .eral-model-option-active { background: rgba(129,140,248,0.08) !important; }
        .eral-model-option-label { font-size: 13px; font-weight: 500; color: #818cf8; }
        .eral-model-option-desc  { font-size: 11px; color: var(--text-muted); }

        .eral-project-select {
          font-size: 11px;
          background: transparent;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 4px;
          color: var(--text-muted);
          padding: 3px 6px;
          cursor: pointer;
          max-width: 160px;
        }
        .eral-project-select:focus { outline: none; border-color: rgba(129,140,248,0.35); }

        .eral-share-btn {
          padding: 4px 12px;
          background: rgba(255,255,255,0.04);
          border: 1px solid var(--border);
          border-radius: 4px;
          color: var(--text-muted);
          font-size: 12px;
          cursor: not-allowed;
          opacity: 0.5;
        }

        .eral-call-btn {
          padding: 4px 12px;
          background: rgba(129,140,248,0.1);
          border: 1px solid rgba(129,140,248,0.25);
          border-radius: 4px;
          color: #818cf8;
          font-size: 12px;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s;
        }
        .eral-call-btn:hover {
          background: rgba(129,140,248,0.18);
          border-color: rgba(129,140,248,0.4);
        }
        .eral-call-btn-active {
          background: rgba(220,38,38,0.15);
          border-color: rgba(220,38,38,0.4);
          color: #f87171;
        }
        .eral-call-btn-active:hover {
          background: rgba(220,38,38,0.22);
        }

        @keyframes call-ring {
          0%   { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(1.5); opacity: 0; }
        }

        /* Messages area */
        .eral-messages {
          flex: 1;
          overflow-y: auto;
          padding: 24px 16px;
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        /* Empty state */
        .eral-empty {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 32px;
          padding: 40px 16px;
          max-width: 680px;
          margin: 0 auto;
          width: 100%;
        }
        .eral-empty-logo {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          text-align: center;
        }
        .eral-empty-icon { font-size: 40px; }
        .eral-empty-title {
          font-family: var(--font-heading, 'Space Grotesk', sans-serif);
          font-size: 28px;
          font-weight: 600;
          color: #818cf8;
          margin: 0;
        }
        .eral-empty-sub {
          font-size: 13px;
          color: var(--text-muted);
          margin: 0;
        }

        .eral-suggestions {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          width: 100%;
        }
        @media (max-width: 540px) {
          .eral-suggestions { grid-template-columns: 1fr; }
        }
        .eral-suggestion {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 10px 12px;
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 6px;
          color: var(--text-muted);
          font-size: 12px;
          cursor: pointer;
          text-align: left;
          transition: border-color 0.15s, background 0.15s, color 0.15s;
          line-height: 1.4;
        }
        .eral-suggestion:hover {
          border-color: rgba(129,140,248,0.3);
          background: rgba(129,140,248,0.06);
          color: var(--text);
        }
        .eral-suggestion-icon { font-size: 14px; flex-shrink: 0; }

        /* Message rows */
        .eral-msg-row {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-bottom: 20px;
          max-width: 780px;
          width: 100%;
        }
        .eral-msg-assistant { align-self: flex-start; }
        .eral-msg-user {
          align-self: flex-end;
          flex-direction: row-reverse;
          margin-left: auto;
        }
        .eral-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(129,140,248,0.15);
          border: 1px solid rgba(129,140,248,0.2);
          flex-shrink: 0;
          margin-top: 2px;
        }
        .eral-avatar-user {
          background: rgba(255,255,255,0.05);
          border-color: var(--border);
        }

        .eral-bubble-wrap { display: flex; flex-direction: column; gap: 4px; min-width: 0; max-width: 100%; }

        .eral-bubble {
          padding: 12px 14px;
          border-radius: 8px;
          font-size: 14px;
          line-height: 1.65;
          word-break: break-word;
        }
        .eral-bubble-user {
          background: rgba(129,140,248,0.12);
          border: 1px solid rgba(129,140,248,0.2);
          color: var(--text);
          border-radius: 8px 2px 8px 8px;
        }
        .eral-bubble-assistant {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          color: var(--text);
          border-radius: 2px 8px 8px 8px;
        }

        /* Streaming cursor */
        .eral-cursor {
          display: inline-block;
          width: 2px;
          height: 14px;
          background: #818cf8;
          margin-left: 2px;
          vertical-align: text-bottom;
          animation: eral-blink 0.8s step-end infinite;
        }
        @keyframes eral-blink { 0%,100% { opacity: 1 } 50% { opacity: 0 } }

        /* Bubble meta */
        .eral-bubble-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 2px 2px;
        }
        .eral-model-tag, .eral-time-tag {
          font-size: 10px;
          color: var(--text-faint);
          background: rgba(255,255,255,0.04);
          border-radius: 3px;
          padding: 1px 5px;
        }
        .eral-copy-msg-btn {
          font-size: 10px;
          color: var(--text-faint);
          background: none;
          border: none;
          cursor: pointer;
          padding: 1px 5px;
          border-radius: 3px;
          opacity: 0;
          transition: opacity 0.15s;
        }
        .eral-bubble-wrap:hover .eral-copy-msg-btn { opacity: 1; }
        .eral-copy-msg-btn:hover { color: var(--text); background: rgba(255,255,255,0.06); }

        /* Markdown prose — see globals.css .eral-message-content for code/heading/list styles */
        .eral-prose p        { margin: 0 0 8px; }
        .eral-prose p:last-child { margin-bottom: 0; }
        .eral-prose strong { color: var(--text); font-weight: 600; }
        .eral-prose em { color: var(--text-muted); font-style: italic; }

        code.eral-inline-code {
          background: rgba(255,255,255,0.08);
          border-radius: 3px;
          padding: 1px 5px;
          font-size: 12px;
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          color: #c9d1d9;
        }

        /* Input area */
        .eral-input-area {
          padding: 12px 16px 16px;
          border-top: 1px solid var(--border);
          background: var(--bg);
          flex-shrink: 0;
        }
        .eral-input-box {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 10px 10px 10px 14px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .eral-input-box:focus-within {
          border-color: rgba(129,140,248,0.4);
          box-shadow: 0 0 0 3px rgba(129,140,248,0.08);
        }
        .eral-textarea {
          flex: 1;
          background: none;
          border: none;
          outline: none;
          color: var(--text);
          font-size: 14px;
          font-family: var(--font-body, 'DM Sans', sans-serif);
          resize: none;
          line-height: 1.55;
          min-height: 22px;
          max-height: 200px;
        }
        .eral-textarea::placeholder { color: var(--text-faint); }
        .eral-textarea:disabled { opacity: 0.6; cursor: not-allowed; }

        .eral-send-btn {
          flex-shrink: 0;
          width: 32px; height: 32px;
          border-radius: 6px;
          border: none;
          background: #818cf8;
          color: #fff;
          font-size: 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s, opacity 0.15s;
        }
        .eral-send-btn:hover:not(:disabled) { background: #6366f1; }
        .eral-send-btn:disabled { opacity: 0.35; cursor: not-allowed; }
        .eral-stop-btn {
          width: auto;
          padding: 0 10px;
          font-size: 12px;
          background: rgba(239,68,68,0.15);
          border: 1px solid rgba(239,68,68,0.3);
          color: #ef4444;
        }
        .eral-stop-btn:hover { background: rgba(239,68,68,0.25) !important; }

        .eral-input-box--director {
          border-color: rgba(234,179,8,0.3);
          box-shadow: 0 0 0 3px rgba(234,179,8,0.05);
        }
        .eral-input-box--director:focus-within {
          border-color: rgba(234,179,8,0.5);
          box-shadow: 0 0 0 3px rgba(234,179,8,0.1);
        }

        .eral-input-hint {
          margin: 6px 0 0;
          font-size: 10px;
          color: var(--text-faint);
          text-align: center;
        }

        /* Conversation skeleton */
        .eral-conv-skeleton {
          height: 28px;
          margin: 3px 6px;
          border-radius: 4px;
          background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%);
          background-size: 200% 100%;
          animation: eral-shimmer 1.4s ease infinite;
        }
        @keyframes eral-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        /* Follow-up suggestion chips */
        .eral-followup-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          padding: 4px 2px 0;
        }
        .eral-followup-chip {
          padding: 4px 10px;
          background: rgba(129,140,248,0.06);
          border: 1px solid rgba(129,140,248,0.2);
          border-radius: 12px;
          color: #818cf8;
          font-size: 11px;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s;
          white-space: nowrap;
        }
        .eral-followup-chip:hover {
          background: rgba(129,140,248,0.14);
          border-color: rgba(129,140,248,0.4);
        }

        /* Tool suggestion banner */
        .eral-tool-suggestion-wrap {
          padding: 0 12px 0 52px;
        }
        .eral-tool-suggestion {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 5px 10px 5px 9px;
          background: rgba(34,211,238,0.06);
          border: 1px solid rgba(34,211,238,0.18);
          border-radius: 8px;
          font-size: 11.5px;
          color: var(--text-muted);
          margin-top: 4px;
        }
        .eral-tool-suggestion-icon { flex-shrink: 0; font-size: 13px; }
        .eral-tool-suggestion-links { flex: 1; display: flex; flex-wrap: wrap; gap: 4px 10px; }
        .eral-tool-suggestion-sep { margin: 0 4px; opacity: 0.4; }
        .eral-tool-suggestion-link {
          color: #22d3ee;
          text-decoration: none;
          font-weight: 500;
        }
        .eral-tool-suggestion-link:hover { text-decoration: underline; }
        .eral-tool-suggestion-dismiss {
          flex-shrink: 0;
          background: none;
          border: none;
          color: var(--text-faint);
          cursor: pointer;
          font-size: 15px;
          line-height: 1;
          padding: 0 2px;
          opacity: 0.6;
        }
        .eral-tool-suggestion-dismiss:hover { opacity: 1; }

        /* Commands section */
        .eral-commands-section {
          margin-top: 28px;
          width: 100%;
          max-width: 540px;
        }
        .eral-commands-label {
          font-size: 11px;
          color: var(--text-faint);
          text-align: center;
          margin-bottom: 10px;
          letter-spacing: 0.02em;
        }
        .eral-commands-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: center;
        }
        .eral-command-chip {
          padding: 5px 12px;
          background: rgba(129,140,248,0.07);
          border: 1px solid rgba(129,140,248,0.15);
          border-radius: 14px;
          color: var(--text-muted);
          font-size: 12px;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s, color 0.15s;
          font-style: italic;
        }
        .eral-command-chip:hover {
          background: rgba(129,140,248,0.14);
          border-color: rgba(129,140,248,0.3);
          color: #818cf8;
        }

        /* Mobile */
        @media (max-width: 640px) {
          .eral-sidebar-open { width: 100%; position: absolute; top: 0; left: 0; bottom: 0; z-index: 40; }
          .eral-v2-plan-panel { display: none; }
          .eral-msg-row { max-width: 100%; }
        }
        @media (max-width: 900px) {
          .eral-v2-plan-panel { width: 220px; }
        }
      `}</style>
    </div>
  );
}

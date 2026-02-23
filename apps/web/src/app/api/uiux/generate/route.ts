import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// ---------------------------------------------------------------------------
// UI/UX Code Generation Endpoint
// POST /api/uiux/generate  — Generate or iteratively refine UI components
// GET  /api/uiux/generate?tokens=true&style=...&framework=... — Design tokens
// ---------------------------------------------------------------------------

// ─── Provider constants ──────────────────────────────────────────────────────

const TOGETHER_CHAT_URL = 'https://api.together.xyz/v1/chat/completions';
const TOGETHER_SMART_MODEL = 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo';
const TOGETHER_QUALITY_MODEL = 'deepseek-ai/DeepSeek-V3';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_FAST_MODEL = 'llama-3.3-70b-versatile';
const GROQ_MINI_MODEL = 'llama3-8b-8192'; // available as a lighter fallback

// ─── Types ───────────────────────────────────────────────────────────────────

type Framework = 'html-tailwind' | 'react-tsx' | 'next-tsx' | 'vanilla-css' | 'vue3' | 'svelte';
type ComponentType =
  | 'hero' | 'pricing' | 'navbar' | 'card' | 'form' | 'dashboard'
  | 'landing' | 'auth' | 'settings' | 'table' | 'modal' | 'sidebar'
  | 'footer' | 'faq' | 'testimonials' | 'features' | 'cta' | 'custom';
type StylePreset =
  | 'saas-dark' | 'minimal-light' | 'bold-consumer' | 'corporate-clean'
  | 'dev-terminal' | 'warm-brand' | 'glassmorphism' | 'brutalist';
type ModelTier = 'fast' | 'quality' | 'smart';
type ErrorCode =
  | 'RATE_LIMITED'
  | 'MODEL_UNAVAILABLE'
  | 'INVALID_PROMPT'
  | 'INVALID_REQUEST'
  | 'SERVICE_UNAVAILABLE';

interface GenerateUIRequest {
  prompt: string;
  componentType: ComponentType;
  framework: Framework;
  style: StylePreset;
  colorScheme?: string;
  darkMode?: boolean;
  responsive?: boolean;
  accessibilityLevel?: 'minimal' | 'standard' | 'enhanced';
  // Model selection
  modelTier?: ModelTier;
  // Iterative refinement
  prevCode?: string;
  refinementPrompt?: string;
}

interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// ─── Structured error helper ─────────────────────────────────────────────────

function errorResponse(
  message: string,
  code: ErrorCode,
  status: number,
  retryable: boolean,
  headers?: Record<string, string>,
): NextResponse {
  return NextResponse.json({ error: message, code, retryable }, { status, headers });
}

// ─── System prompts per framework ───────────────────────────────────────────

function buildSystemPrompt(framework: Framework): string {
  const sharedRules = `
You are an expert front-end developer and UI/UX designer.
Rules you MUST follow:
- Output ONLY the code, no explanations, no markdown fences, no comments outside the code itself.
- The code must be completely self-contained and render correctly standalone.
- Use modern, clean design with professional spacing, typography, and color.
- Never use placeholder images from the web. Use CSS gradients or SVG placeholders inline.
- Use semantic HTML elements (section, article, header, main, nav, aside, footer) where appropriate.
- Every interactive element must have a visible focus ring (outline: 2px solid <accent>; outline-offset: 2px).
- Use CSS custom properties for all colors so the component is trivially themeable.
- All colors must be consistent — pick a palette and stick to it.
- Every interactive element must have hover/focus states.
- Ensure readable contrast ratios (WCAG AA minimum).
- Add brief inline comments explaining any non-obvious design decisions.
- Code must work without any build step — reference CDNs if needed.
`.trim();

  if (framework === 'html-tailwind') {
    return `${sharedRules}

FRAMEWORK: Complete, self-contained HTML with Tailwind CSS via CDN.
- First line of output: <!DOCTYPE html>
- Include in <head>: <script src="https://cdn.tailwindcss.com"></script>
- Include Google Fonts via a <link> tag if using custom fonts (Inter is preferred).
- All Tailwind classes inline. Do not write custom CSS unless absolutely necessary.
- Configure Tailwind dark mode via <script>tailwind.config = { darkMode: 'class' }</script> if dark.
- No external JavaScript dependencies besides Tailwind CDN.
- Include a minimal inline <script> for interactive behaviors if needed (toggles, modals).
- Output the full HTML document from <!DOCTYPE html> to </html>.`;
  }

  if (framework === 'react-tsx') {
    return `${sharedRules}

FRAMEWORK: React TSX component.
- Export a default React function component.
- Accept a \`className?: string\` prop on the root element for external style overrides.
- Use Tailwind CSS classes (assume it is configured in the project).
- Import React if needed: import React from 'react';
- Type all props with TypeScript interfaces.
- No external dependencies beyond React and Tailwind.
- Include all sub-components inline in the same file.
- The component must be self-sufficient — it receives its own mock data internally.
- Output only the TypeScript/TSX code.`;
  }

  if (framework === 'next-tsx') {
    return `${sharedRules}

FRAMEWORK: Next.js 14 App Router TSX component.
- Use 'use client' directive if the component needs interactivity.
- Accept a \`className?: string\` prop on the root element for external style overrides.
- Use Tailwind CSS classes.
- Use Next.js Link for navigation links (import Link from 'next/link').
- Use Next.js Image for any images (import Image from 'next/image'), or use CSS backgrounds.
- Type all props with TypeScript.
- No external dependencies beyond Next.js and Tailwind.
- Output only the TSX code.`;
  }

  if (framework === 'vue3') {
    return `${sharedRules}

FRAMEWORK: Vue 3 Single File Component (SFC).
- Structure: <template>, <script setup lang="ts">, <style scoped>
- Use Vue 3 Composition API with <script setup>.
- Type props with defineProps<{ ... }>() TypeScript generics.
- Use scoped CSS with CSS custom properties for all colors.
- Include mock data inside the <script setup> block.
- No external dependencies beyond Vue 3.
- Output only the complete .vue SFC code.`;
  }

  if (framework === 'svelte') {
    return `${sharedRules}

FRAMEWORK: Svelte component.
- Structure: <script lang="ts">, markup, <style>
- Use Svelte's reactive declarations ($:) where appropriate.
- Type props with TypeScript \`export let\` syntax.
- Use scoped CSS with CSS custom properties for all colors.
- Include mock data inside the <script> block.
- No external dependencies beyond Svelte.
- Output only the complete .svelte component code.`;
  }

  // vanilla-css
  return `${sharedRules}

FRAMEWORK: Pure HTML and CSS (no frameworks).
- First line: <!DOCTYPE html>
- Write a complete HTML document.
- Include a <style> block with all CSS.
- Use CSS custom properties (--variables) for theming.
- Use CSS Grid and Flexbox for layout.
- No JavaScript unless essential for the component.
- Output the full HTML document.`;
}

// ─── User prompt builders ────────────────────────────────────────────────────

function buildUserPrompt(req: GenerateUIRequest): string {
  const styleDescriptions: Record<StylePreset, string> = {
    'saas-dark': 'dark background (#0f0f10), card surfaces (#1a1a1b), accent color indigo/violet (#6366f1), clean SaaS aesthetic, subtle borders, soft shadows',
    'minimal-light': 'white background, light gray surfaces (#f9fafb), minimal design, thin borders, lots of white space, slate text, accent indigo',
    'bold-consumer': 'vibrant colors, high contrast, bold typography, energetic design, large CTAs, consumer app aesthetic',
    'corporate-clean': 'professional, conservative, navy or slate color scheme, clean grid layouts, formal typography, enterprise-grade appearance',
    'dev-terminal': 'dark terminal aesthetic, monospace fonts, green/cyan accents on dark backgrounds, code-editor inspired design, #0d1117 background',
    'warm-brand': 'warm tones, amber/orange accents, friendly typography, rounded corners, welcoming community-focused design',
    'glassmorphism': 'frosted glass effect, backdrop blur, semi-transparent surfaces, gradient backgrounds, modern iOS-inspired',
    'brutalist': 'raw brutalist design, strong borders, high contrast black and white, bold weights, no-nonsense layout',
  };

  const componentDescriptions: Record<ComponentType, string> = {
    hero: 'hero section (headline, subheadline, CTA buttons, optional visual)',
    pricing: 'pricing section with plan cards (Free, Pro, Enterprise tiers)',
    navbar: 'navigation bar with logo, links, and auth buttons',
    card: 'reusable card component with image, title, description, action',
    form: 'form with input fields, labels, validation states, submit button',
    dashboard: 'admin dashboard layout with sidebar, stats, and data table',
    landing: 'full landing page (hero + features + pricing + footer)',
    auth: 'authentication page (sign in / sign up with social auth)',
    settings: 'settings page with sections, toggles, and save buttons',
    table: 'data table with sortable columns, pagination, and row actions',
    modal: 'modal dialog with header, content, and footer buttons',
    sidebar: 'sidebar navigation with sections, icons, and active states',
    footer: 'website footer with links, newsletter signup, social icons',
    faq: 'FAQ section with accordion-style expandable questions',
    testimonials: 'testimonials section with avatar, quote, and attribution',
    features: 'features section with icon grid and descriptions',
    cta: 'call-to-action section with headline and conversion button',
    custom: 'custom component as described in the prompt',
  };

  const parts: string[] = [
    `Generate a ${componentDescriptions[req.componentType]}.`,
    '',
    `Style: ${styleDescriptions[req.style]}.`,
    req.colorScheme ? `Color scheme: ${req.colorScheme}.` : '',
    req.darkMode ? 'Use dark mode by default.' : '',
    req.responsive
      ? 'Must be fully responsive (mobile-first, breakpoints at 640px and 1024px).'
      : 'Desktop layout (min 1024px wide).',
    req.accessibilityLevel === 'enhanced'
      ? 'Add full ARIA attributes, role attributes, keyboard navigation support.'
      : '',
    req.accessibilityLevel === 'standard'
      ? 'Include alt text, label associations, and basic ARIA where appropriate.'
      : '',
    '',
    'User description:',
    req.prompt,
  ];

  return parts.filter(Boolean).join('\n');
}

function buildRefinementPrompt(prevCode: string, refinementPrompt: string): string {
  return `Here is the current component code:
<PREV_CODE>
${prevCode}
</PREV_CODE>

The user wants this change: ${refinementPrompt}

Apply only the requested changes. Preserve the rest of the component exactly.
Output ONLY the updated full code.`;
}

// ─── Accessibility hints post-processor ─────────────────────────────────────

function extractAccessibilityHints(code: string): string[] {
  const hints: string[] = [];

  // Images without alt text
  if (/<img(?![^>]*\balt\s*=)[^>]*>/i.test(code)) {
    hints.push('Warning: One or more <img> elements are missing alt text. Add descriptive alt attributes for screen readers.');
  }

  // Inputs without associated labels
  const inputCount = (code.match(/<input[^>]*>/gi) ?? []).length;
  const hasLabels = /<label/i.test(code);
  if (inputCount > 0 && !hasLabels) {
    hints.push('Warning: Form inputs detected but no <label> elements found. Associate labels using for/id pairs or aria-label.');
  }

  // Buttons that appear to have no accessible text (empty or icon-only)
  const emptyButtonPattern = /<button(?![^>]*aria-label)[^>]*>\s*(?:<svg|<i\s)[^]*?<\/button>/i;
  if (emptyButtonPattern.test(code) || /<button[^>]*>\s*<\/button>/i.test(code)) {
    hints.push('Warning: One or more buttons may lack accessible text. Ensure every button has visible text or an aria-label attribute.');
  }

  // Heuristic check for known low-contrast Tailwind combos
  if (/text-gray-[23]\s/.test(code) || /text-white.*bg-yellow/i.test(code) || /text-yellow.*bg-white/i.test(code)) {
    hints.push('Note: Possible low-contrast color combination detected. Verify contrast meets WCAG AA (4.5:1 for normal text).');
  }

  return hints;
}

// ─── Design tokens ───────────────────────────────────────────────────────────

type TokenMap = Record<string, Record<string, unknown>>;

const DESIGN_TOKENS: Record<StylePreset, TokenMap> = {
  'saas-dark': {
    colors: {
      background: '#0f0f10', surface: '#1a1a1b', surfaceHover: '#222224', border: '#2a2a2c',
      primary: '#6366f1', primaryHover: '#4f46e5', accent: '#8b5cf6',
      textPrimary: '#f1f5f9', textSecondary: '#94a3b8', textMuted: '#64748b',
      success: '#22c55e', warning: '#f59e0b', error: '#ef4444',
    },
    typography: {
      fontFamily: "'Inter', system-ui, sans-serif",
      fontSize: { xs: '0.75rem', sm: '0.875rem', base: '1rem', lg: '1.125rem', xl: '1.25rem', '2xl': '1.5rem', '3xl': '1.875rem', '4xl': '2.25rem' },
      fontWeight: { normal: 400, medium: 500, semibold: 600, bold: 700 },
    },
    spacing: { xs: '0.25rem', sm: '0.5rem', md: '1rem', lg: '1.5rem', xl: '2rem', '2xl': '3rem', '3xl': '4rem' },
    borderRadius: { sm: '0.25rem', md: '0.5rem', lg: '0.75rem', xl: '1rem', full: '9999px' },
    shadows: { sm: '0 1px 2px rgba(0,0,0,0.5)', md: '0 4px 6px rgba(0,0,0,0.4)', lg: '0 10px 15px rgba(0,0,0,0.3)', glow: '0 0 20px rgba(99,102,241,0.3)' },
  },
  'minimal-light': {
    colors: {
      background: '#ffffff', surface: '#f9fafb', surfaceHover: '#f3f4f6', border: '#e5e7eb',
      primary: '#6366f1', primaryHover: '#4f46e5', accent: '#8b5cf6',
      textPrimary: '#0f172a', textSecondary: '#475569', textMuted: '#94a3b8',
      success: '#16a34a', warning: '#d97706', error: '#dc2626',
    },
    typography: {
      fontFamily: "'Inter', system-ui, sans-serif",
      fontSize: { xs: '0.75rem', sm: '0.875rem', base: '1rem', lg: '1.125rem', xl: '1.25rem', '2xl': '1.5rem', '3xl': '1.875rem', '4xl': '2.25rem' },
      fontWeight: { normal: 400, medium: 500, semibold: 600, bold: 700 },
    },
    spacing: { xs: '0.25rem', sm: '0.5rem', md: '1rem', lg: '1.5rem', xl: '2rem', '2xl': '3rem', '3xl': '4rem' },
    borderRadius: { sm: '0.25rem', md: '0.375rem', lg: '0.5rem', xl: '0.75rem', full: '9999px' },
    shadows: { sm: '0 1px 2px rgba(0,0,0,0.05)', md: '0 4px 6px rgba(0,0,0,0.07)', lg: '0 10px 15px rgba(0,0,0,0.1)' },
  },
  'bold-consumer': {
    colors: {
      background: '#ffffff', surface: '#fafafa', surfaceHover: '#f0f0f0', border: '#e0e0e0',
      primary: '#ff4444', primaryHover: '#cc0000', accent: '#ff8c00',
      textPrimary: '#111111', textSecondary: '#444444', textMuted: '#888888',
      success: '#00cc44', warning: '#ffbb00', error: '#ff2222',
    },
    typography: {
      fontFamily: "'Poppins', system-ui, sans-serif",
      fontSize: { xs: '0.75rem', sm: '0.875rem', base: '1rem', lg: '1.25rem', xl: '1.5rem', '2xl': '2rem', '3xl': '2.5rem', '4xl': '3rem' },
      fontWeight: { normal: 400, medium: 600, semibold: 700, bold: 800 },
    },
    spacing: { xs: '0.25rem', sm: '0.5rem', md: '1rem', lg: '1.5rem', xl: '2rem', '2xl': '3rem', '3xl': '4rem' },
    borderRadius: { sm: '0.5rem', md: '0.75rem', lg: '1rem', xl: '1.5rem', full: '9999px' },
    shadows: { sm: '2px 2px 0 #000', md: '4px 4px 0 #000', lg: '6px 6px 0 #000' },
  },
  'corporate-clean': {
    colors: {
      background: '#ffffff', surface: '#f8fafc', surfaceHover: '#f1f5f9', border: '#cbd5e1',
      primary: '#1e40af', primaryHover: '#1e3a8a', accent: '#0ea5e9',
      textPrimary: '#0f172a', textSecondary: '#334155', textMuted: '#64748b',
      success: '#166534', warning: '#92400e', error: '#991b1b',
    },
    typography: {
      fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
      fontSize: { xs: '0.75rem', sm: '0.875rem', base: '1rem', lg: '1.125rem', xl: '1.25rem', '2xl': '1.5rem', '3xl': '1.875rem', '4xl': '2.25rem' },
      fontWeight: { normal: 400, medium: 500, semibold: 600, bold: 700 },
    },
    spacing: { xs: '0.25rem', sm: '0.5rem', md: '1rem', lg: '1.5rem', xl: '2rem', '2xl': '3rem', '3xl': '4rem' },
    borderRadius: { sm: '0.125rem', md: '0.25rem', lg: '0.375rem', xl: '0.5rem', full: '9999px' },
    shadows: { sm: '0 1px 3px rgba(0,0,0,0.12)', md: '0 2px 8px rgba(0,0,0,0.12)', lg: '0 4px 16px rgba(0,0,0,0.12)' },
  },
  'dev-terminal': {
    colors: {
      background: '#0d1117', surface: '#161b22', surfaceHover: '#1f2937', border: '#30363d',
      primary: '#00ff88', primaryHover: '#00cc66', accent: '#00d4ff',
      textPrimary: '#e6edf3', textSecondary: '#8b949e', textMuted: '#484f58',
      success: '#3fb950', warning: '#d29922', error: '#f85149',
    },
    typography: {
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      fontSize: { xs: '0.75rem', sm: '0.875rem', base: '1rem', lg: '1.125rem', xl: '1.25rem', '2xl': '1.5rem', '3xl': '1.875rem', '4xl': '2.25rem' },
      fontWeight: { normal: 400, medium: 500, semibold: 600, bold: 700 },
    },
    spacing: { xs: '0.25rem', sm: '0.5rem', md: '1rem', lg: '1.5rem', xl: '2rem', '2xl': '3rem', '3xl': '4rem' },
    borderRadius: { sm: '0.125rem', md: '0.25rem', lg: '0.375rem', xl: '0.5rem', full: '9999px' },
    shadows: { sm: '0 1px 2px rgba(0,0,0,0.8)', md: '0 4px 6px rgba(0,0,0,0.6)', lg: '0 10px 15px rgba(0,0,0,0.5)', glow: '0 0 20px rgba(0,255,136,0.2)' },
  },
  'warm-brand': {
    colors: {
      background: '#fffbf7', surface: '#fff7ed', surfaceHover: '#ffedd5', border: '#fed7aa',
      primary: '#ea580c', primaryHover: '#c2410c', accent: '#f59e0b',
      textPrimary: '#1c0a00', textSecondary: '#7c2d12', textMuted: '#a16207',
      success: '#15803d', warning: '#b45309', error: '#dc2626',
    },
    typography: {
      fontFamily: "'DM Sans', system-ui, sans-serif",
      fontSize: { xs: '0.75rem', sm: '0.875rem', base: '1rem', lg: '1.125rem', xl: '1.25rem', '2xl': '1.5rem', '3xl': '1.875rem', '4xl': '2.25rem' },
      fontWeight: { normal: 400, medium: 500, semibold: 600, bold: 700 },
    },
    spacing: { xs: '0.25rem', sm: '0.5rem', md: '1rem', lg: '1.5rem', xl: '2rem', '2xl': '3rem', '3xl': '4rem' },
    borderRadius: { sm: '0.5rem', md: '0.75rem', lg: '1rem', xl: '1.5rem', full: '9999px' },
    shadows: { sm: '0 1px 3px rgba(234,88,12,0.1)', md: '0 4px 8px rgba(234,88,12,0.15)', lg: '0 10px 20px rgba(234,88,12,0.2)' },
  },
  'glassmorphism': {
    colors: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      surface: 'rgba(255,255,255,0.1)', surfaceHover: 'rgba(255,255,255,0.15)', border: 'rgba(255,255,255,0.2)',
      primary: 'rgba(255,255,255,0.9)', primaryHover: 'rgba(255,255,255,1)', accent: '#a78bfa',
      textPrimary: '#ffffff', textSecondary: 'rgba(255,255,255,0.8)', textMuted: 'rgba(255,255,255,0.5)',
      success: '#34d399', warning: '#fbbf24', error: '#f87171',
    },
    typography: {
      fontFamily: "'Inter', system-ui, sans-serif",
      fontSize: { xs: '0.75rem', sm: '0.875rem', base: '1rem', lg: '1.125rem', xl: '1.25rem', '2xl': '1.5rem', '3xl': '1.875rem', '4xl': '2.25rem' },
      fontWeight: { normal: 400, medium: 500, semibold: 600, bold: 700 },
    },
    spacing: { xs: '0.25rem', sm: '0.5rem', md: '1rem', lg: '1.5rem', xl: '2rem', '2xl': '3rem', '3xl': '4rem' },
    borderRadius: { sm: '0.5rem', md: '0.75rem', lg: '1rem', xl: '1.5rem', full: '9999px' },
    shadows: { sm: '0 4px 6px rgba(0,0,0,0.1)', md: '0 8px 32px rgba(31,38,135,0.37)', lg: '0 16px 40px rgba(31,38,135,0.5)' },
  },
  'brutalist': {
    colors: {
      background: '#ffffff', surface: '#f0f0f0', surfaceHover: '#e0e0e0', border: '#000000',
      primary: '#000000', primaryHover: '#333333', accent: '#ff0000',
      textPrimary: '#000000', textSecondary: '#333333', textMuted: '#666666',
      success: '#00aa00', warning: '#ffaa00', error: '#ff0000',
    },
    typography: {
      fontFamily: "'Arial Black', Impact, system-ui, sans-serif",
      fontSize: { xs: '0.75rem', sm: '0.875rem', base: '1rem', lg: '1.25rem', xl: '1.5rem', '2xl': '2rem', '3xl': '2.5rem', '4xl': '3.5rem' },
      fontWeight: { normal: 700, medium: 800, semibold: 900, bold: 900 },
    },
    spacing: { xs: '0.25rem', sm: '0.5rem', md: '1rem', lg: '1.5rem', xl: '2rem', '2xl': '3rem', '3xl': '4rem' },
    borderRadius: { sm: '0', md: '0', lg: '0', xl: '0', full: '0' },
    shadows: { sm: '2px 2px 0 #000', md: '4px 4px 0 #000', lg: '8px 8px 0 #000' },
  },
};

function buildCssVariables(style: StylePreset): string {
  const tokens = DESIGN_TOKENS[style];
  const colors = tokens.colors as Record<string, string>;
  // Convert camelCase keys to kebab-case CSS custom property names
  const lines = Object.entries(colors).map(
    ([k, v]) => `  --color-${k.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${v};`,
  );
  return `:root {\n${lines.join('\n')}\n}`;
}

function buildTailwindConfig(style: StylePreset): Record<string, unknown> {
  const tokens = DESIGN_TOKENS[style];
  const colors = tokens.colors as Record<string, string>;
  const typography = tokens.typography as Record<string, unknown>;
  return {
    theme: {
      extend: {
        colors,
        fontFamily: { brand: [typography.fontFamily as string] },
      },
    },
  };
}

// ─── Rate limiting — sliding window, keyed by userId ─────────────────────────

interface RateLimitEntry {
  timestamps: number[]; // epoch-ms of each request within the window
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Limits per tier over a 1-hour sliding window
const RATE_LIMITS: Record<'anonymous' | 'free' | 'paid', number> = {
  anonymous: 3,
  free: 15,
  paid: Infinity,
};
const RATE_WINDOW_MS = 60 * 60 * 1_000; // 1 hour

function checkRateLimit(
  userId: string | null,
  userTier: 'anonymous' | 'free' | 'paid',
): { allowed: boolean; retryAfter?: number } {
  if (userTier === 'paid') return { allowed: true };

  const key = userId ?? 'anon';
  const limit = RATE_LIMITS[userTier];
  const now = Date.now();
  const cutoff = now - RATE_WINDOW_MS;

  const entry = rateLimitStore.get(key) ?? { timestamps: [] };
  entry.timestamps = entry.timestamps.filter(t => t > cutoff); // prune expired

  if (entry.timestamps.length >= limit) {
    const retryAfter = Math.ceil((entry.timestamps[0] + RATE_WINDOW_MS - now) / 1000);
    rateLimitStore.set(key, entry);
    return { allowed: false, retryAfter };
  }

  entry.timestamps.push(now);
  rateLimitStore.set(key, entry);
  return { allowed: true };
}

// ─── Provider call helpers ───────────────────────────────────────────────────

interface LLMCallOptions {
  model: string;
  messages: LLMMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

function callGroq(opts: LLMCallOptions): Promise<Response> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return Promise.reject(new Error('GROQ_API_KEY not set'));
  return fetch(GROQ_API_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: opts.model,
      messages: opts.messages,
      temperature: opts.temperature ?? 0.3,
      max_tokens: opts.max_tokens ?? 4096,
      stream: opts.stream ?? false,
    }),
  });
}

function callTogether(opts: LLMCallOptions): Promise<Response> {
  const apiKey = process.env.TOGETHER_API_KEY;
  if (!apiKey) return Promise.reject(new Error('TOGETHER_API_KEY not set'));
  return fetch(TOGETHER_CHAT_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: opts.model,
      messages: opts.messages,
      temperature: opts.temperature ?? 0.3,
      max_tokens: opts.max_tokens ?? 4096,
      top_p: 0.9,
      stream: opts.stream ?? false,
    }),
  });
}

// Resolve the best provider + model for the requested tier.
// Provider order: Groq (if fast/no preference + key present) → Together → Together fallback
function resolveProvider(tier: ModelTier | undefined): {
  provider: 'groq' | 'together';
  model: string;
  fallbackModel: string;
} {
  const groqAvailable = !!process.env.GROQ_API_KEY;

  if (tier === 'quality') {
    return { provider: 'together', model: TOGETHER_QUALITY_MODEL, fallbackModel: TOGETHER_SMART_MODEL };
  }
  if (tier === 'fast') {
    return groqAvailable
      ? { provider: 'groq', model: GROQ_FAST_MODEL, fallbackModel: TOGETHER_SMART_MODEL }
      : { provider: 'together', model: TOGETHER_SMART_MODEL, fallbackModel: TOGETHER_QUALITY_MODEL };
  }
  // 'smart' or unset — prefer Groq when key is present for better throughput
  return groqAvailable
    ? { provider: 'groq', model: GROQ_FAST_MODEL, fallbackModel: TOGETHER_SMART_MODEL }
    : { provider: 'together', model: TOGETHER_SMART_MODEL, fallbackModel: TOGETHER_QUALITY_MODEL };
}

// ─── Non-streaming generation ────────────────────────────────────────────────

async function generateCode(
  messages: LLMMessage[],
  tier: ModelTier | undefined,
): Promise<{ code: string; modelUsed: string }> {
  const { provider, model, fallbackModel } = resolveProvider(tier);

  // Two attempts: primary provider/model, then Together fallback
  const attempts: Array<() => Promise<Response>> = [
    () => (provider === 'groq' ? callGroq({ model, messages }) : callTogether({ model, messages })),
    () => callTogether({ model: fallbackModel, messages }),
  ];

  for (const attempt of attempts) {
    let res: Response;
    try {
      res = await attempt();
    } catch (err) {
      console.error('[uiux/generate] provider error:', err);
      continue;
    }
    if (!res.ok) {
      console.error(`[uiux/generate] HTTP ${res.status}:`, await res.text().catch(() => ''));
      continue;
    }
    const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
    const raw = data.choices?.[0]?.message?.content ?? '';
    if (raw) return { code: stripCodeFences(raw), modelUsed: model };
  }

  throw new Error('All providers exhausted');
}

// ─── Streaming generation (SSE) ──────────────────────────────────────────────

async function generateCodeStream(
  messages: LLMMessage[],
  tier: ModelTier | undefined,
): Promise<ReadableStream<Uint8Array>> {
  const { provider, model, fallbackModel } = resolveProvider(tier);
  const encoder = new TextEncoder();

  const tryStream = async (p: 'groq' | 'together', m: string): Promise<Response | null> => {
    try {
      const res = p === 'groq'
        ? await callGroq({ model: m, messages, stream: true })
        : await callTogether({ model: m, messages, stream: true });
      return res.ok ? res : null;
    } catch {
      return null;
    }
  };

  let upstream = await tryStream(provider, model);
  let modelUsed = model;
  if (!upstream) {
    upstream = await tryStream('together', fallbackModel);
    modelUsed = fallbackModel;
  }

  if (!upstream?.body) {
    // Surface error as an SSE stream so callers handle it uniformly
    return new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('data: {"error":"All providers failed","code":"MODEL_UNAVAILABLE"}\n\ndata: [DONE]\n\n'));
        controller.close();
      },
    });
  }

  const reader = upstream.body.getReader();
  let sseBuffer = '';

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ model: modelUsed })}\n\n`));

      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        sseBuffer += decoder.decode(value, { stream: true });

        const lines = sseBuffer.split('\n');
        sseBuffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const payload = trimmed.slice(5).trim();
          if (payload === '[DONE]') continue;
          try {
            const parsed = JSON.parse(payload) as {
              choices?: Array<{ delta?: { content?: string } }>;
            };
            const token = parsed.choices?.[0]?.delta?.content ?? '';
            if (token) {
              fullText += token;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token })}\n\n`));
            }
          } catch {
            // skip malformed SSE chunks
          }
        }
      }

      // Emit accessibility hints computed from the full streamed output
      const hints = extractAccessibilityHints(stripCodeFences(fullText));
      if (hints.length > 0) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ accessibilityHints: hints })}\n\n`));
      }

      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
    cancel() {
      reader.cancel();
    },
  });
}

// ─── GET — design tokens ─────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  if (searchParams.get('tokens') !== 'true') {
    return errorResponse('Use ?tokens=true to fetch design tokens', 'INVALID_REQUEST', 400, false);
  }

  const style = (searchParams.get('style') ?? 'saas-dark') as StylePreset;
  const framework = searchParams.get('framework') ?? 'tailwind';

  if (!DESIGN_TOKENS[style]) {
    return errorResponse(`Unknown style preset: ${style}`, 'INVALID_REQUEST', 400, false);
  }

  // Bare CSS variable output for ?framework=css
  if (framework === 'css') {
    return new NextResponse(buildCssVariables(style), {
      headers: { 'Content-Type': 'text/css' },
    });
  }

  return NextResponse.json({
    style,
    framework,
    tokens: DESIGN_TOKENS[style],
    tailwindConfig: buildTailwindConfig(style),
    cssVariables: buildCssVariables(style),
  });
}

// ─── POST — generate / refine ────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const { auth } = await import('@/lib/auth');
  const session = await auth();
  const userId = session?.user?.id ?? null;

  // Simple tier heuristic — extend with a DB lookup for paid status as needed
  const userTier: 'anonymous' | 'free' | 'paid' = userId ? 'free' : 'anonymous';
  const { allowed, retryAfter } = checkRateLimit(userId, userTier);

  if (!allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please wait before trying again.', code: 'RATE_LIMITED', retryable: true },
      { status: 429, headers: retryAfter ? { 'Retry-After': String(retryAfter) } : {} },
    );
  }

  let body: GenerateUIRequest;
  try {
    body = await req.json();
  } catch {
    return errorResponse('Invalid JSON request body', 'INVALID_REQUEST', 400, false);
  }

  const { prompt, componentType, framework, style, modelTier, prevCode, refinementPrompt } = body;
  const isRefinement = !!(prevCode?.trim() && refinementPrompt?.trim());

  if (isRefinement) {
    // Refinement path — prevCode + refinementPrompt are sufficient
    if (!prevCode!.trim() || !refinementPrompt!.trim()) {
      return errorResponse('prevCode and refinementPrompt are both required for refinement', 'INVALID_PROMPT', 400, false);
    }
  } else {
    if (!prompt?.trim()) {
      return errorResponse('prompt is required', 'INVALID_PROMPT', 400, false);
    }
    if (!componentType || !framework || !style) {
      return errorResponse('componentType, framework, and style are required', 'INVALID_REQUEST', 400, false);
    }
  }

  // Build the message list sent to the LLM
  const systemPrompt = isRefinement
    ? 'You are an expert front-end developer. Output ONLY the full updated code with no markdown fences or explanations.'
    : buildSystemPrompt(framework);

  const userPrompt = isRefinement
    ? buildRefinementPrompt(prevCode!, refinementPrompt!)
    : buildUserPrompt(body);

  const messages: LLMMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  const startMs = Date.now();
  const wantsStream = req.headers.get('Accept') === 'text/event-stream';

  // ── Streaming path ──────────────────────────────────────────────────────────
  if (wantsStream) {
    try {
      const stream = await generateCodeStream(messages, modelTier);
      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    } catch (err) {
      console.error('[uiux/generate] stream error:', err);
      return errorResponse('Streaming generation failed', 'MODEL_UNAVAILABLE', 503, true);
    }
  }

  // ── Non-streaming path ──────────────────────────────────────────────────────
  let code: string;
  let modelUsed: string;
  try {
    ({ code, modelUsed } = await generateCode(messages, modelTier));
  } catch (err) {
    console.error('[uiux/generate] generation failed:', err);
    return errorResponse('Code generation temporarily unavailable. Please try again.', 'MODEL_UNAVAILABLE', 503, true);
  }

  const durationMs = Date.now() - startMs;
  const accessibilityHints = extractAccessibilityHints(code);

  // Persist to DB (non-fatal)
  if (userId) {
    prisma.job
      .create({
        data: {
          userId,
          mode: 'uiux',
          tool: isRefinement ? 'refinement' : componentType,
          prompt: (isRefinement ? refinementPrompt! : prompt).trim(),
          status: 'COMPLETED',
          resultUrl: null,
          params: JSON.stringify({ framework: isRefinement ? undefined : framework, style: isRefinement ? undefined : style, modelUsed, durationMs }),
        },
      })
      .catch(() => {});
  }

  return NextResponse.json({
    code,
    framework: isRefinement ? undefined : framework,
    componentType: isRefinement ? undefined : componentType,
    style: isRefinement ? undefined : style,
    modelUsed,
    modelTier: modelTier ?? 'smart',
    durationMs,
    accessibilityHints,
  });
}

function stripCodeFences(raw: string): string {
  return raw
    .replace(/^```[\w-]*\n?/m, '')
    .replace(/\n?```\s*$/m, '')
    .trim();
}

// Suppress unused-variable lint warning for GROQ_MINI_MODEL (reserved for future use)
void GROQ_MINI_MODEL;

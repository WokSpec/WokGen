import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// ---------------------------------------------------------------------------
// UI/UX Code Generation Endpoint
// POST /api/uiux/generate
// Uses Together.ai chat completion (Llama 3.1 70B) to generate self-contained
// HTML/Tailwind components with inline preview capability.
// ---------------------------------------------------------------------------

const TOGETHER_CHAT_URL = 'https://api.together.xyz/v1/chat/completions';
const CODE_MODEL = 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo';
const DEEPSEEK_MODEL = 'deepseek-ai/DeepSeek-V3';

type Framework = 'html-tailwind' | 'react-tsx' | 'next-tsx' | 'vanilla-css';
type ComponentType =
  | 'hero' | 'pricing' | 'navbar' | 'card' | 'form' | 'dashboard'
  | 'landing' | 'auth' | 'settings' | 'table' | 'modal' | 'sidebar'
  | 'footer' | 'faq' | 'testimonials' | 'features' | 'cta' | 'custom';
type StylePreset =
  | 'saas-dark' | 'minimal-light' | 'bold-consumer' | 'corporate-clean'
  | 'dev-terminal' | 'warm-brand' | 'glassmorphism' | 'brutalist';

interface GenerateUIRequest {
  prompt: string;
  componentType: ComponentType;
  framework: Framework;
  style: StylePreset;
  colorScheme?: string;
  darkMode?: boolean;
  responsive?: boolean;
  accessibilityLevel?: 'minimal' | 'standard' | 'enhanced';
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
- All colors must be consistent — pick a palette and stick to it.
- Every interactive element must have hover/focus states.
- Ensure readable contrast ratios (WCAG AA minimum).
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
- Use Tailwind CSS classes.
- Use Next.js Link for navigation links (import Link from 'next/link').
- Use Next.js Image for any images (import Image from 'next/image'), or use CSS backgrounds.
- Type all props with TypeScript.
- No external dependencies beyond Next.js and Tailwind.
- Output only the TSX code.`;
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
    req.responsive ? 'Must be fully responsive (mobile-first, breakpoints at 640px and 1024px).' : 'Desktop layout (min 1024px wide).',
    req.accessibilityLevel === 'enhanced' ? 'Add full ARIA attributes, role attributes, keyboard navigation support.' : '',
    req.accessibilityLevel === 'standard' ? 'Include alt text, label associations, and basic ARIA where appropriate.' : '',
    '',
    'User description:',
    req.prompt,
  ];

  return parts.filter(Boolean).join('\n');
}

// ─── Rate limiting (per-user, in-memory) ────────────────────────────────────

const rateLimits = new Map<string, { count: number; resetAt: number }>();
const UIUX_RATE_LIMIT = 10;
const UIUX_RATE_WINDOW = 60_000;

function checkRateLimit(userId: string | null): boolean {
  const key = userId ?? 'guest';
  const now = Date.now();
  const entry = rateLimits.get(key);
  if (!entry || entry.resetAt < now) {
    rateLimits.set(key, { count: 1, resetAt: now + UIUX_RATE_WINDOW });
    return true;
  }
  if (entry.count >= UIUX_RATE_LIMIT) return false;
  entry.count++;
  return true;
}

// ─── Route handler ───────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const { auth } = await import('@/lib/auth');
  const session = await auth();
  const userId = session?.user?.id ?? null;

  if (!checkRateLimit(userId)) {
    return NextResponse.json({ error: 'Rate limit exceeded. Please wait a moment.' }, { status: 429 });
  }

  let body: GenerateUIRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { prompt, componentType, framework, style } = body;

  if (!prompt?.trim()) {
    return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
  }
  if (!componentType || !framework || !style) {
    return NextResponse.json({ error: 'componentType, framework, and style are required' }, { status: 400 });
  }

  const apiKey = process.env.TOGETHER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Code generation unavailable.' }, { status: 503 });
  }

  const systemPrompt = buildSystemPrompt(framework);
  const userPrompt = buildUserPrompt(body);

  const startMs = Date.now();

  let code: string | null = null;
  let modelUsed = CODE_MODEL;

  for (const model of [CODE_MODEL, DEEPSEEK_MODEL]) {
    try {
      const response = await fetch(TOGETHER_CHAT_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.3,
          max_tokens: 4096,
          top_p: 0.9,
        }),
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        console.error(`[uiux/generate] ${model} error ${response.status}:`, errText);
        continue;
      }

      const data = await response.json() as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const rawContent = data.choices?.[0]?.message?.content ?? '';
      code = stripCodeFences(rawContent);
      modelUsed = model;
      break;
    } catch (err) {
      console.error(`[uiux/generate] ${model} threw:`, err);
    }
  }

  if (!code) {
    return NextResponse.json({
      error: 'Code generation temporarily unavailable. Please try again.',
    }, { status: 503 });
  }

  const durationMs = Date.now() - startMs;

  // Persist to DB if user is signed in (non-fatal)
  if (userId) {
    prisma.job.create({
      data: {
        userId,
        mode: 'uiux',
        tool: componentType,
        prompt: prompt.trim(),
        status: 'COMPLETED',
        resultUrl: null,
        params: JSON.stringify({ framework, style, modelUsed, durationMs }),
      },
    }).catch(() => {});
  }

  return NextResponse.json({ code, framework, componentType, style, modelUsed, durationMs });
}

function stripCodeFences(raw: string): string {
  return raw
    .replace(/^```[\w-]*\n?/m, '')
    .replace(/\n?```\s*$/m, '')
    .trim();
}

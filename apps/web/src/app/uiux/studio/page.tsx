'use client';

import React, {
  useState, useRef, useCallback, useEffect, useMemo,
} from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Framework = 'html-tailwind' | 'react-tsx' | 'next-tsx' | 'vanilla-css' | 'vue3' | 'svelte';
type ComponentType =
  | 'hero' | 'pricing' | 'navbar' | 'card' | 'form' | 'dashboard'
  | 'landing' | 'auth' | 'settings' | 'table' | 'modal' | 'sidebar'
  | 'footer' | 'faq' | 'testimonials' | 'features' | 'cta' | 'custom';
type StylePreset =
  | 'saas-dark' | 'minimal-light' | 'bold-consumer' | 'corporate-clean'
  | 'dev-terminal' | 'warm-brand' | 'glassmorphism' | 'brutalist';
type OutputTab = 'preview' | 'code' | 'accessibility';
type StudioTab = 'studio' | 'page-builder';
type ModelTier = 'fast' | 'quality' | 'smart';
type ViewportMode = 'mobile' | 'tablet' | 'desktop';

interface GenerationResult {
  code: string;
  framework: Framework;
  componentType: ComponentType;
  style: StylePreset;
  modelUsed: string;
  durationMs: number;
  accessibilityHints?: string[];
}

interface VersionEntry {
  code: string;
  prompt: string;
  refinementPrompt: string;
  timestamp: string;
  componentType: ComponentType;
  framework: Framework;
  style: StylePreset;
  modelUsed: string;
  durationMs: number;
  accessibilityHints?: string[];
}

interface HistoryEntry {
  id: string;
  componentType: ComponentType;
  prompt: string;
  timestamp: string;
  result: GenerationResult;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COMPONENT_TYPES: { id: ComponentType; label: string; icon: string; category: string }[] = [
  { id: 'hero',         label: 'Hero Section',   icon: '◈', category: 'Sections'   },
  { id: 'features',     label: 'Features',        icon: '◆', category: 'Sections'   },
  { id: 'pricing',      label: 'Pricing',         icon: '◉', category: 'Sections'   },
  { id: 'testimonials', label: 'Testimonials',    icon: '◎', category: 'Sections'   },
  { id: 'faq',          label: 'FAQ',             icon: '◌', category: 'Sections'   },
  { id: 'cta',          label: 'CTA',             icon: '▶', category: 'Sections'   },
  { id: 'footer',       label: 'Footer',          icon: '▬', category: 'Sections'   },
  { id: 'navbar',       label: 'Navbar',          icon: '≡',  category: 'Navigation' },
  { id: 'sidebar',      label: 'Sidebar',         icon: '⊟', category: 'Navigation' },
  { id: 'card',         label: 'Card',            icon: '▭', category: 'Components' },
  { id: 'form',         label: 'Form',            icon: '⊞', category: 'Components' },
  { id: 'modal',        label: 'Modal',           icon: '⊡', category: 'Components' },
  { id: 'table',        label: 'Data Table',      icon: '⊟', category: 'Components' },
  { id: 'dashboard',    label: 'Dashboard',       icon: '⊞', category: 'Pages'      },
  { id: 'landing',      label: 'Landing Page',    icon: '◈', category: 'Pages'      },
  { id: 'auth',         label: 'Auth Page',       icon: '⊙', category: 'Pages'      },
  { id: 'settings',     label: 'Settings Page',   icon: '⊛', category: 'Pages'      },
  { id: 'custom',       label: 'Custom',          icon: '✦', category: 'Advanced'   },
];

const COMPONENT_CATEGORIES = ['Sections', 'Navigation', 'Components', 'Pages', 'Advanced'];

const FRAMEWORKS: { id: Framework; label: string; ext: string; desc: string }[] = [
  { id: 'html-tailwind', label: 'HTML + Tailwind', ext: 'html',   desc: 'Self-contained, no build step'  },
  { id: 'react-tsx',     label: 'React / TSX',     ext: 'tsx',    desc: 'Component for React projects'  },
  { id: 'next-tsx',      label: 'Next.js / TSX',   ext: 'tsx',    desc: 'Next.js 14 App Router'         },
  { id: 'vanilla-css',   label: 'Vanilla CSS',     ext: 'html',   desc: 'Pure HTML + CSS, no deps'       },
  { id: 'vue3',          label: 'Vue 3 SFC',        ext: 'vue',    desc: 'Vue 3 Single-File Component'   },
  { id: 'svelte',        label: 'Svelte',           ext: 'svelte', desc: 'Svelte component'              },
];

const STYLE_PRESETS: { id: StylePreset; label: string; colors: string[]; desc: string }[] = [
  { id: 'saas-dark',      label: 'SaaS Dark',       colors: ['#0f0f10', '#1a1a1b', '#6366f1'], desc: 'Dark SaaS product aesthetic' },
  { id: 'minimal-light',  label: 'Minimal Light',   colors: ['#ffffff', '#f9fafb', '#6366f1'], desc: 'Clean, lots of white space'  },
  { id: 'bold-consumer',  label: 'Bold Consumer',   colors: ['#fbbf24', '#ef4444', '#1f2937'], desc: 'Vibrant, high energy'        },
  { id: 'corporate-clean',label: 'Corporate Clean', colors: ['#1e3a5f', '#f8fafc', '#3b82f6'], desc: 'Professional enterprise'     },
  { id: 'dev-terminal',   label: 'Dev Terminal',    colors: ['#0d1117', '#161b22', '#22c55e'], desc: 'Code editor inspired'        },
  { id: 'warm-brand',     label: 'Warm Brand',      colors: ['#fffbeb', '#fef3c7', '#f59e0b'], desc: 'Friendly community tone'     },
  { id: 'glassmorphism',  label: 'Glassmorphism',   colors: ['#667eea', '#764ba2', 'rgba(255,255,255,0.1)'], desc: 'Frosted glass effect' },
  { id: 'brutalist',      label: 'Brutalist',       colors: ['#000000', '#ffffff', '#ff0000'], desc: 'Raw, bold, no-nonsense'      },
];

const MODEL_OPTIONS: { id: ModelTier; label: string; model: string; badge: string; speed: string }[] = [
  { id: 'fast',    label: 'Eral Fast',    model: 'Groq Llama 3.3 70B', badge: '⚡', speed: 'fastest'      },
  { id: 'quality', label: 'Eral Quality', model: 'DeepSeek V3',         badge: '⭐', speed: 'best quality' },
  { id: 'smart',   label: 'Eral Smart',   model: 'Llama 3.1 70B',       badge: '◎', speed: 'balanced'     },
];

const VIEWPORT_OPTIONS: { id: ViewportMode; icon: string; label: string; width: number | undefined }[] = [
  { id: 'mobile',  icon: '📱', label: 'Mobile',  width: 375  },
  { id: 'tablet',  icon: '📲', label: 'Tablet',  width: 768  },
  { id: 'desktop', icon: '🖥',  label: 'Desktop', width: undefined },
];

const EXAMPLE_PROMPTS: Partial<Record<ComponentType, string>> = {
  hero:         'SaaS analytics platform called "Chartly" — headline: "Turn your data into decisions", subtitle about real-time dashboards, two CTAs: Start Free and Watch Demo',
  pricing:      'Three tiers: Free (limited), Pro ($29/mo), Enterprise (contact us). Features: API access, custom dashboards, team seats, priority support',
  navbar:       'Company "Nexus" — logo on left, links: Product, Pricing, Docs, Blog — Sign In and Get Started buttons on right',
  dashboard:    'Admin dashboard for an e-commerce platform — sidebar with Orders, Products, Customers, Analytics — stat cards at top, recent orders table',
  auth:         'Sign in page for a developer tool called "DevKit" — sign in with GitHub, sign in with Google, or email/password form below a divider',
  landing:      'Full landing page for an AI writing tool called "Quill" — hero, 3-feature grid, social proof numbers, pricing table, footer',
  form:         'User profile settings form — avatar upload, display name, email (read-only), bio textarea, notification preferences toggles, save button',
  features:     'Three-column feature grid for a CI/CD platform — icons, titles, descriptions for: Fast Builds, Smart Caching, Auto Deploy',
  footer:       'Footer for "Nexus" SaaS — logo, tagline, columns: Product, Company, Developers, Legal — newsletter signup + social icons',
  card:         'Product card for an e-commerce store — product image, title, rating stars, price, Add to Cart button',
};

// ---------------------------------------------------------------------------
// Syntax highlight helper (no deps)
// ---------------------------------------------------------------------------

function highlightCode(code: string, ext: string): string {
  const esc = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  if (ext === 'tsx' || ext === 'jsx' || ext === 'vue' || ext === 'svelte') {
    return esc
      .replace(/(\/\/[^\n]*)/g, '<span class="code-comment">$1</span>')
      .replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g, '<span class="code-string">$1</span>')
      .replace(/\b(import|export|default|from|const|let|var|function|return|if|else|for|while|class|extends|interface|type|async|await|new|null|undefined|true|false|ref|reactive|computed|onMounted|defineProps|script|template|style)\b/g, '<span class="code-keyword">$1</span>')
      .replace(/\b(React|useState|useEffect|useRef|useCallback|NextRequest|NextResponse)\b/g, '<span class="code-builtin">$1</span>');
  }
  return esc
    .replace(/(&lt;\/?[\w-]+)/g, '<span class="code-tag">$1</span>')
    .replace(/([\w-]+=)("(?:[^"\\]|\\.)*")/g, '<span class="code-attr">$1</span><span class="code-string">$2</span>')
    .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="code-comment">$1</span>');
}

// ---------------------------------------------------------------------------
// Download helpers
// ---------------------------------------------------------------------------

function triggerDownload(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function buildPackageJson(name: string): string {
  return JSON.stringify({
    name: name.toLowerCase().replace(/\s+/g, '-'),
    version: '0.1.0',
    private: true,
    dependencies: { react: '^18.0.0', 'react-dom': '^18.0.0' },
    devDependencies: { typescript: '^5.0.0', tailwindcss: '^3.4.0', '@types/react': '^18.0.0' },
  }, null, 2);
}

function buildReadme(componentType: string, framework: string, prompt: string): string {
  return `# WokGen Component — ${componentType}\n\nGenerated with [WokGen UI/UX Studio](https://wokgen.app)\n\n## Framework\n${framework}\n\n## Description\n${prompt}\n\n## Usage\nImport the component into your project and ensure Tailwind CSS is configured.\n\n## Notes\n- All mock data is embedded\n- Requires Tailwind CSS v3+\n- TypeScript types are included\n`;
}

function handleZipExport(result: GenerationResult, prompt: string) {
  const fw = FRAMEWORKS.find((f) => f.id === result.framework);
  const ext = fw?.ext ?? 'html';
  const slug = result.componentType;
  const ComponentName = slug.charAt(0).toUpperCase() + slug.slice(1) + 'Component';
  if (result.framework === 'react-tsx' || result.framework === 'next-tsx') {
    const files = [
      { name: `${ComponentName}.tsx`,  content: result.code },
      { name: 'package.json',           content: buildPackageJson(ComponentName) },
      { name: 'README.md',              content: buildReadme(slug, fw?.label ?? '', prompt) },
    ];
    files.forEach((file, i) => setTimeout(() => triggerDownload(file.content, file.name), i * 150));
  } else {
    triggerDownload(result.code, `${slug}.${ext}`);
  }
}

// ---------------------------------------------------------------------------
// Page assembler
// ---------------------------------------------------------------------------

function assemblePage(
  entries: { componentType: ComponentType; result: GenerationResult }[],
  framework: Framework,
): string {
  if (framework === 'html-tailwind' || framework === 'vanilla-css') {
    const bodies = entries.map(({ result, componentType }) => {
      const m = result.code.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      const content = m ? m[1].trim() : result.code;
      return `<!-- ===== ${componentType.toUpperCase()} ===== -->\n${content}`;
    });
    return `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n  <title>Assembled Page — WokGen</title>\n  <script src="https://cdn.tailwindcss.com"><\/script>\n</head>\n<body>\n${bodies.join('\n\n')}\n</body>\n</html>`;
  }
  const imports = entries.map(({ componentType }, i) => {
    const name = componentType.charAt(0).toUpperCase() + componentType.slice(1) + 'Section';
    return `// Component ${i + 1}: ${componentType}\nconst ${name} = () => <div data-component="${componentType}" />;`;
  }).join('\n\n');
  const usages = entries.map(({ componentType }) => {
    const name = componentType.charAt(0).toUpperCase() + componentType.slice(1) + 'Section';
    return `      <${name} />`;
  }).join('\n');
  return `'use client';\n\n// Auto-assembled by WokGen UI/UX Studio\n// Replace each section stub with the downloaded component file\n\n${imports}\n\nexport default function AssembledPage() {\n  return (\n    <main>\n${usages}\n    </main>\n  );\n}\n`;
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export default function UIUXStudio() {
  const { data: session } = useSession();

  // ── Studio tab ──────────────────────────────────────────────────────────────
  const [studioTab, setStudioTab] = useState<StudioTab>('studio');

  // ── Form state ──────────────────────────────────────────────────────────────
  const [prompt, setPrompt]               = useState('');
  const [componentType, setComponentType] = useState<ComponentType>('hero');
  const [framework, setFramework]         = useState<Framework>('html-tailwind');
  const [style, setStyle]                 = useState<StylePreset>('saas-dark');
  const [colorScheme, setColorScheme]     = useState('');
  const [darkMode, setDarkMode]           = useState(true);
  const [responsive, setResponsive]       = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('Sections');
  const [showAdvanced, setShowAdvanced]   = useState(false);

  // ── Model / viewport ────────────────────────────────────────────────────────
  const [modelTier, setModelTier]       = useState<ModelTier>('fast');
  const [viewportMode, setViewportMode] = useState<ViewportMode>('desktop');

  // ── Generation state ────────────────────────────────────────────────────────
  const [isLoading, setIsLoading]       = useState(false);
  const [result, setResult]             = useState<GenerationResult | null>(null);
  const [error, setError]               = useState<string | null>(null);
  const [outputTab, setOutputTab]       = useState<OutputTab>('preview');
  const [copied, setCopied]             = useState(false);
  const [elapsedMs, setElapsedMs]       = useState(0);
  const [loadingStage, setLoadingStage] = useState('');
  const abortRef      = useRef<AbortController | null>(null);
  const timerRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const stageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Version history ─────────────────────────────────────────────────────────
  const [versionHistory, setVersionHistory] = useState<VersionEntry[]>([]);
  const [currentVersion, setCurrentVersion] = useState(0);

  // ── Refinement ──────────────────────────────────────────────────────────────
  const [refinementPrompt, setRefinementPrompt] = useState('');
  const [isRefining, setIsRefining]             = useState(false);

  // ── Generation history sidebar ──────────────────────────────────────────────
  const [generationHistory, setGenerationHistory] = useState<HistoryEntry[]>([]);
  const [historySidebarOpen, setHistorySidebarOpen] = useState(true);

  // ── Library mode ────────────────────────────────────────────────────────────
  const [libraryMode, setLibraryMode]             = useState(false);
  const [selectedLibraryTypes, setSelectedLibraryTypes] = useState<ComponentType[]>(['hero', 'features', 'pricing']);
  const [libraryResults, setLibraryResults]       = useState<Record<string, GenerationResult>>({});
  const [isGeneratingLibrary, setIsGeneratingLibrary] = useState(false);
  const [libraryCurrentType, setLibraryCurrentType]   = useState<ComponentType | null>(null);
  const [libraryProcessed, setLibraryProcessed]   = useState(0);

  // ── Community save ──────────────────────────────────────────────────────────
  const [isSavingToGallery, setIsSavingToGallery] = useState(false);
  const [gallerySaved, setGallerySaved]           = useState(false);
  const [galleryIsPublic, setGalleryIsPublic]     = useState(true);

  // ── Page builder ────────────────────────────────────────────────────────────
  const [pageBuilderOrder, setPageBuilderOrder] = useState<string[]>([]);
  const [pageBuilderItems, setPageBuilderItems] = useState<Map<string, { componentType: ComponentType; result: GenerationResult }>>(new Map());

  // ── Auto dark-mode from style ────────────────────────────────────────────────
  useEffect(() => {
    const darkStyles: StylePreset[] = ['saas-dark', 'dev-terminal', 'glassmorphism'];
    setDarkMode(darkStyles.includes(style));
  }, [style]);

  // ── Cmd+Enter keyboard shortcut ─────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        if (!isLoading && !isRefining && studioTab === 'studio' && !libraryMode) {
          handleGenerateRef.current?.();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isLoading, isRefining, studioTab, libraryMode]);

  // Use ref to avoid stale closure in keydown handler
  const handleGenerateRef = useRef<(() => void) | null>(null);

  // ── Loading timers ───────────────────────────────────────────────────────────
  const startLoadingTimers = useCallback(() => {
    const stages = ['Analyzing prompt…', 'Designing layout…', 'Generating code…', 'Applying styles…', 'Finalizing output…'];
    let i = 0;
    setLoadingStage(stages[0]);
    const next = () => { i++; if (i < stages.length) { setLoadingStage(stages[i]); stageTimerRef.current = setTimeout(next, 3500); } };
    stageTimerRef.current = setTimeout(next, 3500);
    const start = Date.now();
    timerRef.current = setInterval(() => setElapsedMs(Date.now() - start), 200);
  }, []);

  const stopLoadingTimers = useCallback(() => {
    if (timerRef.current)      { clearInterval(timerRef.current); timerRef.current = null; }
    if (stageTimerRef.current) { clearTimeout(stageTimerRef.current); stageTimerRef.current = null; }
    setElapsedMs(0); setLoadingStage('');
  }, []);

  // ── Core API call ────────────────────────────────────────────────────────────
  const callGenerateAPI = useCallback(async (
    body: Record<string, unknown>,
    signal: AbortSignal,
  ): Promise<GenerationResult> => {
    const res = await fetch('/api/uiux/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal,
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? 'Generation failed');
    return data as GenerationResult;
  }, []);

  // ── Commit result to state ───────────────────────────────────────────────────
  const commitResult = useCallback((
    newResult: GenerationResult,
    usedPrompt: string,
    refinePrompt = '',
    prevVersions: VersionEntry[] = [],
    prevVersion = 0,
  ) => {
    const entry: VersionEntry = {
      code: newResult.code,
      prompt: usedPrompt,
      refinementPrompt: refinePrompt,
      timestamp: new Date().toISOString(),
      componentType: newResult.componentType,
      framework: newResult.framework,
      style: newResult.style,
      modelUsed: newResult.modelUsed,
      durationMs: newResult.durationMs,
      accessibilityHints: newResult.accessibilityHints,
    };

    const nextHistory = refinePrompt
      ? [...prevVersions.slice(0, prevVersion + 1), entry]
      : [entry];
    setVersionHistory(nextHistory);
    setCurrentVersion(nextHistory.length - 1);
    setResult(newResult);
    setGallerySaved(false);
    setOutputTab('preview');

    const histId = `${Date.now()}`;
    setGenerationHistory((prev) => [
      { id: histId, componentType: newResult.componentType, prompt: usedPrompt, timestamp: new Date().toISOString(), result: newResult },
      ...prev.slice(0, 9),
    ]);

    const pbId = `${newResult.componentType}-${Date.now()}`;
    setPageBuilderOrder((prev) => [...prev, pbId]);
    setPageBuilderItems((prev) => { const next = new Map(prev); next.set(pbId, { componentType: newResult.componentType, result: newResult }); return next; });
  }, []);

  // ── Generate ─────────────────────────────────────────────────────────────────
  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      const el = document.getElementById('uiux-prompt');
      el?.classList.add('shake');
      setTimeout(() => el?.classList.remove('shake'), 400);
      return;
    }
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setIsLoading(true);
    setError(null);
    startLoadingTimers();
    try {
      const data = await callGenerateAPI({
        prompt: prompt.trim(), componentType, framework, style,
        colorScheme: colorScheme.trim() || undefined, darkMode, responsive, modelTier,
      }, abortRef.current.signal);
      commitResult(data, prompt.trim());
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Network error. Please try again.');
    } finally {
      setIsLoading(false);
      stopLoadingTimers();
    }
  }, [prompt, componentType, framework, style, colorScheme, darkMode, responsive, modelTier, startLoadingTimers, stopLoadingTimers, callGenerateAPI, commitResult]);

  // Keep ref up to date for keyboard shortcut
  useEffect(() => { handleGenerateRef.current = handleGenerate; }, [handleGenerate]);

  // ── Refine ───────────────────────────────────────────────────────────────────
  const handleRefine = useCallback(async () => {
    if (!refinementPrompt.trim() || !versionHistory[currentVersion]) return;
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setIsRefining(true);
    setError(null);
    startLoadingTimers();
    try {
      const prev = versionHistory[currentVersion];
      const data = await callGenerateAPI({
        prompt: `${prev.prompt}\n\nRefinement request: ${refinementPrompt.trim()}`,
        componentType: prev.componentType, framework: prev.framework, style: prev.style,
        darkMode, responsive, modelTier, prevCode: prev.code, refinementPrompt: refinementPrompt.trim(),
      }, abortRef.current.signal);
      commitResult(data, prev.prompt, refinementPrompt.trim(), versionHistory, currentVersion);
      setRefinementPrompt('');
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Refinement failed.');
    } finally {
      setIsRefining(false);
      stopLoadingTimers();
    }
  }, [refinementPrompt, versionHistory, currentVersion, darkMode, responsive, modelTier, startLoadingTimers, stopLoadingTimers, callGenerateAPI, commitResult]);

  // ── Cancel ───────────────────────────────────────────────────────────────────
  const handleCancel = useCallback(() => {
    abortRef.current?.abort();
    setIsLoading(false); setIsRefining(false); stopLoadingTimers();
  }, [stopLoadingTimers]);

  // ── Copy ─────────────────────────────────────────────────────────────────────
  const handleCopyCode = useCallback(() => {
    const code = versionHistory[currentVersion]?.code ?? result?.code;
    if (!code) return;
    navigator.clipboard.writeText(code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }).catch(() => {});
  }, [versionHistory, currentVersion, result]);

  // ── Download ─────────────────────────────────────────────────────────────────
  const handleDownload = useCallback(() => {
    if (!currentResult) return;
    const fw = FRAMEWORKS.find((f) => f.id === currentResult.framework);
    triggerDownload(currentResult.code, `wokgen-${currentResult.componentType}.${fw?.ext ?? 'html'}`);
  }, []);

  // ── ZIP export ───────────────────────────────────────────────────────────────
  const handleZipExportCurrent = useCallback(() => {
    if (!currentResult) return;
    handleZipExport(currentResult, prompt);
  }, [prompt]);

  // ── Use example prompt ───────────────────────────────────────────────────────
  const handleUseExample = useCallback(() => {
    const ex = EXAMPLE_PROMPTS[componentType];
    if (ex) setPrompt(ex);
  }, [componentType]);

  // ── Save to gallery ──────────────────────────────────────────────────────────
  // Note: references result/versionHistory directly to avoid forward-ref on currentResult
  const handleSaveToGallery = useCallback(async () => {
    const r = versionHistory.length > 0 && versionHistory[currentVersion]
      ? { code: versionHistory[currentVersion].code, framework: versionHistory[currentVersion].framework, componentType: versionHistory[currentVersion].componentType, style: versionHistory[currentVersion].style }
      : result;
    if (!r || !session?.user) return;
    setIsSavingToGallery(true);
    try {
      await fetch('/api/gallery', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: r.code, componentType: r.componentType, framework: r.framework, style: r.style, prompt, isPublic: galleryIsPublic }),
      });
      setGallerySaved(true);
    } catch { /* non-fatal */ } finally { setIsSavingToGallery(false); }
  }, [versionHistory, currentVersion, result, session, prompt, galleryIsPublic]);

  // ── Restore version ──────────────────────────────────────────────────────────
  const restoreVersion = useCallback((idx: number) => {
    const v = versionHistory[idx];
    if (!v) return;
    setCurrentVersion(idx);
    setResult({ code: v.code, framework: v.framework, componentType: v.componentType, style: v.style, modelUsed: v.modelUsed, durationMs: v.durationMs, accessibilityHints: v.accessibilityHints });
  }, [versionHistory]);

  // ── Library generate ─────────────────────────────────────────────────────────
  const handleGenerateLibrary = useCallback(async () => {
    if (selectedLibraryTypes.length < 2) return;
    setLibraryResults({}); setLibraryProcessed(0); setIsGeneratingLibrary(true); setError(null);
    for (const ct of selectedLibraryTypes) {
      setLibraryCurrentType(ct);
      try {
        const ctrl = new AbortController();
        const res = await callGenerateAPI({ prompt: prompt.trim() || `Generate a ${ct} component`, componentType: ct, framework, style, darkMode, responsive, modelTier }, ctrl.signal);
        setLibraryResults((prev) => ({ ...prev, [ct]: res }));
        const pbId = `${ct}-${Date.now()}`;
        setPageBuilderOrder((prev) => [...prev, pbId]);
        setPageBuilderItems((prev) => { const next = new Map(prev); next.set(pbId, { componentType: ct, result: res }); return next; });
      } catch { /* continue with next */ }
      setLibraryProcessed((p) => p + 1);
    }
    setLibraryCurrentType(null); setIsGeneratingLibrary(false);
  }, [selectedLibraryTypes, prompt, framework, style, darkMode, responsive, modelTier, callGenerateAPI]);

  // ── Page builder helpers ─────────────────────────────────────────────────────
  const movePageBuilderItem = useCallback((id: string, dir: 'up' | 'down') => {
    setPageBuilderOrder((prev) => {
      const idx = prev.indexOf(id); if (idx < 0) return prev;
      const next = [...prev]; const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= next.length) return prev;
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
      return next;
    });
  }, []);

  const removePageBuilderItem = useCallback((id: string) => {
    setPageBuilderOrder((prev) => prev.filter((x) => x !== id));
    setPageBuilderItems((prev) => { const next = new Map(prev); next.delete(id); return next; });
  }, []);

  const handleAssemblePage = useCallback(() => {
    const entries = pageBuilderOrder.map((id) => pageBuilderItems.get(id)).filter((x): x is { componentType: ComponentType; result: GenerationResult } => !!x);
    const assembled = assemblePage(entries, framework);
    const fw = FRAMEWORKS.find((f) => f.id === framework);
    triggerDownload(assembled, fw?.id === 'react-tsx' || fw?.id === 'next-tsx' ? 'AssembledPage.tsx' : 'assembled-page.html');
  }, [pageBuilderOrder, pageBuilderItems, framework]);

  // ── Derived state ────────────────────────────────────────────────────────────
  const currentResult: GenerationResult | null = useMemo(() => {
    if (versionHistory.length > 0 && versionHistory[currentVersion]) {
      const v = versionHistory[currentVersion];
      return { code: v.code, framework: v.framework, componentType: v.componentType, style: v.style, modelUsed: v.modelUsed, durationMs: v.durationMs, accessibilityHints: v.accessibilityHints };
    }
    return result;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [versionHistory, currentVersion, result]);

  // Fix stale ref references
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableCurrentResult = currentResult;

  // Wrap unstable callbacks that depend on currentResult
  const stableHandleDownload = useCallback(() => {
    if (!stableCurrentResult) return;
    const fw = FRAMEWORKS.find((f) => f.id === stableCurrentResult.framework);
    triggerDownload(stableCurrentResult.code, `wokgen-${stableCurrentResult.componentType}.${fw?.ext ?? 'html'}`);
  }, [stableCurrentResult]);

  const stableHandleZipExport = useCallback(() => {
    if (!stableCurrentResult) return;
    handleZipExport(stableCurrentResult, prompt);
  }, [stableCurrentResult, prompt]);

  // ---------------------------------------------------------------------------
  return (
    <div className="uiux-studio-root">
      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', height: 44, borderBottom: '1px solid var(--surface-border)', background: 'var(--surface-raised)', flexShrink: 0 }}>
        <span style={{ color: '#f472b6', fontSize: '1.1rem' }}>✦</span>
        <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>WokGen UI/UX</span>
        <div style={{ width: 1, height: 18, background: 'var(--surface-border)', margin: '0 4px' }} />
        {/* Studio / Page Builder tabs */}
        <div style={{ display: 'flex', gap: 2 }}>
          {([['studio', '◈ Studio'], ['page-builder', '⊞ Page Builder']] as [StudioTab, string][]).map(([tab, label]) => (
            <button key={tab} onClick={() => setStudioTab(tab)} style={{ padding: '3px 12px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: '0.75rem', background: studioTab === tab ? 'var(--accent-dim)' : 'transparent', color: studioTab === tab ? 'var(--accent)' : 'var(--text-muted)', fontWeight: studioTab === tab ? 600 : 400 }}>
              {label}
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <button onClick={() => setHistorySidebarOpen((v) => !v)} style={{ padding: '3px 10px', borderRadius: 5, border: '1px solid var(--surface-border)', background: 'transparent', color: 'var(--text-muted)', fontSize: '0.7rem', cursor: 'pointer' }}>
          {historySidebarOpen ? '⊟ History' : '⊞ History'}
        </button>
        <Link href="/" style={{ fontSize: '0.7rem', color: 'var(--text-muted)', padding: '3px 8px', textDecoration: 'none' }}>← Platform</Link>
      </div>

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      <div className="studio-flex-body">

        {/* Page Builder tab */}
        {studioTab === 'page-builder' && (
          <UIUXPageBuilder
            order={pageBuilderOrder}
            items={pageBuilderItems}
            framework={framework}
            onMove={movePageBuilderItem}
            onRemove={removePageBuilderItem}
            onAssemble={handleAssemblePage}
          />
        )}

        {/* Studio tab — 3-col layout */}
        {studioTab === 'studio' && (
          <>
            {/* ── History sidebar (col 1) ───────────────────────────────── */}
            {historySidebarOpen && (
              <div className="studio-history-sidebar">
                <div style={{ padding: '8px 12px 5px', borderBottom: '1px solid var(--surface-border)' }}>
                  <span style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-disabled)' }}>
                    Recent
                  </span>
                </div>
                {generationHistory.length === 0 ? (
                  <div style={{ padding: '18px 12px', textAlign: 'center', color: 'var(--text-disabled)', fontSize: '0.72rem' }}>
                    <div style={{ fontSize: '1.4rem', marginBottom: 6, opacity: 0.3 }}>◌</div>
                    No generations yet
                  </div>
                ) : generationHistory.map((h) => {
                  const ct = COMPONENT_TYPES.find((c) => c.id === h.componentType);
                  return (
                    <button key={h.id} onClick={() => { setResult(h.result); setVersionHistory([]); setCurrentVersion(0); setOutputTab('preview'); }} style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '7px 12px', background: 'transparent', border: 'none', borderBottom: '1px solid var(--surface-border)', cursor: 'pointer', textAlign: 'left' }} onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-overlay)')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontSize: '0.82rem' }}>{ct?.icon}</span>
                        <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{ct?.label}</span>
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-disabled)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 165 }}>{h.prompt.slice(0, 55)}</div>
                      <div style={{ fontSize: '0.6rem', color: 'var(--text-faint)' }}>{new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* ── Form column (col 2) ───────────────────────────────────── */}
            <div className="studio-sidebar" style={{ width: 355, minWidth: 295, maxWidth: 395, flexShrink: 0 }}>
              {/* Header + library mode toggle */}
              <div style={{ padding: '8px 14px 7px', borderBottom: '1px solid var(--surface-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>Configure</span>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <span style={{ fontSize: '0.65rem', color: libraryMode ? 'var(--accent)' : 'var(--text-muted)' }}>Library Mode</span>
                  <div onClick={() => setLibraryMode((v) => !v)} style={{ width: 30, height: 16, borderRadius: 8, cursor: 'pointer', position: 'relative', background: libraryMode ? 'var(--accent-dim)' : 'var(--surface-overlay)', border: `1px solid ${libraryMode ? 'var(--accent-muted)' : 'var(--surface-border)'}`, transition: 'background 0.2s' }}>
                    <div style={{ position: 'absolute', top: 2, left: libraryMode ? 13 : 2, width: 10, height: 10, borderRadius: '50%', background: libraryMode ? 'var(--accent)' : 'var(--text-disabled)', transition: 'left 0.15s' }} />
                  </div>
                </label>
              </div>

              <div style={{ flex: 1, overflowY: 'auto' }}>

                {/* Library checklist */}
                {libraryMode && (
                  <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--surface-border)' }}>
                    <div style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 6 }}>Select Components (2–6)</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                      {COMPONENT_TYPES.filter((c) => c.id !== 'custom').map((ct) => {
                        const checked = selectedLibraryTypes.includes(ct.id);
                        const disabled = !checked && selectedLibraryTypes.length >= 6;
                        return (
                          <label key={ct.id} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 7px', borderRadius: 5, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.35 : 1, background: checked ? 'var(--accent-dim)' : 'var(--surface-overlay)', border: `1px solid ${checked ? 'var(--accent-muted)' : 'var(--surface-border)'}` }}>
                            <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => { if (e.target.checked) setSelectedLibraryTypes((p) => [...p, ct.id]); else setSelectedLibraryTypes((p) => p.filter((x) => x !== ct.id)); }} style={{ accentColor: 'var(--accent)', width: 11, height: 11 }} />
                            <span style={{ fontSize: '0.68rem', color: checked ? 'var(--accent)' : 'var(--text-secondary)' }}>{ct.icon} {ct.label}</span>
                          </label>
                        );
                      })}
                    </div>
                    <div style={{ fontSize: '0.62rem', color: 'var(--text-disabled)', marginTop: 4 }}>{selectedLibraryTypes.length}/6 selected</div>
                  </div>
                )}

                {/* Component selector */}
                {!libraryMode && (
                  <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--surface-border)' }}>
                    <div style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 5 }}>Component</div>
                    <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginBottom: 5 }}>
                      {COMPONENT_CATEGORIES.map((cat) => (
                        <button key={cat} onClick={() => setCategoryFilter(cat)} style={{ padding: '2px 7px', borderRadius: 4, fontSize: '0.62rem', cursor: 'pointer', border: `1px solid ${categoryFilter === cat ? 'var(--accent-muted)' : 'transparent'}`, background: categoryFilter === cat ? 'var(--accent-dim)' : 'transparent', color: categoryFilter === cat ? 'var(--accent)' : 'var(--text-muted)' }}>
                          {cat}
                        </button>
                      ))}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                      {COMPONENT_TYPES.filter((c) => c.category === categoryFilter).map((ct) => (
                        <button key={ct.id} onClick={() => setComponentType(ct.id)} className="uiux-type-btn" style={{ background: componentType === ct.id ? 'var(--accent-dim)' : 'var(--surface-raised)', border: `1px solid ${componentType === ct.id ? 'var(--accent-muted)' : 'var(--surface-border)'}`, color: componentType === ct.id ? 'var(--accent)' : 'var(--text-secondary)' }}>
                          <span style={{ fontSize: '0.85rem' }}>{ct.icon}</span>
                          <span style={{ fontSize: '0.7rem' }}>{ct.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Framework */}
                <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--surface-border)' }}>
                  <div style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 5 }}>Framework</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {FRAMEWORKS.map((fw) => (
                      <button key={fw.id} onClick={() => setFramework(fw.id)} className="uiux-fw-btn" style={{ background: framework === fw.id ? 'var(--accent-dim)' : 'var(--surface-raised)', border: `1px solid ${framework === fw.id ? 'var(--accent-muted)' : 'var(--surface-border)'}` }}>
                        <span className="uiux-fw-label" style={{ color: framework === fw.id ? 'var(--accent)' : 'var(--text-secondary)' }}>{fw.label}</span>
                        <span className="uiux-fw-desc">{fw.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Style preset */}
                <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--surface-border)' }}>
                  <div style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 5 }}>Style</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                    {STYLE_PRESETS.map((sp) => (
                      <button key={sp.id} onClick={() => setStyle(sp.id)} className="uiux-style-btn" style={{ border: `1px solid ${style === sp.id ? 'var(--accent-muted)' : 'var(--surface-border)'}`, background: style === sp.id ? 'var(--accent-dim)' : 'var(--surface-raised)' }}>
                        <div className="uiux-style-swatches">{sp.colors.map((c, i) => <div key={i} className="uiux-style-swatch" style={{ background: c }} />)}</div>
                        <span className="uiux-style-name" style={{ color: style === sp.id ? 'var(--accent)' : 'var(--text-secondary)' }}>{sp.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Model selector */}
                <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--surface-border)' }}>
                  <div style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 5 }}>Model</div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {MODEL_OPTIONS.map((m) => (
                      <button key={m.id} onClick={() => setModelTier(m.id)} title={`${m.model} — ${m.speed}`} style={{ flex: 1, padding: '5px 4px', borderRadius: 6, cursor: 'pointer', textAlign: 'center', border: `1px solid ${modelTier === m.id ? 'var(--accent-muted)' : 'var(--surface-border)'}`, background: modelTier === m.id ? 'var(--accent-dim)' : 'var(--surface-raised)', transition: 'all 0.1s' }}>
                        <div style={{ fontSize: '0.88rem', lineHeight: 1, marginBottom: 2 }}>{m.badge}</div>
                        <div style={{ fontSize: '0.62rem', fontWeight: 600, color: modelTier === m.id ? 'var(--accent)' : 'var(--text-secondary)' }}>{m.label}</div>
                        <div style={{ fontSize: '0.55rem', color: 'var(--text-disabled)', marginTop: 1 }}>{m.speed}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Prompt */}
                <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--surface-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
                      {libraryMode ? 'Library prompt (optional)' : 'Describe what to build'}
                    </span>
                    {!libraryMode && EXAMPLE_PROMPTS[componentType] && (
                      <button onClick={handleUseExample} style={{ fontSize: '0.62rem', color: 'var(--accent)', background: 'transparent', border: 'none', cursor: 'pointer', padding: '1px 3px' }}>Use example ↗</button>
                    )}
                  </div>
                  <textarea id="uiux-prompt" className="studio-textarea" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={libraryMode ? 'Optional theme for all components…' : (EXAMPLE_PROMPTS[componentType] ?? 'Describe the component you want to generate…')} rows={5} maxLength={600} onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && !libraryMode) handleGenerate(); }} />
                  <div style={{ fontSize: '0.62rem', textAlign: 'right', marginTop: 3, color: prompt.length > 540 ? '#ef4444' : prompt.length > 480 ? '#f59e0b' : 'var(--text-disabled)' }}>{prompt.length}/600</div>
                </div>

                {/* Advanced */}
                <div style={{ padding: '5px 14px 8px', borderBottom: '1px solid var(--surface-border)' }}>
                  <button onClick={() => setShowAdvanced((v) => !v)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px 0', fontSize: '0.7rem' }}>
                    <span>Advanced</span>
                    <span style={{ fontSize: '0.62rem' }}>{showAdvanced ? '▲' : '▼'}</span>
                  </button>
                  {showAdvanced && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                      <div>
                        <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginBottom: 3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Color scheme</div>
                        <input type="text" className="studio-input" value={colorScheme} onChange={(e) => setColorScheme(e.target.value)} placeholder="e.g. indigo and slate" />
                      </div>
                      <div style={{ display: 'flex', gap: 14 }}>
                        {([['Dark mode', darkMode, setDarkMode], ['Responsive', responsive, setResponsive]] as [string, boolean, React.Dispatch<React.SetStateAction<boolean>>][]).map(([label, val, setter]) => (
                          <label key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
                            <input type="checkbox" checked={val} onChange={(e) => setter(e.target.checked)} style={{ accentColor: '#a855f7', width: 12, height: 12 }} />
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div style={{ padding: '8px 14px', borderTop: '1px solid var(--surface-border)', flexShrink: 0 }}>
                {error && <div className="uiux-error-msg">{error}</div>}
                {(isLoading || isRefining || isGeneratingLibrary) ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                        {isGeneratingLibrary ? `Generating ${COMPONENT_TYPES.find((c) => c.id === libraryCurrentType)?.label ?? '…'} (${libraryProcessed}/${selectedLibraryTypes.length})` : isRefining ? 'Refining…' : (loadingStage || 'Generating…')}
                      </span>
                      <span style={{ fontSize: '0.62rem', color: 'var(--text-disabled)', fontFamily: 'monospace' }}>{(elapsedMs / 1000).toFixed(1)}s</span>
                    </div>
                    {isGeneratingLibrary ? (
                      <div style={{ height: 4, background: 'var(--surface-overlay)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 2, background: 'linear-gradient(90deg,#a855f7,#ec4899)', width: `${(libraryProcessed / selectedLibraryTypes.length) * 100}%`, transition: 'width 0.4s' }} />
                      </div>
                    ) : (
                      <div style={{ height: 3, background: 'var(--surface-overlay)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: '40%', borderRadius: 2, background: 'linear-gradient(90deg,#a855f7,#ec4899)', animation: 'uiux-progress-slide 1.4s ease infinite' }} />
                      </div>
                    )}
                    <button onClick={handleCancel} style={{ padding: '6px', borderRadius: 6, border: '1px solid var(--surface-border)', background: 'var(--surface-raised)', color: 'var(--text-secondary)', fontSize: '0.75rem', cursor: 'pointer', width: '100%' }}>Cancel</button>
                  </div>
                ) : libraryMode ? (
                  <button onClick={handleGenerateLibrary} disabled={selectedLibraryTypes.length < 2} style={{ width: '100%', padding: '9px', borderRadius: 7, border: 'none', cursor: selectedLibraryTypes.length < 2 ? 'not-allowed' : 'pointer', background: 'linear-gradient(135deg,#a855f7,#ec4899)', color: '#fff', fontWeight: 700, fontSize: '0.83rem', opacity: selectedLibraryTypes.length < 2 ? 0.5 : 1 }}>
                    ✦ Generate Library ({selectedLibraryTypes.length})
                  </button>
                ) : (
                  <button onClick={handleGenerate} disabled={isLoading} style={{ width: '100%', padding: '9px', borderRadius: 7, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#a855f7,#ec4899)', color: '#fff', fontWeight: 700, fontSize: '0.83rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <span>✦ Generate {FRAMEWORKS.find((f) => f.id === framework)?.label ?? 'Code'}</span>
                    <span style={{ fontSize: '0.6rem', opacity: 0.7 }}>⌘↵</span>
                  </button>
                )}
                <div style={{ fontSize: '0.62rem', textAlign: 'center', color: 'var(--text-disabled)', marginTop: 5 }}>
                  <span style={{ color: '#10b981' }}>∞</span> Free code generation
                </div>
              </div>
            </div>

            {/* ── Output panel (col 3) ─────────────────────────────────── */}
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
              {/* Library results */}
              {libraryMode && (Object.keys(libraryResults).length > 0 || isGeneratingLibrary) ? (
                <UIUXLibraryResults
                  results={libraryResults}
                  queue={selectedLibraryTypes}
                  currentType={libraryCurrentType}
                  processed={libraryProcessed}
                  total={selectedLibraryTypes.length}
                  isGenerating={isGeneratingLibrary}
                  framework={framework}
                  onExportAll={() => {
                    Object.entries(libraryResults).forEach(([ct, res], i) => {
                      const fw = FRAMEWORKS.find((f) => f.id === res.framework);
                      setTimeout(() => triggerDownload(res.code, `wokgen-${ct}.${fw?.ext ?? 'html'}`), i * 200);
                    });
                  }}
                />
              ) : (
                <>
                  {/* Output toolbar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px', borderBottom: '1px solid var(--surface-border)', background: 'var(--surface-raised)', flexShrink: 0, flexWrap: 'wrap', minHeight: 42 }}>
                    {/* Tabs */}
                    <div style={{ display: 'flex', gap: 2 }}>
                      {(['preview', 'code', 'accessibility'] as OutputTab[]).map((tab) => {
                        const labels: Record<OutputTab, string> = { preview: '◈ Preview', code: '{ } Code', accessibility: '♿ A11y' };
                        return (
                          <button key={tab} onClick={() => setOutputTab(tab)} disabled={!currentResult} style={{ padding: '3px 9px', borderRadius: 5, border: `1px solid ${outputTab === tab ? 'var(--accent-muted)' : 'transparent'}`, background: outputTab === tab ? 'var(--accent-dim)' : 'transparent', color: outputTab === tab ? 'var(--accent)' : 'var(--text-muted)', fontSize: '0.72rem', cursor: currentResult ? 'pointer' : 'not-allowed', opacity: currentResult ? 1 : 0.4 }}>
                            {labels[tab]}
                          </button>
                        );
                      })}
                    </div>

                    {/* Viewport switcher */}
                    {outputTab === 'preview' && currentResult && (currentResult.framework === 'html-tailwind' || currentResult.framework === 'vanilla-css') && (
                      <div style={{ display: 'flex', gap: 2, marginLeft: 4, borderLeft: '1px solid var(--surface-border)', paddingLeft: 6 }}>
                        {VIEWPORT_OPTIONS.map((vp) => (
                          <button key={vp.id} onClick={() => setViewportMode(vp.id)} title={`${vp.label}${vp.width ? ` (${vp.width}px)` : ''}`} style={{ padding: '2px 7px', borderRadius: 4, fontSize: '0.68rem', cursor: 'pointer', border: `1px solid ${viewportMode === vp.id ? 'var(--accent-muted)' : 'var(--surface-border)'}`, background: viewportMode === vp.id ? 'var(--accent-dim)' : 'var(--surface-raised)', color: viewportMode === vp.id ? 'var(--accent)' : 'var(--text-muted)' }}>
                            {vp.icon}
                          </button>
                        ))}
                        <span style={{ fontSize: '0.6rem', color: 'var(--text-disabled)', alignSelf: 'center', marginLeft: 3 }}>{VIEWPORT_OPTIONS.find((v) => v.id === viewportMode)?.label}</span>
                      </div>
                    )}

                    {/* Version breadcrumb */}
                    {versionHistory.length > 1 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginLeft: 4, borderLeft: '1px solid var(--surface-border)', paddingLeft: 6 }}>
                        {versionHistory.map((_, idx) => (
                          <React.Fragment key={idx}>
                            {idx > 0 && <span style={{ color: 'var(--text-disabled)', fontSize: '0.6rem' }}>→</span>}
                            <button onClick={() => restoreVersion(idx)} title={idx === 0 ? 'Original' : `Refinement: ${versionHistory[idx].refinementPrompt}`} style={{ padding: '1px 6px', borderRadius: 4, fontSize: '0.62rem', cursor: 'pointer', border: `1px solid ${currentVersion === idx ? 'var(--accent-muted)' : 'var(--surface-border)'}`, background: currentVersion === idx ? 'var(--accent-dim)' : 'var(--surface-raised)', color: currentVersion === idx ? 'var(--accent)' : 'var(--text-muted)' }}>
                              v{idx + 1}
                            </button>
                          </React.Fragment>
                        ))}
                      </div>
                    )}

                    {/* Meta + duration */}
                    {currentResult && (
                      <div style={{ display: 'flex', gap: 3, alignItems: 'center', marginLeft: 4 }}>
                        <span style={{ fontSize: '0.65rem', padding: '1px 5px', borderRadius: 3, background: 'var(--surface-overlay)', color: 'var(--text-muted)', border: '1px solid var(--surface-border)' }}>{FRAMEWORKS.find((f) => f.id === currentResult.framework)?.label}</span>
                        <span style={{ fontSize: '0.65rem', padding: '1px 5px', borderRadius: 3, background: 'var(--surface-overlay)', color: 'var(--text-muted)', border: '1px solid var(--surface-border)' }}>{COMPONENT_TYPES.find((c) => c.id === currentResult.componentType)?.label}</span>
                        {currentResult.durationMs > 0 && <span style={{ fontSize: '0.6rem', color: 'var(--text-disabled)' }}>{(currentResult.durationMs / 1000).toFixed(1)}s</span>}
                      </div>
                    )}

                    <div style={{ flex: 1 }} />

                    {/* Actions */}
                    {currentResult && (
                      <div style={{ display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap' }}>
                        <button onClick={handleCopyCode} style={{ padding: '3px 7px', borderRadius: 4, background: copied ? 'rgba(34,197,94,0.1)' : 'var(--surface-raised)', color: copied ? '#22c55e' : 'var(--text-secondary)', fontSize: '0.7rem', cursor: 'pointer', border: copied ? '1px solid rgba(34,197,94,0.3)' : '1px solid var(--surface-border)' }}>
                          {copied ? '✓ Copied!' : '⎘ Copy'}
                        </button>
                        <button onClick={stableHandleDownload} style={{ padding: '3px 7px', borderRadius: 4, border: '1px solid var(--surface-border)', background: 'var(--surface-raised)', color: 'var(--text-secondary)', fontSize: '0.7rem', cursor: 'pointer' }}>↓ Download</button>
                        <button onClick={stableHandleZipExport} title="Export as ZIP (multi-file for React)" style={{ padding: '3px 7px', borderRadius: 4, border: '1px solid var(--surface-border)', background: 'var(--surface-raised)', color: 'var(--text-secondary)', fontSize: '0.7rem', cursor: 'pointer' }}>⊞ Export</button>
                        {session?.user && (
                          <>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 3, cursor: 'pointer' }}>
                              <input type="checkbox" checked={galleryIsPublic} onChange={(e) => setGalleryIsPublic(e.target.checked)} style={{ accentColor: '#a855f7', width: 10, height: 10 }} />
                              <span style={{ fontSize: '0.62rem', color: 'var(--text-disabled)' }}>public</span>
                            </label>
                            <button onClick={handleSaveToGallery} disabled={isSavingToGallery || gallerySaved} style={{ padding: '3px 7px', borderRadius: 4, fontSize: '0.7rem', cursor: isSavingToGallery || gallerySaved ? 'not-allowed' : 'pointer', border: `1px solid ${gallerySaved ? 'rgba(34,197,94,0.4)' : 'var(--surface-border)'}`, background: gallerySaved ? 'rgba(34,197,94,0.08)' : 'var(--surface-raised)', color: gallerySaved ? '#22c55e' : 'var(--text-secondary)' }}>
                              {gallerySaved ? '✓ Saved' : isSavingToGallery ? '…' : '⬆ Save'}
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Output content */}
                  <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
                    {!currentResult && !isLoading && !isRefining && <UIUXEmptyState onSelect={(ct) => { setComponentType(ct); setCategoryFilter(COMPONENT_TYPES.find((c) => c.id === ct)?.category ?? 'Sections'); }} />}
                    {(isLoading || isRefining) && (
                      <div className="uiux-loading-state">
                        <div className="uiux-loading-icon">✦</div>
                        <div className="uiux-loading-text">{loadingStage || (isRefining ? 'Refining…' : 'Generating…')}</div>
                        <div className="uiux-loading-sub">
                          {isRefining ? `Applying refinement to v${currentVersion + 1}…` : `Crafting ${COMPONENT_TYPES.find((c) => c.id === componentType)?.label ?? 'component'} in ${FRAMEWORKS.find((f) => f.id === framework)?.label}`}
                        </div>
                        <div style={{ color: 'var(--text-disabled)', fontSize: '0.68rem', fontFamily: 'monospace', marginTop: 6 }}>{(elapsedMs / 1000).toFixed(1)}s</div>
                      </div>
                    )}
                    {currentResult && !isLoading && !isRefining && outputTab === 'preview' && (
                      <UIUXPreview code={currentResult.code} isHTML={currentResult.framework === 'html-tailwind' || currentResult.framework === 'vanilla-css'} viewportMode={viewportMode} framework={currentResult.framework} />
                    )}
                    {currentResult && !isLoading && !isRefining && outputTab === 'code' && (
                      <UIUXCodePane code={currentResult.code} ext={FRAMEWORKS.find((f) => f.id === currentResult.framework)?.ext ?? 'html'} onCopy={handleCopyCode} copied={copied} />
                    )}
                    {currentResult && !isLoading && !isRefining && outputTab === 'accessibility' && (
                      <UIUXAccessibilityPanel hints={currentResult.accessibilityHints ?? []} />
                    )}
                  </div>

                  {/* Refinement bar */}
                  {currentResult && !isLoading && !isRefining && (
                    <div style={{ padding: '7px 10px', borderTop: '1px solid var(--surface-border)', background: 'var(--surface-raised)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', flexShrink: 0 }}>✦ Refine</span>
                      <input type="text" value={refinementPrompt} onChange={(e) => setRefinementPrompt(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleRefine(); }} placeholder="Describe what to change — e.g. 'make the CTA button larger', 'add a dark mode toggle'" style={{ flex: 1, padding: '5px 9px', borderRadius: 5, border: '1px solid var(--surface-border)', background: 'var(--surface-overlay)', color: 'var(--text-primary)', fontSize: '0.75rem', outline: 'none', fontFamily: 'inherit' }} />
                      <button onClick={handleRefine} disabled={!refinementPrompt.trim()} style={{ padding: '5px 11px', borderRadius: 5, border: 'none', cursor: refinementPrompt.trim() ? 'pointer' : 'not-allowed', background: refinementPrompt.trim() ? 'linear-gradient(135deg,#a855f7,#ec4899)' : 'var(--surface-overlay)', color: refinementPrompt.trim() ? '#fff' : 'var(--text-disabled)', fontSize: '0.72rem', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>
                        Refine →
                      </button>
                      {versionHistory.length > 0 && <span style={{ fontSize: '0.6rem', color: 'var(--text-disabled)', flexShrink: 0 }}>v{currentVersion + 1}/{versionHistory.length}</span>}
                    </div>
                  )}
                </>
              )}
            </main>
          </>
        )}
      </div>

      <style>{`
        @keyframes uiux-progress-slide {
          0%   { transform: translateX(-250%); }
          100% { transform: translateX(600%); }
        }
      `}</style>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Preview component
// ---------------------------------------------------------------------------

function UIUXPreview({
  code, isHTML, viewportMode, framework,
}: {
  code: string;
  isHTML: boolean;
  viewportMode: ViewportMode;
  framework: Framework;
}) {
  const [iframeKey, setIframeKey] = useState(0);
  useEffect(() => { setIframeKey((k) => k + 1); }, [code]);

  if (!isHTML) {
    const fwLabel = FRAMEWORKS.find((f) => f.id === framework)?.label ?? framework;
    return (
      <div className="uiux-preview-unavailable">
        <div style={{ fontSize: '1.5rem', marginBottom: 10, opacity: 0.4 }}>◈</div>
        <div style={{ color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 600 }}>Live preview unavailable for {fwLabel}</div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', maxWidth: 340, textAlign: 'center', lineHeight: 1.6 }}>
          Switch to the <strong style={{ color: 'var(--accent)' }}>Code</strong> tab to copy.
          {framework === 'vue3' && ' Paste into a .vue file in your Vue 3 project.'}
          {framework === 'svelte' && ' Paste into a .svelte file in your SvelteKit project.'}
        </div>
      </div>
    );
  }

  const vpWidth = VIEWPORT_OPTIONS.find((v) => v.id === viewportMode)?.width;

  return (
    <div className="uiux-preview-frame">
      <div className="uiux-preview-toolbar">
        <div className="uiux-browser-dots">
          <span style={{ background: '#ef4444' }} />
          <span style={{ background: '#f59e0b' }} />
          <span style={{ background: '#22c55e' }} />
        </div>
        <div className="uiux-browser-bar">
          {viewportMode !== 'desktop' && <span style={{ marginRight: 5 }}>{VIEWPORT_OPTIONS.find((v) => v.id === viewportMode)?.icon} {vpWidth}px</span>}
          localhost / preview
        </div>
        <button className="btn-ghost btn-xs" onClick={() => setIframeKey((k) => k + 1)} title="Reload preview">↺</button>
      </div>
      <div style={{ flex: 1, overflow: 'auto', background: vpWidth ? '#1a1a1a' : '#fff', display: 'flex', justifyContent: 'center', padding: vpWidth ? '12px 0' : 0 }}>
        <div style={{ width: vpWidth ?? '100%', height: vpWidth ? undefined : '100%', minHeight: vpWidth ? 600 : undefined, boxShadow: vpWidth ? '0 4px 24px rgba(0,0,0,0.5)' : 'none', borderRadius: vpWidth ? 8 : 0, overflow: 'hidden', flex: vpWidth ? undefined : 1 }}>
          <iframe key={iframeKey} srcDoc={code} title="Component preview" className="uiux-iframe" sandbox="allow-scripts allow-same-origin" style={{ border: 'none', width: '100%', height: vpWidth ? 600 : '100%', display: 'block', minHeight: vpWidth ? 600 : undefined }} />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Code pane
// ---------------------------------------------------------------------------

function UIUXCodePane({ code, ext, onCopy, copied }: { code: string; ext: string; onCopy: () => void; copied: boolean }) {
  const highlighted = highlightCode(code, ext);
  return (
    <div className="uiux-code-pane">
      <div className="uiux-code-header">
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>component.{ext}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '0.62rem', color: 'var(--text-disabled)' }}>{code.split('\n').length} lines · {(new Blob([code]).size / 1024).toFixed(1)} KB</span>
          <button className="btn-ghost btn-xs" onClick={onCopy}>{copied ? '✓ Copied!' : '⎘ Copy'}</button>
        </div>
      </div>
      <pre className="uiux-code-content" dangerouslySetInnerHTML={{ __html: highlighted }} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Accessibility panel
// ---------------------------------------------------------------------------

function UIUXAccessibilityPanel({ hints }: { hints: string[] }) {
  if (hints.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 10, padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem' }}>✅</div>
        <div style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No accessibility issues detected</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: 320, lineHeight: 1.6 }}>The component appears to follow accessibility best practices. Always test with a screen reader for full verification.</div>
      </div>
    );
  }
  return (
    <div style={{ padding: '14px 18px', overflowY: 'auto', height: '100%' }}>
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>Accessibility Review</div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{hints.length} hint{hints.length !== 1 ? 's' : ''} found</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {hints.map((hint, i) => {
          const isWarning = /warning|missing|lacks|no\s+alt|no\s+label/i.test(hint) || hint.includes('⚠');
          return (
            <div key={i} style={{ display: 'flex', gap: 9, padding: '9px 11px', borderRadius: 7, background: isWarning ? 'rgba(245,158,11,0.07)' : 'rgba(99,102,241,0.07)', border: `1px solid ${isWarning ? 'rgba(245,158,11,0.2)' : 'rgba(99,102,241,0.2)'}` }}>
              <span style={{ fontSize: '0.95rem', flexShrink: 0, marginTop: 1 }}>{isWarning ? '⚠️' : 'ℹ️'}</span>
              <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>{hint}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function UIUXEmptyState({ onSelect }: { onSelect: (ct: ComponentType) => void }) {
  const featured: ComponentType[] = ['hero', 'pricing', 'dashboard', 'auth', 'landing', 'navbar'];
  return (
    <div className="uiux-empty-state">
      <div className="uiux-empty-icon">✦</div>
      <h2 className="uiux-empty-title">WokGen UI/UX</h2>
      <p className="uiux-empty-desc">Generate production-ready front-end components from a prompt. Preview HTML instantly, copy React / Vue / Svelte for your project.</p>
      <div className="uiux-empty-chips">
        {featured.map((ct) => {
          const item = COMPONENT_TYPES.find((c) => c.id === ct);
          return (
            <button key={ct} className="uiux-empty-chip" onClick={() => onSelect(ct)}>{item?.icon} {item?.label}</button>
          );
        })}
      </div>
      <div style={{ marginTop: 18, fontSize: '0.7rem', color: 'var(--text-disabled)' }}>
        Press <kbd style={{ padding: '1px 5px', borderRadius: 3, border: '1px solid var(--surface-border)', background: 'var(--surface-overlay)', fontSize: '0.65rem' }}>⌘↵</kbd> to generate
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Library results panel
// ---------------------------------------------------------------------------

function UIUXLibraryResults({
  results, queue, currentType, processed, total, isGenerating, framework, onExportAll,
}: {
  results: Record<string, GenerationResult>;
  queue: ComponentType[];
  currentType: ComponentType | null;
  processed: number;
  total: number;
  isGenerating: boolean;
  framework: Framework;
  onExportAll: () => void;
}) {
  const [activeTabs, setActiveTabs] = useState<Record<string, 'preview' | 'code'>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyCode = (ct: string, code: string) => {
    navigator.clipboard.writeText(code).then(() => { setCopiedId(ct); setTimeout(() => setCopiedId(null), 2000); }).catch(() => {});
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '7px 12px', borderBottom: '1px solid var(--surface-border)', background: 'var(--surface-raised)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>Library — {processed}/{total}</span>
        <div style={{ flex: 1, height: 4, background: 'var(--surface-overlay)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 2, background: 'linear-gradient(90deg,#a855f7,#ec4899)', width: `${(processed / total) * 100}%`, transition: 'width 0.4s' }} />
        </div>
        {isGenerating && currentType && <span style={{ fontSize: '0.68rem', color: '#f472b6', whiteSpace: 'nowrap' }}>Generating {COMPONENT_TYPES.find((c) => c.id === currentType)?.label}…</span>}
        {!isGenerating && processed > 0 && (
          <button onClick={onExportAll} style={{ padding: '3px 10px', borderRadius: 5, border: '1px solid var(--accent-muted)', background: 'var(--accent-dim)', color: 'var(--accent)', fontSize: '0.7rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>⊞ Export All</button>
        )}
      </div>

      {/* Items */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {queue.map((ct) => {
          const res = results[ct];
          const ctInfo = COMPONENT_TYPES.find((c) => c.id === ct);
          const tab = activeTabs[ct] ?? 'preview';
          const isCurrentlyGenerating = isGenerating && currentType === ct;
          const isPending = isGenerating && !res && currentType !== ct;
          const ext = FRAMEWORKS.find((f) => f.id === framework)?.ext ?? 'html';
          const isPreviewable = res && (res.framework === 'html-tailwind' || res.framework === 'vanilla-css');

          return (
            <div key={ct} style={{ border: '1px solid var(--surface-border)', borderRadius: 9, overflow: 'hidden', background: 'var(--surface-raised)', opacity: isPending ? 0.45 : 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 10px', borderBottom: '1px solid var(--surface-border)', background: 'var(--surface-overlay)' }}>
                <span style={{ fontSize: '0.95rem' }}>{ctInfo?.icon}</span>
                <span style={{ fontWeight: 600, fontSize: '0.78rem', color: 'var(--text-primary)' }}>{ctInfo?.label}</span>
                {isCurrentlyGenerating && <span style={{ fontSize: '0.65rem', color: '#f472b6' }}>Generating…</span>}
                {isPending && <span style={{ fontSize: '0.65rem', color: 'var(--text-disabled)' }}>Queued</span>}
                {res && (
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 3 }}>
                    {isPreviewable && (
                      <button onClick={() => setActiveTabs((p) => ({ ...p, [ct]: 'preview' }))} style={{ padding: '2px 7px', borderRadius: 4, fontSize: '0.62rem', cursor: 'pointer', border: `1px solid ${tab === 'preview' ? 'var(--accent-muted)' : 'var(--surface-border)'}`, background: tab === 'preview' ? 'var(--accent-dim)' : 'transparent', color: tab === 'preview' ? 'var(--accent)' : 'var(--text-muted)' }}>◈</button>
                    )}
                    <button onClick={() => setActiveTabs((p) => ({ ...p, [ct]: 'code' }))} style={{ padding: '2px 7px', borderRadius: 4, fontSize: '0.62rem', cursor: 'pointer', border: `1px solid ${tab === 'code' ? 'var(--accent-muted)' : 'var(--surface-border)'}`, background: tab === 'code' ? 'var(--accent-dim)' : 'transparent', color: tab === 'code' ? 'var(--accent)' : 'var(--text-muted)' }}>{ '{ }' }</button>
                    <button onClick={() => copyCode(ct, res.code)} style={{ padding: '2px 7px', borderRadius: 4, fontSize: '0.62rem', cursor: 'pointer', border: '1px solid var(--surface-border)', background: 'transparent', color: copiedId === ct ? '#22c55e' : 'var(--text-muted)' }}>{copiedId === ct ? '✓' : '⎘'}</button>
                    <button onClick={() => triggerDownload(res.code, `wokgen-${ct}.${ext}`)} style={{ padding: '2px 7px', borderRadius: 4, fontSize: '0.62rem', cursor: 'pointer', border: '1px solid var(--surface-border)', background: 'transparent', color: 'var(--text-muted)' }}>↓</button>
                  </div>
                )}
              </div>
              {res && (
                <div style={{ height: 260 }}>
                  {tab === 'preview' && isPreviewable ? (
                    <LibraryPreviewFrame code={res.code} />
                  ) : (
                    <UIUXCodePane code={res.code} ext={ext} onCopy={() => copyCode(ct, res.code)} copied={copiedId === ct} />
                  )}
                </div>
              )}
              {res && <LibraryRefineBar componentType={ct} result={res} framework={framework} stylePreset={res.style} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LibraryPreviewFrame({ code }: { code: string }) {
  const [key, setKey] = useState(0);
  useEffect(() => setKey((k) => k + 1), [code]);
  return <iframe key={key} srcDoc={code} title="Preview" sandbox="allow-scripts allow-same-origin" style={{ width: '100%', height: '100%', border: 'none', background: '#fff', display: 'block' }} />;
}

function LibraryRefineBar({
  componentType, result, framework, stylePreset,
}: {
  componentType: ComponentType;
  result: GenerationResult;
  framework: Framework;
  stylePreset: StylePreset;
}) {
  const [refPrompt, setRefPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRefine = async () => {
    if (!refPrompt.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/uiux/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: `Refinement: ${refPrompt}`, componentType, framework, style: stylePreset, prevCode: result.code }) });
      if (res.ok) setRefPrompt('');
    } finally { setIsLoading(false); }
  };

  return (
    <div style={{ display: 'flex', gap: 5, padding: '5px 9px', borderTop: '1px solid var(--surface-border)', background: 'var(--surface-overlay)' }}>
      <input type="text" value={refPrompt} onChange={(e) => setRefPrompt(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleRefine(); }} placeholder="Refine this component…" disabled={isLoading} style={{ flex: 1, padding: '3px 7px', borderRadius: 4, border: '1px solid var(--surface-border)', background: 'var(--bg)', color: 'var(--text-primary)', fontSize: '0.7rem', outline: 'none', fontFamily: 'inherit' }} />
      <button onClick={handleRefine} disabled={isLoading || !refPrompt.trim()} style={{ padding: '3px 9px', borderRadius: 4, border: 'none', background: refPrompt.trim() ? 'linear-gradient(135deg,#a855f7,#ec4899)' : 'var(--surface-border)', color: refPrompt.trim() ? '#fff' : 'var(--text-disabled)', fontSize: '0.68rem', cursor: refPrompt.trim() ? 'pointer' : 'not-allowed' }}>
        {isLoading ? '…' : '→'}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page builder
// ---------------------------------------------------------------------------

function UIUXPageBuilder({
  order, items, framework, onMove, onRemove, onAssemble,
}: {
  order: string[];
  items: Map<string, { componentType: ComponentType; result: GenerationResult }>;
  framework: Framework;
  onMove: (id: string, dir: 'up' | 'down') => void;
  onRemove: (id: string) => void;
  onAssemble: () => void;
}) {
  if (order.length === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '2rem', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '2.5rem', opacity: 0.2 }}>⊞</div>
        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Page Builder is empty</div>
        <div style={{ fontSize: '0.78rem', textAlign: 'center', maxWidth: 360, lineHeight: 1.65 }}>Generate components in the Studio tab — they appear here automatically. Then assemble them into a complete page.</div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '9px 14px', borderBottom: '1px solid var(--surface-border)', background: 'var(--surface-raised)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>⊞ Page Builder — {order.length} component{order.length !== 1 ? 's' : ''}</span>
        <div style={{ flex: 1 }} />
        <button onClick={onAssemble} style={{ padding: '5px 13px', borderRadius: 6, border: 'none', background: 'linear-gradient(135deg,#a855f7,#ec4899)', color: '#fff', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}>⬡ Assemble Page →</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 7 }}>
        {order.map((id, idx) => {
          const item = items.get(id);
          if (!item) return null;
          const ctInfo = COMPONENT_TYPES.find((c) => c.id === item.componentType);
          const fw = FRAMEWORKS.find((f) => f.id === item.result.framework);
          return (
            <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 11px', borderRadius: 7, border: '1px solid var(--surface-border)', background: 'var(--surface-raised)' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-disabled)', fontFamily: 'monospace', width: 18, textAlign: 'right', flexShrink: 0 }}>{idx + 1}</span>
              <span style={{ fontSize: '0.95rem', flexShrink: 0 }}>{ctInfo?.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.78rem', color: 'var(--text-primary)' }}>{ctInfo?.label}</div>
                <div style={{ fontSize: '0.62rem', color: 'var(--text-disabled)' }}>{fw?.label} · {item.result.code.split('\n').length} lines</div>
              </div>
              <div style={{ display: 'flex', gap: 3 }}>
                <button onClick={() => onMove(id, 'up')} disabled={idx === 0} style={{ padding: '3px 6px', borderRadius: 4, border: '1px solid var(--surface-border)', background: 'transparent', color: idx === 0 ? 'var(--text-disabled)' : 'var(--text-muted)', cursor: idx === 0 ? 'not-allowed' : 'pointer', fontSize: '0.78rem' }}>↑</button>
                <button onClick={() => onMove(id, 'down')} disabled={idx === order.length - 1} style={{ padding: '3px 6px', borderRadius: 4, border: '1px solid var(--surface-border)', background: 'transparent', color: idx === order.length - 1 ? 'var(--text-disabled)' : 'var(--text-muted)', cursor: idx === order.length - 1 ? 'not-allowed' : 'pointer', fontSize: '0.78rem' }}>↓</button>
                <button onClick={() => onRemove(id)} style={{ padding: '3px 6px', borderRadius: 4, border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.06)', color: '#ef4444', cursor: 'pointer', fontSize: '0.78rem' }}>✕</button>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ padding: '8px 14px', borderTop: '1px solid var(--surface-border)', background: 'var(--surface-raised)', flexShrink: 0 }}>
        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
          Assembles components in order into one {framework === 'react-tsx' || framework === 'next-tsx' ? 'React page (AssembledPage.tsx) with import stubs' : 'HTML file (assembled-page.html)'}. HTML components are stitched by extracting each &lt;body&gt; section.
        </div>
      </div>
    </div>
  );
}

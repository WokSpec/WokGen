'use client';




import React, {
  useState, useRef, useCallback, useEffect, useMemo,
} from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { QuotaBadge } from '@/components/quota-badge';

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

const COMPONENT_TYPES: { id: ComponentType; label: string; icon?: string; category: string }[] = [
  { id: 'hero',         label: 'Hero Section',   category: 'Sections'   },
  { id: 'features',     label: 'Features',        category: 'Sections'   },
  { id: 'pricing',      label: 'Pricing',         category: 'Sections'   },
  { id: 'testimonials', label: 'Testimonials',    category: 'Sections'   },
  { id: 'faq',          label: 'FAQ',             category: 'Sections'   },
  { id: 'cta',          label: 'CTA',             category: 'Sections'   },
  { id: 'footer',       label: 'Footer',          category: 'Sections'   },
  { id: 'navbar',       label: 'Navbar',           category: 'Navigation' },
  { id: 'sidebar',      label: 'Sidebar',         category: 'Navigation' },
  { id: 'card',         label: 'Card',            category: 'Components' },
  { id: 'form',         label: 'Form',            category: 'Components' },
  { id: 'modal',        label: 'Modal',           category: 'Components' },
  { id: 'table',        label: 'Data Table',      category: 'Components' },
  { id: 'dashboard',    label: 'Dashboard',       category: 'Pages'      },
  { id: 'landing',      label: 'Landing Page',    category: 'Pages'      },
  { id: 'auth',         label: 'Auth Page',       category: 'Pages'      },
  { id: 'settings',     label: 'Settings Page',   category: 'Pages'      },
  { id: 'custom',       label: 'Custom',          category: 'Advanced'   },
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
  { id: 'glassmorphism',  label: 'Glassmorphism',   colors: ['#667eea', '#764ba2', 'var(--border)'], desc: 'Frosted glass effect' },
  { id: 'brutalist',      label: 'Brutalist',       colors: ['#000000', '#ffffff', '#ff0000'], desc: 'Raw, bold, no-nonsense'      },
];

const MODEL_OPTIONS: { id: ModelTier; label: string; model: string; badge?: string; speed: string }[] = [
  { id: 'fast',    label: 'Eral Fast',    model: 'Groq Llama 3.3 70B', speed: 'fastest'      },
  { id: 'quality', label: 'Eral Quality', model: 'DeepSeek V3',         badge: '', speed: 'best quality' },
  { id: 'smart',   label: 'Eral Smart',   model: 'Llama 3.1 70B',       badge: '◎', speed: 'balanced'     },
];

const VIEWPORT_OPTIONS: { id: ViewportMode; icon?: string; label: string; width: number | undefined }[] = [
  { id: 'mobile',  label: 'Mobile',  width: 375  },
  { id: 'tablet',  label: 'Tablet',  width: 768  },
  { id: 'desktop',  label: 'Desktop', width: undefined },
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
      <div className="app-topbar">
        <span className="app-topbar__title">WokGen UI/UX</span>
        <div className="app-topbar__divider" />
        {/* Studio / Page Builder tabs */}
        <div className="app-topbar__tabs">
          {([['studio', '◈ Studio'], ['page-builder', '⊞ Page Builder']] as [StudioTab, string][]).map(([tab, label]) => (
            <button type="button" key={tab} onClick={() => setStudioTab(tab)}
              className={`app-topbar__tab${studioTab === tab ? ' active' : ''}`}>
              {label}
            </button>
          ))}
        </div>
        <div className="sidebar-spacer" />
        <QuotaBadge />
        <button type="button" onClick={() => setHistorySidebarOpen((v) => !v)}
          className="btn btn-secondary btn-sm">
          {historySidebarOpen ? '⊟ History' : '⊞ History'}
        </button>
        <Link href="/" className="app-topbar__back-link">← Platform</Link>
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
                <div className="uiux-history-section-head">
                  <span className="uiux-history-section-label">Recent</span>
                </div>
                {generationHistory.length === 0 ? (
                  <div className="uiux-history-empty">
                    <div className="uiux-history-empty-icon">◌</div>
                    No generations yet
                  </div>
                ) : generationHistory.map((h) => {
                  const ct = COMPONENT_TYPES.find((c) => c.id === h.componentType);
                  return (
                    <button type="button" key={h.id}
                      className="uiux-history-item"
                      onClick={() => { setResult(h.result); setVersionHistory([]); setCurrentVersion(0); setOutputTab('preview'); }}
                    >
                      <div className="uiux-history-item__meta">
                        <span className="uiux-history-item__icon">{ct?.icon}</span>
                        <span className="uiux-history-item__type">{ct?.label}</span>
                      </div>
                      <div className="uiux-history-item__prompt">{h.prompt.slice(0, 55)}</div>
                      <div className="uiux-history-item__time">{new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* ── Form column (col 2) ───────────────────────────────────── */}
            <div className="studio-sidebar uiux-sidebar">
              {/* Header + library mode toggle */}
              <div className="uiux-config-header">
                <span className="uiux-config-header__title">Configure</span>
                <label className="uiux-toggle-label">
                  <span className={`${libraryMode ? 'active' : ''}`}>Library Mode</span>
                  <div onClick={() => setLibraryMode((v) => !v)} className={`uiux-toggle-track${libraryMode ? ' active' : ''}`}>
                    <div className={`uiux-toggle-knob${libraryMode ? ' active' : ''}`} />
                  </div>
                </label>
              </div>

              <div className="uiux-sidebar-scroll">

                {/* Library checklist */}
                {libraryMode && (
                  <div className="uiux-config-section">
                    <span className="uiux-config-section-label">Select Components (2–6)</span>
                    <div className="uiux-config-grid-2">
                      {COMPONENT_TYPES.filter((c) => c.id !== 'custom').map((ct) => {
                        const checked = selectedLibraryTypes.includes(ct.id);
                        const disabled = !checked && selectedLibraryTypes.length >= 6;
                        return (
                          <label key={ct.id} className={`uiux-config-type-btn${checked ? ' active' : ''}`} style={{ opacity: disabled ? 0.35 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}>
                            <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => { if (e.target.checked) setSelectedLibraryTypes((p) => [...p, ct.id]); else setSelectedLibraryTypes((p) => p.filter((x) => x !== ct.id)); }} className="uiux-checkbox" />
                            <span>{ct.icon} {ct.label}</span>
                          </label>
                        );
                      })}
                    </div>
                    <div className="uiux-config-count">{selectedLibraryTypes.length}/6 selected</div>
                  </div>
                )}

                {/* Component selector */}
                {!libraryMode && (
                  <div className="uiux-config-section">
                    <span className="uiux-config-section-label">Component</span>
                    <div className="uiux-config-filter-row">
                      {COMPONENT_CATEGORIES.map((cat) => (
                        <button type="button" key={cat}
                          className={`uiux-config-filter-btn${categoryFilter === cat ? ' active' : ''}`}
                          onClick={() => setCategoryFilter(cat)}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                    <div className="uiux-config-grid-2">
                      {COMPONENT_TYPES.filter((c) => c.category === categoryFilter).map((ct) => (
                        <button type="button" key={ct.id}
                          className={`uiux-type-btn${componentType === ct.id ? ' active' : ''}`}
                          onClick={() => setComponentType(ct.id)}
                        >
                          <span className="uiux-config-type-icon">{ct.icon}</span>
                          <span className="uiux-config-type-label">{ct.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Framework */}
                <div className="uiux-config-section">
                  <span className="uiux-config-section-label">Framework</span>
                  <div className="uiux-fw-list">
                    {FRAMEWORKS.map((fw) => (
                      <button type="button" key={fw.id} onClick={() => setFramework(fw.id)} className={`uiux-fw-btn${framework === fw.id ? ' active' : ''}`}>
                        <span className={`uiux-fw-label${framework === fw.id ? ' active' : ''}`}>{fw.label}</span>
                        <span className="uiux-fw-desc">{fw.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Style preset */}
                <div className="uiux-config-section">
                  <span className="uiux-config-section-label">Style</span>
                  <div className="uiux-config-grid-2">
                    {STYLE_PRESETS.map((sp) => (
                      <button type="button" key={sp.id} onClick={() => setStyle(sp.id)} className={`uiux-style-btn${style === sp.id ? ' active' : ''}`}>
                        <div className="uiux-style-swatches">{sp.colors.map((c, i) => <div key={i} className="uiux-style-swatch" style={{ background: c }} />)}</div>
                        <span className={`uiux-style-name${style === sp.id ? ' active' : ''}`}>{sp.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Model selector */}
                <div className="uiux-config-section">
                  <span className="uiux-config-section-label">Model</span>
                  <div className="uiux-model-grid">
                    {MODEL_OPTIONS.map((m) => (
                      <button type="button" key={m.id} onClick={() => setModelTier(m.id)} title={`${m.model} — ${m.speed}`} className={`uiux-model-btn${modelTier === m.id ? ' active' : ''}`}>
                        <div className="uiux-model-badge">{m.badge}</div>
                        <div className="uiux-model-name">{m.label}</div>
                        <div className="uiux-model-speed">{m.speed}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Prompt */}
                <div className="uiux-prompt-section">
                  <div className="uiux-prompt-header">
                    <span className="uiux-prompt-header-label">
                      {libraryMode ? 'Library prompt (optional)' : 'Describe what to build'}
                    </span>
                    {!libraryMode && EXAMPLE_PROMPTS[componentType] && (
                      <button type="button" onClick={handleUseExample} className="uiux-prompt-example-btn">Use example ↗</button>
                    )}
                  </div>
                  <textarea id="uiux-prompt" className="studio-textarea" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={libraryMode ? 'Optional theme for all components…' : (EXAMPLE_PROMPTS[componentType] ?? 'Describe the component you want to generate…')} rows={5} maxLength={600} onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && !libraryMode) handleGenerate(); }} />
                  <div className={`uiux-prompt-char-count${prompt.length > 540 ? ' error' : prompt.length > 480 ? ' warn' : ''}`}>{prompt.length}/600</div>
                </div>

                {/* Advanced */}
                <div className="uiux-config-section uiux-config-section--py">
                  <button type="button" onClick={() => setShowAdvanced((v) => !v)} className="uiux-advanced-toggle">
                    <span>Advanced</span>
                    <span className="uiux-advanced-toggle-icon">{showAdvanced ? '▲' : '▼'}</span>
                  </button>
                  {showAdvanced && (
                    <div className="uiux-advanced-content">
                      <div>
                        <div className="uiux-advanced-sublabel">Color scheme</div>
                        <input type="text" className="studio-input" value={colorScheme} onChange={(e) => setColorScheme(e.target.value)} placeholder="e.g. indigo and slate" />
                      </div>
                      <div className="uiux-advanced-checkrow">
                        {([['Dark mode', darkMode, setDarkMode], ['Responsive', responsive, setResponsive]] as [string, boolean, React.Dispatch<React.SetStateAction<boolean>>][]).map(([label, val, setter]) => (
                          <label key={label} className="uiux-advanced-check-label">
                            <input type="checkbox" checked={val} onChange={(e) => setter(e.target.checked)} className="uiux-checkbox-sm" />
                            <span >{label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="uiux-gen-footer">
                {error && <div className="uiux-error-msg">{error}</div>}
                {(isLoading || isRefining || isGeneratingLibrary) ? (
                  <div className="uiux-gen-progress">
                    <div className="uiux-gen-progress-row">
                      <span className="uiux-cfg-hint">
                        {isGeneratingLibrary ? `Generating ${COMPONENT_TYPES.find((c) => c.id === libraryCurrentType)?.label ?? '…'} (${libraryProcessed}/${selectedLibraryTypes.length})` : isRefining ? 'Refining…' : (loadingStage || 'Generating…')}
                      </span>
                      <span className="uiux-gen-progress-elapsed">{(elapsedMs / 1000).toFixed(1)}s</span>
                    </div>
                    {isGeneratingLibrary ? (
                      <div className="uiux-gen-progress-bar uiux-gen-progress-bar--determined">
                        <div className="uiux-gen-progress-fill" style={{ width: `${(libraryProcessed / selectedLibraryTypes.length) * 100}%` }} />
                      </div>
                    ) : (
                      <div className="uiux-gen-progress-bar uiux-gen-progress-bar--indeterminate">
                        <div className="uiux-gen-progress-fill" />
                      </div>
                    )}
                    <button type="button" onClick={handleCancel} className="uiux-cancel-btn">Cancel</button>
                  </div>
                ) : libraryMode ? (
                  <button type="button" onClick={handleGenerateLibrary} disabled={selectedLibraryTypes.length < 2} className="btn btn-generate">
                    ✦ Generate Library ({selectedLibraryTypes.length})
                  </button>
                ) : (
                  <button type="button" onClick={handleGenerate} disabled={isLoading} className="btn btn-generate">
                    <span>Generate {FRAMEWORKS.find((f) => f.id === framework)?.label ?? 'Code'}</span>
                    <span className="uiux-gen-shortcut">⌘↵</span>
                  </button>
                )}
                <div className="uiux-free-badge">
                  <span className="text-success">∞</span> Free code generation
                </div>
              </div>
            </div>

            {/* ── Output panel (col 3) ─────────────────────────────────── */}
            <main className="uiux-output-col">
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
                  <div className="uiux-output-toolbar">
                    {/* Tabs */}
                    <div className="uiux-tab-btns-row">
                      {(['preview', 'code', 'accessibility'] as OutputTab[]).map((tab) => {
                        const labels: Record<OutputTab, string> = { preview: 'Preview', code: '{ } Code', accessibility: 'A11y' };
                        return (
                          <button type="button" key={tab} onClick={() => setOutputTab(tab)} disabled={!currentResult}
                            className={`uiux-output-tab${outputTab === tab ? ' active' : ''}`}>
                            {labels[tab]}
                          </button>
                        );
                      })}
                    </div>

                    {/* Viewport switcher */}
                    {outputTab === 'preview' && currentResult && (currentResult.framework === 'html-tailwind' || currentResult.framework === 'vanilla-css') && (
                      <div className="uiux-viewport-group">
                        {VIEWPORT_OPTIONS.map((vp) => (
                          <button type="button" key={vp.id} onClick={() => setViewportMode(vp.id)} title={`${vp.label}${vp.width ? ` (${vp.width}px)` : ''}`}
                            className={`uiux-viewport-btn${viewportMode === vp.id ? ' active' : ''}`}>
                            {vp.icon}
                          </button>
                        ))}
                        <span className="uiux-viewport-label">{VIEWPORT_OPTIONS.find((v) => v.id === viewportMode)?.label}</span>
                      </div>
                    )}

                    {/* Version breadcrumb */}
                    {versionHistory.length > 1 && (
                      <div className="uiux-version-group">
                        {versionHistory.map((_, idx) => (
                          <React.Fragment key={idx}>
                            {idx > 0 && <span className="uiux-version-sep">→</span>}
                            <button type="button" onClick={() => restoreVersion(idx)} title={idx === 0 ? 'Original' : `Refinement: ${versionHistory[idx].refinementPrompt}`}
                              className={`uiux-version-btn${currentVersion === idx ? ' active' : ''}`}>
                              v{idx + 1}
                            </button>
                          </React.Fragment>
                        ))}
                      </div>
                    )}

                    {/* Meta + duration */}
                    {currentResult && (
                      <div className="uiux-meta-row">
                        <span className="uiux-meta-tag">{FRAMEWORKS.find((f) => f.id === currentResult.framework)?.label}</span>
                        <span className="uiux-meta-tag">{COMPONENT_TYPES.find((c) => c.id === currentResult.componentType)?.label}</span>
                        {currentResult.durationMs > 0 && <span className="uiux-meta-duration">{(currentResult.durationMs / 1000).toFixed(1)}s</span>}
                      </div>
                    )}

                    <div className="sidebar-spacer" />

                    {/* Actions */}
                    {currentResult && (
                      <div className="uiux-actions-row">
                        <button type="button" onClick={handleCopyCode} className={`uiux-action-btn${copied ? ' uiux-action-btn--copied' : ''}`}>
                          {copied ? 'Copied!' : 'Copy'}
                        </button>
                        <button type="button" onClick={stableHandleDownload} className="uiux-action-btn">↓ Download</button>
                        <button type="button" onClick={stableHandleZipExport} title="Export as ZIP (multi-file for React)" className="uiux-action-btn">⊞ Export</button>
                        {session?.user && (
                          <>
                            <label className="uiux-gallery-label">
                              <input type="checkbox" checked={galleryIsPublic} onChange={(e) => setGalleryIsPublic(e.target.checked)} className="uiux-checkbox-sm" />
                              <span>public</span>
                            </label>
                            <button type="button" onClick={handleSaveToGallery} disabled={isSavingToGallery || gallerySaved}
                              className={`uiux-action-btn${gallerySaved ? ' uiux-action-btn--saved' : ''}`}>
                              {gallerySaved ? 'Saved' : isSavingToGallery ? '…' : 'Save'}
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Output content */}
                  <div className="uiux-output-frame">
                    {!currentResult && !isLoading && !isRefining && <UIUXEmptyState onSelect={(ct) => { setComponentType(ct); setCategoryFilter(COMPONENT_TYPES.find((c) => c.id === ct)?.category ?? 'Sections'); }} />}
                    {(isLoading || isRefining) && (
                      <div className="uiux-loading-state">
                        <div className="uiux-loading-icon"></div>
                        <div className="uiux-loading-text">{loadingStage || (isRefining ? 'Refining…' : 'Generating…')}</div>
                        <div className="uiux-loading-sub">
                          {isRefining ? `Applying refinement to v${currentVersion + 1}…` : `Crafting ${COMPONENT_TYPES.find((c) => c.id === componentType)?.label ?? 'component'} in ${FRAMEWORKS.find((f) => f.id === framework)?.label}`}
                        </div>
                        <div className="uiux-elapsed-badge">{(elapsedMs / 1000).toFixed(1)}s</div>
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
                    <div className="uiux-refine-bar uiux-refine-bar--single">
                      <span className="uiux-refine-label">✦ Refine</span>
                      <input type="text" value={refinementPrompt} onChange={(e) => setRefinementPrompt(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleRefine(); }} placeholder="Describe what to change — e.g. 'make the CTA button larger', 'add a dark mode toggle'" className="uiux-refine-input uiux-refine-input--lg" />
                      <button type="button" onClick={handleRefine} disabled={!refinementPrompt.trim()} className="uiux-refine-btn uiux-refine-btn--lg">
                        Refine →
                      </button>
                      {versionHistory.length > 0 && <span className="uiux-version-badge">v{currentVersion + 1}/{versionHistory.length}</span>}
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
        <div className="uiux-preview-unavail-icon">◈</div>
        <div className="uiux-preview-unavail-title">Live preview unavailable for {fwLabel}</div>
        <div className="uiux-preview-unavail-desc">
          Switch to the <strong className="uiux-preview-accent">Code</strong> tab to copy.
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
          <span className="uiux-browser-dot--red" />
          <span className="uiux-browser-dot--yellow" />
          <span className="uiux-browser-dot--green" />
        </div>
        <div className="uiux-browser-bar">
          {viewportMode !== 'desktop' && <span className="uiux-viewport-px-info">{VIEWPORT_OPTIONS.find((v) => v.id === viewportMode)?.icon} {vpWidth}px</span>}
          localhost / preview
        </div>
        <button type="button" className="btn-ghost btn-xs" onClick={() => setIframeKey((k) => k + 1)} title="Reload preview">↺</button>
      </div>
      <div style={{ flex: 1, overflow: 'auto', background: vpWidth ? '#1a1a1a' : '#fff', display: 'flex', justifyContent: 'center', padding: vpWidth ? '12px 0' : 0 }}>
        <div style={{ width: vpWidth ?? '100%', height: vpWidth ? undefined : '100%', minHeight: vpWidth ? 600 : undefined, boxShadow: vpWidth ? '0 4px 24px var(--overlay-50)' : 'none', borderRadius: vpWidth ? 8 : 0, overflow: 'hidden', flex: vpWidth ? undefined : 1 }}>
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
        <span className="uiux-code-filename">component.{ext}</span>
        <div className="uiux-code-header-actions">
          <span className="uiux-code-stats">{code.split('\n').length} lines · {(new Blob([code]).size / 1024).toFixed(1)} KB</span>
          <button type="button" className="btn-ghost btn-xs" onClick={onCopy}>{copied ? 'Copied!' : 'Copy'}</button>
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
      <div className="uiux-a11y-pass">
        <div className="uiux-a11y-pass-icon">✓</div>
        <div className="uiux-a11y-pass-title">No accessibility issues detected</div>
        <div className="uiux-a11y-pass-desc">The component appears to follow accessibility best practices. Always test with a screen reader for full verification.</div>
      </div>
    );
  }
  return (
    <div className="uiux-a11y-panel">
      <div className="uiux-a11y-panel-head">
        <div className="uiux-a11y-panel-title">Accessibility Review</div>
        <div className="uiux-a11y-count">{hints.length} hint{hints.length !== 1 ? 's' : ''} found</div>
      </div>
      <div className="uiux-a11y-hints">
        {hints.map((hint, i) => {
          const isWarning = /warning|missing|lacks|no\s+alt|no\s+label/i.test(hint) || hint.includes('Warning');
          return (
            <div key={i} style={{ display: 'flex', gap: 9, padding: '9px 11px', borderRadius: 7, background: isWarning ? '!' : '→', border: `1px solid ${isWarning ? '!' : '→'}` }}>
              <span className="uiux-a11y-hint-icon">{isWarning ? '!' : '→'}</span>
              <div className="uiux-a11y-hint-text">{hint}</div>
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
      <div className="uiux-empty-icon"></div>
      <h2 className="uiux-empty-title">WokGen UI/UX</h2>
      <p className="uiux-empty-desc">Generate production-ready front-end components from a prompt. Preview HTML instantly, copy React / Vue / Svelte for your project.</p>
      <div className="uiux-empty-chips">
        {featured.map((ct) => {
          const item = COMPONENT_TYPES.find((c) => c.id === ct);
          return (
            <button type="button" key={ct} className="uiux-empty-chip" onClick={() => onSelect(ct)}>{item?.icon} {item?.label}</button>
          );
        })}
      </div>
      <div className="uiux-empty-hint">
        Press <kbd className="uiux-empty-kbd">⌘↵</kbd> to generate
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
    <div className="uiux-lib-results">
      {/* Header */}
      <div className="uiux-lib-header">
        <span className="uiux-lib-title">Library — {processed}/{total}</span>
        <div className="uiux-lib-progress">
          <div className="uiux-lib-progress-fill" style={{ width: `${(processed / total) * 100}%` }} />
        </div>
        {isGenerating && currentType && <span className="uiux-lib-generating">Generating {COMPONENT_TYPES.find((c) => c.id === currentType)?.label}…</span>}
        {!isGenerating && processed > 0 && (
          <button type="button" onClick={onExportAll} className="uiux-lib-export-btn">⊞ Export All</button>
        )}
      </div>

      {/* Items */}
      <div className="uiux-lib-items">
        {queue.map((ct) => {
          const res = results[ct];
          const ctInfo = COMPONENT_TYPES.find((c) => c.id === ct);
          const tab = activeTabs[ct] ?? 'preview';
          const isCurrentlyGenerating = isGenerating && currentType === ct;
          const isPending = isGenerating && !res && currentType !== ct;
          const ext = FRAMEWORKS.find((f) => f.id === framework)?.ext ?? 'html';
          const isPreviewable = res && (res.framework === 'html-tailwind' || res.framework === 'vanilla-css');

          return (
            <div key={ct} className="uiux-batch-item" style={{ opacity: isPending ? 0.45 : 1 }}>
              <div className="uiux-batch-header">
                <span className="uiux-batch-icon">{ctInfo?.icon}</span>
                <span className="uiux-batch-header-title">{ctInfo?.label}</span>
                {isCurrentlyGenerating && <span className="uiux-batch-generating">Generating…</span>}
                {isPending && <span className="uiux-batch-pending">Queued</span>}
                {res && (
                  <div className="uiux-batch-actions">
                    {isPreviewable && (
                      <button type="button" onClick={() => setActiveTabs((p) => ({ ...p, [ct]: 'preview' }))}
                        className={`uiux-batch-tab-btn${tab === 'preview' ? ' active' : ''}`}>◈</button>
                    )}
                    <button type="button" onClick={() => setActiveTabs((p) => ({ ...p, [ct]: 'code' }))}
                      className={`uiux-batch-tab-btn${tab === 'code' ? ' active' : ''}`}>{'{ }'}</button>
                    <button type="button" onClick={() => copyCode(ct, res.code)} className="uiux-batch-tab-btn"
                      style={{ color: copiedId === ct ? '#22c55e' : undefined }}>{copiedId === ct ? '✓' : '⎘'}</button>
                    <button type="button" onClick={() => triggerDownload(res.code, `wokgen-${ct}.${ext}`)} className="uiux-batch-tab-btn">↓</button>
                  </div>
                )}
              </div>
              {res && (
                <div className="uiux-batch-content uiux-batch-content--lg">
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
  return <iframe key={key} srcDoc={code} title="Preview" sandbox="allow-scripts allow-same-origin" className="uiux-lib-iframe" />;
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
    <div className="uiux-refine-bar">
      <input type="text" value={refPrompt} onChange={(e) => setRefPrompt(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleRefine(); }} placeholder="Refine this component…" disabled={isLoading} className="uiux-refine-input" />
      <button type="button" onClick={handleRefine} disabled={isLoading || !refPrompt.trim()} className="uiux-refine-btn">
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
      <div className="uiux-pb-empty">
        <div className="uiux-pb-empty-icon">⊞</div>
        <div className="uiux-pb-empty-title">Page Builder is empty</div>
        <div className="uiux-pb-empty-desc">Generate components in the Studio tab — they appear here automatically. Then assemble them into a complete page.</div>
      </div>
    );
  }

  return (
    <div className="uiux-pb-shell">
      <div className="uiux-pb-header">
        <span className="uiux-pb-title">⊞ Page Builder — {order.length} component{order.length !== 1 ? 's' : ''}</span>
        <div className="sidebar-spacer" />
        <button type="button" onClick={onAssemble} className="btn btn-generate">⬡ Assemble Page →</button>
      </div>

      <div className="uiux-pb-list">
        {order.map((id, idx) => {
          const item = items.get(id);
          if (!item) return null;
          const ctInfo = COMPONENT_TYPES.find((c) => c.id === item.componentType);
          const fw = FRAMEWORKS.find((f) => f.id === item.result.framework);
          return (
            <div key={id} className="uiux-pb-item">
              <span className="uiux-pb-item__idx">{idx + 1}</span>
              <span className="uiux-pb-item__icon">{ctInfo?.icon}</span>
              <div className="uiux-pb-item__info">
                <div className="uiux-pb-item__name">{ctInfo?.label}</div>
                <div className="uiux-pb-item__meta">{fw?.label} · {item.result.code.split('\n').length} lines</div>
              </div>
              <div className="uiux-pb-item__actions">
                <button type="button" onClick={() => onMove(id, 'up')} disabled={idx === 0} aria-label="Move up" className="uiux-pb-item-btn">↑</button>
                <button type="button" onClick={() => onMove(id, 'down')} disabled={idx === order.length - 1} aria-label="Move down" className="uiux-pb-item-btn">↓</button>
                <button type="button" onClick={() => onRemove(id)} aria-label="Remove" className="uiux-pb-item-btn uiux-pb-item-btn--remove">✕</button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="uiux-pb-footer">
        <div className="uiux-pb-footer-hint">
          Assembles components in order into one {framework === 'react-tsx' || framework === 'next-tsx' ? 'React page (AssembledPage.tsx) with import stubs' : 'HTML file (assembled-page.html)'}. HTML components are stitched by extracting each &lt;body&gt; section.
        </div>
      </div>
    </div>
  );
}

'use client';




import { useState, useCallback, useRef, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import type {
  BusinessTool,
  BusinessStyle,
  BusinessMood,
  BusinessPlatform,
} from '@/lib/prompt-builder-business';
import { PLATFORM_DIMENSIONS } from '@/lib/prompt-builder-business';
import WorkspaceSelector from '@/app/_components/WorkspaceSelector';
import { EralSidebar } from '@/app/_components/EralSidebar';
import { QuotaBadge } from '@/components/quota-badge';
import { parseApiError, type StudioError } from '@/lib/studio-errors';
import { StudioErrorBanner } from '@/app/_components/StudioErrorBanner';
import { usePreferenceSync } from '@/hooks/usePreferenceSync';
import { ColorPalette } from '@/components/color-palette';
import { QrGenerator } from '@/components/qr-generator';
import { FontPairing } from '@/components/font-pairing';
import SfxBrowser from '@/components/sfx-browser';
import BrandWizard from '@/components/studio/BrandWizard';
import type { BrandWizardData } from '@/lib/brand-prompt-builder';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface GenerationResult {
  jobId:        string;
  resultUrl:    string | null;
  resultUrls?:  string[] | null;
  durationMs?:  number;
  resolvedSeed?: number;
  width?:       number;
  height?:      number;
  guestDownloadGated?: boolean;
}

interface HistoryItem {
  id: string;
  tool: BusinessTool;
  prompt: string;
  resultUrl: string | null;
  width?: number;
  height?: number;
  createdAt: string;
}

type JobStatus = 'idle' | 'running' | 'succeeded' | 'failed';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const TOOLS: { id: BusinessTool; label: string; icon?: string; desc: string }[] = [
  { id: 'logo',       label: 'Logo Mark',        desc: 'Brand symbols and marks' },
  { id: 'brand-kit',  label: 'Brand Kit (4×)',   desc: 'Full 4-image brand set' },
  { id: 'slide',      label: 'Slide Visual',     desc: '16:9 presentation backgrounds' },
  { id: 'social',     label: 'Social Banner',    desc: 'Platform-optimised sizes' },
  { id: 'web-hero',   label: 'Hero Image',       desc: 'Website hero backgrounds' },
];

const STYLES: { id: BusinessStyle; label: string }[] = [
  { id: 'minimal_flat',        label: 'Minimal Flat' },
  { id: 'bold_geometric',      label: 'Bold Geometric' },
  { id: 'corporate_clean',     label: 'Corporate' },
  { id: 'photography_overlay', label: 'Photography' },
  { id: 'monochrome',          label: 'Monochrome' },
  { id: 'gradient_modern',     label: 'Gradient' },
  { id: 'tech_dark',           label: 'Tech Dark' },
  { id: 'warm_brand',          label: 'Warm Brand' },
];

const MOODS: { id: BusinessMood; label: string }[] = [
  { id: 'professional', label: 'Professional' },
  { id: 'playful',      label: 'Playful' },
  { id: 'bold',         label: 'Bold' },
  { id: 'minimal',      label: 'Minimal' },
  { id: 'luxury',       label: 'Luxury' },
  { id: 'technical',    label: 'Technical' },
];

const PLATFORMS: { id: BusinessPlatform; label: string; size: string; icon?: string }[] = [
  { id: 'og_image',         label: 'OG / Meta',         size: '1200×630',  },
  { id: 'twitter_header',   label: 'X/Twitter Header',  size: '1500×500',  },
  { id: 'twitter_post',     label: 'X/Twitter Post',    size: '1080×1080', },
  { id: 'instagram_square', label: 'Instagram Post',    size: '1080×1080', },
  { id: 'instagram_story',  label: 'Instagram Story',   size: '1080×1920', },
  { id: 'linkedin_banner',  label: 'LinkedIn Banner',   size: '1584×396',  },
  { id: 'youtube_art',      label: 'YouTube Art',       size: '2560×1440', },
  { id: 'youtube_thumbnail', label: 'YouTube Thumbnail', size: '1280×720',  },
  { id: 'tiktok_cover',     label: 'TikTok Cover',      size: '1080×1920', },
];

const SLIDE_FORMATS = [
  { id: '16:9',  label: 'Widescreen 16:9', width: 1920, height: 1080 },
  { id: '4:3',   label: 'Standard 4:3',   width: 1024, height: 768  },
  { id: '1:1',   label: 'Square',         width: 1024, height: 1024 },
];

const INDUSTRIES = [
  'Tech', 'Finance', 'Health', 'E-commerce', 'Creative', 'Food & Beverage',
  'Real Estate', 'Education', 'SaaS', 'Consulting', 'Media', 'Startup',
];

const EXAMPLE_PROMPTS: Record<BusinessTool, string> = {
  'logo':      'Modern tech startup focused on AI security, minimal, trustworthy',
  'brand-kit': 'Creative agency specializing in digital design, bold and colorful',
  'slide':     'SaaS product launch, dark tech style, innovation keynote',
  'social':    'Product launch announcement for a productivity app, minimal flat',
  'web-hero':  'Developer tools company homepage, dark tech background, clean',
};

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Loading stages
// ---------------------------------------------------------------------------
const BUSINESS_STAGES = [
  { delay: 0,     message: 'Connecting to generation service...' },
  { delay: 3000,  message: 'Building your business asset...' },
  { delay: 15000, message: 'Applying brand styles...' },
  { delay: 40000, message: 'Almost there...' },
];

// ---------------------------------------------------------------------------
// Output format options (shown after wizard generation)
// ---------------------------------------------------------------------------
const OUTPUT_FORMATS = [
  { id: 'logo_horizontal', label: 'Logo Horizontal',  size: '1200×400'  },
  { id: 'logo_vertical',   label: 'Logo Vertical',    size: '400×600'   },
  { id: 'icon_only',       label: 'Icon Only',        size: '512×512'   },
  { id: 'full_lockup',     label: 'Full Lockup',      size: '1600×600'  },
  { id: 'social_banner',   label: 'Social Banner',    size: '1200×630'  },
  { id: 'slide_bg',        label: 'Slide Background', size: '1920×1080' },
] as const;

// ---------------------------------------------------------------------------
// Business Studio Component (inner — needs Suspense for useSearchParams)
// ---------------------------------------------------------------------------
function BusinessStudioInner() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();

  // ── Tool & controls state ──────────────────────────────────────────────────
  const [activeTool, setActiveTool]     = useState<BusinessTool>(
    (searchParams.get('tool') as BusinessTool | null) ?? 'logo'
  );
  const [prompt, setPrompt]             = useState(searchParams.get('prompt') ?? '');
  const [style, setStyle]               = useState<BusinessStyle>('corporate_clean');
  const [mood, setMood]                 = useState<BusinessMood>('professional');
  const [industry, setIndustry]         = useState('');
  const [colorDirection, setColorDir]   = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [platform, setPlatform]         = useState<BusinessPlatform>('og_image');
  const [slideFormat, setSlideFormat]   = useState(SLIDE_FORMATS[0]);
  const [logoBg, setLogoBg]             = useState<'white' | 'dark' | 'transparent'>('white');
  const [useHD, setUseHD]               = useState(false);
  const [isPublic, setIsPublic]         = useState(false);

  // Workspace
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('wokgen:workspace:business') ?? null;
    return null;
  });

  // ── Generation state ──────────────────────────────────────────────────────
  const [jobStatus, setJobStatus]       = useState<JobStatus>('idle');
  const [result, setResult]             = useState<GenerationResult | null>(null);
  const [brandKitResults, setBrandKitResults] = useState<GenerationResult[]>([]);
  const [studioError, setStudioError]   = useState<StudioError | null>(null);
  const [elapsedMs, setElapsedMs]       = useState(0);
  const [loadingMsg, setLoadingMsg]     = useState(BUSINESS_STAGES[0].message);

  // ── History ───────────────────────────────────────────────────────────────
  const [history, setHistory]           = useState<HistoryItem[]>([]);
  const [selectedHistory, setSelHistory] = useState<number | null>(null);

  // ── Toast ─────────────────────────────────────────────────────────────────
  const [toast, setToast]               = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // ── Favorites state ────────────────────────────────────────────────────────
  const [favPrompts, setFavPrompts]     = useState<{ id: string; prompt: string; label?: string }[]>([]);
  const [showFavMenu, setShowFavMenu]   = useState(false);
  const [favSaved, setFavSaved]         = useState(false);

  // ── Preference sync ────────────────────────────────────────────────────────
  usePreferenceSync('business', { tool: activeTool, style, mood, useHD, platform });

  // Timer ref
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Free integrations state ───────────────────────────────────────────────
  const [showQrPanel, setShowQrPanel]         = useState(false);
  const [showFontPanel, setShowFontPanel]     = useState(false);
  const [bgRemoving, setBgRemoving]           = useState(false);
  const [displayUrl, setDisplayUrl]           = useState<string | null>(null);

  // ── Brand Copy panel ─────────────────────────────────────────────────────
  const [showCopyPanel, setShowCopyPanel]     = useState(false);
  const [copyLoading, setCopyLoading]         = useState(false);
  const [copyError, setCopyError]             = useState<string | null>(null);
  const [brandCopy, setBrandCopy]             = useState<{ taglines: string[]; pitch: string; bio: string } | null>(null);

  // ── Brand Wizard state ────────────────────────────────────────────────────
  const [showWizard, setShowWizard]         = useState(() => !searchParams.get('prompt'));
  const [wizardData, setWizardData]         = useState<BrandWizardData | null>(null);
  const [selectedFormat, setSelectedFormat] = useState('logo_horizontal');

  // ── SFX / Audio panel ────────────────────────────────────────────────────
  const [showAudioPanel, setShowAudioPanel] = useState(false);
  const [sfxPrompt, setSfxPrompt]           = useState('');
  const [sfxDuration, setSfxDuration]       = useState(2.0);
  const [sfxInfluence, setSfxInfluence]     = useState(0.6);
  const [sfxAudio, setSfxAudio]             = useState<string | null>(null);
  const [sfxLoading, setSfxLoading]         = useState(false);
  const [sfxError, setSfxError]             = useState<string | null>(null);

  // Content-aware SFX prompt defaults when tool changes
  const SFX_DEFAULTS: Record<string, string> = {
    'logo':      'brand reveal sting, professional, elegant, 2 seconds',
    'brand-kit': 'brand reveal sting, professional, elegant, 2 seconds',
    'social':    'notification sound, energetic, attention-grabbing',
    'slide':     'slide transition, smooth, corporate',
    'web-hero':  'ambient website sound, modern, subtle',
  };

  useEffect(() => {
    setSfxPrompt(SFX_DEFAULTS[activeTool] ?? '');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTool]);

  // Close My Prompts dropdown on outside click
  useEffect(() => {
    if (!showFavMenu) return;
    const handler = (e: MouseEvent) => {
      const menu = document.querySelector('[data-fav-menu]');
      if (menu && !menu.contains(e.target as Node)) setShowFavMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showFavMenu]);

  const toastSuccess = (msg: string) => { setToast({ msg, type: 'success' }); setTimeout(() => setToast(null), 3500); };
  const toastError   = (msg: string) => { setToast({ msg, type: 'error' });   setTimeout(() => setToast(null), 4000); };

  // ── Tool switch — reset relevant state ───────────────────────────────────
  const switchTool = useCallback((tool: BusinessTool) => {
    setActiveTool(tool);
    setResult(null);
    setBrandKitResults([]);
    setStudioError(null);
    setJobStatus('idle');
    setPrompt(EXAMPLE_PROMPTS[tool]);
  }, []);

  // Init prompt
  // Only set default prompt if not provided via URL param
  useEffect(() => {
    if (!searchParams.get('prompt')) setPrompt(EXAMPLE_PROMPTS[activeTool]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Elapsed timer ─────────────────────────────────────────────────────────
  const startTimer = () => {
    const start = Date.now();
    timerRef.current = setInterval(() => setElapsedMs(Date.now() - start), 100);
  };
  const stopTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };
  useEffect(() => () => stopTimer(), []);

  // ── Determine width/height for current tool ───────────────────────────────
  const getToolDimensions = () => {
    if (activeTool === 'social') {
      const dims = PLATFORM_DIMENSIONS[platform];
      return { width: dims.width, height: dims.height };
    }
    if (activeTool === 'slide') {
      return { width: slideFormat.width, height: slideFormat.height };
    }
    if (activeTool === 'logo') return { width: 512, height: 512 };
    if (activeTool === 'web-hero') return { width: 1920, height: 1080 };
    return { width: 1024, height: 1024 };
  };

  // ── Generate ──────────────────────────────────────────────────────────────
  const handleGenerate = useCallback(async (promptOverride?: unknown) => {
    const effectivePrompt = typeof promptOverride === 'string' ? promptOverride : prompt;
    if (!effectivePrompt.trim() || jobStatus === 'running') return;
    setJobStatus('running');
    setStudioError(null);
    setResult(null);
    setBrandKitResults([]);
    setElapsedMs(0);
    setLoadingMsg(BUSINESS_STAGES[0].message);
    startTimer();
    const stageTimers = BUSINESS_STAGES.slice(1).map(s =>
      setTimeout(() => setLoadingMsg(s.message), s.delay)
    );

    const dims = getToolDimensions();

    const body = {
      tool:           activeTool === 'brand-kit' ? 'generate' : activeTool,
      mode:           'business',
      prompt:         activeTool === 'logo' && targetAudience.trim()
                        ? `${effectivePrompt.trim()}, target audience: ${targetAudience.trim()}`
                        : effectivePrompt.trim(),
      style,
      mood,
      industry:       industry.trim() || undefined,
      colorDirection: colorDirection.trim() || undefined,
      platform:       activeTool === 'social' ? platform : undefined,
      width:          dims.width,
      height:         dims.height,
      quality:        useHD ? 'hd' : 'standard',
      isPublic,
      ...(activeWorkspaceId ? { projectId: activeWorkspaceId } : {}),
      // Business-specific extra params passed through
      extra: {
        businessTool: activeTool,
        businessStyle: style,
        businessMood: mood,
        businessPlatform: activeTool === 'social' ? platform : undefined,
        logoBg: activeTool === 'logo' ? logoBg : undefined,
      },
    };

    try {
      if (activeTool === 'brand-kit') {
        // Fire 4 parallel requests with brandKitIndex 1-4
        const results = await Promise.allSettled(
          [1, 2, 3, 4].map(async (idx) => {
            const res = await fetch('/api/generate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...body, extra: { ...body.extra, brandKitIndex: idx } }),
            });
            const data = await res.json();
            if (!res.ok || !data.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
            return { jobId: data.job?.id ?? 'local', resultUrl: data.resultUrl, width: dims.width, height: dims.height } as GenerationResult;
          })
        );
        const fulfilled = results
          .filter((r): r is PromiseFulfilledResult<GenerationResult> => r.status === 'fulfilled')
          .map(r => r.value);
        setBrandKitResults(fulfilled);
        setJobStatus('succeeded');
        if (fulfilled[0]) {
          setHistory(prev => [{
            id: fulfilled[0].jobId, tool: activeTool,
            prompt: prompt.trim(), resultUrl: fulfilled[0].resultUrl,
            width: dims.width, height: dims.height, createdAt: new Date().toISOString(),
          }, ...prev].slice(0, 30));
        }
      } else {
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
        const gen: GenerationResult = {
          jobId: data.job?.id ?? 'local', resultUrl: data.resultUrl,
          durationMs: data.durationMs, resolvedSeed: data.resolvedSeed,
          width: dims.width, height: dims.height,
          guestDownloadGated: data.guestDownloadGated as boolean | undefined,
        };
        setResult(gen);
        setJobStatus('succeeded');
        setHistory(prev => [{
          id: gen.jobId, tool: activeTool,
          prompt: prompt.trim(), resultUrl: gen.resultUrl,
          width: dims.width, height: dims.height, createdAt: new Date().toISOString(),
        }, ...prev].slice(0, 30));
      }
    } catch (err) {
      setStudioError(parseApiError({ status: 0 }, err instanceof Error ? err.message : String(err)));
      setJobStatus('failed');
    } finally {
      stopTimer();
      stageTimers.forEach(clearTimeout);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompt, activeTool, style, mood, industry, colorDirection, targetAudience, platform, slideFormat, useHD, isPublic, jobStatus]);

  // ── Brand Wizard completion handler ──────────────────────────────────────
  const handleWizardGenerate = useCallback((wizardPrompt: string, data: BrandWizardData) => {
    setWizardData(data);
    setShowWizard(false);
    setPrompt(wizardPrompt);
    handleGenerate(wizardPrompt);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleGenerate]);

  // ── Load history from API on mount ───────────────────────────────────────
  useEffect(() => {
    fetch('/api/generate?limit=20&status=succeeded&mode=business')
      .then(r => r.ok ? r.json() : null)
      .then((data: { jobs: Array<{ id?: string; prompt: string; tool: string; resultUrl?: string; imageUrl?: string; width?: number; height?: number; createdAt: string }> } | null) => {
        if (!data?.jobs) return;
        const items = data.jobs.map(j => ({
          id: j.id ?? crypto.randomUUID(),
          tool: (j.tool as BusinessTool) ?? 'logo',
          prompt: j.prompt,
          resultUrl: j.imageUrl ?? j.resultUrl ?? '',
          width: j.width ?? 1024,
          height: j.height ?? 1024,
          createdAt: j.createdAt,
        }));
        setHistory(items);
      })
      .catch(() => { /* silently ignore — history isn't critical */ });
  }, []);

  // ── Init isPublic from user's default preference ───────────────────────────
  useEffect(() => {
    fetch('/api/user/settings')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.publicGenerationsDefault) setIsPublic(true); })
      .catch(() => {});
  }, []);

  // ── Keyboard shortcut ─────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault(); handleGenerate();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleGenerate]);

  // ── Load favorite prompts ──────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/favorites?mode=business')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.favorites) setFavPrompts(d.favorites); })
      .catch(() => {});
  }, []);

  const savePromptAsFavorite = useCallback(async () => {
    if (!prompt.trim()) return;
    try {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'business', prompt: prompt.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setFavPrompts(prev => [data.favorite, ...prev]);
        setFavSaved(true);
        setTimeout(() => setFavSaved(false), 2000);
      }
    } catch { /* silent fail */ }
  }, [prompt]);

  // ── Download ──────────────────────────────────────────────────────────────
  const handleDownload = useCallback(async (url: string, suffix = '') => {
    try {
      const slug = prompt.trim().replace(/[^a-z0-9]+/gi, '-').toLowerCase().slice(0, 30);
      const filename = `wokgen-business-${activeTool}${suffix ? `-${suffix}` : ''}-${slug}.png`;
      const res  = await fetch(url);
      const blob = await res.blob();
      const a    = document.createElement('a');
      a.href     = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
      toastSuccess('Download started');
    } catch { toastError('Download failed'); }
  }, [prompt, activeTool]);

  // ── Export all format sizes ───────────────────────────────────────────────
  const handleExportAll = useCallback(() => {
    const url = displayUrl ?? (result?.resultUrl ?? null);
    if (!url) return;
    OUTPUT_FORMATS.forEach((f, i) => {
      setTimeout(() => handleDownload(url, f.id), i * 300);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayUrl, result, handleDownload]);
  const displayResult = result ?? (history[selectedHistory ?? -1] ?? null);
  const isBrandKit    = activeTool === 'brand-kit';

  // Keep displayUrl in sync with latest result (allows bg-remove to override)
  useEffect(() => {
    setDisplayUrl(displayResult?.resultUrl ?? null);
  }, [displayResult?.resultUrl]);

  // ── Background remove ─────────────────────────────────────────────────────
  const handleBgRemove = useCallback(async (url: string) => {
    setBgRemoving(true);
    try {
      const res = await fetch('/api/tools/bg-remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: url }),
      });
      const data = await res.json();
      if (!res.ok) { toastError(data.error ?? 'BG removal failed'); return; }
      setDisplayUrl(`data:image/png;base64,${data.resultBase64}`);
      toastSuccess('Background removed');
    } catch { toastError('BG removal failed'); }
    finally { setBgRemoving(false); }
  }, [toastError, toastSuccess]);

  // ── Export brand kit as JSON ─────────────────────────────────────────────
  const handleExportBrandKitJson = useCallback(() => {
    const imageUrls = brandKitResults
      .map((r, i) => ({ label: ['Logo Mark', 'Brand Banner', 'Profile Image', 'OG Meta'][i], url: r.resultUrl }))
      .filter(r => r.url);
    const payload = {
      exportedAt: new Date().toISOString(),
      brandName:  wizardData?.brandName ?? '',
      prompt,
      style,
      mood,
      industry:       industry || undefined,
      colorDirection: colorDirection || undefined,
      primaryColor:   wizardData?.primaryColor ?? undefined,
      moods:          wizardData?.moods ?? undefined,
      imageUrls,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `brand-kit-${(wizardData?.brandName || prompt).replace(/[^a-z0-9]+/gi, '-').toLowerCase().slice(0, 30)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    toastSuccess('Brand kit exported');
  }, [brandKitResults, wizardData, prompt, style, mood, industry, colorDirection]);

  // ── Generate brand copy via Eral ─────────────────────────────────────────
  const handleGenerateCopy = useCallback(async () => {
    if (!prompt.trim()) return;
    setCopyLoading(true);
    setCopyError(null);
    setBrandCopy(null);
    const brandContext = [
      `Brand: ${wizardData?.brandName || prompt}`,
      `Industry: ${wizardData?.industry || industry || 'general'}`,
      `Style: ${style}, Mood: ${mood}`,
      colorDirection ? `Colors: ${colorDirection}` : '',
    ].filter(Boolean).join('\n');
    const userMessage = `Generate brand copy for the following brand:\n${brandContext}\n\nRespond in this exact format:\nTAGLINES:\n1. [tagline]\n2. [tagline]\n3. [tagline]\n\nELEVATOR PITCH:\n[2-3 sentence pitch]\n\nSOCIAL BIO:\n[1 sentence social media bio under 160 chars]`;
    try {
      const res = await fetch('/api/eral/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, modelVariant: 'eral-mini', stream: false }),
      });
      const data = await res.json() as { reply?: string; error?: string };
      if (!res.ok || !data.reply) { setCopyError(data.error ?? 'Generation failed'); return; }
      // Parse the structured response
      const text = data.reply;
      const taglinesMatch = text.match(/TAGLINES:\n([\s\S]*?)(?:\n\n|$)/);
      const pitchMatch    = text.match(/ELEVATOR PITCH:\n([\s\S]*?)(?:\n\n|$)/);
      const bioMatch      = text.match(/SOCIAL BIO:\n([\s\S]*?)(?:\n\n|$)/);
      const taglines = taglinesMatch
        ? taglinesMatch[1].split('\n').map(l => l.replace(/^\d+\.\s*/, '').trim()).filter(Boolean)
        : [];
      const pitch = pitchMatch ? pitchMatch[1].trim() : '';
      const bio   = bioMatch   ? bioMatch[1].trim()   : '';
      setBrandCopy({ taglines, pitch, bio });
    } catch { setCopyError('Copy generation failed'); }
    finally   { setCopyLoading(false); }
  }, [prompt, wizardData, style, mood, industry, colorDirection]);

  return (
    <div className="studio-layout">

      {/* ── Toast ─────────────────────────────────────────────────────────── */}
      {toast && (
        <div className={`studio-toast studio-toast--${toast.type}`} role="alert">
          {toast.msg}
        </div>
      )}

      {/* ────────────────────────────── LEFT PANEL ──────────────────────────── */}
      <aside className="studio-sidebar">

        {/* Mode identifier */}
        <div className="studio-mode-header" style={{ '--mode-accent': '#60a5fa' } as React.CSSProperties}>
          <span className="studio-mode-label">Business mode</span>
          <QuotaBadge />
          <a
            href="/pixel/studio"
            style={{
              marginLeft: 'auto',
              fontSize: '0.7rem',
              color: 'var(--text-faint, #555)',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-muted)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-faint, #555)')}
            title="Switch to Pixel mode"
          >
            Pixel
          </a>
        </div>

        {showWizard ? (
          <BrandWizard onGenerate={handleWizardGenerate} />
        ) : (<>
        {/* Brand Wizard re-open button */}
        {wizardData && (
          <div className="studio-control-section" style={{ paddingBottom: '0.5rem' }}>
            <button
              className="btn-secondary"
              style={{ width: '100%', fontSize: '0.78rem' }}
              onClick={() => setShowWizard(true)}
            >
              ✦ Re-run Brand Wizard
            </button>
          </div>
        )}

        {/* Tool tabs */}
        <div className="studio-tool-tabs">
          {TOOLS.map(t => (
            <button
              key={t.id}
              className={`studio-tool-tab${activeTool === t.id ? ' active' : ''}`}
              onClick={() => switchTool(t.id)}
              title={t.desc}
            >
              <span className="studio-tool-icon">{t.icon}</span>
              <span className="studio-tool-label">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Workspace selector */}
        <div className="studio-control-section" style={{ paddingBottom: 0 }}>
          <WorkspaceSelector
            mode="business"
            activeWorkspaceId={activeWorkspaceId}
            onChange={setActiveWorkspaceId}
          />
        </div>

        {/* Prompt / concept input */}
        <div className="studio-control-section">
          <div className="flex items-center justify-between mb-1">
            <label className="studio-label" style={{ marginBottom: 0 }}>Concept / Description</label>
            <div className="flex items-center gap-2">
              {/* Save as Favorite */}
              <button
                title={favSaved ? 'Saved!' : 'Save prompt as favorite'}
                onClick={savePromptAsFavorite}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', lineHeight: 1, color: favSaved ? '#f59e0b' : 'var(--text-disabled)', transition: 'color 0.15s' }}
              >
                {favSaved ? '✓' : '+'}
              </button>
              {/* My Prompts dropdown */}
              {favPrompts.length > 0 && (
                <div data-fav-menu style={{ position: 'relative' }}>
                  <button
                    title="My saved prompts"
                    onClick={() => setShowFavMenu(v => !v)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.65rem', color: 'var(--text-disabled)', padding: '0 2px' }}
                  >
                    My Prompts ▾
                  </button>
                  {showFavMenu && (
                    <div style={{ position: 'absolute', right: 0, top: '100%', zIndex: 50, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, minWidth: 220, maxHeight: 180, overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                      {favPrompts.map(f => (
                        <button
                          key={f.id}
                          onClick={() => { setPrompt(f.prompt); setShowFavMenu(false); }}
                          style={{ display: 'block', width: '100%', textAlign: 'left', padding: '6px 10px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.7rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--border)' }}
                        >
                          {f.prompt.length > 60 ? f.prompt.slice(0, 58) + '…' : f.prompt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <textarea
            className="studio-textarea"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder={EXAMPLE_PROMPTS[activeTool]}
            rows={4}
          />
        </div>

        {/* Industry (optional) */}
        <div className="studio-control-section">
          <label className="studio-label">Industry <span className="studio-label-opt">(optional)</span></label>
          <select
            className="studio-select"
            value={industry}
            onChange={e => setIndustry(e.target.value)}
          >
            <option value="">— Select industry —</option>
            {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>

        {/* Style presets */}
        <div className="studio-control-section">
          <label className="studio-label">Style</label>
          <div className="studio-preset-grid studio-preset-grid--sm">
            {STYLES.map(s => (
              <button
                key={s.id}
                className={`studio-preset-btn${style === s.id ? ' active' : ''}`}
                onClick={() => setStyle(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Mood */}
        <div className="studio-control-section">
          <label className="studio-label">Mood</label>
          <div className="studio-preset-grid studio-preset-grid--sm">
            {MOODS.map(m => (
              <button
                key={m.id}
                className={`studio-preset-btn${mood === m.id ? ' active' : ''}`}
                onClick={() => setMood(m.id)}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Color direction */}
        <div className="studio-control-section">
          <label className="studio-label">Color Direction <span className="studio-label-opt">(optional)</span></label>
          <input
            className="studio-input"
            type="text"
            value={colorDirection}
            onChange={e => setColorDir(e.target.value)}
            placeholder="e.g. navy and gold, deep purple"
          />
        </div>

        {/* Logo background toggle */}
        {activeTool === 'logo' && (
          <div className="studio-control-section">
            <label className="studio-label">Logo Background</label>
            <div className="studio-preset-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              {([
                { id: 'white',       label: '⬜ White'       },
                { id: 'dark',        label: '⬛ Dark'         },
                { id: 'transparent', label: 'Transparent' },
              ] as { id: typeof logoBg; label: string }[]).map(opt => (
                <button
                  key={opt.id}
                  className={`studio-preset-btn${logoBg === opt.id ? ' active' : ''}`}
                  onClick={() => setLogoBg(opt.id)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Target audience (logo only) */}
        {activeTool === 'logo' && (
          <div className="studio-control-section">
            <label className="studio-label">Target Audience <span className="studio-label-opt">(optional)</span></label>
            <input
              className="studio-input"
              type="text"
              value={targetAudience}
              onChange={e => setTargetAudience(e.target.value)}
              placeholder="e.g. senior engineers, Gen Z founders"
            />
          </div>
        )}

        {/* Platform selector (social only) */}
        {activeTool === 'social' && (
          <div className="studio-control-section">
            <label className="studio-label">Platform</label>
            <div className="biz-platform-grid">
              {PLATFORMS.map(p => (
                <button
                  key={p.id}
                  className={`biz-platform-btn${platform === p.id ? ' active' : ''}`}
                  onClick={() => setPlatform(p.id)}
                >
                  <span className="biz-platform-icon">{p.icon}</span>
                  <span className="biz-platform-label">{p.label}</span>
                  <span className="biz-platform-size">{p.size}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Slide format (slide only) */}
        {activeTool === 'slide' && (
          <div className="studio-control-section">
            <label className="studio-label">Format</label>
            <div className="studio-preset-grid">
              {SLIDE_FORMATS.map(f => (
                <button
                  key={f.id}
                  className={`studio-preset-btn${slideFormat.id === f.id ? ' active' : ''}`}
                  onClick={() => setSlideFormat(f)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quality toggle */}
        <div className="studio-control-section">
          <div className="studio-row studio-row--spaced">
            <label className="studio-label" style={{ margin: 0 }}>
              HD Quality
              <span className="studio-label-opt"> (uses 1 credit)</span>
            </label>
            <button
              className={`toggle-track${useHD ? ' on' : ''}`}
              onClick={() => setUseHD(v => !v)}
              disabled={!session}
              title={session ? undefined : 'Sign in to use HD quality'}
            >
              <span className="toggle-thumb" />
            </button>
          </div>
          {!session && (
            <p className="studio-hint">
              <a href="/login" className="link">Sign in</a> to unlock HD quality
            </p>
          )}
        </div>

        {/* Public toggle */}
        {session && (
          <div className="studio-control-section">
            <div className="studio-row studio-row--spaced">
              <label className="studio-label" style={{ margin: 0 }}>Share to Gallery</label>
              <button className={`toggle-track${isPublic ? ' on' : ''}`} onClick={() => setIsPublic(v => !v)}>
                <span className="toggle-thumb" />
              </button>
            </div>
          </div>
        )}

        {/* Audio panel */}
        <div className="studio-control-section" style={{ padding: 0, borderTop: '1px solid var(--surface-border)' }}>
          <div
            className="px-4 py-3 flex items-center justify-between cursor-pointer transition-colors duration-150"
            onClick={() => setShowAudioPanel((v) => !v)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setShowAudioPanel((v) => !v)}
            aria-expanded={showAudioPanel}
          >
            <span className="studio-control-label" style={{ fontWeight: 600 }}>Audio</span>
            <span style={{ color: 'var(--text-disabled)', fontSize: 12 }}>
              {showAudioPanel ? '▾' : '▸'}
            </span>
          </div>

          {showAudioPanel && (
            <div className="px-4 pb-4 flex flex-col gap-3">
              {/* Freesound browser */}
              <SfxBrowser onSelectPrompt={(p) => setSfxPrompt(p)} />
              <div style={{ borderTop: '1px solid var(--surface-border)', margin: '2px 0' }} />
              {/* Prompt label + Auto-suggest */}
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Describe the sound…
                </label>
                <button
                  className="btn-secondary"
                  style={{ fontSize: '0.7rem', padding: '2px 8px', height: 'auto' }}
                  onClick={async () => {
                    if (!prompt.trim()) return;
                    try {
                      const res = await fetch('/api/sfx/suggest', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ visualPrompt: prompt, assetType: `business ${activeTool}` }),
                      });
                      const data = await res.json() as { suggestion?: string };
                      if (data.suggestion) setSfxPrompt(data.suggestion);
                    } catch { /* ignore */ }
                  }}
                  title="Auto-suggest audio from visual prompt"
                >
                  ✦ Auto-suggest
                </button>
              </div>
              <input
                type="text"
                className="studio-input"
                placeholder="e.g. brand reveal sting, notification sound"
                value={sfxPrompt}
                onChange={(e) => setSfxPrompt(e.target.value)}
                maxLength={500}
              />

              {/* Duration slider */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs" style={{ color: 'var(--text-secondary)' }}>Duration</label>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{sfxDuration.toFixed(1)}s</span>
                </div>
                <input
                  type="range"
                  className="studio-slider"
                  min={1}
                  max={10}
                  step={0.5}
                  value={sfxDuration}
                  onChange={(e) => setSfxDuration(Number(e.target.value))}
                />
                <div className="flex justify-between text-xs mt-0.5" style={{ color: 'var(--text-disabled)' }}>
                  <span>1s</span>
                  <span>10s</span>
                </div>
              </div>

              {/* Prompt influence */}
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>Prompt influence</label>
                <div className="flex gap-1">
                  {([['Low', 0.3], ['Balanced', 0.6], ['Exact', 0.9]] as [string, number][]).map(([label, val]) => (
                    <button
                      key={label}
                      onClick={() => setSfxInfluence(val)}
                      className="flex-1"
                      style={{
                        padding: '3px 0',
                        borderRadius: 4,
                        border: '1px solid',
                        borderColor: sfxInfluence === val ? 'var(--accent-muted, #60a5fa66)' : 'var(--surface-border)',
                        background:  sfxInfluence === val ? 'var(--accent-dim, rgba(96,165,250,0.12))' : 'transparent',
                        color:       sfxInfluence === val ? 'var(--accent, #60a5fa)' : 'var(--text-muted)',
                        fontSize: '0.72rem',
                        fontWeight: sfxInfluence === val ? 600 : 400,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate audio button */}
              <button
                className="btn-primary w-full"
                style={{ height: 38, fontSize: '0.85rem', fontWeight: 600 }}
                disabled={sfxLoading || !sfxPrompt.trim()}
                onClick={async () => {
                  if (!sfxPrompt.trim()) return;
                  setSfxLoading(true);
                  setSfxError(null);
                  setSfxAudio(null);
                  try {
                    const res = await fetch('/api/sfx/generate', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ prompt: sfxPrompt, duration: sfxDuration, promptInfluence: sfxInfluence }),
                    });
                    const data = await res.json() as { audioBase64?: string; mimeType?: string; error?: string };
                    if (!res.ok || data.error) {
                      setSfxError(data.error ?? 'Audio generation failed');
                    } else if (data.audioBase64 && data.mimeType) {
                      setSfxAudio(`data:${data.mimeType};base64,${data.audioBase64}`);
                    }
                  } catch {
                    setSfxError('Audio generation failed');
                  } finally {
                    setSfxLoading(false);
                  }
                }}
              >
                {sfxLoading ? 'Generating…' : 'Generate Audio'}
              </button>

              {/* Error */}
              {sfxError && (
                <p className="text-xs" style={{ color: 'var(--error, #ef4444)' }}>{sfxError}</p>
              )}

              {/* Audio player */}
              {sfxAudio && (
                <div className="flex flex-col gap-2">
                  {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                  <audio controls src={sfxAudio} style={{ width: '100%', height: 36, borderRadius: 6 }} />
                  <a
                    href={sfxAudio}
                    download={`${sfxPrompt.slice(0, 30).replace(/[^a-z0-9]/gi, '_')}.mp3`}
                    className="btn-secondary text-center"
                    style={{ fontSize: '0.78rem', padding: '4px 0', display: 'block', textDecoration: 'none' }}
                  >
                    ↓ Download .mp3
                  </a>
                </div>
              )}

              {/* Hint */}
              <p className="text-xs" style={{ color: 'var(--text-disabled)', marginTop: -4 }}>
                Free: 3 sounds/day · Great for game assets
              </p>
            </div>
          )}
        </div>

        {/* QR Code panel */}
        <div className="studio-control-section" style={{ padding: 0, borderTop: '1px solid var(--surface-border)' }}>
          <div
            className="px-4 py-3 flex items-center justify-between cursor-pointer"
            onClick={() => setShowQrPanel(v => !v)}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && setShowQrPanel(v => !v)}
          >
            <span className="studio-control-label" style={{ fontWeight: 600 }}>QR Code</span>
            <span style={{ color: 'var(--text-disabled)', fontSize: 12 }}>{showQrPanel ? '▾' : '▸'}</span>
          </div>
          {showQrPanel && (
            <div className="px-4 pb-4">
              <QrGenerator resultUrl={displayResult?.resultUrl} />
            </div>
          )}
        </div>

        {/* Font Pairing panel */}
        <div className="studio-control-section" style={{ padding: 0, borderTop: '1px solid var(--surface-border)' }}>
          <div
            className="px-4 py-3 flex items-center justify-between cursor-pointer"
            onClick={() => setShowFontPanel(v => !v)}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && setShowFontPanel(v => !v)}
          >
            <span className="studio-control-label" style={{ fontWeight: 600 }}>Font Pairing</span>
            <span style={{ color: 'var(--text-disabled)', fontSize: 12 }}>{showFontPanel ? '▾' : '▸'}</span>
          </div>
          {showFontPanel && (
            <div className="px-4 pb-4">
              <FontPairing brandStyle={style} />
            </div>
          )}
        </div>

        {/* Brand Copy panel */}
        <div className="studio-control-section" style={{ padding: 0, borderTop: '1px solid var(--surface-border)' }}>
          <div
            className="px-4 py-3 flex items-center justify-between cursor-pointer"
            onClick={() => setShowCopyPanel(v => !v)}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && setShowCopyPanel(v => !v)}
          >
            <span className="studio-control-label" style={{ fontWeight: 600 }}>Brand Copy</span>
            <span style={{ color: 'var(--text-disabled)', fontSize: 12 }}>{showCopyPanel ? '▾' : '▸'}</span>
          </div>
          {showCopyPanel && (
            <div className="px-4 pb-4 flex flex-col gap-3">
              <p className="text-xs" style={{ color: 'var(--text-muted)', margin: 0 }}>
                Generate taglines, elevator pitch, and social bio from your brand context.
              </p>
              <button
                className="btn-primary w-full"
                style={{ height: 36, fontSize: '0.85rem', fontWeight: 600 }}
                disabled={copyLoading || !prompt.trim()}
                onClick={handleGenerateCopy}
              >
                {copyLoading ? 'Generating…' : 'Generate Brand Copy'}
              </button>
              {copyError && (
                <p className="text-xs" style={{ color: 'var(--error, #ef4444)' }}>{copyError}</p>
              )}
              {brandCopy && (
                <div className="flex flex-col gap-3" style={{ fontSize: '0.78rem' }}>
                  <div>
                    <p style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Taglines</p>
                    {brandCopy.taglines.map((t, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '3px 0', borderBottom: '1px solid var(--surface-border)' }}>
                        <span style={{ color: 'var(--text-primary)', flex: 1 }}>{t}</span>
                        <button
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-disabled)', fontSize: '0.7rem', whiteSpace: 'nowrap' }}
                          onClick={() => { navigator.clipboard.writeText(t); toastSuccess('Copied'); }}
                        >Copy</button>
                      </div>
                    ))}
                  </div>
                  {brandCopy.pitch && (
                    <div>
                      <p style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Elevator Pitch</p>
                      <p style={{ color: 'var(--text-primary)', lineHeight: 1.5 }}>{brandCopy.pitch}</p>
                      <button
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-disabled)', fontSize: '0.7rem', marginTop: 4 }}
                        onClick={() => { navigator.clipboard.writeText(brandCopy.pitch); toastSuccess('Copied'); }}
                      >Copy</button>
                    </div>
                  )}
                  {brandCopy.bio && (
                    <div>
                      <p style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Social Bio</p>
                      <p style={{ color: 'var(--text-primary)', lineHeight: 1.5 }}>{brandCopy.bio}</p>
                      <button
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-disabled)', fontSize: '0.7rem', marginTop: 4 }}
                        onClick={() => { navigator.clipboard.writeText(brandCopy.bio); toastSuccess('Copied'); }}
                      >Copy</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Generate button */}
        <div className="studio-control-section">
          <button
            className="btn btn-primary btn-generate"
            onClick={() => handleGenerate()}
            disabled={jobStatus === 'running' || !prompt.trim()}
          >
            {jobStatus === 'running'
              ? `Generating… ${(elapsedMs / 1000).toFixed(1)}s`
              : isBrandKit
              ? 'Generate Brand Kit (4 images)'
              : 'Generate'}
          </button>
          <p className="studio-hint" style={{ textAlign: 'right', marginTop: '0.25rem' }}>⌘↵</p>
        </div>

        </>)}
      </aside>

      {/* ────────────────────────────── CANVAS ──────────────────────────────── */}
      <main className="studio-canvas">

        {/* Error state */}
        {jobStatus === 'failed' && studioError && (
          <div style={{ padding: '0 16px 16px' }}>
            <StudioErrorBanner
              error={studioError}
              onDismiss={() => setStudioError(null)}
              onRetry={() => handleGenerate()}
            />
          </div>
        )}

        {/* Brand kit 2x2 grid */}
        {isBrandKit && brandKitResults.length > 0 && (
          <>
          <div className="biz-brandkit-grid">
            {brandKitResults.map((r, i) => {
              const labels = ['Logo Mark', 'Brand Banner', 'Profile Image', 'OG Meta'];
              return r.resultUrl ? (
                <div key={i} className="biz-brandkit-cell">
                  <div className="biz-brandkit-img" style={{ position: 'relative', aspectRatio: '1' }}>
                    <Image src={r.resultUrl} alt={labels[i]} fill className="object-cover" placeholder="blur" blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" sizes="300px" />
                  </div>
                  <div className="biz-brandkit-footer">
                    <span className="biz-brandkit-label">{labels[i]}</span>
                    <button
                      className="btn-ghost btn-xs"
                      onClick={() => r.resultUrl && handleDownload(r.resultUrl, (i + 1).toString())}
                    >
                      ↓
                    </button>
                  </div>
                </div>
              ) : null;
            })}
          </div>
          {/* Export brand kit as JSON */}
          <div style={{ padding: '8px 0 4px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              className="btn-ghost btn-sm"
              onClick={handleExportBrandKitJson}
            >
              Export Brand Kit
            </button>
          </div>
          </>
        )}

        {/* Single output */}
        {!isBrandKit && jobStatus !== 'idle' && (
          <div className="studio-output-frame">
            {jobStatus === 'running' && (
              <div className="studio-output-loading">
                <div className="studio-spinner" />
                <span>{loadingMsg} {(elapsedMs / 1000).toFixed(1)}s</span>
                <div className="studio-shimmer-wrap" style={{ marginTop: 12, maxWidth: 360 }}>
                  <div className="studio-shimmer-block" style={{ height: 240, borderRadius: 8 }} />
                  <div className="studio-shimmer-block" style={{ height: 14, width: '45%', alignSelf: 'center' }} />
                </div>
              </div>
            )}
            {jobStatus === 'failed' && (
              <div className="studio-error-card">
                <p className="studio-error-card__title">Generation failed</p>
                {studioError && (
                  <p className="studio-error-card__msg">{studioError.message}</p>
                )}
                <button className="btn-secondary" onClick={() => handleGenerate()}>↻ Retry</button>
              </div>
            )}
            {displayResult?.resultUrl && jobStatus !== 'running' && (
              <>
                <div key={displayResult.resultUrl} className="generated-result-enter" style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={displayUrl ?? displayResult.resultUrl}
                    alt="Generated business asset"
                    className="studio-output-img biz-output-img"
                  />
                  {/* Remove BG button on hover */}
                  <button
                    onClick={() => displayResult.resultUrl && handleBgRemove(displayUrl ?? displayResult.resultUrl)}
                    disabled={bgRemoving}
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      opacity: 0,
                      transition: 'opacity 0.15s',
                      fontSize: '0.72rem',
                      padding: '3px 8px',
                      background: 'rgba(0,0,0,0.7)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: 4,
                      color: '#fff',
                      cursor: bgRemoving ? 'wait' : 'pointer',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '0'; }}
                    title="Remove background"
                  >
                    {bgRemoving ? 'Removing…' : 'Remove BG'}
                  </button>
                </div>
                {/* Color palette */}
                {(displayUrl ?? displayResult.resultUrl) && (
                  <ColorPalette imageUrl={displayUrl ?? displayResult.resultUrl!} />
                )}
                <div className="studio-output-toolbar">
                  {displayResult.width && displayResult.height && (
                    <span className="studio-output-size">
                      {displayResult.width} × {displayResult.height}
                    </span>
                  )}
                  {(displayResult as GenerationResult)?.guestDownloadGated ? (
                    <a
                      href="/api/auth/signin"
                      style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        background: '#f59e0b18',
                        border: '1px solid #f59e0b55',
                        color: '#f59e0b',
                        fontSize: 11,
                        fontWeight: 600,
                        textDecoration: 'none',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Sign in to download →
                    </a>
                  ) : (
                    <button
                      className="btn-ghost btn-sm"
                      onClick={() => handleDownload(displayUrl ?? displayResult.resultUrl!)}
                    >
                      ↓ Download
                    </button>
                  )}
                  <button
                    className="btn-ghost btn-sm"
                    onClick={() => { const u = displayUrl ?? displayResult.resultUrl; if (u) { navigator.clipboard.writeText(u); toastSuccess('URL copied'); } }}
                  >
                    Copy URL
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Output format selector (shown after wizard generation) ────── */}
        {wizardData && jobStatus === 'succeeded' && (
          <div className="biz-studio-format-selector">
            <p className="biz-studio-format-selector__label">Export Format</p>
            <div className="biz-studio-format-options-grid">
              {OUTPUT_FORMATS.map(f => (
                <button
                  key={f.id}
                  type="button"
                  className={[
                    'biz-studio-format-option',
                    selectedFormat === f.id ? 'biz-studio-format-option--active' : '',
                  ].join(' ')}
                  onClick={() => setSelectedFormat(f.id)}
                >
                  <span className="biz-studio-format-option__name">{f.label}</span>
                  <span className="biz-studio-format-option__size">{f.size}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.75rem' }}
              onClick={handleExportAll}
            >
              ↓ Export All Sizes
            </button>
          </div>
        )}

        {/* Idle state */}
        {jobStatus === 'idle' && (
          <div className="studio-idle">
            <div className="studio-idle-icon">⬛</div>
            <p className="studio-idle-title">Business mode</p>
            <p className="studio-idle-desc">
              {TOOLS.find(t => t.id === activeTool)?.desc}
            </p>
            <div className="studio-idle-chips">
              {(['logo', 'social', 'slide', 'web-hero'] as BusinessTool[]).map(t => (
                <button
                  key={t}
                  className="studio-chip"
                  onClick={() => { switchTool(t); setPrompt(EXAMPLE_PROMPTS[t]); }}
                >
                  {EXAMPLE_PROMPTS[t].slice(0, 50)}…
                </button>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* ────────────────────────────── HISTORY ─────────────────────────────── */}
      <aside className="studio-history">
        <div className="studio-history-header">
          <span className="studio-history-title">History</span>
        </div>
        <div className="studio-history-list">
          {history.length === 0 && (
            <p className="studio-history-empty">Generated assets appear here</p>
          )}
          {history.map((item, idx) => (
            <button
              key={item.id}
              className={`studio-history-item${selectedHistory === idx ? ' active' : ''}`}
              onClick={() => { setResult({ jobId: item.id, resultUrl: item.resultUrl }); setSelHistory(idx); }}
            >
              {item.resultUrl
                ? (
                    <div className="studio-history-thumb biz-history-thumb" style={{ position: 'relative' }}>
                      <Image src={item.resultUrl} alt={item.prompt?.slice(0, 50) || 'Generated business asset'} fill className="object-cover" sizes="48px" />
                    </div>
                  )
                : <div className="studio-history-thumb studio-history-thumb--empty">⬛</div>
              }
              <div className="studio-history-meta">
                <span className="studio-history-tool">{item.tool}</span>
                <span className="studio-history-prompt">{item.prompt.slice(0, 32)}…</span>
              </div>
            </button>
          ))}
        </div>
      </aside>

      <EralSidebar mode="business" tool={activeTool} prompt={prompt} />
    </div>
  );
}

// Wrap with Suspense for useSearchParams
export default function BusinessStudio() {
  return (
    <Suspense fallback={<div className="studio-layout" />}>
      <BusinessStudioInner />
    </Suspense>
  );
}

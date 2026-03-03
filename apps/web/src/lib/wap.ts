// WokGen Action Protocol — structured commands Eral can dispatch to the platform

export type WAPActionType =
  | 'navigate'           // Go to a URL
  | 'setParam'           // Set a studio parameter
  | 'generate'           // Trigger a generation
  | 'openModal'          // Open a modal/overlay
  | 'showTip'            // Show a tooltip/hint overlay
  | 'clearHistory'       // Clear studio history
  | 'toggleHD'           // Toggle HD mode
  | 'setPrompt'          // Fill the prompt field
  | 'setTool'            // Select a tool in the studio
  | 'openGallery'        // Navigate to gallery
  | 'saveToGallery'      // Save current generation
  | 'downloadAsset'      // Download current asset
  // Cycle 13 additions:
  | 'batchGenerate'      // Fire a batch with N prompts
  | 'createProject'      // Create a named project with brief
  | 'saveToBrandKit'     // Save current palette to active brand kit
  | 'scheduleGeneration' // Create an automation with config and schedule
  | 'searchGallery'      // Return public assets matching a style query
  | 'voiceText'          // Send text output to Voice Studio
  | 'exportAssets'       // Trigger ZIP export of current batch or project
  | 'openPanel'          // Open a specific control panel or modal
  | 'setQuality'         // Switch HD/standard toggle
  | 'openTool'           // Navigate to a /tools/* page
  | 'processImage'      // Navigate to a tool with an image pre-loaded
  | 'rememberFact'     // Save a fact to user's Eral memory
  | 'readURL'          // Read and summarize any webpage
  | 'webSearch';       // Search the web for current information

export interface WAPAction {
  type: WAPActionType;
  // For 'navigate' | 'openGallery':
  path?: string;
  // For 'setParam':
  key?: string;
  value?: string | number | boolean;
  // For 'generate':
  prompt?: string;
  tool?: string;
  size?: number;
  style?: string;
  // For 'showTip':
  message?: string;
  targetSelector?: string;
  // For 'setPrompt':
  text?: string;
  // For 'batchGenerate' (Cycle 13):
  prompts?: string[];
  count?: number;
  // For 'createProject':
  name?: string;
  brief?: string;
  // For 'scheduleGeneration':
  schedule?: string;   // cron expression
  // For 'searchGallery':
  query?: string;
  mode?: string;
  // For 'voiceText':
  voiceText?: string;
  // For 'exportAssets':
  projectId?: string;
  batchJobIds?: string[];
  // For 'openPanel':
  panel?: string;
  // For 'setQuality':
  quality?: 'hd' | 'standard';
  // For 'openTool' | 'processImage':
  toolId?: string;        // e.g. "background-remover", "image-compress"
  imageUrl?: string;      // data URL or remote URL to pre-load into the tool
}

export interface WAPResponse {
  actions: WAPAction[];
  confirmation: string; // Human-readable confirmation of what's happening
}

// Action category descriptors for system prompt
export const WAP_CAPABILITIES = `
You can perform real actions on the WokGen platform by returning a JSON block at the end of your response.

Supported actions:
- navigate: Go to a URL (path: "/studio", "/business/studio", "/studio", "/uiux/studio", "/voice/studio", "/text/studio", "/eral", "/community", "/pricing", "/docs", "/tools")
- setParam: Set a studio parameter (key: "size" | "tool" | "style" | "prompt" | "hd", value: the value)
- setPrompt: Fill the prompt field with text (text: "your prompt here")
- setTool: Select a studio tool
- generate: Trigger generation with params (prompt, tool, size, style)
- toggleHD: Enable/disable HD mode
- openGallery: Open the gallery for current or specified mode
- showTip: Show a helpful tip overlay (message: "tip text")
- batchGenerate: Fire a batch with multiple prompts (prompts: ["p1","p2"], tool: "sprite")
- createProject: Create a named project (name: "Game Kit 2024", brief: "2D platformer assets")
- voiceText: Send text to Voice Studio (voiceText: "the text to narrate")
- exportAssets: Trigger ZIP export (projectId: "..." or batchJobIds: ["id1","id2"])
- openPanel: Open a specific panel (panel: "brand-kit" | "history" | "settings" | "gallery")
- setQuality: Switch quality mode (quality: "hd" | "standard")
- openTool: Navigate to a free tool (toolId: "background-remover" | "image-compress" | "image-resize" | "font-pairer" | "color-tools" | "css-generator" | "json-tools" | "regex" | "encode-decode" | "hash" | "generators" | "text-tools" | "markdown" | "csv-tools" | "og-preview" | "color-palette" | "mockup" | "social-resize" | "pixel-editor" | "sprite-packer" | "whiteboard" | "snippets" | "pdf" | "crypto-tools" | "audio-tools" | "tilemap" | "font-pairer")
- processImage: Open a specific tool with an image URL pre-loaded (toolId: "background-remover" | "image-compress" | "image-resize" | "color-palette", imageUrl: "https://...")
- rememberFact: Save something the user wants remembered (key: short label, value: what to remember)
- readURL: Read and summarize any webpage (url: full URL to fetch)
- webSearch: Search the web via Exa AI for current information (query: search query)

Format (append to your reply only when taking action):
<wap>{"actions":[{"type":"navigate","path":"/studio"},{"type":"setParam","key":"size","value":64}],"confirmation":"Opening Pixel Studio and setting size to 64×64"}</wap>

Examples:
- User: "Take me to the pixel studio" → navigate action
- User: "Set the size to 64" → setParam action
- User: "Generate a fire mage character" → setPrompt + generate action
- User: "Make a batch of 4 enemy sprites" → batchGenerate action
- User: "Create a project called Game Kit" → createProject action
- User: "Send this to voice studio" → voiceText action
- User: "Export everything to ZIP" → exportAssets action
- User: "Open the background remover" → openTool action (toolId: "background-remover")
- User: "Remove the background from my image" → processImage action
- User: "Compress this image" → openTool action (toolId: "image-compress")
- User: "Remember that I prefer dark themes" → rememberFact action (key: "style preference", value: "dark themes")
- User: "What's on this page: https://example.com" → readURL action
- User: "Search for latest AI news" → webSearch action
- User: "How do I make better pixel art?" → NO wap block, just answer

CRITICAL RULES:
1. Only include <wap> block when you're ACTUALLY taking an action the user requested
2. Pure questions/conversations → no <wap> block
3. Always explain the action in plain English BEFORE the <wap> block
4. If navigating somewhere, always navigate FIRST before setting params
`.trim();

// Parse WAP actions from Eral's response
export function parseWAPFromResponse(rawReply: string): { cleanReply: string; wap: WAPResponse | null } {
  const match = rawReply.match(/<wap>([\s\S]*?)<\/wap>/);
  if (!match) return { cleanReply: rawReply, wap: null };

  const cleanReply = rawReply.replace(/<wap>[\s\S]*?<\/wap>/, '').trim();

  try {
    const wap = JSON.parse(match[1]) as WAPResponse;
    if (!Array.isArray(wap.actions)) return { cleanReply, wap: null };
    return { cleanReply, wap };
  } catch {
    return { cleanReply, wap: null };
  }
}

// Dispatch a WAP action as a custom DOM event
export function dispatchWAPAction(action: WAPAction): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('wokgen:action', { detail: action }));
}

// Execute a WAP response (dispatch all actions)
export function executeWAP(wap: WAPResponse, router?: { push: (path: string) => void }): void {
  for (const action of wap.actions) {
    if ((action.type === 'navigate' || action.type === 'openGallery') && action.path) {
      if (router) {
        router.push(action.path);
      } else if (typeof window !== 'undefined') {
        window.location.href = action.path;
      }
    } else if (action.type === 'voiceText' && action.voiceText && router) {
      // Navigate to voice studio with text pre-filled via query param
      router.push(`/voice/studio?text=${encodeURIComponent(action.voiceText)}`);
    } else if (action.type === 'exportAssets') {
      // Dispatch to the studio's export handler
      dispatchWAPAction(action);
    } else if (action.type === 'createProject') {
      // Route to /projects/new with name+brief pre-filled
      if (router && action.name) {
        router.push(`/projects/new?name=${encodeURIComponent(action.name)}${action.brief ? `&brief=${encodeURIComponent(action.brief)}` : ''}`);
      }
    } else if (action.type === 'setQuality') {
      // Dispatch as setParam so studios can handle it
      dispatchWAPAction({ type: 'setParam', key: 'hd', value: action.quality === 'hd' });
    } else if (action.type === 'openTool' && action.toolId) {
      const url = `https://tools.wokspec.org/tools/${action.toolId}`;
      if (typeof window !== 'undefined') window.open(url, '_blank', 'noopener');
    } else if (action.type === 'processImage' && action.toolId) {
      const params = action.imageUrl ? `?imageUrl=${encodeURIComponent(action.imageUrl)}` : '';
      const url = `https://tools.wokspec.org/tools/${action.toolId}${params}`;
      if (typeof window !== 'undefined') window.open(url, '_blank', 'noopener');
    } else if (action.type === 'rememberFact' && action.key && action.value) {
      // Fire-and-forget: save to Eral memory API
      fetch('/api/eral/memory', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action: 'remember', key: action.key, value: action.value }),
      }).catch(() => { /* non-fatal */ });
    } else {
      dispatchWAPAction(action);
    }
  }
}

// WAP action log entry for Eral sidebar display
export interface WAPLogEntry {
  id: string;
  type: WAPActionType;
  confirmation: string;
  timestamp: number;
}

// Store last N WAP actions in sessionStorage
export function logWAPAction(wap: WAPResponse): void {
  if (typeof window === 'undefined') return;
  try {
    const existing: WAPLogEntry[] = JSON.parse(sessionStorage.getItem('wap:log') ?? '[]');
    const entry: WAPLogEntry = {
      id:           Math.random().toString(36).slice(2),
      type:         wap.actions[0]?.type ?? 'navigate',
      confirmation: wap.confirmation,
      timestamp:    Date.now(),
    };
    const updated = [entry, ...existing].slice(0, 5);
    sessionStorage.setItem('wap:log', JSON.stringify(updated));
  } catch { /* ignore */ }
}

export function getWAPLog(): WAPLogEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(sessionStorage.getItem('wap:log') ?? '[]');
  } catch { return []; }
}

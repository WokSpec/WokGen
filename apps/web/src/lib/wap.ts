// WokGen Action Protocol — structured commands Eral can dispatch to the platform

export type WAPActionType =
  | 'navigate'        // Go to a URL
  | 'setParam'        // Set a studio parameter
  | 'generate'        // Trigger a generation
  | 'openModal'       // Open a modal/overlay
  | 'showTip'         // Show a tooltip/hint overlay
  | 'clearHistory'    // Clear studio history
  | 'toggleHD'        // Toggle HD mode
  | 'setPrompt'       // Fill the prompt field
  | 'setTool'         // Select a tool in the studio
  | 'openGallery'     // Navigate to gallery
  | 'saveToGallery'   // Save current generation
  | 'downloadAsset';  // Download current asset

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
}

export interface WAPResponse {
  actions: WAPAction[];
  confirmation: string; // Human-readable confirmation of what's happening
}

// Action category descriptors for system prompt
export const WAP_CAPABILITIES = `
You can perform real actions on the WokGen platform by returning a JSON block at the end of your response.

Supported actions:
- navigate: Go to a URL (path: "/pixel/studio", "/business/studio", "/vector/studio", "/emoji/studio", "/uiux/studio", "/voice/studio", "/text/studio", "/eral", "/community", "/pricing", "/docs")
- setParam: Set a studio parameter (key: "size" | "tool" | "style" | "prompt" | "hd", value: the value)
- setPrompt: Fill the prompt field with text (text: "your prompt here")
- setTool: Select a studio tool (tool: "character" | "enemy" | "tileset" | "item" | "ui" | "animation" for Pixel; "logo" | "brand-kit" | "slide" | "social" for Business; etc.)
- generate: Trigger generation with params
- toggleHD: Enable/disable HD mode
- openGallery: Open the gallery for current or specified mode
- showTip: Show a helpful tip overlay (message: "tip text")

Format (append to your reply only when taking action):
<wap>{"actions":[{"type":"navigate","path":"/pixel/studio"},{"type":"setParam","key":"size","value":64}],"confirmation":"Opening Pixel Studio and setting size to 64×64"}</wap>

Examples of commands vs questions:
- User: "Take me to the pixel studio" → Use navigate action
- User: "Set the size to 64" → Use setParam action
- User: "Generate a fire mage character" → Use setPrompt + generate action
- User: "How do I make better pixel art?" → NO wap block, just answer
- User: "What's the difference between standard and HD?" → NO wap block, just answer
- User: "Open my gallery" → Use navigate to gallery
- User: "Go to pricing" → Use navigate to /pricing

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
    } else {
      dispatchWAPAction(action);
    }
  }
}

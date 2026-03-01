/**
 * Eral Integration Contract
 * -------------------------
 * Eral is a standalone product developed separately under wokspec/Eral.
 * WokGen integrates with Eral via this file only — no direct internal imports
 * of Eral logic should bypass these constants and helpers.
 *
 * Environment variables (add to .env.local):
 *   NEXT_PUBLIC_ERAL_ENABLED=true          — toggles all Eral UI in WokGen
 *   NEXT_PUBLIC_ERAL_URL=https://eral.wokspec.com  — standalone Eral origin
 *
 * Integration surface:
 *   1. EralCompanion   — floating widget in root layout (client-side only)
 *   2. EralSidebar     — collapsible panel in studio pages (optional per-studio)
 *   3. /eral/* routes  — thin shell that embeds or links to standalone Eral
 *   4. WAP protocol    — WokGen Action Protocol (lib/wap.ts) dispatches DOM events
 *                        that Eral listens to — this is the bidirectional contract
 *
 * WAP event channel (window events):
 *   WokGen  → Eral:  CustomEvent('wap:dispatch', { detail: WAPAction })
 *   Eral    → WokGen: CustomEvent('eral:action', { detail: WAPAction })
 */

/** Whether Eral features are enabled in this WokGen deployment */
export const ERAL_ENABLED =
  process.env.NEXT_PUBLIC_ERAL_ENABLED === 'true';

/**
 * Base URL of the standalone Eral product.
 * Falls back to the bundled /eral route when not set (local-only mode).
 */
export const ERAL_URL =
  process.env.NEXT_PUBLIC_ERAL_URL ?? '/eral';

/** The chat API endpoint WokGen uses when Eral is bundled (local mode only) */
export const ERAL_CHAT_API = '/api/eral/chat';

/**
 * Context passed from WokGen studios to Eral.
 * This is the payload shape both sides must agree on.
 */
export interface EralStudioContext {
  /** Active studio mode id, e.g. "pixel" | "vector" | "business" */
  mode: string;
  /** Active tool within the studio, if any */
  tool?: string;
  /** Current prompt text in the studio */
  prompt?: string;
  /** Freeform extra context string from the studio */
  studioContext?: string;
  /** Active project id, if set */
  projectId?: string;
}

/**
 * Helper: dispatch a WAP action to Eral via DOM event.
 * Eral (standalone or bundled) must listen for 'wap:dispatch' on window.
 */
export function sendWAPToEral(action: import('./wap').WAPAction): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('wap:dispatch', { detail: action }));
}

/**
 * Helper: subscribe to actions Eral sends back to WokGen.
 * Returns an unsubscribe function.
 */
export function onEralAction(
  handler: (action: import('./wap').WAPAction) => void
): () => void {
  if (typeof window === 'undefined') return () => {};
  const listener = (e: Event) => handler((e as CustomEvent).detail);
  window.addEventListener('eral:action', listener);
  return () => window.removeEventListener('eral:action', listener);
}

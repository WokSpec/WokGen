/**
 * WokGen generation event helpers.
 * Dispatch/listen custom browser events across components without prop drilling.
 * Usage:
 *   emitGenerationStart(jobId, 'pixel', 'a fox in a forest')
 *   emitGenerationComplete(jobId, resultImageUrl)
 *   emitGenerationFailed(jobId, 'Out of quota')
 */

export function emitGenerationStart(jobId: string, mode: string, prompt: string): void {
  window.dispatchEvent(
    new CustomEvent('wokgen:generation-start', { detail: { jobId, mode, prompt } }),
  );
}

export function emitGenerationComplete(jobId: string, imageUrl?: string): void {
  window.dispatchEvent(
    new CustomEvent('wokgen:generation-complete', { detail: { jobId, imageUrl } }),
  );
}

export function emitGenerationFailed(jobId: string, error: string): void {
  window.dispatchEvent(
    new CustomEvent('wokgen:generation-failed', { detail: { jobId, error } }),
  );
}

/**
 * WokGen Pixel Mode — Exporter Interface
 *
 * Implement this interface to add a custom export format to Pixel mode.
 *
 * Example: A WebP exporter, a ZIP packer, or a sprite atlas builder.
 */

import type { PixelExporter } from './schema';

export type { PixelExporter };

/**
 * Register a custom exporter for the Pixel mode.
 * In a full implementation, this would be called at app init time.
 */
export function registerPixelExporter(exporter: PixelExporter): void {
  // Implementation: register with the export pipeline
  // In the hosted platform this connects to the exporter registry.
  // In self-hosted: implement this to add your custom export logic.
  console.log(`[pixel] Registered exporter: ${exporter.format}`);
}

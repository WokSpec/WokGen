/**
 * WokGen Pixel Mode — OSS Prompt Builder
 *
 * Re-exports the OSS stub with pixel-specific typing.
 * For production quality, the hosted platform uses a private implementation.
 */

export {
  buildPixelPromptOSS as buildPixelPrompt,
  buildNegativePromptOSS as buildNegativePrompt,
} from '../../packages/prompts/src/stub';

export type { PixelPromptParams as PixelPromptInput } from '../../packages/prompts/src/stub';

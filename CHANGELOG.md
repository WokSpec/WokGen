# Changelog

All notable changes to WokGen are documented in this file.

## [2.0.0] — 2025-07-20

### Master Plan Cycles C1–C21 (Professional Hardening & Expansion)

#### Branding & Polish (C1–C3)
- **Zero emoji enforcement**: All emoji removed from 48+ source files, tools-registry, Discord messages, and email templates. Tools-registry uses text abbreviations (BG, CV, CMP, etc.) as icons.
- **WokGen IS the studio**: Pixel, Business, Vector, UI/UX, Voice, Text are now consistently referred to as "modes" within WokGen Studio — not individual studios. All navigation, breadcrumbs, metadata, and copy updated.
- **Eral 7c branding**: AI companion is consistently branded as "Eral 7c" (variants: Eral Mini, Eral Code, Eral Creative) across all UI surfaces.
- **canvas-confetti removed**: Dependency removed from package.json; `lib/confetti.ts` deleted; all `fireConfetti()` call sites removed.
- **DonationStrip removed** from the main layout.

#### Auth (C9)
- **Google OAuth**: Added Google provider to NextAuth v5 config with `allowDangerousEmailAccountLinking: true`. Login page shows Google and GitHub buttons. DEPLOYMENT.md updated with Google OAuth setup guide.

#### Eral Notepad (C7)
- **EralNote + EralNoteTag** models added to Prisma schema (cascade delete).
- **API routes**: `GET/POST /api/eral/notes`, `PATCH/DELETE /api/eral/notes/[id]`.
- **EralNotepad component**: Full UI with note list, editor, auto-save (debounced 500ms), pin, 5-color swatches, guest localStorage fallback.
- **EralSidebar** now has Chat/Notes tab switcher — Eral 7c chat on one tab, notepad on the other.
- "Send to Eral" from a note pre-fills the chat input.

#### Eral Personalization (C8)
- **eralMemory** and **eralContext** fields added to `UserPreference` model.
- **`/api/eral/memory`** route: GET (list facts/context), POST (remember/forget/set_context).
- **WAP `rememberFact` action**: Eral can now save user facts via WAP when asked to "remember" something.
- **Eral chat API** injects eralMemory facts and eralContext (project type, main tool, style preference) into every system prompt.

#### WokGen Studio Hub (C17)
- **`/studio`** is now a proper mode-selector hub page instead of a redirect. Displays all 6 modes with status badges, descriptions, and category tags.

#### New Tools (C14/C15/C16C)
- **README Generator**: Form-based professional README.md builder with live preview and download.
- **JWT Debugger**: Client-side JWT decode — header, payload, expiry, signature display. Nothing leaves the browser.
- **Base Converter**: Binary / octal / decimal / hexadecimal conversion with copy buttons.
- **Tech Stack Badge Builder**: Select from 40+ technologies; generates shields.io badge markdown for READMEs.

#### Security & Quality (C10/C12/C19)
- Confirmed CSP, HSTS, and edge rate limiting in middleware.
- All admin routes require `requireAdmin()` guard.
- `console.log` removed from automation test route.
- `npm audit` — no critical vulnerabilities.

---

## [1.1.0] — 2025-07-15

### Cycles 40–44 (Final Cycles)

#### Added
- **Notification Bell** (c40): `NotificationBell` component in nav — unread badge, dropdown with last 10 notifications, mark-all-read button
- **Bulk Download** (c43): Pixel gallery now supports multi-select checkboxes and a "Download selected" button that opens each image in a new tab
- **Automations Test Run** (c42): Test button now available for all automation types (email, in_app, webhook). Non-webhook types log and update `lastRunAt`; webhooks fire the URL and return HTTP status

#### Improved
- **Page Performance** (c41): Added `loading="lazy"` to below-fold images in community gallery modal
- **Automations Test Route** (c42): Test route now updates `lastRunAt`/`lastRunStatus` after any test run and returns `{ ok: true, message }` consistently

### Cycles 1–39

#### Core Platform
- **c1–c3**: Initial pixel, business, vector, UI/UX studios; removed emoji mode with redirects
- **c4**: Replaced all emoji icons with SVG components site-wide
- **c5–c6**: Visual polish, typography, spacing, and color system tokens
- **c7**: Style-aware provider routing with quality gate and request tracing
- **c8**: Prompt Intelligence Engine — quality classifier, auto-enrichment, examples library
- **c9**: Structured logging with pino across all API routes
- **c10**: DB performance — Job index on `(projectId, status)`, Notification model

#### Infrastructure
- **c11**: Redis cache layer — admin stats caching + cache key constants
- **c12**: Rate limits by plan — HD/batch/director/Eral quotas + 80% warning notifications
- **c13**: WAP (Workspace Automation Platform) — 8 actions, action log, execute handlers
- **c14**: Eral Director — project type selector, retry-failed, export manifest
- **c15**: Eral Simulate — export .txt/.md, Voice This, stop/add-turn controls
- **c16**: Eral context memory — project brief injection + mode-aware asset context
- **c17**: Onboarding use cases expanded — Product Design and Explore added
- **c18**: Universal studio layout system — `StudioResultPanel`, `GeneratingState`, `StudioEmpty`

#### Studio Features
- **c19**: Pixel studio — capture provider header, show in metadata strip
- **c20**: Voice studio — character presets and text URL param pre-population
- **c21**: Text studio — SSE streaming scaffold
- **c22**: Business studio — target audience field, YouTube thumbnail and TikTok cover platforms
- **c23**: Vector studio — detect SVG content type for download extension
- **c24**: Community gallery — trending sort, remix button, removed emoji mode
- **c25**: Asset permalink at `/assets/[id]`
- **c26**: Style mirror — copy style from community modal, apply in pixel studio

#### APIs & Integrations
- **c27**: Notifications API — GET unread, PATCH mark all read
- **c28**: OpenAPI spec — added missing endpoints + interactive docs page
- **c29**: Webhooks system — Webhook model + `/api/webhooks/user` GET/POST
- **c30**: TypeScript SDK — `@wokgen/sdk` with `generate` and `getJob`
- **c31**: Referral system — Referral model + `/api/referrals` GET/POST
- **c32**: Admin panel — Provider Health tab
- **c33**: Error handling hardening in generate route and studio error components
- **c34**: BullMQ async queue scaffold with `QUEUE_ENABLED` flag
- **c35**: `typecheck` script added to root `package.json`

#### Security & Ops
- **c36**: Security headers hardening — X-DNS-Prefetch-Control, tightened CSP `img-src`
- **c37**: Input validation hardening with `input-sanitize.ts`
- **c38**: Eral docs tutorial page and link from docs hub
- **c39**: Dockerfile health check fixed to `/api/health`; self-hosted env vars documented

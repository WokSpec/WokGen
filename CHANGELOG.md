# Changelog

All notable changes to WokGen are documented in this file.

## [3.0.0] — 2026-02-25

### Cycles C3–C10: Studio Unification, Documents, Context Intelligence, API Hardening

#### Studio Unification (C1)
- Unified Studio Shell: all asset types accessible from `/studio?type=X`, single shell, single nav rail
- Studio→Project binding: project picker in context bar, `?projectId=X` URL param
- All old `/pixel/studio`, `/business/studio` etc. routes redirect to unified shell
- Removed all redundant sub-client mode headers

#### Project Workspace (C2)
- Project dashboard tabs: Assets, Documents, Activity, Settings
- "Ask Eral" button links to `/eral?projectId=X`
- Dashboard: recent projects shown as primary content above nav grid
- Eral reads `?projectId=` from URL and auto-selects project context

#### Documents System (C3)
- Tiptap rich-text editor at `/projects/[id]/docs/[docId]`
- CRUD API: `GET/POST /api/projects/[id]/documents`, `GET/PATCH/DELETE /api/projects/[id]/documents/[docId]`
- Documents tab in project dashboard with template picker
- 5 templates: GDD, Brand Book, Content Calendar, Tech Spec, Release Notes
- Auto-save with 1.2s debounce, Markdown export

#### Context Intelligence (C4)
- New `/api/projects/[id]/context` — returns brief + brand kit in one call
- Studio shell shows project name, art style tag, brand color swatch in context bar when project active
- Eral API already had project brief injection (confirmed functional)

#### Generation Pipeline (C5)
- Webhook dispatch on `job.succeeded` fires to all active user webhooks (non-blocking)
- PostProcessToolbar confirmed live in pixel + vector studios

#### Tools Curation (C6)
- All 67 tools verified as `'live'` status with working implementations
- Old studio route links updated throughout community, gallery, asset pages
- Tools page structured with sidebar categories, starred tools, recently used

#### Navigation & Architecture (C9)
- Nav simplified: Studio, Projects, Tools, Community, Developers
- Eral removed from primary nav — now a floating companion button (site-wide)
- `EralCompanion` component: 44px fixed button bottom-right, opens 360×560 chat panel
- Mobile nav updated to reflect simplified structure
- Homepage hero updated: "One studio. Everything you need." with unified studio CTA
- Mode cards link to `/studio?type=X` (not old `/pixel/studio` routes)
- `Eral 7c` branding confirmed throughout homepage

#### API Hardening & SDK (C7)
- TypeScript SDK at `/public/sdk/wokgen.ts` — `WokGenClient` with `generate()`, `getJob()`, `waitForJob()`, `getAssets()`, `processAsset()`, `getMe()`
- New `POST /api/v1/assets/[id]/process` — bg-remove, vectorize, resize, compress ops
- Developers page updated to reference downloadable SDK

#### Production Hardening (C10)
- Zero TypeScript errors confirmed on all changed files
- Clean `next build` confirmed before every commit
- Security headers: X-Frame-Options DENY, nosniff, CSP, HSTS on prod
- Health endpoint `/api/health` verified with DB, Redis, provider checks
- `.env.example` has 199 documented vars
- OSS infrastructure: CONTRIBUTING.md, SECURITY.md, CODE_OF_CONDUCT.md, CODEOWNERS, PR template all in place

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
- **c40**: Final security audit — X-XSS-Protection header added, middleware protected routes expanded to /library, /projects, /dashboard; deployment readiness confirmed

---

## [2.0.0] — 2025 — Feature Summary

### Added
- WokAPI developer platform with `/developers` page and `@wokspec/sdk` package scaffold
- 20+ new tools: media downloader, link scraper, shadow generator, UUID generator, SQL formatter, OG analyzer, favicon extractor, website palette, link checker, color converter, password generator, diff tool, cron builder, aspect ratio calculator, font weight tester, gradient animator, icon search, invoice generator, privacy policy generator, MD to HTML, changelog writer, JSON-to-TypeScript
- Light/dark mode with system preference detection and per-user persistence
- Eral Notepad — persistent site-wide notes companion
- Eral 7c memory system — remembers user preferences across sessions
- Google OAuth sign-in
- Personal analytics dashboard (`/dashboard/analytics`)
- Admin platform metrics dashboard (`/admin/metrics`)
- Asset Library (`/library`) — unified view of all generated assets
- Projects/Workspaces hub (`/projects`)
- Account settings page (`/settings`) with OAuth providers, preferences, and account deletion
- Browser extension v2 — Eral panel, asset harvester, settings page
- Loading skeleton screens for all tool and studio routes
- Accessibility improvements: skip-to-content link, 404/error pages, aria labels
- WokAPI/WokSDK developer branding

### Improved
- WokGen Studio branding — unified platform with modes (not separate studios)
- Eral 7c branding throughout
- Zero-emoji enforcement across all UI surfaces
- Backend hardening: standardized error responses, rate limiting, provider health tracking
- Job queue robustness: BullMQ limits, 5-minute timeouts, dead-letter handling
- ElevenLabs-inspired dark design system

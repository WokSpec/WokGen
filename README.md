# WokGen

AI pixel art studio. Generate sprites, tilesets, animations, and game-ready assets — then edit them in the browser.

**Live:** [wokgen.wokspec.org](https://wokgen.wokspec.org)

---

## What's inside

| Tool | Description |
|------|-------------|
| **AI Generator** | Text-to-pixel-art. 18 style presets, multiple aspect ratios. |
| **Animator** | Multi-frame sprite animations exported as looping GIF. |
| **Scene Builder** | Coherent tilesets and environment scenes from a single prompt. |
| **Pixel Editor** | Browser-based canvas editor — pencil, fill, eraser, palette, PNG export. Works offline. |
| **Gallery** | Browse and save community generations. |

### AI providers

| Provider | Used for |
|----------|----------|
| Fal.ai / FLUX | Standard generation |
| FLUX Pro (Replicate) | HD quality generation |
| Real-ESRGAN | Upscaling |
| ControlNet | Sketch/palette-guided generation |

Eral is integrated site-wide — persistent memory, brand context, project scoping. Can trigger generation jobs directly from chat.

---

## Stack

```
Framework:   Next.js (App Router)
Language:    TypeScript
Database:    PostgreSQL via Prisma (Neon)
Auth:        NextAuth v5 (GitHub + Google)
Queue:       BullMQ + Redis (Upstash)
Payments:    Stripe
Deploy:      Vercel
```

---

## Local development

```bash
git clone https://github.com/WokSpec/WokGen
cd WokGen
cp apps/web/.env.example apps/web/.env.local
# fill in DB, auth, and AI API keys
npm install --legacy-peer-deps
npm run web:dev
```

Visit [http://localhost:3000](http://localhost:3000).

The pixel editor (`/editor`) works fully offline — no API keys needed.

---

## Project structure

```
WokGen/
├── apps/
│   └── web/
│       ├── src/app/
│       │   ├── pixel/     # AI generation
│       │   ├── editor/    # Pixel editor
│       │   ├── gallery/   # Community gallery
│       │   ├── eral/      # Eral AI companion
│       │   └── api/       # API routes
│       └── prisma/
└── packages/
```

---

## Documentation

- [WokGen Architecture](./docs/architecture.md)
- [WokGen Deployment](./docs/deployment.md)
- [WokSpec Ecosystem Overview](https://github.com/WokSpec/WokDocs)
- [Contributing Guide](https://github.com/WokSpec/WokDocs/blob/main/CONTRIBUTING.md)

---

## Related

- [Vecto](https://github.com/WokSpec/Vecto) — vectors, brand, UI/UX, voice (`vecto.wokspec.org`)
- [WokTool](https://github.com/WokSpec/WokTool) — 80+ browser tools (`tools.wokspec.org`)
- [Eral](https://github.com/WokSpec/Eral) — AI layer (`eral.wokspec.org`)

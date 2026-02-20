# WokGen

**Open-source AI pixel art generation platform.**

Generate sprites, animations, tilesets, and game assets with AI. Works with Replicate, Fal.ai, Together.ai, or your local ComfyUI. Free to self-host.

---

## Tools

| Tool | Description |
|------|-------------|
| **Generate** | Text → pixel art sprite or icon (32–512px) |
| **Animate** | Sprite → GIF animation with text control |
| **Rotate** | Sprite → 4 or 8 directional views |
| **Inpaint** | Edit areas of existing pixel art with masking |
| **Scenes & Maps** | Text → tilesets, environments, game maps |

## Quick Start

```bash
git clone https://github.com/WokSpecialists/WokGen.git
cd WokGen
cp .env.example .env.local
# Add at least one AI provider key to .env.local
npm install
cd apps/web && npx prisma db push && cd ../..
npm run dev
```

Open http://localhost:3000

No account needed — provide your own API key in the Studio settings.

## AI Provider Support

WokGen is provider-agnostic. Set any combination:

| Provider | Env var | Free tier |
|----------|---------|-----------|
| [Replicate](https://replicate.com) | `REPLICATE_API_TOKEN` | ✅ Free credits for new users |
| [Fal.ai](https://fal.ai) | `FAL_KEY` | ✅ Free credits |
| [Together.ai](https://together.ai) | `TOGETHER_API_KEY` | ✅ FLUX.1-schnell-Free |
| [ComfyUI (local)](https://github.com/comfyanonymous/ComfyUI) | `COMFYUI_HOST` | ✅ Fully free |

## Repo Structure

```
WokGen/
├── apps/
│   └── web/              # Next.js app (frontend + API)
│       ├── src/app/      # Pages and API routes
│       ├── src/lib/      # Providers, auth, DB
│       └── prisma/       # SQLite schema
├── packages/
│   └── asset-pipeline/   # CLI pixel art post-processing tools
├── .env.example          # All environment variables documented
└── LICENSE               # MIT + Commons Clause
```

## API

The platform exposes a REST API:

- `POST /api/generate` — Generate pixel art
- `GET /api/jobs/[id]` — Check job status
- `GET /api/gallery` — Browse public gallery
- `GET /api/providers` — List available providers

Full API reference: [/docs](/docs)

## Self-Hosting

See the [Self-Hosting docs](/docs#self-hosting) or use Docker:

```bash
docker build -t wokgen .
docker run -p 3000:3000 --env-file .env.local wokgen
```

## License

[MIT + Commons Clause](./LICENSE) — Free for personal use, self-hosting, and modification.
You may not sell the software as an unmodified hosted service.

Copyright © 2026 Wok Specialists / WokGen Contributors

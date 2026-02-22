# Licensing

## Code License

The WokGen codebase is licensed under **Apache-2.0**.

Apache-2.0 is permissive: you can use, modify, and distribute the code commercially
without paying royalties. It requires:
- Attribution (retain copyright notices)
- State changes made to modified files
- Include the license in distributions

This includes a **patent grant** — contributors grant you rights to their patents
that cover the code. This is particularly important for generative AI systems.

## What Is and Isn't Included

### Open (included in this repository)

| Component | Location | License |
|-----------|----------|---------|
| Frontend application | `apps/web/src/app/` | Apache-2.0 |
| API route scaffolding | `apps/web/src/app/api/` | Apache-2.0 |
| Mode schema interfaces | `modes/*/schema.ts` | Apache-2.0 |
| OSS stub prompt builders | `packages/prompts/` | Apache-2.0 |
| Provider capability types | `packages/core/` | Apache-2.0 |
| UI components | `apps/web/src/app/_components/` | Apache-2.0 |
| Database schema | `apps/web/prisma/schema.prisma` | Apache-2.0 |

### Not Included (WokSpec proprietary)

| Component | Why Not Included |
|-----------|-----------------|
| Production prompt token chains | Core quality differentiator |
| Quality profiles (steps/CFG per preset) | Empirically tuned, competitive advantage |
| Provider model IDs and tuning parameters | Varies by negotiated API access |
| Billing and credit management logic | Business logic, not platform logic |
| Abuse detection heuristics | Security-sensitive |

OSS self-hosted deployments use the stub prompt builders in `packages/prompts/`.
These are functional and produce good outputs. They do not include the quality
optimization layer that the hosted platform uses.

## Asset Usage Rights

Assets generated through WokGen are subject to the terms of the underlying
inference providers (Together.ai, Hugging Face, Pollinations, fal.ai, Replicate).

### Free Tier (Standard Quality)

- Personal and commercial use permitted
- Attribution to WokGen not required for generated assets
- Subject to provider terms of service

### HD Tier / Paid Plans

- Commercial use permitted, including client work
- No WokSpec attribution required for generated assets
- Provider terms apply

### Self-Hosted OSS Deployments

- You are responsible for compliance with your chosen providers' terms
- WokSpec makes no warranty about the fitness of generated assets for any purpose

## Third-Party Dependencies

This project depends on external services and packages. See `package.json` for
npm dependencies (each carries its own license). Key service dependencies:

- **Together.ai** — free tier image generation
- **Hugging Face** — free inference API
- **Pollinations.ai** — free image generation (no account required)
- **fal.ai** — premium inference
- **Replicate** — premium inference
- **Neon** — PostgreSQL database
- **Vercel** — deployment and CDN
- **Stripe** — payment processing (hosted platform only)
- **Resend** — transactional email (hosted platform only)

## WokSpec Trademark

"WokSpec" and "WokGen" are trademarks of WokSpec. You may:
- Reference them to describe the technology you built on
- Use "powered by WokGen" in attribution

You may not:
- Use them as the name of a competing service
- Imply WokSpec endorses your self-hosted deployment

## Questions

For licensing questions: legal@wokspec.org

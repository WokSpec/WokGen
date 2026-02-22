# WokGen UI/UX Mode

## What this mode is for

WokGen UI/UX generates production-ready frontend code:

- **React / Next.js components** — JSX/TSX with Tailwind or CSS modules
- **HTML + Tailwind sections** — direct copy-paste snippets
- **Vanilla HTML/CSS** — framework-agnostic components
- **Full page sections** — hero, pricing, features, CTA, testimonials, forms
- **Dashboard layouts** — tables, sidebars, cards, stats panels
- **Authentication flows** — login, signup, forgot password
- **Landing pages** — complete single-page layouts

## What this mode is NOT for

- Image generation → use Pixel, Business, or Vector modes
- Static images → this mode outputs code, not images
- Production-hardened components without review — always review generated code

## Output

Two panes:
1. **Live preview** — iframe rendering of the generated HTML (for HTML/Tailwind output)
2. **Code pane** — syntax-highlighted, copy-ready code

## Frameworks supported

| Framework | Output |
|-----------|--------|
| `react` | JSX with Tailwind classes |
| `next` | TSX for Next.js App Router |
| `html-tailwind` | Plain HTML with Tailwind CDN |
| `vanilla-css` | Plain HTML + embedded CSS |

## Live platform

[wokgen.wokspec.org/uiux/studio](https://wokgen.wokspec.org/uiux/studio)

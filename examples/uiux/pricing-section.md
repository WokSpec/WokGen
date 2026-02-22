# WokGen UI/UX — Pricing Section Example

This workflow generates a production-ready SaaS pricing section.

## Studio Setup

1. Go to [wokgen.wokspec.org/uiux/studio](https://wokgen.wokspec.org/uiux/studio)
2. Select component type: **Pricing**
3. Select framework: **React** (or **HTML + Tailwind** for direct use)
4. Select style: **Minimal** or **Corporate** for SaaS

## Example Prompt

```
3-tier pricing section for a SaaS product. Tiers: Free ($0/mo), Pro ($29/mo), Enterprise (custom). 
Free: 5 projects, 1GB storage, community support.
Pro: unlimited projects, 50GB, priority support, API access.
Enterprise: everything + SSO, SLA, dedicated account manager.
Highlight the Pro tier. Dark background, modern, clean typography.
```

## Output

The generator produces:
- **Live preview** (iframe) — for HTML/Tailwind output
- **Code pane** — copy-ready JSX or HTML

## Frameworks

### React output
```tsx
// JSX with Tailwind classes
// Import directly into your Next.js or React project
// Customize colors via Tailwind config
```

### HTML + Tailwind output
```html
<!-- Uses Tailwind CDN — works standalone in browser -->
<!-- Extract to your project and replace CDN with your build -->
```

## Refinement Prompts

After initial generation, refine with follow-up prompts:

- "Make the middle tier have a purple border and 'Most Popular' badge"
- "Add a feature comparison table below the cards"
- "Make it responsive — stack cards vertically on mobile"
- "Add toggle for monthly/annual pricing with discount badge"

## Integration Tips

- React output: copy the component file, install Tailwind if not present
- HTML output: works anywhere — no build step required
- Always review and test generated code before production use
- Accessibility: check that color contrast meets WCAG 2.1 AA

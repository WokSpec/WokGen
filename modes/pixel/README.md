# WokGen Pixel Mode

## What this mode is for

WokGen Pixel generates pixel art assets for game development:

- **Sprites** — characters, enemies, NPCs (idle, side, top-down, isometric, chibi)
- **Items** — weapons, armor, consumables, gems, containers (RPG icon style)
- **Tilesets** — seamless top-down and side-scroller map tiles
- **Effects** — particle effects, magic visuals, animations
- **UI / HUD** — game interface elements, health bars, inventory frames
- **Sprite sheets** — multiple animation frames on a single PNG strip
- **Portraits** — character bust shots for dialogue systems
- **Animated GIFs** — looping sprite animations

## What this mode is NOT for

- Photographs or realistic images
- Business logos or brand assets → use WokGen Business
- UI components (HTML/CSS) → use WokGen UI/UX
- SVG icons or vector illustrations → use WokGen Vector
- General-purpose image generation

## Output formats

| Format | Description |
|--------|-------------|
| PNG | Single frame, transparent background supported |
| GIF | Animated loop (animate tool) |
| PNG strip | Sprite sheet / multiple frames in a row |
| ZIP | Batch export of multiple assets |

## Preset overview

| Preset | Best for |
|--------|----------|
| `rpg_icon` | Inventory items, game icons |
| `character_idle` | Standing front-facing characters |
| `character_side` | Side-scroller platformer sprites |
| `top_down_char` | Top-down RPG characters |
| `isometric` | Isometric game assets, buildings |
| `chibi` | Super-deformed cute characters |
| `tileset` | Seamless map tiles |
| `nature_tile` | Grass, water, forest tiles |
| `sprite_sheet` | Multi-pose animation frames |
| `animated_effect` | Particle effects and magic |
| `portrait` | Character face/bust close-ups |
| `weapon_icon` | Weapon inventory items |
| `badge_icon` | Achievement and app icons |
| `game_ui` | HUD elements, buttons, frames |
| `horror` | Dark atmospheric sprites |
| `sci_fi` | Futuristic technological sprites |
| `emoji` | Emoji-scale simple icons |
| `raw` | No preset steering |

## How to add a custom preset

1. Add your preset key to `PixelPreset` in `modes/pixel/schema.ts`
2. Add preset tokens to `STYLE_PRESET_TOKENS` in your prompt builder
3. Add preset-specific negatives to `PRESET_NEGATIVES` in `apps/web/src/lib/negative-banks.ts`
4. Add a quality profile to `QUALITY_PROFILES` in `apps/web/src/lib/quality-profiles.ts`

## How to add a custom exporter

Implement the `PixelExporter` interface from `modes/pixel/exporters.ts` and
call `registerPixelExporter()` at app initialization.

## Live platform

[wokgen.wokspec.org/pixel/studio](https://wokgen.wokspec.org/pixel/studio)

## Related documentation

- [Architecture overview](../../docs/architecture.md)
- [Prompting guide](../../docs/pixel.md) (see live docs at wokgen.wokspec.org/docs/pixel)
- [Example workflows](../../examples/pixel/)

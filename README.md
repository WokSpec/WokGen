# WokGen

WokGen is a production-grade cloud-based pipeline for generating pixel-art item/icon assets for RPG inventories, Discord embeds, and emoji-scale usage. Uses free cloud AI APIs for generation and enforces strict post-processing + validation.

## Quick Start

Run the interactive TUI:

```bash
npm start
```

This launches a clean ASCII art interface for controlling the asset factory.

Quick start command presets are in `COMMANDS.md`.
Use `--profile detailed` on `normalize/package/validate/registry` for higher-detail exports (64 base, up to 512).

## Drag-and-Drop Training Dataset Intake

This repo includes a license-aware intake flow so you can drag downloaded art packs into one folder and build a clean training dataset.

1. Reset dataset workspace:
   - `npm run data:reset`
2. Drag/drop files or extracted packs into:
   - `dataset/inbox/`
3. Add license metadata (recommended):
   - `dataset/inbox/_licenses.csv` with columns:
   - `path,license,source_url,title,author`
4. Run intake:
   - `npm run data:intake`

Outputs:
- Accepted files: `dataset/accepted/`
- Training copy: `dataset/train/images/`
- Rejected files (missing/unsupported license): `dataset/rejected/`
- Manifests: `dataset/manifests/`
- Attribution file: `dataset/manifests/ATTRIBUTION.md`

Default licenses allowed for training:
- `CC0`
- `CC-BY-3.0`
- `CC-BY-4.0`
- `OGA-BY`

## What this repo guarantees

- Pixel-art pipeline with base `32x32` canonical assets.
- Export variants: `32, 64, 128, 256` transparent PNG.
- Deterministic generation with seeds (via prompts).
- Rarity-driven prompt composition and style extras.
- Hard validation for dimensions, alpha, palette membership, file size limits, and unique IDs.
- Uses free cloud AI APIs (Replicate with free credits for new users).

## Folder structure

- `art/source/`
- `art/parts/base`
- `art/parts/material`
- `art/parts/modifier`
- `art/parts/frame`
- `assets/raw/`
- `assets/clean/`
- `assets/rendered/icons/{32,64,128,256}/`
- `assets/rendered/sheets/`
- `registry/`
- `prompts/`
- `scripts/`
- `comfyui/workflows/`

## Prerequisites

### Universal

1. Install GitHub CLI:
   - Linux: `sudo apt update && sudo apt install -y gh && gh auth login`
   - Or follow https://cli.github.com/
2. Install Node.js 20+:
   - Linux: `sudo apt update && sudo apt install -y nodejs npm`
3. Install image tools:
   - Linux: `sudo apt install -y imagemagick pngquant oxipng`

### Cloud Generation

1. Sign up for Replicate: https://replicate.com/
2. Get your API token from https://replicate.com/account/api-tokens
3. Set environment variable: `export REPLICATE_API_TOKEN=your_token_here`
4. (Optional) For local ComfyUI fallback: Follow old instructions below.

### Local ComfyUI (Optional Fallback)

1. Install Python 3.10+:
   - `sudo apt install -y python3 python3-pip`
2. Install ComfyUI:
   - `git clone https://github.com/comfyanonymous/ComfyUI.git`
   - `cd ComfyUI && python3 -m pip install -r requirements.txt`
   - `python main.py`

## ComfyUI model placement

- Put SD checkpoints in `ComfyUI/models/checkpoints/`.
- Optionally put pixel-art LoRA files in `ComfyUI/models/loras/`.
- Edit `comfyui/workflows/pixel_icon_workflow.json` and set:
  - `CheckpointLoaderSimple.inputs.ckpt_name` to your checkpoint filename.
- If your workflow uses LoRA nodes, add them and keep node titles for positive/negative prompt + sampler intact.

## Install and run this repo

1. Install local JS project dependencies:
   - `npm install`
2. Set up cloud generation:
   - Sign up for Replicate, get API token, set `REPLICATE_API_TOKEN`
3. Generate prompt jobs:
   - `npm run prompts -- --count 200`
4. Generate raw images via cloud AI:
   - `npm run gen`
5. Normalize and hard-enforce baseline style constraints:
   - `npm run normalize`
6. Package export sizes + sprite sheets:
   - `npm run package`
7. Validate:
   - `npm run validate`
8. Build registry:
   - `npm run registry`

Single command:

- `npm run all`

## Script reference

- `npm run prompts -- --count 200 --seedBase 1234`
- `npm run prompts -- --count 50 --rarity rare --category items/weapons`
- `npm run gen` (uses Replicate SDXL with pixel art style)
- `npm run gen:cpu` (procedural fallback, no AI model required)
- `npm run normalize`
- `npm run package`
- `npm run validate`
- `npm run registry`

## Troubleshooting

- `ComfyUI connection refused`:
  - Start ComfyUI (`python main.py`) and verify it is listening on `8188`.
- `Checkpoint not found`:
  - Ensure checkpoint file name in workflow matches a file under `ComfyUI/models/checkpoints/`.
- `pngquant not found` / `magick not found` / `oxipng not found`:
  - Install required system binaries and ensure they are in PATH.
- `validate` reports palette violations:
  - Run `npm run normalize` again and inspect raw source images for anti-aliased edges or gradients.
- `No clean assets found` during packaging:
  - Confirm `assets/clean/` has PNG files and that normalize step completed.
- Output looks muddy at 32x32:
  - Increase prompt strictness for silhouette simplicity; avoid complex scenes; keep single centered object.

## Low-Memory CPU Mode

For constrained systems (CPU-only, low RAM), use:

- Checkpoint: `full_int2_sd.pth` in `ComfyUI/models/checkpoints/`
- Workflow: `comfyui/workflows/pixel_icon_lowmem_workflow.json`
- ComfyUI start flags:
  - `python main.py --listen 127.0.0.1 --port 8190 --cpu --novram --cache-none --preview-method none --disable-all-custom-nodes --disable-manager-ui`
- Generation command:
  - `npm run gen:lowmem`

This mode is slower and lower quality, but minimizes memory pressure.

If your machine cannot keep a diffusion checkpoint loaded, use the strict fallback:

- `npm run gen:cpu`

This generates deterministic pixel-style placeholders from seeds/categories so the rest of the pipeline (`normalize -> package -> validate -> registry`) remains fully operational on low-spec hardware.

### Rotating Unique Batches

- `npm run prompts` now rotates through catalog items automatically.
- Each run emits a different unique batch (default 8 items).
- Rotation state is stored in `.cache/prompt-rotation.json`.
- Reset rotation to the first batch:
  - `node scripts/generate-prompts.mjs --resetRotation`
- Generate only one category:
  - `npm run prompts -- --category items/weapons --count 6`
- Generate from multiple categories:
  - `npm run prompts -- --categories items/weapons,items/armor --count 8`

## Production notes

- Keep `registry/assets.json` as your single source of truth for bot/game lookups.
- Use pre-rendered icon sizes instead of runtime image composition in Discord.
- For maximum consistency, prefer layered parts workflows (`art/parts/*`) and reserve diffusion generation for unique/high-rarity items.

# Quality-First Commands (5 Items Per Cycle)

Run from project root (WokGen directory):

## 1) Clean Generated Outputs

```bash
npm run clean
```

## 1b) Reset Dataset Intake Workspace

```bash
npm run data:reset
```

Then drag/drop downloaded assets into:

```bash
dataset/inbox/
```

Optional metadata file:

```bash
dataset/inbox/_licenses.csv
```

Build accepted training dataset + attribution:

```bash
npm run data:intake
```

One-command orchestration:

```bash
npm run data:orchestrate
```

Fresh orchestration (resets then runs):

```bash
npm run data:orchestrate:fresh
```

Dry-run report (no file moves):

```bash
npm run data:report
```

## 2) Port Management

Check common ports:

```bash
npm run ports -- --action status --ports 8188,8190,9015,9016,9017,9020
```

Kill processes on those ports:

```bash
npm run ports -- --action kill --ports 8188,8190,9015,9016,9017,9020
```

## 3) Default Quality Cycle (Exactly 5 Items)

```bash
npm run cycle
```

This runs:
- prompts in a strict pack of `5`
- HQ model generation with port fallback
- normalize/package/validate/registry

## 4) Quality Cycle For One Category (5 Items)

```bash
npm run cycle -- --category world/food
```

## 5) Quality Cycle For Multiple Categories (5 Items)

```bash
npm run cycle -- --categories world/furniture,world/utensils,world/appliances
```

## 6) Force Specific Checkpoint

```bash
npm run cycle -- --checkpoint Realistic_Vision_V6.0_NV_B1_fp16.safetensors
```

## 7) Force Port Set

```bash
npm run cycle -- --ports 8188,8190,9015,9016,9017,9020
```

## 8) CPU Fallback Cycle (5 Items)

```bash
npm run cycle:cpu
```

## 9) Reset Rotation And Start New 5-Item Sequence

```bash
npm run cycle -- --resetRotation
```

## 10) View Outputs

```bash
ls assets/rendered/icons/32 | head -n 20
ls assets/rendered/icons/512 | head -n 20
ls assets/rendered/sheets
cat registry/assets.json | head -n 80
cat registry/validation-report.json
```

## 11) View Dataset Intake Results

```bash
ls dataset/accepted | head -n 20
ls dataset/rejected | head -n 20
ls dataset/train/images | head -n 20
cat dataset/manifests/dataset-report.json
cat dataset/manifests/ATTRIBUTION.md
```
Isolated 5-item review cycle (cleans old outputs first):

```bash
npm run cycle:fresh
```

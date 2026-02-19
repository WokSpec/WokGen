# Dataset Intake License Guide

Drop downloaded assets/folders into `dataset/inbox/`.

Provide license metadata via one of these:
1. Put assets under a license folder (example `dataset/inbox/CC0/my_pack/...`).
2. Fill `dataset/inbox/_licenses.csv`.

Recognized allow-for-training licenses by default:
- `CC0`
- `CC-BY-3.0`
- `CC-BY-4.0`
- `OGA-BY`

Assets with missing/unsupported licenses are moved to `dataset/rejected/`.

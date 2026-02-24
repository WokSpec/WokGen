# @wokgen/sdk

Minimal TypeScript SDK for the [WokGen](https://wokgen.wokspec.org) API.

## Installation

```bash
npm install @wokgen/sdk
```

## Usage

```typescript
import { WokGen } from '@wokgen/sdk';

const client = new WokGen({ apiKey: 'wk_live_...' });

// Generate an asset
const result = await client.generate({
  mode: 'pixel',
  prompt: 'a cute corgi wearing a wizard hat',
});
console.log(result.resultUrl);

// Poll a job by ID
const job = await client.getJob(result.jobId!);
console.log(job.job?.status);
```

## API

### `new WokGen({ apiKey, baseUrl? })`

| Option    | Type     | Description                                        |
| --------- | -------- | -------------------------------------------------- |
| `apiKey`  | `string` | Your WokGen API key (`wk_live_...`)                |
| `baseUrl` | `string` | Override base URL (default: `https://wokgen.wokspec.org`) |

### `client.generate(params)`

| Param    | Type     | Required | Description        |
| -------- | -------- | -------- | ------------------ |
| `mode`   | `string` | ✓        | Generation mode    |
| `prompt` | `string` | ✓        | Generation prompt  |
| `tool`   | `string` |          | Tool identifier    |

Returns `{ resultUrl?, jobId? }`.

### `client.getJob(id)`

Returns `{ job?: { status, resultUrl? } }`.

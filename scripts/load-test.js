/**
 * WokGen k6 Load Test
 * Usage: k6 run scripts/load-test.js --env BASE_URL=https://wokgen.app
 *
 * Install k6: https://k6.io/docs/get-started/installation/
 *
 * Scenarios:
 *   70% — gallery browse (unauthenticated)
 *   20% — generate (requires PAT_TOKEN env var for authenticated test)
 *   10% — Eral chat (requires PAT_TOKEN)
 *
 * Thresholds:
 *   p95 response time < 2s
 *   error rate < 1%
 */

// @ts-check
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { check, group, sleep } = require('k6');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const http = require('k6/http');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const PAT_TOKEN = __ENV.PAT_TOKEN || '';

export const options = {
  scenarios: {
    gallery_browse: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 350 }, // ramp to 70% of 500
        { duration: '5m', target: 350 },
        { duration: '1m', target: 0   },
      ],
      tags: { scenario: 'gallery' },
    },
    authenticated_generate: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 100 },
        { duration: '5m', target: 100 },
        { duration: '1m', target: 0   },
      ],
      tags: { scenario: 'generate' },
    },
    eral_chat: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 50 },
        { duration: '5m', target: 50 },
        { duration: '1m', target: 0  },
      ],
      tags: { scenario: 'eral' },
    },
  },
  thresholds: {
    'http_req_duration{scenario:gallery}':  ['p(95)<2000'],
    'http_req_duration{scenario:generate}': ['p(95)<10000'], // generation can be slow
    'http_req_duration{scenario:eral}':     ['p(95)<5000'],
    'http_req_failed':                      ['rate<0.01'],
  },
};

// ── Gallery browse scenario ────────────────────────────────────────────────
export function gallery_browse() {
  group('gallery', () => {
    const pages = [1, 2, 3];
    const page = pages[Math.floor(Math.random() * pages.length)];

    const res = http.get(`${BASE_URL}/api/gallery?page=${page}&limit=24`);
    check(res, {
      'gallery status 200': (r) => r.status === 200,
      'gallery has data':   (r) => { try { const b = JSON.parse(r.body); return Array.isArray(b.assets); } catch { return false; } },
    });

    // Also hit health endpoint occasionally
    if (Math.random() < 0.05) {
      const health = http.get(`${BASE_URL}/api/health`);
      check(health, { 'health ok': (r) => r.status === 200 });
    }

    sleep(1 + Math.random() * 2);
  });
}

// ── Authenticated generate scenario ────────────────────────────────────────
export function authenticated_generate() {
  if (!PAT_TOKEN) { sleep(1); return; }

  group('generate', () => {
    const payload = JSON.stringify({
      mode:   'pixel',
      prompt: 'a small red mushroom pixel art, 16x16, retro style',
      tool:   'pixel-art',
    });

    const res = http.post(`${BASE_URL}/api/generate`, payload, {
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${PAT_TOKEN}`,
      },
      timeout: '30s',
    });

    check(res, {
      'generate accepted':      (r) => r.status === 200 || r.status === 202,
      'generate not rate limited': (r) => r.status !== 429,
    });

    sleep(2 + Math.random() * 3);
  });
}

// ── Eral chat scenario ─────────────────────────────────────────────────────
export function eral_chat() {
  if (!PAT_TOKEN) { sleep(1); return; }

  group('eral', () => {
    const prompts = [
      'What styles work best for game UI icons?',
      'How do I create a cohesive color palette for a sci-fi brand?',
      'What is the difference between vector and raster for logo design?',
    ];
    const message = prompts[Math.floor(Math.random() * prompts.length)];

    const res = http.post(`${BASE_URL}/api/eral/chat`, JSON.stringify({
      message,
      modelVariant: 'eral-mini',
      stream: false,
    }), {
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${PAT_TOKEN}`,
      },
      timeout: '15s',
    });

    check(res, {
      'eral status ok': (r) => r.status === 200,
    });

    sleep(3 + Math.random() * 4);
  });
}

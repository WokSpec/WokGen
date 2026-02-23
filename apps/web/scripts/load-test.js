/**
 * WokGen k6 load test
 * Run: k6 run scripts/load-test.js
 * With staging: BASE_URL=https://staging.wokgen.com k6 run scripts/load-test.js
 *
 * Thresholds: p95 < 2s, error rate < 1%
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const generateDuration = new Trend('generate_duration', true);

export const options = {
  stages: [
    { duration: '30s', target: 50 },   // ramp up
    { duration: '2m', target: 200 },   // sustained load
    { duration: '1m', target: 500 },   // spike
    { duration: '30s', target: 0 },    // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    errors: ['rate<0.01'],
    generate_duration: ['p(95)<5000'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Weighted scenario distribution: 70% browse, 20% generate, 10% eral
function weightedScenario() {
  const r = Math.random();
  if (r < 0.70) return 'browse';
  if (r < 0.90) return 'generate';
  return 'eral';
}

export default function () {
  const scenario = weightedScenario();

  if (scenario === 'browse') {
    // Gallery + asset browse
    const r1 = http.get(`${BASE_URL}/gallery`, { tags: { name: 'gallery' } });
    check(r1, { 'gallery 200': r => r.status === 200 });
    errorRate.add(r1.status !== 200);
    sleep(1 + Math.random() * 2);

    const r2 = http.get(`${BASE_URL}/api/gallery?limit=20`, { tags: { name: 'gallery-api' } });
    check(r2, { 'gallery-api 200': r => r.status === 200 });
    errorRate.add(r2.status !== 200);
    sleep(0.5);
  }

  else if (scenario === 'generate') {
    const start = Date.now();
    const payload = JSON.stringify({
      prompt: 'a small pixel art mushroom with red cap',
      mode: 'pixel',
      style: 'pixel-art',
    });
    const r = http.post(`${BASE_URL}/api/generate`, payload, {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'generate' },
    });
    // Expect 401 (unauthenticated) or 200 (authenticated test user)
    check(r, { 'generate responds': r => [200, 401, 429].includes(r.status) });
    errorRate.add(![200, 401, 429].includes(r.status));
    generateDuration.add(Date.now() - start);
    sleep(2);
  }

  else {
    // Eral chat
    const payload = JSON.stringify({
      messages: [{ role: 'user', content: 'Suggest a color palette for a fantasy RPG game' }],
      model: 'eral-fast',
    });
    const r = http.post(`${BASE_URL}/api/eral/chat`, payload, {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'eral' },
      timeout: '10s',
    });
    check(r, { 'eral responds': r => [200, 401, 429].includes(r.status) });
    errorRate.add(![200, 401, 429].includes(r.status));
    sleep(1.5);
  }
}

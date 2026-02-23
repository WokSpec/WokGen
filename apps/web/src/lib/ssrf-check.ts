/**
 * SSRF protection — block requests to private/internal network ranges.
 *
 * Rejects:
 *   - Loopback:        127.0.0.0/8, ::1
 *   - Link-local:      169.254.0.0/16, fe80::/10
 *   - RFC1918 private: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
 *   - Metadata IMDS:   169.254.169.254 (AWS/GCP/Azure instance metadata)
 *   - Non-HTTP(S):     file://, ftp://, gopher://, etc.
 */

const BLOCKED_RANGES: { prefix: string; bits: number }[] = [
  // IPv4
  { prefix: '127.',        bits: 8  },
  { prefix: '10.',         bits: 8  },
  { prefix: '169.254.',    bits: 16 },
  { prefix: '172.16.',     bits: 12 },
  { prefix: '172.17.',     bits: 12 },
  { prefix: '172.18.',     bits: 12 },
  { prefix: '172.19.',     bits: 12 },
  { prefix: '172.20.',     bits: 12 },
  { prefix: '172.21.',     bits: 12 },
  { prefix: '172.22.',     bits: 12 },
  { prefix: '172.23.',     bits: 12 },
  { prefix: '172.24.',     bits: 12 },
  { prefix: '172.25.',     bits: 12 },
  { prefix: '172.26.',     bits: 12 },
  { prefix: '172.27.',     bits: 12 },
  { prefix: '172.28.',     bits: 12 },
  { prefix: '172.29.',     bits: 12 },
  { prefix: '172.30.',     bits: 12 },
  { prefix: '172.31.',     bits: 12 },
  { prefix: '192.168.',    bits: 16 },
];

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'metadata.google.internal',
  '169.254.169.254',  // AWS/GCP/Azure IMDS
  '100.100.100.200',  // Alibaba IMDS
]);

const ALLOWED_SCHEMES = new Set(['https:', 'http:']);

export type SsrfCheckResult =
  | { ok: true  }
  | { ok: false; reason: string };

/**
 * Validate a user-supplied URL against SSRF attack vectors.
 *
 * @param rawUrl  - The URL string to validate
 * @param requireHttps - If true, reject http:// (default: false for dev convenience)
 */
export function checkSsrf(rawUrl: string, requireHttps = false): SsrfCheckResult {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { ok: false, reason: 'Invalid URL.' };
  }

  // Only allow http(s)
  if (!ALLOWED_SCHEMES.has(parsed.protocol)) {
    return { ok: false, reason: `Protocol "${parsed.protocol}" is not allowed.` };
  }

  if (requireHttps && parsed.protocol !== 'https:') {
    return { ok: false, reason: 'Only HTTPS URLs are allowed.' };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Block known internal hostnames
  if (BLOCKED_HOSTNAMES.has(hostname)) {
    return { ok: false, reason: 'URL targets a blocked internal host.' };
  }

  // Block IPv6 loopback / link-local
  if (hostname === '::1' || hostname.startsWith('fe80:') || hostname.startsWith('[::1]')) {
    return { ok: false, reason: 'URL targets a blocked internal host.' };
  }

  // Block private IPv4 ranges
  for (const range of BLOCKED_RANGES) {
    if (hostname.startsWith(range.prefix)) {
      return { ok: false, reason: 'URL targets a private network address.' };
    }
  }

  return { ok: true };
}

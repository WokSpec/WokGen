# WokGen Performance Baseline

## Target Thresholds (200k DAU)

| Metric | Target | Critical |
|--------|--------|----------|
| p50 response time | < 300ms | > 1s |
| p95 response time | < 2000ms | > 5s |
| Error rate | < 0.5% | > 1% |
| Generation p95 | < 5000ms | > 15s |
| DB query p95 | < 100ms | > 500ms |
| Redis hit rate | > 85% | < 60% |

## Architecture for 200k DAU

- **Database**: Neon Postgres + PgBouncer connection pooling (DIRECT_URL + DATABASE_URL)
- **Cache**: Upstash Redis — quota (30s TTL), brand kit (5m), admin stats (5m), gallery (60s ETag)
- **Queue**: BullMQ async generation — /api/generate returns jobId immediately
- **CDN**: Cloudflare R2 or Backblaze B2 for generated assets
- **Edge**: Next.js middleware rate limiting before route handlers

## Load Test

Run with k6:
```bash
# Install k6: https://k6.io/docs/get-started/installation/
BASE_URL=https://staging.wokgen.com k6 run apps/web/scripts/load-test.js
```

## Chaos Probes

```bash
BASE_URL=https://staging.wokgen.com bash apps/web/scripts/chaos-probe.sh
```

## Connection Pool Settings

```
DATABASE_URL=postgresql://...?pgbouncer=true&connection_limit=25&statement_timeout=10000
DIRECT_URL=postgresql://...  # Direct connection for migrations
```

import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'API Reference · Docs',
  description: 'WokGen API reference — generation endpoint, history, rate limits, error codes, and SDK roadmap.',
};

export default function DocsAPI() {
  return (
    <div className="docs-page">
      <div className="docs-page-inner">

        {/* Sidebar */}
        <aside className="docs-sidebar">
          <Link href="/docs" className="docs-back">← Docs Hub</Link>
          <div className="docs-sidebar-mode">
            <span>⚡</span> API Reference
          </div>
          <nav className="docs-toc">
            <a href="#overview"        className="docs-toc-link">Overview</a>
            <a href="#authentication"  className="docs-toc-link">Authentication</a>
            <a href="#post-generate"   className="docs-toc-link">POST /api/generate</a>
            <a href="#get-generate"    className="docs-toc-link">GET /api/generate</a>
            <a href="#rate-limits"     className="docs-toc-link">Rate Limits</a>
            <a href="#error-responses" className="docs-toc-link">Error Responses</a>
            <a href="#webhooks"        className="docs-toc-link">Webhooks</a>
            <a href="#sdk"             className="docs-toc-link">SDK &amp; Keys</a>
          </nav>
        </aside>

        {/* Content */}
        <main className="docs-content">
          <div className="docs-content-header">
            <h1 className="docs-title">API Reference</h1>
            <p className="docs-subtitle">
              WokGen&apos;s generation API — request schemas, response shapes, rate limits,
              and error codes for the hosted service at{' '}
              <code className="docs-code">wokgen.wokspec.org</code>.
            </p>
          </div>

          <div className="docs-callout docs-callout--warn">
            <span className="docs-callout-icon">⚠</span>
            <span>
              A public API key system is <strong>in development</strong>. Until it ships,
              all API access requires an authenticated browser session (cookie-based).
              Programmatic access without a browser session is not yet supported on the
              hosted service.
            </span>
          </div>

          {/* ── Overview ── */}
          <section id="overview">
            <h2 className="docs-h2">Overview</h2>
            <p className="docs-p">
              The WokGen API exposes two primary endpoints for interacting with the generation system:
            </p>
            <ul className="docs-ul">
              <li className="docs-li">
                <code className="docs-code">POST /api/generate</code> — submit a generation job
                (image, animation, scene, rotate, inpaint) and receive the result synchronously.
              </li>
              <li className="docs-li">
                <code className="docs-code">GET /api/generate</code> — query your generation
                history with filtering, pagination, and status filtering.
              </li>
            </ul>
            <p className="docs-p">
              <strong>Base URL:</strong>{' '}
              <code className="docs-code">https://wokgen.wokspec.org/api</code>
            </p>
            <p className="docs-p">
              Both endpoints accept and return <code className="docs-code">application/json</code>.
              All requests must be made over HTTPS. The API does not support HTTP.
            </p>
          </section>

          {/* ── Authentication ── */}
          <section id="authentication">
            <h2 className="docs-h2">Authentication</h2>
            <p className="docs-p">
              Authentication currently uses the same browser session cookie that powers the
              WokGen web app. When you are signed in on{' '}
              <code className="docs-code">wokgen.wokspec.org</code>, your session cookie is
              automatically included with all same-origin requests made from the browser.
            </p>
            <p className="docs-p">
              If you make requests from outside a browser (e.g., with <code className="docs-code">curl</code> or
              a server-side script), you must include the session cookie manually. This is not
              recommended for production use — a proper API key system is being built to replace this.
            </p>
            <div className="docs-callout docs-callout--info">
              <span className="docs-callout-icon">ℹ</span>
              <span>
                <strong>API key system — in development.</strong> A token-based authentication
                system (<code className="docs-code">Authorization: Bearer &lt;token&gt;</code>)
                is on the roadmap. Once available, it will be the preferred method for programmatic
                access. Watch the{' '}
                <a
                  href="https://github.com/wokspec"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="docs-code"
                >
                  GitHub org
                </a>{' '}
                for announcements.
              </span>
            </div>
            <h3 className="docs-h3">Unauthenticated access</h3>
            <p className="docs-p">
              Unauthenticated (guest) requests to <code className="docs-code">POST /api/generate</code> are
              allowed for Standard quality generations, subject to the guest rate limit. HD quality
              and job history (<code className="docs-code">GET /api/generate</code>) require authentication.
            </p>
          </section>

          {/* ── POST /api/generate ── */}
          <section id="post-generate">
            <h2 className="docs-h2">POST /api/generate</h2>
            <p className="docs-p">
              Submits a generation job. The endpoint is synchronous — it waits for the generation
              to complete and returns the result in a single response.
            </p>

            <h3 className="docs-h3">Request body</h3>
            <pre className="docs-pre">{`{
  // Required
  "tool":           "generate",     // generate | animate | rotate | inpaint | scene
  "mode":           "pixel",        // pixel | business
  "prompt":         "RPG sword",    // max 200 characters

  // Quality & output
  "quality":        "standard",     // standard | hd  (hd costs 1 credit)
  "width":          128,            // output width in px
  "height":         128,            // output height in px
  "isPublic":       false,          // save to public gallery

  // Optional
  "style":          "rpg_icon",     // style preset (mode-specific)
  "mood":           "dark",         // mood/tone hint
  "industry":       "gaming",       // business mode: industry context
  "colorDirection": "earthy",       // color palette hint
  "platform":       "steam_capsule",// target platform / format

  // Project association
  "projectId":      "proj_abc123",  // optional project ID

  // Tool-specific parameters
  "extra": {
    // animate: number of frames
    "frames":       4,

    // rotate: source image URL to rotate
    "sourceUrl":    "https://...",

    // inpaint: mask data and source image
    "sourceUrl":    "https://...",
    "maskDataUrl":  "data:image/png;base64,...",

    // scene: composition layout hint
    "sceneLayout":  "side_scroll",

    // Business-specific
    "brandKitIndex": 1              // 1–4 for Brand Kit multi-gen
  }
}`}</pre>

            <h3 className="docs-h3">Response</h3>
            <pre className="docs-pre">{`{
  "jobId":        "job_01abc...",   // unique job identifier
  "resultUrl":    "https://...",    // primary output image URL (PNG or GIF)
  "resultUrls":   null,             // array of URLs for multi-output tools (or null)
  "durationMs":   1842,             // time from request to result in milliseconds
  "resolvedSeed": 1234567890,       // seed used for this generation (for reproduction)
  "width":        128,              // actual output width
  "height":       128               // actual output height
}`}</pre>

            <h3 className="docs-h3">Status codes</h3>
            <div className="docs-table-wrap">
              <table className="docs-table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Meaning</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td><code className="docs-code">200</code></td><td>Generation succeeded. Response includes <code className="docs-code">resultUrl</code>.</td></tr>
                  <tr><td><code className="docs-code">400</code></td><td>Bad request — missing required field (<code className="docs-code">prompt</code>, <code className="docs-code">tool</code>) or invalid parameter value.</td></tr>
                  <tr><td><code className="docs-code">401</code></td><td>Authentication required — HD generation or history access without a valid session.</td></tr>
                  <tr><td><code className="docs-code">429</code></td><td>Rate limited — too many requests, or HD credit balance is zero with no fallback override.</td></tr>
                  <tr><td><code className="docs-code">503</code></td><td>Provider error — the upstream AI inference provider returned an error or timed out.</td></tr>
                </tbody>
              </table>
            </div>

            <div className="docs-callout docs-callout--info">
              <span className="docs-callout-icon">ℹ</span>
              <span>
                When <code className="docs-code">quality</code> is <code className="docs-code">hd</code>
                and the account has no remaining HD credits, the API automatically falls back to
                Standard quality rather than returning a 429. The response will reflect the
                actual quality used.
              </span>
            </div>
          </section>

          {/* ── GET /api/generate ── */}
          <section id="get-generate">
            <h2 className="docs-h2">GET /api/generate</h2>
            <p className="docs-p">
              Returns a paginated list of generation jobs. Requires authentication.
              Supports cursor-based pagination for stable results during high-volume use.
            </p>

            <h3 className="docs-h3">Query parameters</h3>
            <div className="docs-table-wrap">
              <table className="docs-table">
                <thead>
                  <tr>
                    <th>Parameter</th>
                    <th>Type</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code className="docs-code">mode</code></td>
                    <td>string</td>
                    <td>Filter by mode: <code className="docs-code">pixel</code> or <code className="docs-code">business</code>.</td>
                  </tr>
                  <tr>
                    <td><code className="docs-code">status</code></td>
                    <td>string</td>
                    <td>Filter by job status: <code className="docs-code">succeeded</code>, <code className="docs-code">failed</code>, or <code className="docs-code">pending</code>.</td>
                  </tr>
                  <tr>
                    <td><code className="docs-code">mine</code></td>
                    <td>boolean</td>
                    <td>When <code className="docs-code">true</code>, returns only the authenticated user&apos;s jobs. Defaults to <code className="docs-code">true</code> for authenticated requests.</td>
                  </tr>
                  <tr>
                    <td><code className="docs-code">projectId</code></td>
                    <td>string</td>
                    <td>Filter to jobs associated with a specific project ID.</td>
                  </tr>
                  <tr>
                    <td><code className="docs-code">limit</code></td>
                    <td>number</td>
                    <td>Number of results per page. Default <code className="docs-code">20</code>, max <code className="docs-code">100</code>.</td>
                  </tr>
                  <tr>
                    <td><code className="docs-code">cursor</code></td>
                    <td>string</td>
                    <td>Pagination cursor from the previous response&apos;s <code className="docs-code">nextCursor</code> field.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="docs-h3">Response</h3>
            <pre className="docs-pre">{`{
  "jobs": [
    {
      "id":         "job_01abc...",
      "tool":       "generate",
      "mode":       "pixel",
      "prompt":     "RPG sword icon",
      "resultUrl":  "https://...",
      "status":     "succeeded",
      "createdAt":  "2025-01-14T12:00:00.000Z",
      "width":      128,
      "height":     128
    }
    // ... more jobs
  ],
  "nextCursor":   "job_01xyz...", // pass as cursor= for next page, or null if no more
  "hasMore":      true
}`}</pre>
          </section>

          {/* ── Rate Limits ── */}
          <section id="rate-limits">
            <h2 className="docs-h2">Rate Limits</h2>
            <p className="docs-p">
              Rate limits are enforced per IP for guest requests and per account for authenticated
              requests. Limits apply to <code className="docs-code">POST /api/generate</code> only —
              history reads are not rate limited in normal use.
            </p>
            <div className="docs-table-wrap">
              <table className="docs-table">
                <thead>
                  <tr>
                    <th>Context</th>
                    <th>Limit</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Guest (unauthenticated), Standard only</td>
                    <td>10 requests / minute</td>
                  </tr>
                  <tr>
                    <td>Authenticated, Standard</td>
                    <td>30 requests / minute</td>
                  </tr>
                  <tr>
                    <td>Authenticated, HD</td>
                    <td>Limited by HD credit balance (each request consumes 1 credit)</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <h3 className="docs-h3">Rate limit response headers</h3>
            <p className="docs-p">
              Every response from <code className="docs-code">POST /api/generate</code> includes
              rate limit headers:
            </p>
            <pre className="docs-pre">{`X-RateLimit-Remaining: 27      // requests remaining in the current window
X-RateLimit-Reset:     1705230060  // Unix timestamp when the window resets`}</pre>
            <p className="docs-p">
              When a request is rate limited (status <code className="docs-code">429</code>),
              an additional header is included:
            </p>
            <pre className="docs-pre">{`Retry-After: 12    // seconds to wait before retrying`}</pre>
          </section>

          {/* ── Error Responses ── */}
          <section id="error-responses">
            <h2 className="docs-h2">Error Responses</h2>
            <p className="docs-p">
              All error responses use a consistent JSON shape:
            </p>
            <pre className="docs-pre">{`{
  "error": "Human-readable error message",
  "code":  "MACHINE_READABLE_CODE"   // optional, present on most errors
}`}</pre>
            <h3 className="docs-h3">Error codes</h3>
            <div className="docs-table-wrap">
              <table className="docs-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>HTTP status</th>
                    <th>Meaning</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code className="docs-code">PROMPT_REQUIRED</code></td>
                    <td>400</td>
                    <td>The <code className="docs-code">prompt</code> field is missing or empty.</td>
                  </tr>
                  <tr>
                    <td><code className="docs-code">TOOL_REQUIRED</code></td>
                    <td>400</td>
                    <td>The <code className="docs-code">tool</code> field is missing or not a valid value.</td>
                  </tr>
                  <tr>
                    <td><code className="docs-code">INVALID_PARAMS</code></td>
                    <td>400</td>
                    <td>One or more parameters are out of range or have an invalid value.</td>
                  </tr>
                  <tr>
                    <td><code className="docs-code">AUTH_REQUIRED</code></td>
                    <td>401</td>
                    <td>The request requires an authenticated session (e.g., HD generation, history access).</td>
                  </tr>
                  <tr>
                    <td><code className="docs-code">RATE_LIMITED</code></td>
                    <td>429</td>
                    <td>Request rate exceeds the allowed limit for this context. See <code className="docs-code">Retry-After</code> header.</td>
                  </tr>
                  <tr>
                    <td><code className="docs-code">WORKSPACE_LIMIT</code></td>
                    <td>429</td>
                    <td>The account&apos;s plan workspace limit has been reached (e.g., project count exceeded).</td>
                  </tr>
                  <tr>
                    <td><code className="docs-code">PROVIDER_ERROR</code></td>
                    <td>503</td>
                    <td>The upstream AI inference provider returned an error or timed out. Retry after a short delay.</td>
                  </tr>
                  <tr>
                    <td><code className="docs-code">PROVIDER_UNAVAILABLE</code></td>
                    <td>503</td>
                    <td>No provider is available to handle the request (e.g., all providers in error state).</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* ── Webhooks ── */}
          <section id="webhooks">
            <h2 className="docs-h2">Webhooks</h2>
            <p className="docs-p">
              Webhooks are <strong>not publicly available</strong>. The generation endpoint is
              synchronous, so webhook-style async callbacks are not required for normal use.
              Internal event handling (e.g., billing events from Stripe) uses webhooks
              internally but those are not exposed to users.
            </p>
            <p className="docs-p">
              If you require async job submission with a completion callback for high-volume
              use cases, this is being considered for the public API roadmap. Reach out via
              the support channel to express interest.
            </p>
          </section>

          {/* ── SDK & Keys ── */}
          <section id="sdk">
            <h2 className="docs-h2">SDK &amp; API Keys</h2>
            <p className="docs-p">
              A public API key system and an official SDK are on the roadmap but not yet
              available on the hosted service.
            </p>
            <ul className="docs-ul">
              <li className="docs-li">
                <strong>API keys</strong> — will allow programmatic access without a browser
                session. Keys will be issued from the Account Settings page and support
                scoped permissions (read-only history, generate-only, etc.).
              </li>
              <li className="docs-li">
                <strong>JavaScript / TypeScript SDK</strong> — a typed client library is planned.
                It will wrap both endpoints with full type safety, automatic retry on 503 errors,
                and credit balance checking before HD requests.
              </li>
              <li className="docs-li">
                <strong>Open-source examples</strong> — once the public API is live, usage
                examples and the SDK source will be published on the{' '}
                <a
                  href="https://github.com/wokspec"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="docs-code"
                >
                  WokSpec GitHub org
                </a>.
              </li>
            </ul>
            <div className="docs-callout docs-callout--tip">
              <span className="docs-callout-icon">✦</span>
              <span>
                In the meantime, you can use the API from the browser by building on top of
                the same session-authenticated requests the WokGen UI makes. Browser DevTools
                &rarr; Network tab while using the studio will show you the exact request shape.
              </span>
            </div>
          </section>

          <div className="docs-content-footer">
            <Link href="/docs" className="btn-ghost btn-sm">← Docs Hub</Link>
            <Link href="/docs/platform/billing" className="btn-ghost btn-sm">Billing & Credits →</Link>
          </div>
        </main>
      </div>
    </div>
  );
}

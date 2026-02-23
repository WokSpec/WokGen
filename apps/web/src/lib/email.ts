/**
 * Transactional email via Resend.
 * All functions are no-ops when RESEND_API_KEY is not set — safe for
 * local dev and self-hosted deployments without email configured.
 */

const FROM = 'WokGen <noreply@wokspec.org>';
const REPLY_TO = 'team@wokspec.org';

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Resend } = require('resend');
  return new Resend(key) as { emails: { send: (opts: unknown) => Promise<unknown> } };
}

async function send(opts: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}) {
  const resend = getResend();
  if (!resend) return; // no-op: RESEND_API_KEY not set
  try {
    await resend.emails.send({ from: FROM, replyTo: REPLY_TO, ...opts });
  } catch (err) {
    console.error('[email] send error:', err);
  }
}

// ─── Email templates ──────────────────────────────────────────────────────

export async function sendWelcomeEmail(to: string, name?: string) {
  const displayName = name ?? 'there';
  await send({
    to,
    subject: 'Welcome to WokGen',
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:2rem;background:#0d0d0d;color:#ebebeb">
        <h1 style="font-size:1.5rem;font-weight:700;color:#a78bfa;margin:0 0 1rem">WokGen</h1>
        <p style="color:#ebebeb;margin:0 0 1rem">Hey ${displayName},</p>
        <p style="color:#888;margin:0 0 1.5rem;line-height:1.7">
          Your account is ready. Standard pixel art generation is free — no setup, no key needed.
          Upgrade to a paid plan for HD quality via Replicate.
        </p>
        <a href="https://wokgen.wokspec.org/studio" style="display:inline-block;padding:.75rem 1.5rem;background:#a78bfa;color:#0d0d0d;font-weight:700;text-decoration:none;border-radius:4px">
          Open Studio →
        </a>
        <p style="color:#464646;font-size:.8rem;margin:2rem 0 0">
          Made by <a href="https://wokspec.org" style="color:#a78bfa">Wok Specialists</a>
        </p>
      </div>
    `,
    text: `Hey ${displayName}, your WokGen account is ready. Visit https://wokgen.wokspec.org/studio to start generating.`,
  });
}

export async function sendLowCreditsEmail(to: string, remaining: number) {
  await send({
    to,
    subject: `You have ${remaining} HD credit${remaining === 1 ? '' : 's'} left`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:2rem;background:#0d0d0d;color:#ebebeb">
        <h1 style="font-size:1.5rem;font-weight:700;color:#a78bfa;margin:0 0 1rem">WokGen</h1>
        <p style="color:#ebebeb;margin:0 0 1rem">Running low on HD credits.</p>
        <p style="color:#888;margin:0 0 1.5rem;line-height:1.7">
          You have <strong style="color:#f59e0b">${remaining} HD credit${remaining === 1 ? '' : 's'}</strong> remaining this month.
          Top up or upgrade your plan to keep generating high-quality assets.
        </p>
        <a href="https://wokgen.wokspec.org/billing" style="display:inline-block;padding:.75rem 1.5rem;background:#a78bfa;color:#0d0d0d;font-weight:700;text-decoration:none;border-radius:4px">
          Add credits →
        </a>
      </div>
    `,
    text: `You have ${remaining} HD credits left. Top up at https://wokgen.wokspec.org/billing`,
  });
}

export async function sendBillingReceiptEmail(to: string, amountUsd: number, planName?: string) {
  const desc = planName ? `${planName} subscription` : 'payment';
  await send({
    to,
    subject: `Payment confirmed — $${amountUsd.toFixed(2)}`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:2rem;background:#0d0d0d;color:#ebebeb">
        <h1 style="font-size:1.5rem;font-weight:700;color:#a78bfa;margin:0 0 1rem">WokGen</h1>
        <p style="color:#ebebeb;margin:0 0 1rem">Payment confirmed ✓</p>
        <p style="color:#888;margin:0 0 1.5rem;line-height:1.7">
          Your ${desc} of <strong style="color:#ebebeb">$${amountUsd.toFixed(2)}</strong> was processed.
          Credits have been added to your account.
        </p>
        <a href="https://wokgen.wokspec.org/account" style="display:inline-block;padding:.75rem 1.5rem;background:#a78bfa;color:#0d0d0d;font-weight:700;text-decoration:none;border-radius:4px">
          View account →
        </a>
      </div>
    `,
    text: `Payment of $${amountUsd.toFixed(2)} confirmed. View your account at https://wokgen.wokspec.org/account`,
  });
}

export async function sendSubscriptionCanceledEmail(to: string, periodEnd: Date) {
  const date = periodEnd.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  await send({
    to,
    subject: 'Your WokGen subscription has been canceled',
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:2rem;background:#0d0d0d;color:#ebebeb">
        <h1 style="font-size:1.5rem;font-weight:700;color:#a78bfa;margin:0 0 1rem">WokGen</h1>
        <p style="color:#ebebeb;margin:0 0 1rem">Subscription canceled</p>
        <p style="color:#888;margin:0 0 1.5rem;line-height:1.7">
          Your subscription has been canceled. You&apos;ll retain access to your current plan until
          <strong style="color:#ebebeb">${date}</strong>, after which your account moves to the Free tier.
        </p>
        <p style="color:#888;line-height:1.7">
          Standard generation remains free forever.
        </p>
        <a href="https://wokgen.wokspec.org/billing" style="display:inline-block;padding:.75rem 1.5rem;background:rgba(167,139,250,.12);color:#a78bfa;font-weight:700;text-decoration:none;border-radius:4px;border:1px solid rgba(167,139,250,.25)">
          Reactivate subscription →
        </a>
      </div>
    `,
    text: `Your WokGen subscription has been canceled. Access continues until ${date}. Standard generation remains free.`,
  });
}

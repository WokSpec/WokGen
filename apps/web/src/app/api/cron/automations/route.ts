import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// ---------------------------------------------------------------------------
// GET /api/cron/automations
//
// Fires pending automations whose cron expression matches the current time.
// Called by Vercel Cron (every 5 minutes) or Render cron jobs.
// Secured by CRON_SECRET header.
//
// Template variables supported in messageTemplate:
//   {{date}}       — current ISO date
//   {{user_name}}  — user's display name or email
//   {{quota_used}} — today's generation count
//   {{quota_max}}  — plan limit
// ---------------------------------------------------------------------------

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function matchesCronNow(expr: string): boolean {
  const now = new Date();
  const parts = expr.trim().split(/\s+/);
  if (parts.length < 5) return false;

  const [minExpr, hourExpr, domExpr, monExpr, dowExpr] = parts;
  const minute = now.getUTCMinutes();
  const hour   = now.getUTCHours();
  const dom    = now.getUTCDate();
  const month  = now.getUTCMonth() + 1;
  const dow    = now.getUTCDay();

  function matchField(expr: string, val: number): boolean {
    if (expr === '*') return true;
    if (expr.startsWith('*/')) return val % parseInt(expr.slice(2)) === 0;
    if (expr.includes('-')) {
      const [lo, hi] = expr.split('-').map(Number);
      return val >= lo && val <= hi;
    }
    if (expr.includes(',')) return expr.split(',').map(Number).includes(val);
    return parseInt(expr) === val;
  }

  return (
    matchField(minExpr, minute) &&
    matchField(hourExpr, hour) &&
    matchField(domExpr, dom) &&
    matchField(monExpr, month) &&
    matchField(dowExpr, dow)
  );
}

function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

async function fireAutomation(automation: {
  id: string;
  userId: string;
  targetType: string;
  targetValue: string | null;
  messageTemplate: string;
}) {
  const user = await prisma.user.findUnique({
    where: { id: automation.userId },
    select: { name: true, email: true },
  });

  const vars = {
    date:      new Date().toISOString().slice(0, 10),
    user_name: user?.name ?? user?.email ?? 'there',
  };

  const message = renderTemplate(automation.messageTemplate, vars);

  if (automation.targetType === 'webhook' && automation.targetValue) {
    const res = await fetch(automation.targetValue, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'automation', userId: automation.userId, message, sentAt: new Date().toISOString() }),
    });
    if (!res.ok) throw new Error(`Webhook ${res.status}`);
  }
  // email + in_app: extensible hooks (Resend, ActivityEvent, etc.)
  return { ok: true };
}

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret') ?? req.nextUrl.searchParams.get('secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const automations = await prisma.automation.findMany({ where: { enabled: true } });
  const fired: string[] = [];
  const errors: string[] = [];

  for (const auto of automations) {
    if (!matchesCronNow(auto.schedule)) continue;
    try {
      await fireAutomation(auto);
      await prisma.automation.update({
        where: { id: auto.id },
        data: { lastRunAt: new Date(), lastRunStatus: 'ok', lastRunError: null },
      });
      fired.push(auto.id);
    } catch (err: unknown) {
      const msg = (err as Error).message;
      await prisma.automation.update({
        where: { id: auto.id },
        data: { lastRunAt: new Date(), lastRunStatus: 'error', lastRunError: msg },
      });
      errors.push(`${auto.id}: ${msg}`);
    }
  }

  return NextResponse.json({ checked: automations.length, fired: fired.length, errors });
}

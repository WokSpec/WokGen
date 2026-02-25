import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma, dbQuery } from '@/lib/db';
import { API_ERRORS } from '@/lib/api-response';
import { log } from '@/lib/logger';
import { z } from 'zod';
import { checkSsrf } from '@/lib/ssrf-check';

// ---------------------------------------------------------------------------
// GET  /api/automations     — list user's automations
// POST /api/automations     — create automation
// ---------------------------------------------------------------------------

export const dynamic = 'force-dynamic';

const MAX_AUTOMATIONS = 10;

// Cron syntax validator (5 fields)
function isValidCron(expr: string): boolean {
  const parts = expr.trim().split(/\s+/);
  if (parts.length < 5 || parts.length > 6) return false;
  const part = /^(\*|[0-9]+(-[0-9]+)?(\/[0-9]+)?|\*\/[0-9]+)$/;
  return parts.every(p => part.test(p));
}

const CreateAutomationSchema = z.object({
  name:            z.string().min(1).max(80),
  schedule:        z.string().min(9).max(60),
  targetType:      z.enum(['email', 'webhook', 'in_app']).optional().default('in_app'),
  targetValue:     z.string().max(500).optional(),
  messageTemplate: z.string().min(1).max(2000),
});

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return API_ERRORS.UNAUTHORIZED();

    const limit = Math.min(Number(req.nextUrl.searchParams.get('limit') ?? '20'), 50);

    const automations = await dbQuery(prisma.automation.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
    }));

    return NextResponse.json({ automations });
  } catch (err) {
    log.error({ err }, 'GET /api/automations failed');
    return API_ERRORS.INTERNAL();
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return API_ERRORS.UNAUTHORIZED();

    let rawBody: unknown;
    try { rawBody = await req.json(); } catch { return API_ERRORS.BAD_REQUEST('Invalid JSON'); }

    const parsed = CreateAutomationSchema.safeParse(rawBody);
    if (!parsed.success) {
      return API_ERRORS.BAD_REQUEST(parsed.error.issues[0]?.message ?? 'Invalid request body.');
    }

    const { name, schedule, targetType, targetValue, messageTemplate } = parsed.data;

    if (!isValidCron(schedule)) return API_ERRORS.BAD_REQUEST('Invalid cron expression');

    if (targetType === 'webhook' && targetValue) {
      const ssrf = checkSsrf(targetValue, true);
      if (!ssrf.ok) {
        return API_ERRORS.BAD_REQUEST(`Invalid webhook URL: ${ssrf.reason}`);
      }
    }

    // Enforce per-user limit
    const count = await dbQuery(prisma.automation.count({ where: { userId: session.user.id } }));
    if (count >= MAX_AUTOMATIONS) {
      return API_ERRORS.BAD_REQUEST(`Max ${MAX_AUTOMATIONS} automations per account`);
    }

    const automation = await dbQuery(prisma.automation.create({
      data: {
        userId:          session.user.id,
        name:            name.trim(),
        schedule:        schedule.trim(),
        targetType:      targetType ?? 'email',
        targetValue:     targetValue?.trim() || null,
        messageTemplate: messageTemplate.trim(),
        enabled:         true,
      },
    }));

    return NextResponse.json({ automation }, { status: 201 });
  } catch (err) {
    log.error({ err }, 'POST /api/automations failed');
    return API_ERRORS.INTERNAL();
  }
}

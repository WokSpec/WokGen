import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
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
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const limit = Math.min(Number(req.nextUrl.searchParams.get('limit') ?? '20'), 50);

  const automations = await prisma.automation.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return NextResponse.json({ automations });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rawBody = await req.json().catch(() => null);
  if (!rawBody) return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });

  const parsed = CreateAutomationSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid request body.' }, { status: 400 });
  }

  const { name, schedule, targetType, targetValue, messageTemplate } = parsed.data;

  if (!isValidCron(schedule)) return NextResponse.json({ error: 'Invalid cron expression' }, { status: 400 });

  if (targetType === 'webhook' && targetValue) {
    const ssrf = checkSsrf(targetValue, true);
    if (!ssrf.ok) {
      return NextResponse.json({ error: `Invalid webhook URL: ${ssrf.reason}` }, { status: 400 });
    }
  }

  // Enforce per-user limit
  const count = await prisma.automation.count({ where: { userId: session.user.id } });
  if (count >= MAX_AUTOMATIONS) {
    return NextResponse.json({ error: `Max ${MAX_AUTOMATIONS} automations per account` }, { status: 400 });
  }

  const automation = await prisma.automation.create({
    data: {
      userId:          session.user.id,
      name:            name.trim(),
      schedule:        schedule.trim(),
      targetType:      targetType ?? 'email',
      targetValue:     targetValue?.trim() || null,
      messageTemplate: messageTemplate.trim(),
      enabled:         true,
    },
  });

  return NextResponse.json({ automation }, { status: 201 });
}

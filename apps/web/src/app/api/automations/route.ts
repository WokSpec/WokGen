import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// ---------------------------------------------------------------------------
// GET  /api/automations     — list user's automations
// POST /api/automations     — create automation
// ---------------------------------------------------------------------------

export const dynamic = 'force-dynamic';

const MAX_AUTOMATIONS = 10;

// Very basic cron syntax validator (5 or 6 fields)
function isValidCron(expr: string): boolean {
  const parts = expr.trim().split(/\s+/);
  if (parts.length < 5 || parts.length > 6) return false;
  // Each part: digit, *, */N, or N-M
  const part = /^(\*|[0-9]+(-[0-9]+)?(\/[0-9]+)?|\*\/[0-9]+)$/;
  return parts.every(p => part.test(p));
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const automations = await prisma.automation.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ automations });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { name, schedule, targetType, targetValue, messageTemplate } = body;

  if (!name?.trim())            return NextResponse.json({ error: '`name` required' }, { status: 400 });
  if (!schedule?.trim())        return NextResponse.json({ error: '`schedule` required' }, { status: 400 });
  if (!messageTemplate?.trim()) return NextResponse.json({ error: '`messageTemplate` required' }, { status: 400 });
  if (!isValidCron(schedule))   return NextResponse.json({ error: 'Invalid cron expression' }, { status: 400 });

  const allowedTargets = ['email', 'webhook', 'in_app'];
  if (targetType && !allowedTargets.includes(targetType)) {
    return NextResponse.json({ error: 'Invalid targetType' }, { status: 400 });
  }

  if (targetType === 'webhook' && targetValue) {
    try { new URL(targetValue); } catch {
      return NextResponse.json({ error: 'Invalid webhook URL' }, { status: 400 });
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

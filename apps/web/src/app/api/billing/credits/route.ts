import { NextResponse } from 'next/server';
import { API_ERRORS } from '@/lib/api-response';
import { log } from '@/lib/logger';

export async function POST() {
  try {
    return NextResponse.json(
      { error: 'Subscriptions are no longer available. All features are free.' },
      { status: 410 },
    );
  } catch (err) {
    log.error({ err }, 'POST /api/billing/credits failed');
    return API_ERRORS.INTERNAL();
  }
}

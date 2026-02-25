import { NextResponse } from 'next/server';
import { API_ERRORS } from '@/lib/api-response';
import { log } from '@/lib/logger';

export async function POST() {
  try {
    return NextResponse.json(
      {
        error: 'Billing is not yet available. WokGen is currently free for all users.',
        code: 'BILLING_NOT_AVAILABLE',
      },
      { status: 410 },
    );
  } catch (err) {
    log.error({ err }, 'POST /api/billing/checkout failed');
    return API_ERRORS.INTERNAL();
  }
}

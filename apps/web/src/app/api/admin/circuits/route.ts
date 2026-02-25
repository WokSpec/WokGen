import { getAllCircuitStatuses } from '@/lib/circuit-breaker';
import { API_ERRORS } from '@/lib/api-response';
import { log } from '@/lib/logger';
import { requireAdmin, isAdminResponse } from '@/lib/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
  const adminResult = await requireAdmin();
  if (isAdminResponse(adminResult)) return adminResult;

  const statuses = getAllCircuitStatuses();
  return Response.json({ circuits: statuses });
  } catch (err) {
    log.error({ err }, 'GET /api/admin/circuits failed');
    return API_ERRORS.INTERNAL();
  }
}

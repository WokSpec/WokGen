/**
 * GET /api/v1/jobs/:id
 *
 * Poll the status of an async generation job.
 * Returns the job's current state, and resultUrl once succeeded.
 *
 * Authentication: Bearer API key
 */
import { type NextRequest, NextResponse } from 'next/server';
import { prisma, dbQuery } from '@/lib/db';
import { authenticateApiKey } from '@/lib/api-key-auth';
import { API_ERRORS } from '@/lib/api-response';
import { log } from '@/lib/logger';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const jobId = ctx?.params?.id;
    if (!jobId) {
      return API_ERRORS.BAD_REQUEST('Job ID required');
    }

    const apiUser = await authenticateApiKey(req);
    if (!apiUser) {
      return API_ERRORS.UNAUTHORIZED();
    }

    const job = await dbQuery(
      prisma.job.findFirst({
        where: { id: jobId, userId: apiUser.userId },
        select: {
          id:         true,
          status:     true,
          tool:       true,
          prompt:     true,
          provider:   true,
          width:      true,
          height:     true,
          seed:       true,
          resultUrl:  true,
          resultUrls: true,
          error:      true,
          createdAt:  true,
          updatedAt:  true,
        },
      }),
    );

    if (!job) {
      return API_ERRORS.NOT_FOUND('Job');
    }

    const response = {
      id:          job.id,
      status:      job.status,
      tool:        job.tool,
      prompt:      job.prompt,
      provider:    job.provider,
      width:       job.width,
      height:      job.height,
      seed:        job.seed,
      result_url:  job.status === 'succeeded' ? job.resultUrl   : null,
      result_urls: job.status === 'succeeded' ? (job.resultUrls ?? []) : [],
      error:       job.status === 'failed'    ? job.error       : null,
      created_at:  job.createdAt,
      updated_at:  job.updatedAt,
    };

    const cacheControl = (job.status === 'succeeded' || job.status === 'failed')
      ? 'public, max-age=300'
      : 'no-store';

    return NextResponse.json(response, {
      status: 200,
      headers: { ...CORS, 'Cache-Control': cacheControl },
    });
  } catch (err) {
    log.error({ err }, 'GET /api/v1/jobs/[id] failed');
    return API_ERRORS.INTERNAL();
  }
}

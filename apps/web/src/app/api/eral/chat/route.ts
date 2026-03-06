import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { signEralToken } from '@/lib/eral-token';

// ---------------------------------------------------------------------------
// POST /api/eral/chat
//
// Thin proxy to the Eral Worker — avoids CORS issues for WokGen clients and
// lets WokGen sign a service JWT on behalf of the authenticated user.
// ---------------------------------------------------------------------------

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ERAL_API = process.env.ERAL_API_URL ?? 'https://eral.wokspec.org/api';
type Quality = 'fast' | 'balanced' | 'best';

function getMetadata(value: unknown): Record<string, string | number | boolean> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }

  const metadata = Object.fromEntries(
    Object.entries(value as Record<string, unknown>).filter(([, entry]) => {
      return (
        typeof entry === 'string' ||
        typeof entry === 'number' ||
        typeof entry === 'boolean'
      );
    }),
  ) as Record<string, string | number | boolean>;

  return Object.keys(metadata).length > 0 ? metadata : undefined;
}

function resolveQuality(body: Record<string, unknown>): Quality {
  if (body.quality === 'fast' || body.quality === 'balanced' || body.quality === 'best') {
    return body.quality;
  }

  switch (body.modelVariant) {
    case 'speed':
      return 'fast';
    case 'creative':
    case 'code':
      return 'best';
    default:
      return 'balanced';
  }
}

function createStreamingResponse(payload: { reply: string; conversationId?: string; model?: string }) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({
          token: payload.reply,
          conversationId: payload.conversationId,
          model: payload.model,
        })}\n\n`)
      );
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}

function normalizeConversationId(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = signEralToken(session.user);
  if (!token) {
    return NextResponse.json(
      { error: 'Eral service not configured (ERAL_JWT_SECRET missing)' },
      { status: 503 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const wantsStream = body.stream === true;
  const quality = resolveQuality(body);
  const eralRes = await fetch(`${ERAL_API}/v1/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-Eral-Source': 'wokgen',
    },
    body: JSON.stringify({
      message: body.message ?? body.prompt,
      sessionId: body.conversationId ?? body.sessionId ?? 'wokgen-default',
      quality,
      product: 'wokgen',
      pageContext: body.context != null
        ? JSON.stringify(body.context)
        : (body.studioContext as string | undefined),
      integration: {
        name: 'WokGen',
        kind: 'creative-studio',
        capabilities: ['asset-generation', 'project-chat'],
        metadata: {
          surface: 'web-app',
          ...(getMetadata(body.context) ?? {}),
        },
      },
    }),
  });

  const data = await eralRes.json() as {
    data?: {
      response?: string;
      sessionId?: string;
      model?: { provider?: string; model?: string };
    };
    error?: unknown;
  };

  if (!eralRes.ok) {
    return NextResponse.json(data.error ?? data, { status: eralRes.status });
  }

  const normalized = {
    reply: data.data?.response ?? '',
    conversationId: normalizeConversationId(data.data?.sessionId)
      ?? normalizeConversationId(body.conversationId)
      ?? normalizeConversationId(body.sessionId),
    model: data.data?.model?.model ?? 'eral',
  };

  if (wantsStream) {
    return createStreamingResponse(normalized);
  }

  // Normalize to the shape WokGen clients expect
  return NextResponse.json(normalized);
}

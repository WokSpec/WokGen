import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// POST /api/compute/test
// Tests reachability of a ComfyUI or Ollama endpoint URL.
// Body: { type: 'comfyUrl' | 'ollamaUrl', url: string }
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({})) as { type?: string; url?: string };
  const { url } = body;

  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'url is required' }, { status: 400 });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return NextResponse.json({ ok: false, message: 'Invalid URL format' });
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    return NextResponse.json({ ok: false, message: 'Only http/https URLs are supported' });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, { method: 'GET', signal: controller.signal });
    clearTimeout(timeout);
    return NextResponse.json({ ok: res.ok, message: res.ok ? `Connected (${res.status})` : `Returned ${res.status}` });
  } catch (err) {
    const msg = err instanceof Error && err.name === 'AbortError'
      ? 'Connection timed out (5s)'
      : 'Connection refused or unreachable';
    return NextResponse.json({ ok: false, message: msg });
  }
}

import { NextResponse } from 'next/server';
import { listAvailableProviders } from '@/lib/providers';

// GET /api/providers — list available AI providers and their capabilities
export async function GET() {
  const providers = listAvailableProviders();
  return NextResponse.json({ providers });
}

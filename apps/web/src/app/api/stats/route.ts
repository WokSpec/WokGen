import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';
export const revalidate = 60; // cache for 60 seconds

export async function GET() {
  try {
    const count = await prisma.job.count({
      where: { status: 'succeeded' },
    });
    return NextResponse.json({ totalGenerations: count });
  } catch {
    return NextResponse.json({ totalGenerations: null });
  }
}

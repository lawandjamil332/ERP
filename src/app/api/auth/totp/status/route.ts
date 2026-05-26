import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';

export async function GET() {
  const session = await requireSession();
  const row = await db.totpSecret.findUnique({ where: { userId: session.userId } });
  return NextResponse.json({
    enabled: !!row?.enabledAt,
  });
}

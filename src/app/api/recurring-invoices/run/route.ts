import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { runRecurring } from '@/lib/iraq/recurring';

export async function POST() {
  const session = await requireSession();
  const result = await runRecurring(db, session.tenantId);
  return NextResponse.json({ data: result });
}

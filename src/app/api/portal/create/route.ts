import { NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'node:crypto';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';

export async function POST(req: Request) {
  const session = await requireSession();
  const parsed = z.object({
    contactId: z.string(),
    ttlDays: z.number().int().min(1).max(365).default(30),
  }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });

  const token = crypto.randomBytes(24).toString('hex');
  const expiresAt = new Date(Date.now() + parsed.data.ttlDays * 86_400_000);
  const t = await db.customerPortalToken.create({
    data: {
      tenantId: session.tenantId,
      contactId: parsed.data.contactId,
      token, expiresAt,
    },
  });
  return NextResponse.json({ data: { id: t.id, token, expiresAt } });
}

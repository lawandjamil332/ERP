import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';

/**
 * NetSuite-style saved searches. Per-user filter snapshots on a list page.
 */
export async function GET(req: Request) {
  const session = await requireSession();
  const page = new URL(req.url).searchParams.get('page');
  const rows = await db.savedView.findMany({
    where: {
      tenantId: session.tenantId,
      userId: session.userId,
      ...(page ? { page } : {}),
    },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ data: rows });
}

const Body = z.object({
  page: z.string().min(1),
  name: z.string().min(1).max(60),
  filters: z.record(z.any()),
});

export async function POST(req: Request) {
  const session = await requireSession();
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  const created = await db.savedView.create({
    data: {
      tenantId: session.tenantId,
      userId: session.userId,
      page: parsed.data.page,
      name: parsed.data.name,
      filters: parsed.data.filters,
    },
  });
  return NextResponse.json({ data: created }, { status: 201 });
}

export async function DELETE(req: Request) {
  const session = await requireSession();
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id_required' }, { status: 400 });
  const result = await db.savedView.deleteMany({
    where: { id, tenantId: session.tenantId, userId: session.userId },
  });
  if (result.count === 0) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}

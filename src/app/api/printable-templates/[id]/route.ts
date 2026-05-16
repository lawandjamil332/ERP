import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';

const Body = z.object({
  name: z.string().min(1).optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
  paperSize: z.string().optional(),
  layout: z.object({
    sections: z.record(z.boolean()).optional(),
    styles: z.record(z.string()).optional(),
    text: z.record(z.string()).optional(),
  }).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await params;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  const existing = await db.printableTemplate.findFirst({ where: { id, tenantId: session.tenantId } });
  if (!existing) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  if (parsed.data.isDefault) {
    await db.printableTemplate.updateMany({
      where: { tenantId: session.tenantId, kind: existing.kind, isDefault: true, NOT: { id } },
      data: { isDefault: false },
    });
  }
  const updated = await db.printableTemplate.update({
    where: { id },
    data: parsed.data,
  });
  return NextResponse.json({ data: updated });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await params;
  const existing = await db.printableTemplate.findFirst({ where: { id, tenantId: session.tenantId } });
  if (!existing) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  await db.printableTemplate.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

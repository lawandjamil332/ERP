import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';

export async function GET(req: Request) {
  const session = await requireSession();
  const { searchParams } = new URL(req.url);
  const entity = searchParams.get('entity');
  const entityId = searchParams.get('entityId');
  if (!entity || !entityId) return NextResponse.json({ error: 'entity and entityId required' }, { status: 400 });
  const rows = await db.attachment.findMany({
    where: { tenantId: session.tenantId, entity, entityId },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ data: rows });
}

export async function POST(req: Request) {
  const session = await requireSession();
  const formData = await req.formData();
  const entity = formData.get('entity') as string;
  const entityId = formData.get('entityId') as string;
  const file = formData.get('file') as File | null;

  if (!entity || !entityId || !file) {
    return NextResponse.json({ error: 'entity, entityId, and file are required' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const storageKey = `attachments/${session.tenantId}/${entity}/${entityId}/${Date.now()}-${file.name}`;

  // Store in local filesystem for now. In production, use S3/R2 via the existing offsite.ts uploader.
  const fs = await import('fs/promises');
  const path = await import('path');
  const dir = path.join(process.cwd(), 'uploads', session.tenantId, entity, entityId);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, file.name), buffer);

  const created = await db.attachment.create({
    data: {
      tenantId: session.tenantId,
      entity,
      entityId,
      fileName: file.name,
      fileSize: buffer.length,
      mimeType: file.type || 'application/octet-stream',
      storageKey,
      uploadedById: session.userId,
    },
  });
  return NextResponse.json({ data: created }, { status: 201 });
}

export async function DELETE(req: Request) {
  const session = await requireSession();
  const { id } = await req.json().catch(() => ({ id: '' }));
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const existing = await db.attachment.findFirst({ where: { id, tenantId: session.tenantId } });
  if (!existing) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  await db.attachment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

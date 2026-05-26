import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { generateTotpSecret, totpUri, totpQrPng, verifyTotp } from '@/lib/auth/totp';

export async function POST() {
  const session = await requireSession();
  const user = await db.user.findUnique({ where: { id: session.userId } });
  if (!user) return NextResponse.json({ error: 'user_not_found' }, { status: 404 });

  const existing = await db.totpSecret.findUnique({ where: { userId: session.userId } });
  if (existing?.enabledAt) {
    return NextResponse.json({ error: 'totp_already_enabled' }, { status: 409 });
  }

  const secret = generateTotpSecret();
  await db.totpSecret.upsert({
    where: { userId: session.userId },
    create: { tenantId: session.tenantId, userId: session.userId, secret },
    update: { secret, enabledAt: null },
  });

  const tenant = await db.tenant.findUnique({ where: { id: session.tenantId } });
  const uri = totpUri({ account: user.email, issuer: tenant?.nameEn ?? 'Iraq ERP', secret });
  const png = await totpQrPng(uri);

  return NextResponse.json({
    secret,
    uri,
    qrPngBase64: `data:image/png;base64,${png.toString('base64')}`,
  });
}

export async function PUT(req: Request) {
  const session = await requireSession();
  const body = await req.json().catch(() => ({} as any));
  const token = String(body.token ?? '');
  const row = await db.totpSecret.findUnique({ where: { userId: session.userId } });
  if (!row) return NextResponse.json({ error: 'totp_not_set' }, { status: 400 });
  if (!verifyTotp(token, row.secret)) {
    return NextResponse.json({ error: 'invalid_code' }, { status: 400 });
  }
  await db.totpSecret.update({ where: { userId: session.userId }, data: { enabledAt: new Date() } });
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const session = await requireSession();
  await db.totpSecret.delete({ where: { userId: session.userId } }).catch(() => null);
  return NextResponse.json({ ok: true });
}

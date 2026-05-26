import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { verifyPassword } from '@/lib/auth/password';
import { signSession, setSessionCookie } from '@/lib/auth/session';
import { verifyTotp } from '@/lib/auth/totp';

const Body = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  totp: z.string().optional(),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  const { email, password, totp } = parsed.data;

  const user = await db.user.findFirst({
    where: { email: email.toLowerCase(), isActive: true },
    include: { tenant: true },
  });
  if (!user) return NextResponse.json({ error: 'invalid_credentials' }, { status: 401 });

  const ok = await verifyPassword(user.passwordHash, password);
  if (!ok) return NextResponse.json({ error: 'invalid_credentials' }, { status: 401 });

  const totpRow = await db.totpSecret.findUnique({ where: { userId: user.id } });
  if (totpRow?.enabledAt) {
    if (!totp) {
      return NextResponse.json({ error: 'totp_required', requiresTotp: true }, { status: 401 });
    }
    if (!verifyTotp(totp, totpRow.secret)) {
      return NextResponse.json({ error: 'invalid_totp' }, { status: 401 });
    }
  }

  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  const token = await signSession({
    userId: user.id,
    tenantId: user.tenantId,
    role: user.role,
    email: user.email,
  });
  await setSessionCookie(token);
  return NextResponse.json({ ok: true });
}

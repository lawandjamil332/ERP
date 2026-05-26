import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createHash } from 'crypto';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth/password';

const Body = z.object({ password: z.string().min(8) });

function hashToken(t: string) {
  return createHash('sha256').update(t).digest('hex');
}

export async function POST(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const tokenHash = hashToken(token);
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_input', issues: parsed.error.issues }, { status: 400 });
  }
  const row = await db.passwordResetToken.findUnique({ where: { tokenHash } });
  if (!row) return NextResponse.json({ error: 'invalid_token' }, { status: 400 });
  if (row.usedAt) return NextResponse.json({ error: 'token_used' }, { status: 400 });
  if (row.expiresAt < new Date()) return NextResponse.json({ error: 'token_expired' }, { status: 400 });

  const passwordHash = await hashPassword(parsed.data.password);
  await db.$transaction([
    db.user.update({ where: { id: row.userId }, data: { passwordHash } }),
    db.passwordResetToken.update({ where: { tokenHash }, data: { usedAt: new Date() } }),
  ]);
  return NextResponse.json({ ok: true });
}

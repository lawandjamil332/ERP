import { NextResponse } from 'next/server';
import { z } from 'zod';
import argon2 from 'argon2';
import { cookies } from 'next/headers';
import { SignJWT } from 'jose';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-change-me');
const COOKIE = 'iraq_erp_reauth';
const TTL_MIN = 5;

/**
 * Step-up authentication. Confirms the user's password and issues a short-lived
 * (5 min) re-auth cookie. Used before sensitive actions (post payment, close
 * period, restore backup).
 */
const Body = z.object({ password: z.string().min(1) });

export async function POST(req: Request) {
  const session = await requireSession();
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });

  const user = await db.user.findUnique({ where: { id: session.userId }, select: { passwordHash: true } });
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const ok = await argon2.verify(user.passwordHash, parsed.data.password);
  if (!ok) return NextResponse.json({ error: 'wrong_password' }, { status: 401 });

  const token = await new SignJWT({ uid: session.userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${TTL_MIN}m`)
    .sign(SECRET);
  (await cookies()).set(COOKIE, token, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax',
    path: '/', maxAge: TTL_MIN * 60,
  });
  return NextResponse.json({ ok: true, validForMinutes: TTL_MIN });
}

import { SignJWT, jwtVerify } from 'jose';
import { cookies, headers } from 'next/headers';
import type { NextRequest } from 'next/server';

const COOKIE = process.env.SESSION_COOKIE_NAME || 'iraq_erp_session';
const ALG = 'HS256';
const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'dev-secret-change-me'
);
const TTL_HOURS = 12;

export interface SessionPayload {
  userId: string;
  tenantId: string;
  role: string;
  email: string;
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(`${TTL_HOURS}h`)
    .sign(SECRET);
}

export async function verifySession(req?: NextRequest): Promise<SessionPayload | null> {
  const token = req
    ? req.cookies.get(COOKIE)?.value
    : (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string) {
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: TTL_HOURS * 60 * 60,
  });
}

export async function clearSessionCookie() {
  (await cookies()).delete(COOKIE);
}

/** Helper for server components & route handlers — throws if not signed in. */
export async function requireSession(): Promise<SessionPayload> {
  const s = await verifySession();
  if (!s) throw new Error('UNAUTHORIZED');
  // Attribute all subsequent DB writes in this request to this user/tenant.
  try {
    const { enterAuditContext } = await import('@/lib/db/audit');
    const h = await headers();
    enterAuditContext({
      tenantId: s.tenantId,
      userId: s.userId,
      ip: h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
      userAgent: h.get('user-agent'),
    });
  } catch { /* headers() unavailable outside request scope — ignore */ }
  return s;
}

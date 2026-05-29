import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-change-me');
const COOKIE = 'iraq_erp_reauth';

/** Server-side check: does the caller hold a fresh re-auth proof? */
export async function hasFreshReauth(userId: string): Promise<boolean> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload.uid === userId;
  } catch {
    return false;
  }
}

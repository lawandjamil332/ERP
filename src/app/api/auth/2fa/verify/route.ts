import { NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'node:crypto';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';

function hotp(secretBase32: string, counter: number): string {
  const key = base32Decode(secretBase32);
  const buf = Buffer.alloc(8);
  buf.writeUInt32BE(Math.floor(counter / 2 ** 32), 0);
  buf.writeUInt32BE(counter >>> 0, 4);
  const h = crypto.createHmac('sha1', key).update(buf).digest();
  const offset = h[h.length - 1] & 0xf;
  const code = ((h[offset] & 0x7f) << 24) | (h[offset + 1] << 16) | (h[offset + 2] << 8) | h[offset + 3];
  return String(code % 1_000_000).padStart(6, '0');
}

function base32Decode(input: string): Buffer {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0, value = 0;
  const bytes: number[] = [];
  for (const ch of input.replace(/=+$/, '').toUpperCase()) {
    const idx = alphabet.indexOf(ch);
    if (idx < 0) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((value >> bits) & 0xff);
    }
  }
  return Buffer.from(bytes);
}

export async function POST(req: Request) {
  const session = await requireSession();
  const parsed = z.object({ code: z.string().regex(/^\d{6}$/) }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });

  const rec = await db.totpSecret.findUnique({ where: { userId: session.userId } });
  if (!rec) return NextResponse.json({ error: 'no_secret' }, { status: 400 });

  const counter = Math.floor(Date.now() / 1000 / 30);
  const ok = [counter - 1, counter, counter + 1].some(
    (c) => hotp(rec.secret, c) === parsed.data.code
  );
  if (!ok) return NextResponse.json({ error: 'invalid_code' }, { status: 401 });

  await db.totpSecret.update({
    where: { userId: session.userId },
    data: { enabledAt: rec.enabledAt ?? new Date() },
  });
  return NextResponse.json({ ok: true });
}

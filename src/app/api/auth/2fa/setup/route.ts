import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';

function generateBase32Secret(bytes = 20): string {
  const buf = crypto.randomBytes(bytes);
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0, value = 0, out = '';
  for (let i = 0; i < buf.length; i++) {
    value = (value << 8) | buf[i];
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      out += alphabet[(value >> bits) & 0x1f];
    }
  }
  if (bits > 0) out += alphabet[(value << (5 - bits)) & 0x1f];
  return out;
}

export async function POST() {
  const session = await requireSession();
  const secret = generateBase32Secret();
  await db.totpSecret.upsert({
    where: { userId: session.userId },
    create: { tenantId: session.tenantId, userId: session.userId, secret },
    update: { secret, enabledAt: null },
  });
  const otpauthUri = `otpauth://totp/Iraq%20ERP:${encodeURIComponent(session.email)}?secret=${secret}&issuer=Iraq%20ERP&algorithm=SHA1&digits=6&period=30`;
  return NextResponse.json({ secret, otpauthUri });
}

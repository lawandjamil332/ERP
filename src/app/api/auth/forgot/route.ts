import { NextResponse } from 'next/server';
import { z } from 'zod';
import { randomBytes, createHash } from 'crypto';
import { db } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { logger } from '@/lib/observability/logger';

const Body = z.object({ email: z.string().email() });

const RESET_TTL_MIN = 30;

function hashToken(t: string) {
  return createHash('sha256').update(t).digest('hex');
}

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: true });

  const email = parsed.data.email.toLowerCase();
  const user = await db.user.findFirst({ where: { email } });

  if (user) {
    const raw = randomBytes(24).toString('hex');
    const tokenHash = hashToken(raw);
    await db.passwordResetToken.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + RESET_TTL_MIN * 60_000),
      },
    });
    const base = process.env.APP_URL ?? 'http://localhost:3000';
    const link = `${base}/${user.locale}/auth/reset/${raw}`;
    try {
      await sendEmail({
        to: email,
        subject: 'Reset your Iraq ERP password',
        html: `<p>Hello ${user.fullName},</p>
               <p>Click the link below to reset your password. The link expires in ${RESET_TTL_MIN} minutes.</p>
               <p><a href="${link}">${link}</a></p>
               <p>If you did not request this, ignore this email.</p>`,
        text: `Reset your password: ${link} (expires in ${RESET_TTL_MIN} minutes).`,
      });
    } catch (e) {
      logger.error({ err: (e as any)?.message }, 'forgot-email-send-failed');
    }
  }

  return NextResponse.json({ ok: true });
}

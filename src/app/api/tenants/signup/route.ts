import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth/password';
import { signSession, setSessionCookie } from '@/lib/auth/session';
import { IUAS_CHART_OF_ACCOUNTS } from '@/lib/iraq/coa';

const Body = z.object({
  tenant: z.object({
    nameAr: z.string().min(2),
    nameEn: z.string().min(2),
    taxNumber: z.string().optional(),
    commercialReg: z.string().optional(),
    governorate: z.string().optional(),
    region: z.enum(['FEDERAL', 'KURDISTAN']).default('FEDERAL'),
    sector: z.enum([
      'GENERAL','OIL_GAS','TELECOM','HOSPITALITY','CONSTRUCTION',
      'RETAIL','MANUFACTURING','AGRICULTURE','HEALTHCARE','EDUCATION','TRANSPORT',
    ]).default('GENERAL'),
    defaultLocale: z.enum(['ar', 'ku', 'en']).default('ar'),
  }),
  owner: z.object({
    email: z.string().email(),
    password: z.string().min(8),
    fullName: z.string().min(2),
  }),
});

export async function POST(req: Request) {
  try {
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'invalid_input', issues: parsed.error.issues }, { status: 400 });
    const { tenant: tBody, owner } = parsed.data;

    if (tBody.taxNumber) {
      const existing = await db.tenant.findUnique({ where: { taxNumber: tBody.taxNumber } });
      if (existing) return NextResponse.json({ error: 'tax_number_taken' }, { status: 409 });
    }

    const existingEmail = await db.user.findFirst({ where: { email: owner.email.toLowerCase() } });
    if (existingEmail) return NextResponse.json({ error: 'email_already_registered' }, { status: 409 });

    const passwordHash = await hashPassword(owner.password);

    const created = await db.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          nameAr: tBody.nameAr, nameEn: tBody.nameEn,
          taxNumber: tBody.taxNumber, commercialReg: tBody.commercialReg,
          governorate: tBody.governorate, region: tBody.region, sector: tBody.sector,
          defaultLocale: tBody.defaultLocale,
        },
      });
      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: owner.email.toLowerCase(),
          passwordHash, fullName: owner.fullName,
          role: 'OWNER', locale: tBody.defaultLocale,
        },
      });

      const codeToId = new Map<string, string>();
      for (const acc of IUAS_CHART_OF_ACCOUNTS.filter((a) => !a.parentCode)) {
        const a = await tx.account.create({
          data: { tenantId: tenant.id, code: acc.code, nameAr: acc.nameAr, nameEn: acc.nameEn, type: acc.type, isPostable: acc.isPostable },
        });
        codeToId.set(acc.code, a.id);
      }
      let pending = IUAS_CHART_OF_ACCOUNTS.filter((a) => a.parentCode);
      while (pending.length) {
        const next: typeof pending = [];
        for (const acc of pending) {
          const parentId = codeToId.get(acc.parentCode!);
          if (!parentId) { next.push(acc); continue; }
          const a = await tx.account.create({
            data: { tenantId: tenant.id, code: acc.code, nameAr: acc.nameAr, nameEn: acc.nameEn, type: acc.type, isPostable: acc.isPostable, parentId },
          });
          codeToId.set(acc.code, a.id);
        }
        if (next.length === pending.length) throw new Error('Cyclic COA');
        pending = next;
      }

      return { tenant, user };
    });

    const token = await signSession({
      userId: created.user.id,
      tenantId: created.tenant.id,
      role: 'OWNER',
      email: created.user.email,
    });
    await setSessionCookie(token);
    return NextResponse.json({ ok: true, data: { tenantId: created.tenant.id } });
  } catch (e: any) {
    console.error('[signup] failed', e);
    const code = e?.code;
    const message = e?.message ?? 'internal_error';
    return NextResponse.json({
      error: code ? `${code}: ${message}` : message,
      meta: e?.meta,
    }, { status: 500 });
  }
}

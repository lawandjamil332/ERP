import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';

const Body = z.object({
  empNo: z.string().min(1),
  fullNameAr: z.string().min(1),
  fullNameEn: z.string().optional(),
  nationalId: z.string().optional(),
  ssNumber: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE']).optional(),
  dateOfBirth: z.coerce.date().optional(),
  governorate: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  hireDate: z.coerce.date(),
  jobTitle: z.string().optional(),
  department: z.string().optional(),
  baseSalary: z.number().positive(),
  dependents: z.number().int().nonnegative().default(0),
});

export async function GET() {
  let session;
  try { session = await requireSession(); } catch { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }); }
  const employees = await db.employee.findMany({
    where: { tenantId: session.tenantId, isActive: true },
    orderBy: { empNo: 'asc' },
  });
  return NextResponse.json({ data: employees });
}

export async function POST(req: Request) {
  let session;
  try { session = await requireSession(); } catch { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }); }
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input', issues: parsed.error.issues }, { status: 400 });
  const b = parsed.data;
  const created = await db.employee.create({
    data: {
      tenantId: session.tenantId,
      empNo: b.empNo,
      fullNameAr: b.fullNameAr,
      fullNameEn: b.fullNameEn,
      nationalId: b.nationalId,
      ssNumber: b.ssNumber,
      gender: b.gender,
      dateOfBirth: b.dateOfBirth,
      governorate: b.governorate,
      phone: b.phone,
      email: b.email || null,
      hireDate: b.hireDate,
      jobTitle: b.jobTitle,
      department: b.department,
      baseSalary: new Prisma.Decimal(b.baseSalary),
      dependents: b.dependents,
    },
  });
  return NextResponse.json({ data: created }, { status: 201 });
}

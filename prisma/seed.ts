/**
 * Seeds the Iraq ERP with:
 *   1. A demo tenant in Baghdad (federal Iraq)
 *   2. Owner + accountant + HR users
 *   3. The full IUAS chart of accounts
 *   4. A few sample customers/suppliers, products, employees
 *
 * Run: pnpm db:seed
 */
import { PrismaClient, Prisma } from '@prisma/client';
import argon2 from 'argon2';
import { IUAS_CHART_OF_ACCOUNTS } from '../src/lib/iraq/coa';

const db = new PrismaClient();

async function main() {
  console.log('Seeding Iraq ERP…');

  const tenant = await db.tenant.upsert({
    where: { taxNumber: 'IQ-DEMO-001' },
    update: {},
    create: {
      nameAr: 'شركة العراق التجريبية المحدودة',
      nameKu: 'کۆمپانیای عێراق دیمۆ',
      nameEn: 'Iraq Demo Trading Co. Ltd.',
      taxNumber: 'IQ-DEMO-001',
      commercialReg: 'CR-2026-0001',
      governorate: 'Baghdad',
      region: 'FEDERAL',
      sector: 'GENERAL',
      baseCurrency: 'IQD',
      defaultLocale: 'ar',
    },
  });

  const ownerHash      = await argon2.hash('Owner@2026!');
  const accountantHash = await argon2.hash('Accountant@2026!');
  const hrHash         = await argon2.hash('HR@2026!');

  await db.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'owner@demo.iq' } },
    update: {},
    create: {
      tenantId: tenant.id, email: 'owner@demo.iq',
      passwordHash: ownerHash, fullName: 'صاحب الشركة',
      role: 'OWNER', locale: 'ar',
    },
  });
  await db.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'accountant@demo.iq' } },
    update: {},
    create: {
      tenantId: tenant.id, email: 'accountant@demo.iq',
      passwordHash: accountantHash, fullName: 'المحاسب الرئيسي',
      role: 'ACCOUNTANT', locale: 'ar',
    },
  });
  await db.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'hr@demo.iq' } },
    update: {},
    create: {
      tenantId: tenant.id, email: 'hr@demo.iq',
      passwordHash: hrHash, fullName: 'مسؤول الموارد البشرية',
      role: 'HR', locale: 'ar',
    },
  });

  // IUAS chart of accounts — two-pass so parents exist before children
  const codeToId = new Map<string, string>();
  for (const acc of IUAS_CHART_OF_ACCOUNTS.filter((a) => !a.parentCode)) {
    const created = await db.account.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: acc.code } },
      update: {},
      create: {
        tenantId: tenant.id, code: acc.code,
        nameAr: acc.nameAr, nameEn: acc.nameEn,
        type: acc.type, isPostable: acc.isPostable,
      },
    });
    codeToId.set(acc.code, created.id);
  }
  let pending = IUAS_CHART_OF_ACCOUNTS.filter((a) => a.parentCode);
  while (pending.length > 0) {
    const next: typeof pending = [];
    for (const acc of pending) {
      const parentId = codeToId.get(acc.parentCode!);
      if (!parentId) { next.push(acc); continue; }
      const created = await db.account.upsert({
        where: { tenantId_code: { tenantId: tenant.id, code: acc.code } },
        update: {},
        create: {
          tenantId: tenant.id, code: acc.code,
          nameAr: acc.nameAr, nameEn: acc.nameEn,
          type: acc.type, isPostable: acc.isPostable,
          parentId,
        },
      });
      codeToId.set(acc.code, created.id);
    }
    if (next.length === pending.length) throw new Error('Cyclic chart of accounts');
    pending = next;
  }
  console.log(`  Seeded ${codeToId.size} accounts (IUAS 2026)`);

  await db.taxRate.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: 'NONE' } },
    update: {},
    create: { tenantId: tenant.id, code: 'NONE', nameAr: 'بلا ضريبة', nameEn: 'No tax', rate: new Prisma.Decimal(0), kind: 'SALES' },
  });
  await db.taxRate.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: 'HOSP' } },
    update: {},
    create: { tenantId: tenant.id, code: 'HOSP', nameAr: 'ضريبة الضيافة', nameEn: 'Hospitality tax', rate: new Prisma.Decimal(0.10), kind: 'SALES' },
  });
  await db.taxRate.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: 'WHT15' } },
    update: {},
    create: { tenantId: tenant.id, code: 'WHT15', nameAr: 'استقطاع غير المقيمين', nameEn: 'Non-resident WHT', rate: new Prisma.Decimal(0.15), kind: 'WITHHOLDING' },
  });

  const branch = await db.branch.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: 'BGW' } },
    update: {},
    create: {
      tenantId: tenant.id, code: 'BGW',
      nameAr: 'فرع بغداد', nameEn: 'Baghdad Branch',
      governorate: 'Baghdad', address: 'حي الكرادة',
    },
  });
  await db.warehouse.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: 'WH-BGW' } },
    update: {},
    create: { tenantId: tenant.id, branchId: branch.id, code: 'WH-BGW', nameAr: 'مخزن بغداد', nameEn: 'Baghdad Warehouse' },
  });

  await db.contact.create({
    data: {
      tenantId: tenant.id, kind: 'CUSTOMER',
      nameAr: 'شركة دجلة للتجارة', nameEn: 'Tigris Trading Co.',
      taxNumber: 'IQ-CUS-001', phone: '+9647901234567',
      governorate: 'Baghdad', currency: 'IQD',
      creditLimit: new Prisma.Decimal(50_000_000),
    },
  });
  await db.contact.create({
    data: {
      tenantId: tenant.id, kind: 'SUPPLIER',
      nameAr: 'مؤسسة الفرات للتوريدات', nameEn: 'Euphrates Supplies Est.',
      taxNumber: 'IQ-SUP-001', phone: '+9647708765432',
      governorate: 'Basra', currency: 'USD',
    },
  });

  await db.product.upsert({
    where: { tenantId_sku: { tenantId: tenant.id, sku: 'WHEAT-50KG' } },
    update: {},
    create: {
      tenantId: tenant.id, sku: 'WHEAT-50KG',
      nameAr: 'قمح - كيس ٥٠ كغم', nameEn: 'Wheat — 50kg bag',
      hsCode: '100199', countryOfOrigin: 'IQ', trademark: 'Local',
      unitOfMeasure: 'BAG', salePrice: new Prisma.Decimal(75_000), cost: new Prisma.Decimal(55_000),
    },
  });
  await db.product.upsert({
    where: { tenantId_sku: { tenantId: tenant.id, sku: 'OLIVE-1L' } },
    update: {},
    create: {
      tenantId: tenant.id, sku: 'OLIVE-1L',
      nameAr: 'زيت زيتون - ١ لتر', nameEn: 'Olive oil — 1 L',
      hsCode: '150910', countryOfOrigin: 'TR', trademark: 'Aegean',
      unitOfMeasure: 'BOTTLE', salePrice: new Prisma.Decimal(8_000), cost: new Prisma.Decimal(5_500),
    },
  });

  await db.employee.upsert({
    where: { tenantId_empNo: { tenantId: tenant.id, empNo: 'E-0001' } },
    update: {},
    create: {
      tenantId: tenant.id, empNo: 'E-0001',
      fullNameAr: 'أحمد علي حسين', fullNameEn: 'Ahmed Ali Hussein',
      nationalId: '19850515-001', ssNumber: 'SS-001',
      gender: 'MALE', dateOfBirth: new Date('1985-05-15'),
      governorate: 'Baghdad', jobTitle: 'محاسب', department: 'الإدارة المالية',
      hireDate: new Date('2022-01-01'),
      baseSalary: new Prisma.Decimal(1_200_000),
      dependents: 2,
      isActive: true,
    },
  });
  await db.employee.upsert({
    where: { tenantId_empNo: { tenantId: tenant.id, empNo: 'E-0002' } },
    update: {},
    create: {
      tenantId: tenant.id, empNo: 'E-0002',
      fullNameAr: 'فاطمة محمد كاظم', fullNameEn: 'Fatima Mohammed Kadhim',
      gender: 'FEMALE', dateOfBirth: new Date('1992-08-20'),
      governorate: 'Baghdad', jobTitle: 'مدير مبيعات', department: 'المبيعات',
      hireDate: new Date('2023-03-15'),
      baseSalary: new Prisma.Decimal(2_500_000),
      dependents: 0,
      isActive: true,
    },
  });

  console.log('Seed complete.');
  console.log('  Login:  owner@demo.iq / Owner@2026!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await db.$disconnect(); });

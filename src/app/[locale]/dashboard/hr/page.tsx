import Link from 'next/link';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { Plus } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { formatMoney } from '@/lib/iraq/money';
import { tri } from '@/lib/i18n/tri';

export default async function HrPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await requireSession();
  const t = await getTranslations('nav');

  const employees = await db.employee.findMany({
    where: { tenantId: session.tenantId, isActive: true },
    orderBy: { empNo: 'asc' },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('hr')}</h1>
        <Button asChild>
          <Link href={`/${locale}/dashboard/hr/new`}>
            <Plus className="h-4 w-4" /> {tri(locale, { ar: 'موظف جديد', ku: 'کارمەندی نوێ', en: 'New employee' })}
          </Link>
        </Button>
      </div>
      <Card>
        <Table>
          <THead>
            <TR>
              <TH>{tri(locale, { ar: 'رقم الموظف', ku: 'ژم. کارمەند', en: 'Emp #' })}</TH>
              <TH>{tri(locale, { ar: 'الاسم', ku: 'ناو', en: 'Name' })}</TH>
              <TH>{tri(locale, { ar: 'الوظيفة', ku: 'ناونیشانی کار', en: 'Job title' })}</TH>
              <TH>{tri(locale, { ar: 'القسم', ku: 'بەش', en: 'Department' })}</TH>
              <TH>{tri(locale, { ar: 'تاريخ التعيين', ku: 'بەرواری دامەزراندن', en: 'Hire date' })}</TH>
              <TH className="text-end">{tri(locale, { ar: 'الراتب الأساسي', ku: 'مووچەی بنەڕەتی', en: 'Base salary' })}</TH>
            </TR>
          </THead>
          <TBody>
            {employees.length === 0 && (
              <TR><TD colSpan={6} className="py-12 text-center text-muted-foreground">{tri(locale, { ar: 'لا يوجد موظفون بعد', ku: 'هێشتا هیچ کارمەندێک نییە', en: 'No employees yet' })}</TD></TR>
            )}
            {employees.map((e) => (
              <TR key={e.id}>
                <TD className="font-mono text-xs">{e.empNo}</TD>
                <TD>{tri(locale, { ar: e.fullNameAr, ku: e.fullNameEn ?? e.fullNameAr, en: e.fullNameEn ?? e.fullNameAr })}</TD>
                <TD>{e.jobTitle ?? '—'}</TD>
                <TD>{e.department ?? '—'}</TD>
                <TD className="tabular-nums">{new Intl.DateTimeFormat(locale).format(e.hireDate)}</TD>
                <TD className="text-end tabular-nums">{formatMoney(Number(e.baseSalary), 'IQD', locale as 'ar')}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>
    </div>
  );
}

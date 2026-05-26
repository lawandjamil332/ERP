import Link from 'next/link';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { Plus } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { formatMoney } from '@/lib/iraq/money';

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
            <Plus className="h-4 w-4" /> New employee
          </Link>
        </Button>
      </div>
      <Card>
        <Table>
          <THead>
            <TR>
              <TH>Emp #</TH>
              <TH>{locale === 'en' ? 'Name' : 'الاسم'}</TH>
              <TH>{locale === 'en' ? 'Job title' : 'الوظيفة'}</TH>
              <TH>{locale === 'en' ? 'Department' : 'القسم'}</TH>
              <TH>{locale === 'en' ? 'Hire date' : 'تاريخ التعيين'}</TH>
              <TH className="text-end">{locale === 'en' ? 'Base salary' : 'الراتب الأساسي'}</TH>
            </TR>
          </THead>
          <TBody>
            {employees.length === 0 && (
              <TR><TD colSpan={6} className="py-12 text-center text-muted-foreground">No employees yet</TD></TR>
            )}
            {employees.map((e) => (
              <TR key={e.id}>
                <TD className="font-mono text-xs">{e.empNo}</TD>
                <TD>{locale === 'ar' ? e.fullNameAr : (e.fullNameEn ?? e.fullNameAr)}</TD>
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

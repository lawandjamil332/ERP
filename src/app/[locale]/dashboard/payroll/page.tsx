import { getTranslations } from 'next-intl/server';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { formatMoney } from '@/lib/iraq/money';

export default async function PayrollPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await verifySession();
  if (!session) redirect(`/${locale}/auth/login`);
  const t = await getTranslations('payroll');

  const runs = await db.payrollRun.findMany({
    where: { tenantId: session.tenantId },
    include: { lines: true },
    orderBy: { period: 'desc' },
    take: 24,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <Button asChild>
          <Link href={`/${locale}/dashboard/payroll/new`}>
            <Plus className="h-4 w-4" />
            {t('newRun')}
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('ssEmployerNote')}</CardTitle>
          <CardDescription>
            Iraqi labor law: 5% employee + 12% employer social security; progressive PIT 3-15%.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <Table>
          <THead>
            <TR>
              <TH>{t('period')}</TH>
              <TH>{t('employee')}</TH>
              <TH className="text-end">{t('gross')}</TH>
              <TH className="text-end">{t('ssEmployee')}</TH>
              <TH className="text-end">{t('incomeTax')}</TH>
              <TH className="text-end">{t('net')}</TH>
              <TH>Status</TH>
            </TR>
          </THead>
          <TBody>
            {runs.length === 0 && (
              <TR><TD colSpan={7} className="py-12 text-center text-muted-foreground">No payroll runs yet</TD></TR>
            )}
            {runs.flatMap((run) =>
              run.lines.map((line) => (
                <TR key={line.id}>
                  <TD className="font-mono text-xs">{run.period}</TD>
                  <TD>{line.employeeId}</TD>
                  <TD className="text-end tabular-nums">{formatMoney(Number(line.gross), 'IQD', locale as 'ar')}</TD>
                  <TD className="text-end tabular-nums">{formatMoney(Number(line.ssEmployee), 'IQD', locale as 'ar')}</TD>
                  <TD className="text-end tabular-nums">{formatMoney(Number(line.incomeTax), 'IQD', locale as 'ar')}</TD>
                  <TD className="text-end tabular-nums font-semibold">{formatMoney(Number(line.net), 'IQD', locale as 'ar')}</TD>
                  <TD><Badge>{run.status}</Badge></TD>
                </TR>
              ))
            )}
          </TBody>
        </Table>
      </Card>
    </div>
  );
}

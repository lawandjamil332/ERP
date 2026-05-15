import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { canSeePayroll } from '@/lib/auth/sanitize';
import { Card } from '@/components/ui/card';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatMoney } from '@/lib/iraq/money';

export default async function SalaryAdvancesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await requireSession();
  if (!canSeePayroll(session)) {
    return <div className="rounded-md border border-destructive bg-destructive/5 p-6 text-sm">Access restricted to HR/Accountant/Admin.</div>;
  }
  const advances = await db.salaryAdvance.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { date: 'desc' }, take: 100,
  });
  const employees = await db.employee.findMany({
    where: { tenantId: session.tenantId, deletedAt: null },
    select: { id: true, empNo: true, fullNameAr: true, fullNameEn: true },
  });
  const emap = new Map(employees.map((e) => [e.id, e]));
  const m = (v: any) => formatMoney(Number(v), 'IQD', locale as 'ar');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Salary advances / سُلف الرواتب</h1>
      <Card>
        <Table>
          <THead><TR>
            <TH>Date</TH><TH>Employee</TH>
            <TH className="text-end">Amount</TH><TH className="text-end">Recovered</TH>
            <TH>Recovery</TH><TH>Status</TH>
          </TR></THead>
          <TBody>
            {advances.length === 0 && (
              <TR><TD colSpan={6} className="py-12 text-center text-muted-foreground">No advances yet</TD></TR>
            )}
            {advances.map((a) => {
              const e = emap.get(a.employeeId);
              return (
                <TR key={a.id}>
                  <TD className="tabular-nums">{new Intl.DateTimeFormat(locale).format(a.date)}</TD>
                  <TD>{e?.empNo} · {locale === 'ar' ? e?.fullNameAr : (e?.fullNameEn ?? e?.fullNameAr)}</TD>
                  <TD className="text-end tabular-nums">{m(a.amount)}</TD>
                  <TD className="text-end tabular-nums">{m(a.recovered)}</TD>
                  <TD><Badge variant="outline">{a.recovery}{a.instalments ? `/${a.instalments}` : ''}</Badge></TD>
                  <TD><Badge variant={a.status === 'OUTSTANDING' ? 'warning' : 'success'}>{a.status}</Badge></TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      </Card>
    </div>
  );
}

import Link from 'next/link';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import { formatMoney } from '@/lib/iraq/money';

export default async function PaymentsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await requireSession();
  const payments = await db.payment.findMany({
    where: { tenantId: session.tenantId },
    include: { contact: true },
    orderBy: { date: 'desc' }, take: 100,
  });
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Payments / المدفوعات</h1>
        <Button asChild>
          <Link href={`/${locale}/dashboard/payments/new`}><Plus className="h-4 w-4" /> New payment</Link>
        </Button>
      </div>
      <Card>
        <Table>
          <THead>
            <TR><TH>#</TH><TH>Date</TH><TH>Direction</TH><TH>Contact</TH>
              <TH>Method</TH><TH className="text-end">Amount</TH></TR>
          </THead>
          <TBody>
            {payments.length === 0 && (
              <TR><TD colSpan={6} className="py-12 text-center text-muted-foreground">No payments yet</TD></TR>
            )}
            {payments.map((p) => (
              <TR key={p.id}>
                <TD className="font-mono text-xs">{p.number}</TD>
                <TD className="tabular-nums">{new Intl.DateTimeFormat(locale).format(p.date)}</TD>
                <TD><Badge variant={p.direction === 'IN' ? 'success' : 'secondary'}>{p.direction}</Badge></TD>
                <TD>{locale === 'ar' ? p.contact.nameAr : (p.contact.nameEn ?? p.contact.nameAr)}</TD>
                <TD>{p.method}</TD>
                <TD className="text-end tabular-nums">{formatMoney(Number(p.amount), p.currency as 'IQD', locale as 'ar')}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>
    </div>
  );
}

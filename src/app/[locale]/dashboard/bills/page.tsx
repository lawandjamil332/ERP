import Link from 'next/link';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import { formatMoney } from '@/lib/iraq/money';

export default async function BillsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await requireSession();
  const bills = await db.bill.findMany({
    where: { tenantId: session.tenantId },
    include: { supplier: true },
    orderBy: { date: 'desc' }, take: 100,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Bills / فواتير الموردين</h1>
        <Button asChild>
          <Link href={`/${locale}/dashboard/bills/new`}><Plus className="h-4 w-4" /> New bill</Link>
        </Button>
      </div>
      <Card>
        <Table>
          <THead>
            <TR>
              <TH>#</TH><TH>Date</TH><TH>Supplier</TH><TH>Currency</TH>
              <TH className="text-end">Subtotal</TH><TH className="text-end">WHT</TH>
              <TH className="text-end">Total</TH><TH>Status</TH>
            </TR>
          </THead>
          <TBody>
            {bills.length === 0 && (
              <TR><TD colSpan={8} className="py-12 text-center text-muted-foreground">No bills yet</TD></TR>
            )}
            {bills.map((b) => (
              <TR key={b.id}>
                <TD className="font-mono text-xs">{b.number}</TD>
                <TD className="tabular-nums">{new Intl.DateTimeFormat(locale).format(b.date)}</TD>
                <TD>{locale === 'ar' ? b.supplier.nameAr : (b.supplier.nameEn ?? b.supplier.nameAr)}</TD>
                <TD>{b.currency}</TD>
                <TD className="text-end tabular-nums">{formatMoney(Number(b.subtotal), b.currency as 'IQD', locale as 'ar')}</TD>
                <TD className="text-end tabular-nums">{formatMoney(Number(b.withholding), b.currency as 'IQD', locale as 'ar')}</TD>
                <TD className="text-end tabular-nums">{formatMoney(Number(b.total), b.currency as 'IQD', locale as 'ar')}</TD>
                <TD><Badge>{b.status}</Badge></TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>
    </div>
  );
}

import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { Card } from '@/components/ui/card';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getTranslations } from 'next-intl/server';
import { formatMoney } from '@/lib/iraq/money';

export default async function PurchasesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await requireSession();
  const t = await getTranslations('nav');

  const bills = await db.bill.findMany({
    where: { tenantId: session.tenantId },
    include: { supplier: true },
    orderBy: { date: 'desc' },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('purchases')}</h1>
      <Card>
        <Table>
          <THead>
            <TR>
              <TH>Bill #</TH>
              <TH>Date</TH>
              <TH>Supplier</TH>
              <TH>Currency</TH>
              <TH className="text-end">Total</TH>
              <TH className="text-end">WHT</TH>
              <TH>Status</TH>
            </TR>
          </THead>
          <TBody>
            {bills.length === 0 && (
              <TR><TD colSpan={7} className="py-12 text-center text-muted-foreground">No bills yet</TD></TR>
            )}
            {bills.map((b) => (
              <TR key={b.id}>
                <TD className="font-mono text-xs">{b.number}</TD>
                <TD className="tabular-nums">{new Intl.DateTimeFormat(locale).format(b.date)}</TD>
                <TD>{locale === 'ar' ? b.supplier.nameAr : (b.supplier.nameEn ?? b.supplier.nameAr)}</TD>
                <TD>{b.currency}</TD>
                <TD className="text-end tabular-nums">{formatMoney(Number(b.total), b.currency as 'IQD', locale as 'ar')}</TD>
                <TD className="text-end tabular-nums">{formatMoney(Number(b.withholding), b.currency as 'IQD', locale as 'ar')}</TD>
                <TD><Badge>{b.status}</Badge></TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>
    </div>
  );
}

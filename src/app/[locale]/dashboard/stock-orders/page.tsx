import Link from 'next/link';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Boxes, Plus } from 'lucide-react';

const KIND_LABEL: Record<string, { ar: string; en: string }> = {
  TRANSFER: { ar: 'نقل', en: 'Transfer' },
  ADJUSTMENT_IN: { ar: 'تسوية إضافة', en: 'Adjustment in' },
  ADJUSTMENT_OUT: { ar: 'تسوية خصم', en: 'Adjustment out' },
  WRITE_OFF: { ar: 'إتلاف', en: 'Write-off' },
  OPENING_BALANCE: { ar: 'رصيد افتتاحي', en: 'Opening balance' },
};

export default async function StockOrdersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await verifySession();
  if (!session) redirect(`/${locale}/auth/login`);
  const isAr = locale === 'ar';

  const rows = await db.stockOrder.findMany({
    where: { tenantId: session.tenantId },
    include: { lines: true },
    orderBy: { date: 'desc' }, take: 100,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">{isAr ? 'أوامر المخزون' : 'Stock orders'}</h1>
          <p className="text-sm text-muted-foreground">{isAr ? 'النقل والتسويات والإتلاف' : 'Transfers, adjustments, write-offs'}</p>
        </div>
        <Button asChild>
          <Link href={`/${locale}/dashboard/stock-orders/new`}>
            <Plus className="h-4 w-4" /> {isAr ? 'أمر جديد' : 'New order'}
          </Link>
        </Button>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={Boxes}
          title={isAr ? 'لا توجد أوامر مخزون' : 'No stock orders yet'}
          description={isAr ? 'سجّل النقل والتسويات وعمليات الإتلاف' : 'Record transfers, adjustments, and write-offs'}
        />
      ) : (
        <Card>
          <Table>
            <THead>
              <TR>
                <TH>{isAr ? 'الرقم' : 'Reference'}</TH>
                <TH>{isAr ? 'النوع' : 'Kind'}</TH>
                <TH>{isAr ? 'التاريخ' : 'Date'}</TH>
                <TH>{isAr ? 'البنود' : 'Lines'}</TH>
                <TH>{isAr ? 'الحالة' : 'Status'}</TH>
              </TR>
            </THead>
            <TBody>
              {rows.map((o) => (
                <TR key={o.id}>
                  <TD className="font-mono text-xs">{o.reference}</TD>
                  <TD>{(KIND_LABEL[o.kind] ?? { ar: o.kind, en: o.kind })[isAr ? 'ar' : 'en']}</TD>
                  <TD className="tabular-nums">{new Intl.DateTimeFormat(locale).format(o.date)}</TD>
                  <TD className="tabular-nums">{o.lines.length}</TD>
                  <TD><Badge variant={o.status === 'POSTED' ? 'default' : 'secondary'}>{o.status}</Badge></TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

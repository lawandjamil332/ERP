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
import { tri } from '@/lib/i18n/tri';

const KIND_LABEL: Record<string, { ar: string; ku: string; en: string }> = {
  TRANSFER: { ar: 'نقل', ku: 'گواستنەوە', en: 'Transfer' },
  ADJUSTMENT_IN: { ar: 'تسوية إضافة', ku: 'ڕێکخستنی زیادکردن', en: 'Adjustment in' },
  ADJUSTMENT_OUT: { ar: 'تسوية خصم', ku: 'ڕێکخستنی کەمکردن', en: 'Adjustment out' },
  WRITE_OFF: { ar: 'إتلاف', ku: 'تەفروتوناکردن', en: 'Write-off' },
  OPENING_BALANCE: { ar: 'رصيد افتتاحي', ku: 'باڵانسی دەستپێک', en: 'Opening balance' },
};

export default async function StockOrdersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await verifySession();
  if (!session) redirect(`/${locale}/auth/login`);

  const rows = await db.stockOrder.findMany({
    where: { tenantId: session.tenantId },
    include: { lines: true },
    orderBy: { date: 'desc' }, take: 100,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">{tri(locale, { ar: 'أوامر المخزون', ku: 'داواکارییەکانی کۆگا', en: 'Stock orders' })}</h1>
          <p className="text-sm text-muted-foreground">{tri(locale, { ar: 'النقل والتسويات والإتلاف', ku: 'گواستنەوە و ڕێکخستن و تەفروتوناکردن', en: 'Transfers, adjustments, write-offs' })}</p>
        </div>
        <Button asChild>
          <Link href={`/${locale}/dashboard/stock-orders/new`}>
            <Plus className="h-4 w-4" /> {tri(locale, { ar: 'أمر جديد', ku: 'داواکاری نوێ', en: 'New order' })}
          </Link>
        </Button>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={Boxes}
          title={tri(locale, { ar: 'لا توجد أوامر مخزون', ku: 'هێشتا هیچ داواکارییەکی کۆگا نییە', en: 'No stock orders yet' })}
          description={tri(locale, { ar: 'سجّل النقل والتسويات وعمليات الإتلاف', ku: 'گواستنەوە و ڕێکخستن و تەفروتوناکردنەکان تۆمار بکە', en: 'Record transfers, adjustments, and write-offs' })}
        />
      ) : (
        <Card>
          <Table>
            <THead>
              <TR>
                <TH>{tri(locale, { ar: 'الرقم', ku: 'ژمارە', en: 'Reference' })}</TH>
                <TH>{tri(locale, { ar: 'النوع', ku: 'جۆر', en: 'Kind' })}</TH>
                <TH>{tri(locale, { ar: 'التاريخ', ku: 'بەروار', en: 'Date' })}</TH>
                <TH>{tri(locale, { ar: 'البنود', ku: 'بڕگەکان', en: 'Lines' })}</TH>
                <TH>{tri(locale, { ar: 'الحالة', ku: 'دۆخ', en: 'Status' })}</TH>
              </TR>
            </THead>
            <TBody>
              {rows.map((o) => (
                <TR key={o.id}>
                  <TD className="font-mono text-xs">{o.reference}</TD>
                  <TD>{tri(locale, KIND_LABEL[o.kind] ?? { ar: o.kind, ku: o.kind, en: o.kind })}</TD>
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

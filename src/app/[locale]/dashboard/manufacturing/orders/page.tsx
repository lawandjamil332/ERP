import { db } from '@/lib/db';
import { verifySession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Factory } from 'lucide-react';
import { tri } from '@/lib/i18n/tri';

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline'> = {
  DRAFT: 'outline', RELEASED: 'default', IN_PROGRESS: 'warning',
  COMPLETED: 'success', CANCELLED: 'secondary',
};

export default async function ManufacturingOrdersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await verifySession();
  if (!session) redirect(`/${locale}/auth/login`);
  const isAr = locale === 'ar';

  const rows = await db.workOrder.findMany({
    where: { tenantId: session.tenantId },
    include: { bom: true },
    orderBy: { startDate: 'desc' }, take: 100,
  });
  const productIds = rows.map((w) => w.bom.productId);
  const products = await db.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, nameAr: true, nameEn: true, sku: true },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{tri(locale, { ar: 'أوامر التصنيع', ku: 'فەرمانەکانی بەرهەمهێنان', en: 'Manufacturing orders' })}</h1>
        <p className="text-sm text-muted-foreground">{tri(locale, { ar: 'تتبع تنفيذ أوامر الإنتاج', ku: 'بەدواداچوونی جێبەجێکردنی فەرمانەکانی بەرهەمهێنان', en: 'Track production order execution' })}</p>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={Factory}
          title={tri(locale, { ar: 'لا توجد أوامر تصنيع', ku: 'هیچ فەرمانی بەرهەمهێنان نییە', en: 'No manufacturing orders' })}
          description={tri(locale, { ar: 'ابدأ بإنشاء أمر تصنيع من شجرة BoM', ku: 'دەست پێبکە بە دروستکردنی فەرمانێک لە BoM', en: 'Start by creating an order from a BoM' })} />
      ) : (
        <Card>
          <Table>
            <THead>
              <TR>
                <TH>{tri(locale, { ar: 'الرقم', ku: 'ژمارە', en: 'Number' })}</TH>
                <TH>{tri(locale, { ar: 'المنتج', ku: 'بەرهەم', en: 'Product' })}</TH>
                <TH>{tri(locale, { ar: 'الكمية', ku: 'بڕ', en: 'Quantity' })}</TH>
                <TH>{tri(locale, { ar: 'تاريخ البدء', ku: 'بەرواری دەستپێک', en: 'Start date' })}</TH>
                <TH>{tri(locale, { ar: 'الحالة', ku: 'دۆخ', en: 'Status' })}</TH>
              </TR>
            </THead>
            <TBody>
              {rows.map((w) => {
                const p = productMap.get(w.bom.productId);
                return (
                  <TR key={w.id}>
                    <TD className="font-mono text-xs">{w.number}</TD>
                    <TD>{p ? (isAr ? p.nameAr : p.nameEn) : w.bom.productId}</TD>
                    <TD className="tabular-nums">{w.quantity.toString()}</TD>
                    <TD className="tabular-nums">{w.startDate ? new Intl.DateTimeFormat(locale).format(w.startDate) : '—'}</TD>
                    <TD><Badge variant={STATUS_VARIANT[w.status] ?? 'outline'}>{w.status}</Badge></TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

import Link from 'next/link';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { formatMoney } from '@/lib/iraq/money';

export default async function InventoryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await requireSession();
  const t = await getTranslations('nav');

  const products = await db.product.findMany({
    where: { tenantId: session.tenantId, isActive: true },
    include: { stock: true },
    orderBy: { nameAr: 'asc' },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('inventory')}</h1>
        <Button asChild>
          <Link href={`/${locale}/dashboard/products/new`}>
            <Plus className="h-4 w-4" /> New product
          </Link>
        </Button>
      </div>
      <Card>
        <Table>
          <THead>
            <TR>
              <TH>SKU</TH>
              <TH>{locale === 'en' ? 'Name' : 'الاسم'}</TH>
              <TH>HS Code</TH>
              <TH>{locale === 'en' ? 'Origin' : 'المنشأ'}</TH>
              <TH>UoM</TH>
              <TH className="text-end">{locale === 'en' ? 'Price' : 'السعر'}</TH>
              <TH className="text-end">{locale === 'en' ? 'On hand' : 'الرصيد'}</TH>
            </TR>
          </THead>
          <TBody>
            {products.length === 0 && (
              <TR><TD colSpan={7} className="py-12 text-center text-muted-foreground">No products yet</TD></TR>
            )}
            {products.map((p) => {
              const onHand = p.stock.reduce((s, st) => s + Number(st.quantity), 0);
              return (
                <TR key={p.id}>
                  <TD className="font-mono text-xs">{p.sku}</TD>
                  <TD>{locale === 'ar' ? p.nameAr : p.nameEn}</TD>
                  <TD className="font-mono text-xs">{p.hsCode ?? '—'}</TD>
                  <TD>{p.countryOfOrigin ?? '—'}</TD>
                  <TD>{p.unitOfMeasure}</TD>
                  <TD className="text-end tabular-nums">{formatMoney(Number(p.salePrice), 'IQD', locale as 'ar')}</TD>
                  <TD className="text-end tabular-nums">
                    <Badge variant={onHand <= 10 ? 'destructive' : 'default'}>{onHand.toLocaleString()}</Badge>
                  </TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      </Card>
    </div>
  );
}

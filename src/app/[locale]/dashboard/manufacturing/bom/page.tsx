import Link from 'next/link';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Plus, Component } from 'lucide-react';

export default async function BomListPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await verifySession();
  if (!session) redirect(`/${locale}/auth/login`);
  const isAr = locale === 'ar';

  const rows = await db.bom.findMany({
    where: { tenantId: session.tenantId },
    include: { _count: { select: { components: true } } },
    orderBy: { version: 'desc' }, take: 100,
  });
  const productIds = rows.map((b) => b.productId);
  const products = await db.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, nameAr: true, nameEn: true, sku: true },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">{isAr ? 'هياكل المنتجات (BoM)' : 'Bill of Materials'}</h1>
          <p className="text-sm text-muted-foreground">{isAr ? 'وصفات تجميع المنتجات' : 'Product assembly recipes'}</p>
        </div>
        <Button asChild>
          <Link href={`/${locale}/dashboard/manufacturing`}>
            <Plus className="h-4 w-4" /> {isAr ? 'هيكل جديد' : 'New BoM'}
          </Link>
        </Button>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={Component}
          title={isAr ? 'لا توجد هياكل منتجات' : 'No BoMs yet'}
          description={isAr ? 'أنشئ هيكل منتج لتفعيل التصنيع' : 'Create a BoM to enable manufacturing'}
          action={<Button asChild><Link href={`/${locale}/dashboard/manufacturing`}><Plus className="h-4 w-4" /> {isAr ? 'هيكل جديد' : 'New BoM'}</Link></Button>}
        />
      ) : (
        <Card>
          <Table>
            <THead>
              <TR>
                <TH>{isAr ? 'المنتج' : 'Product'}</TH>
                <TH>{isAr ? 'الإصدار' : 'Version'}</TH>
                <TH>{isAr ? 'المكونات' : 'Components'}</TH>
                <TH>{isAr ? 'الحالة' : 'Status'}</TH>
              </TR>
            </THead>
            <TBody>
              {rows.map((b) => {
                const p = productMap.get(b.productId);
                return (
                  <TR key={b.id}>
                    <TD className="font-medium">{p ? (isAr ? p.nameAr : p.nameEn) : b.productId} <span className="text-xs text-muted-foreground">{p?.sku}</span></TD>
                    <TD className="font-mono text-xs">v{b.version}</TD>
                    <TD className="tabular-nums">{b._count.components}</TD>
                    <TD><Badge variant={b.isActive ? 'default' : 'secondary'}>{b.isActive ? (isAr ? 'نشط' : 'Active') : (isAr ? 'متوقف' : 'Inactive')}</Badge></TD>
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

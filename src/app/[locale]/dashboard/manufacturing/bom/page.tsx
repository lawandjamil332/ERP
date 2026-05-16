import Link from 'next/link';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Plus, RefreshCw, Component } from 'lucide-react';

export default async function BomListPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await verifySession();
  if (!session) redirect(`/${locale}/auth/login`);
  const isAr = locale === 'ar';

  const rows = await db.bom.findMany({
    where: { tenantId: session.tenantId },
    include: { product: true, components: true },
    orderBy: { createdAt: 'desc' }, take: 100,
  });

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
                <TH>{isAr ? 'الكمية' : 'Output qty'}</TH>
                <TH>{isAr ? 'المكونات' : 'Components'}</TH>
                <TH>{isAr ? 'الحالة' : 'Status'}</TH>
              </TR>
            </THead>
            <TBody>
              {rows.map((b) => (
                <TR key={b.id}>
                  <TD className="font-medium">{isAr ? b.product.nameAr : b.product.nameEn}</TD>
                  <TD className="tabular-nums">{b.outputQty.toString()}</TD>
                  <TD className="tabular-nums">{b.components.length}</TD>
                  <TD><Badge variant={b.isActive ? 'default' : 'secondary'}>{b.isActive ? (isAr ? 'نشط' : 'Active') : (isAr ? 'متوقف' : 'Inactive')}</Badge></TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

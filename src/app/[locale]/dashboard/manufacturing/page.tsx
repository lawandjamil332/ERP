import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function ManufacturingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await requireSession();
  const boms = await db.bom.findMany({
    where: { tenantId: session.tenantId, isActive: true },
    include: { components: true },
  });
  const products = await db.product.findMany({
    where: { tenantId: session.tenantId },
    select: { id: true, sku: true, nameAr: true, nameEn: true },
  });
  const pMap = new Map(products.map((p) => [p.id, p]));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Manufacturing / التصنيع</h1>
      <p className="text-sm text-muted-foreground">
        Bills of materials (BOM) describe the components needed to produce one unit of a finished product.
        Use the API <code className="rounded bg-muted px-1">POST /api/manufacturing/bom</code> to create one.
      </p>

      {boms.length === 0 && (
        <Card><CardContent className="p-12 text-center text-muted-foreground">No BOMs yet</CardContent></Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {boms.map((b) => {
          const finished = pMap.get(b.productId);
          return (
            <Card key={b.id}>
              <CardHeader>
                <CardTitle>{finished?.sku} — {locale === 'ar' ? finished?.nameAr : finished?.nameEn}</CardTitle>
                <p className="text-xs text-muted-foreground">v{b.version}</p>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {b.components.map((c) => {
                  const comp = pMap.get(c.componentProductId);
                  return (
                    <div key={c.id} className="flex justify-between rounded-md border bg-muted/30 px-2 py-1.5 text-xs">
                      <span>{comp?.sku} — {locale === 'ar' ? comp?.nameAr : comp?.nameEn}</span>
                      <span className="tabular-nums">{Number(c.quantity)} {c.unitOfMeasure}</span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

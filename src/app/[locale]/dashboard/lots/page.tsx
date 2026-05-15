import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export default async function LotsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await requireSession();
  const lots = await db.stockLot.findMany({
    where: { tenantId: session.tenantId, remainingQty: { gt: 0 } },
    orderBy: [{ expiryDate: 'asc' }, { receivedAt: 'desc' }],
    take: 200,
  });
  const products = await db.product.findMany({
    where: { tenantId: session.tenantId },
    select: { id: true, sku: true, nameAr: true, nameEn: true },
  });
  const pmap = new Map(products.map((p) => [p.id, p]));

  const now = Date.now();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Stock lots / دفعات المخزون</h1>
      <p className="text-sm text-muted-foreground">FIFO consumption by expiry date. Critical for pharma, food & cosmetics.</p>
      <Card>
        <Table>
          <THead><TR>
            <TH>Product</TH><TH>Lot #</TH>
            <TH className="text-end">Remaining</TH><TH className="text-end">Unit cost</TH>
            <TH>Received</TH><TH>Expiry</TH><TH>Status</TH>
          </TR></THead>
          <TBody>
            {lots.length === 0 && (
              <TR><TD colSpan={7} className="py-12 text-center text-muted-foreground">No active lots</TD></TR>
            )}
            {lots.map((l) => {
              const p = pmap.get(l.productId);
              const daysToExpiry = l.expiryDate ? Math.floor((l.expiryDate.getTime() - now) / 86_400_000) : null;
              const status = daysToExpiry === null ? 'OK'
                : daysToExpiry < 0 ? 'EXPIRED'
                : daysToExpiry < 30 ? 'EXPIRING SOON'
                : 'OK';
              return (
                <TR key={l.id}>
                  <TD>{p?.sku} — {locale === 'ar' ? p?.nameAr : p?.nameEn}</TD>
                  <TD className="font-mono text-xs">{l.lotNumber}</TD>
                  <TD className="text-end tabular-nums">{Number(l.remainingQty).toLocaleString()}</TD>
                  <TD className="text-end tabular-nums">{Number(l.unitCost).toLocaleString()}</TD>
                  <TD className="tabular-nums">{new Intl.DateTimeFormat(locale).format(l.receivedAt)}</TD>
                  <TD className="tabular-nums">{l.expiryDate ? new Intl.DateTimeFormat(locale).format(l.expiryDate) : '—'}</TD>
                  <TD>
                    <Badge variant={status === 'EXPIRED' ? 'destructive' : status === 'EXPIRING SOON' ? 'warning' : 'default'}>
                      {status}
                    </Badge>
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

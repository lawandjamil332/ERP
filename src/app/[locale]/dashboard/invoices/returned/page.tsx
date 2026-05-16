import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Undo2, RefreshCw } from 'lucide-react';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { formatMoney } from '@/lib/iraq/money';

export default async function ReturnedInvoicesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await verifySession();
  if (!session) redirect(`/${locale}/auth/login`);
  const isAr = locale === 'ar';

  const rows = await db.invoice.findMany({
    where: { tenantId: session.tenantId, deletedAt: null, kind: 'CREDIT_NOTE' },
    include: { contact: true },
    orderBy: { date: 'desc' },
    take: 100,
  });

  const totalRefunded = rows.reduce((s, r) => s + Number(r.total), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">{isAr ? 'الفواتير المرتجعة' : 'Returned invoices'}</h1>
          <p className="text-sm text-muted-foreground">
            {isAr ? 'إشعارات دائنة ومرتجعات المبيعات' : 'Credit notes and sales returns'}
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <div className="p-4">
            <p className="text-xs font-medium text-muted-foreground">{isAr ? 'عدد الإشعارات' : 'Credit notes count'}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{rows.length.toLocaleString()}</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-xs font-medium text-muted-foreground">{isAr ? 'إجمالي المرتجعات' : 'Total refunded'}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-rose-600">{formatMoney(totalRefunded, 'IQD', locale as 'ar')}</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-xs font-medium text-muted-foreground">{isAr ? 'آخر 30 يوماً' : 'Last 30 days'}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">
              {rows.filter((r) => Date.now() - r.date.getTime() <= 30 * 86400000).length.toLocaleString()}
            </p>
          </div>
        </Card>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={Undo2}
          title={isAr ? 'لا توجد فواتير مرتجعة' : 'No returned invoices'}
          description={isAr ? 'يمكنك إصدار إشعار دائن من شاشة الفاتورة' : 'Issue a credit note from any invoice screen'}
          action={
            <Button asChild variant="outline">
              <Link href={`/${locale}/dashboard/invoices`}>
                <RefreshCw className="h-4 w-4" /> {isAr ? 'الفواتير' : 'Invoices'}
              </Link>
            </Button>
          }
        />
      ) : (
        <Card>
          <Table>
            <THead>
              <TR>
                <TH>{isAr ? 'الرقم' : 'Number'}</TH>
                <TH>{isAr ? 'التاريخ' : 'Date'}</TH>
                <TH>{isAr ? 'العميل' : 'Customer'}</TH>
                <TH>{isAr ? 'الفاتورة الأصلية' : 'Original ref'}</TH>
                <TH className="text-end">{isAr ? 'مبلغ المرتجع' : 'Refund amount'}</TH>
                <TH>{isAr ? 'الحالة' : 'Status'}</TH>
              </TR>
            </THead>
            <TBody>
              {rows.map((inv) => (
                <TR key={inv.id}>
                  <TD className="font-mono text-xs">
                    <Link href={`/${locale}/dashboard/invoices/${inv.id}`} className="hover:underline">{inv.number}</Link>
                  </TD>
                  <TD className="tabular-nums">{new Intl.DateTimeFormat(locale).format(inv.date)}</TD>
                  <TD>{isAr ? inv.contact.nameAr : (inv.contact.nameEn ?? inv.contact.nameAr)}</TD>
                  <TD className="font-mono text-xs text-muted-foreground">{inv.notes?.match(/REVERSAL OF\s+(\S+)/i)?.[1] ?? '—'}</TD>
                  <TD className="text-end tabular-nums text-rose-600">{formatMoney(Number(inv.total), inv.currency as 'IQD', locale as 'ar')}</TD>
                  <TD><Badge variant={inv.status === 'POSTED' ? 'default' : 'secondary'}>{inv.status}</Badge></TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

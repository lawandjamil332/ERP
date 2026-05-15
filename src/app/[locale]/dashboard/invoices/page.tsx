import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { formatMoney } from '@/lib/iraq/money';

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline'> = {
  DRAFT: 'outline', POSTED: 'default', PARTIALLY_PAID: 'warning', PAID: 'success', OVERDUE: 'destructive', CANCELLED: 'secondary',
};

export default async function InvoicesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await verifySession();
  if (!session) redirect(`/${locale}/auth/login`);
  const t = await getTranslations('invoice');

  const invoices = await db.invoice.findMany({
    where: { tenantId: session.tenantId },
    include: { contact: true },
    orderBy: { date: 'desc' },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <Button asChild>
          <Link href={`/${locale}/dashboard/invoices/new`}>
            <Plus className="h-4 w-4" />
            {t('new')}
          </Link>
        </Button>
      </div>

      <Card>
        <Table>
          <THead>
            <TR>
              <TH>{t('number')}</TH>
              <TH>{t('date')}</TH>
              <TH>{t('customer')}</TH>
              <TH>{t('currency')}</TH>
              <TH className="text-end">{t('total')}</TH>
              <TH>{t('status')}</TH>
            </TR>
          </THead>
          <TBody>
            {invoices.length === 0 && (
              <TR><TD colSpan={6} className="py-12 text-center text-muted-foreground">No invoices yet</TD></TR>
            )}
            {invoices.map((inv) => (
              <TR key={inv.id} className="cursor-pointer">
                <TD className="font-mono text-xs"><Link href={`/${locale}/dashboard/invoices/${inv.id}`}>{inv.number}</Link></TD>
                <TD><Link href={`/${locale}/dashboard/invoices/${inv.id}`}>{new Intl.DateTimeFormat(locale).format(inv.date)}</Link></TD>
                <TD>{locale === 'ar' ? inv.contact.nameAr : (inv.contact.nameEn ?? inv.contact.nameAr)}</TD>
                <TD>{inv.currency}</TD>
                <TD className="text-end tabular-nums">{formatMoney(Number(inv.total), inv.currency as 'IQD', locale as 'ar')}</TD>
                <TD><Badge variant={STATUS_VARIANT[inv.status] ?? 'outline'}>{inv.status}</Badge></TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>
    </div>
  );
}

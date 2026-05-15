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
import { ListToolbar } from '@/components/ListToolbar';
import { paginate, readPagination } from '@/lib/paginate';

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline'> = {
  DRAFT: 'outline', POSTED: 'default', PARTIALLY_PAID: 'warning',
  PAID: 'success', OVERDUE: 'destructive', CANCELLED: 'secondary', REVERSED: 'secondary',
};

export default async function InvoicesPage({
  params, searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const session = await verifySession();
  if (!session) redirect(`/${locale}/auth/login`);
  const t = await getTranslations('invoice');

  const { cursor, q, take } = readPagination(sp);
  const where = {
    tenantId: session.tenantId,
    deletedAt: null,
    ...(q ? {
      OR: [
        { number: { contains: q, mode: 'insensitive' as const } },
        { contact: { nameAr: { contains: q } } },
        { contact: { nameEn: { contains: q, mode: 'insensitive' as const } } },
      ],
    } : {}),
  };

  const rows = await db.invoice.findMany({
    where,
    include: { contact: true },
    orderBy: { date: 'desc' },
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
  const page = paginate(rows, take);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <Button asChild>
          <Link href={`/${locale}/dashboard/invoices/new`}>
            <Plus className="h-4 w-4" />
            {t('new')}
          </Link>
        </Button>
      </div>

      <ListToolbar
        placeholder="Search by number, customer…"
        hasMore={page.hasMore}
        nextCursor={page.nextCursor}
      />

      <Card>
        <Table>
          <THead>
            <TR>
              <TH>{t('number')}</TH>
              <TH>Kind</TH>
              <TH>{t('date')}</TH>
              <TH>{t('customer')}</TH>
              <TH>{t('currency')}</TH>
              <TH className="text-end">{t('total')}</TH>
              <TH>{t('status')}</TH>
            </TR>
          </THead>
          <TBody>
            {page.items.length === 0 && (
              <TR><TD colSpan={7} className="py-12 text-center text-muted-foreground">
                {q ? `No invoices match "${q}"` : 'No invoices yet'}
              </TD></TR>
            )}
            {page.items.map((inv) => (
              <TR key={inv.id} className="cursor-pointer">
                <TD className="font-mono text-xs">
                  <Link href={`/${locale}/dashboard/invoices/${inv.id}`}>{inv.number}</Link>
                </TD>
                <TD>
                  <Badge variant={inv.kind === 'CREDIT_NOTE' ? 'destructive' : 'outline'}>
                    {inv.kind}
                  </Badge>
                </TD>
                <TD>{new Intl.DateTimeFormat(locale).format(inv.date)}</TD>
                <TD>{locale === 'ar' ? inv.contact.nameAr : (inv.contact.nameEn ?? inv.contact.nameAr)}</TD>
                <TD>{inv.currency}</TD>
                <TD className="text-end tabular-nums">
                  {formatMoney(Number(inv.total), inv.currency as 'IQD', locale as 'ar')}
                </TD>
                <TD><Badge variant={STATUS_VARIANT[inv.status] ?? 'outline'}>{inv.status}</Badge></TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>
    </div>
  );
}

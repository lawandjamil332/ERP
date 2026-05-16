import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
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
  const isAr = locale === 'ar';

  const { cursor, q, take } = readPagination(sp);
  const baseWhere = { tenantId: session.tenantId, deletedAt: null };
  const where = {
    ...baseWhere,
    ...(q ? {
      OR: [
        { number: { contains: q, mode: 'insensitive' as const } },
        { contact: { nameAr: { contains: q } } },
        { contact: { nameEn: { contains: q, mode: 'insensitive' as const } } },
      ],
    } : {}),
  };

  const [rows, totalCount, paidCount, pendingCount, unpaidCount] = await Promise.all([
    db.invoice.findMany({
      where, include: { contact: true }, orderBy: { date: 'desc' },
      take: take + 1, ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    }),
    db.invoice.count({ where: baseWhere }),
    db.invoice.count({ where: { ...baseWhere, status: 'PAID' } }),
    db.invoice.count({ where: { ...baseWhere, status: { in: ['DRAFT', 'POSTED', 'PARTIALLY_PAID'] } } }),
    db.invoice.count({ where: { ...baseWhere, status: 'OVERDUE' } }),
  ]);
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

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label={isAr ? 'إجمالي الفواتير' : 'Total invoices'} value={totalCount} Icon={FileText} tone="sky" />
        <Kpi label={isAr ? 'مدفوعة' : 'Paid invoices'} value={paidCount} Icon={CheckCircle2} tone="emerald" />
        <Kpi label={isAr ? 'قيد التحصيل' : 'Pending invoices'} value={pendingCount} Icon={Clock} tone="amber" />
        <Kpi label={isAr ? 'متأخرة / غير مدفوعة' : 'Unpaid invoices'} value={unpaidCount} Icon={AlertCircle} tone="rose" />
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

function Kpi({ label, value, Icon, tone }: { label: string; value: number; Icon: React.ComponentType<{ className?: string }>; tone: 'sky' | 'emerald' | 'amber' | 'rose' }) {
  const cls = {
    sky: 'bg-sky-50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-400',
    emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
    rose: 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400',
  }[tone];
  return (
    <Card>
      <div className="flex items-center justify-between p-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{value.toLocaleString()}</p>
        </div>
        <div className={`grid h-10 w-10 place-items-center rounded-lg ${cls}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

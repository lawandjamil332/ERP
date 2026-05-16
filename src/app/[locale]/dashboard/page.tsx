import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { Dates } from '@/lib/iraq';
import { getTranslations } from 'next-intl/server';
import { Calendar, AlertCircle, Wallet, Users, FileText, Package, Building2 } from 'lucide-react';
import { formatMoney } from '@/lib/iraq/money';
import { DashboardCharts } from '@/components/dashboard/Charts';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';

export default async function DashboardHome({
  params,
}: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await verifySession();
  if (!session) redirect(`/${locale}/auth/login`);
  const t = await getTranslations('dashboard');

  const tenantId = session.tenantId;
  const tenant = await db.tenant.findUnique({ where: { id: tenantId } });

  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  const [salesToday, salesMonth, openInvoices, lowStock, employeeCount] = await Promise.all([
    db.invoice.aggregate({
      _sum: { total: true },
      where: { tenantId, date: { gte: todayStart }, status: { in: ['POSTED', 'PARTIALLY_PAID', 'PAID'] } },
    }),
    db.invoice.aggregate({
      _sum: { total: true },
      where: { tenantId, date: { gte: monthStart }, status: { in: ['POSTED', 'PARTIALLY_PAID', 'PAID'] } },
    }),
    db.invoice.count({ where: { tenantId, status: { in: ['POSTED', 'PARTIALLY_PAID', 'OVERDUE'] } } }),
    db.stock.count({ where: { product: { tenantId }, quantity: { lt: 10 } } }),
    db.employee.count({ where: { tenantId, isActive: true } }),
  ]);

  const region = (tenant?.region ?? 'FEDERAL') as 'FEDERAL' | 'KURDISTAN';
  const monthly = Dates.monthlySsDeadline(now.getUTCFullYear(), now.getUTCMonth() + 1);
  const annualSs  = Dates.annualSsDeadline(now.getUTCFullYear());
  const annualPit = Dates.annualPitDeadline(now.getUTCFullYear(), region);
  const annualCit = Dates.annualCitDeadline(now.getUTCFullYear(), region);

  const fmtDate = (d: Date) =>
    new Intl.DateTimeFormat(locale === 'ar' ? 'ar-IQ' : locale === 'ku' ? 'ckb-IQ' : 'en-IQ', {
      year: 'numeric', month: 'long', day: 'numeric',
    }).format(d);

  const m = (v: number) => formatMoney(v, 'IQD', locale as 'ar' | 'ku' | 'en');
  const today = new Intl.DateTimeFormat(locale === 'ar' ? 'ar-IQ' : locale === 'ku' ? 'ckb-IQ' : 'en-IQ', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  }).format(now);

  return (
    <div className="space-y-8">
      <PageHeader
        title={t('title')}
        description={today}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard tone="primary"     icon={Wallet}   label={t('salesToday')}    value={m(Number(salesToday._sum.total ?? 0))} />
        <StatCard tone="success"     icon={Wallet}   label={t('salesMonth')}    value={m(Number(salesMonth._sum.total ?? 0))} />
        <StatCard tone="warning"     icon={FileText} label={t('openInvoices')}  value={openInvoices.toString()} />
        <StatCard tone="destructive" icon={Package}  label={t('stockAlerts')}   value={lowStock.toString()} />
      </div>

      <DashboardCharts />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <CardTitle>{t('filingsTitle')}</CardTitle>
              </div>
              <CardDescription className="mt-1">
                {region === 'KURDISTAN' ? 'KRG' : 'Federal Iraq'} — General Commission for Taxes
              </CardDescription>
            </div>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              {region}
            </span>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Deadline label={t('monthlySS')} date={fmtDate(monthly)} />
            <Deadline label={t('annualSS')}  date={fmtDate(annualSs)} />
            <Deadline label={t('annualPIT')} date={fmtDate(annualPit)} />
            <Deadline label={t('annualCIT')} date={fmtDate(annualCit)} />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <CardTitle>{t('employeeCount')}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold tabular-nums">{employeeCount}</div>
              <p className="mt-1 text-xs text-muted-foreground">Active employees</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <CardTitle>{tenant?.nameEn ?? tenant?.nameAr ?? '—'}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              {tenant?.taxNumber && <p className="text-muted-foreground">TIN: <span className="font-mono text-foreground">{tenant.taxNumber}</span></p>}
              {tenant?.governorate && <p className="text-muted-foreground">{tenant.governorate}</p>}
              {tenant?.sector && <p className="text-muted-foreground">{tenant.sector}</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Deadline({ label, date }: { label: string; date: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border bg-background p-3 transition-colors hover:bg-accent/50">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-amber-100 text-amber-700">
        <AlertCircle className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-tight">{label}</p>
        <p className="mt-1 text-xs tabular-nums text-muted-foreground">{date}</p>
      </div>
    </div>
  );
}

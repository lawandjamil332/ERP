import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { Dates } from '@/lib/iraq';
import { getTranslations } from 'next-intl/server';
import { Calendar, AlertCircle, Wallet, Users, FileText, Package } from 'lucide-react';
import { formatMoney } from '@/lib/iraq/money';

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('title')}</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={<Wallet className="h-4 w-4" />} title={t('salesToday')} value={m(Number(salesToday._sum.total ?? 0))} />
        <KpiCard icon={<Wallet className="h-4 w-4" />} title={t('salesMonth')} value={m(Number(salesMonth._sum.total ?? 0))} />
        <KpiCard icon={<FileText className="h-4 w-4" />} title={t('openInvoices')} value={openInvoices.toString()} />
        <KpiCard icon={<Package className="h-4 w-4" />} title={t('stockAlerts')} value={lowStock.toString()} />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <CardTitle>{t('filingsTitle')}</CardTitle>
          </div>
          <CardDescription>
            {region === 'KURDISTAN' ? 'KRG' : 'Federal Iraq'} — General Commission for Taxes
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Deadline label={t('monthlySS')} date={fmtDate(monthly)} />
          <Deadline label={t('annualSS')} date={fmtDate(annualSs)} />
          <Deadline label={t('annualPIT')} date={fmtDate(annualPit)} />
          <Deadline label={t('annualCIT')} date={fmtDate(annualCit)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <CardTitle>{t('employeeCount')}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{employeeCount}</div>
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({ icon, title, value }: { icon: React.ReactNode; title: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardDescription>{title}</CardDescription>
          <div className="text-muted-foreground">{icon}</div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}

function Deadline({ label, date }: { label: string; date: string }) {
  return (
    <div className="flex items-start gap-3 rounded-md border bg-background p-3">
      <AlertCircle className="mt-0.5 h-4 w-4 text-amber-500 shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground tabular-nums">{date}</p>
      </div>
    </div>
  );
}

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { Dates } from '@/lib/iraq';
import { getTranslations } from 'next-intl/server';
import { Calendar, AlertCircle, Wallet, Users, FileText, Package, Building2, ShoppingCart, BookOpen, UserPlus, Receipt } from 'lucide-react';
import { formatMoney } from '@/lib/iraq/money';
import { DashboardCharts } from '@/components/dashboard/Charts';
import { StatCard } from '@/components/ui/stat-card';

export default async function DashboardHome({
  params,
}: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await verifySession();
  if (!session) redirect(`/${locale}/auth/login`);
  const t = await getTranslations('dashboard');
  const tApp = await getTranslations('app');
  const tNav = await getTranslations('nav');

  const tenantId = session.tenantId;
  const tenant = await db.tenant.findUnique({ where: { id: tenantId } });

  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  const [salesToday, salesMonth, openInvoices, lowStock, employeeCount, productCount, activeContacts] = await Promise.all([
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
    db.product.count({ where: { tenantId, isActive: true, deletedAt: null } }),
    db.contact.count({ where: { tenantId, isActive: true, deletedAt: null } }),
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

  const isAr = locale === 'ar';

  const actions = [
    {
      title: isAr ? 'إضافة منتج جديد' : tNav('products') + ' — Add',
      subtitle: isAr ? 'بدء معاملة بيع جديدة' : 'Start a new sales transaction',
      href: `/${locale}/dashboard/products`,
      icon: ShoppingCart,
      gradient: 'from-indigo-500 via-violet-600 to-purple-700',
    },
    {
      title: isAr ? 'إضافة قيد جديد' : 'New journal entry',
      subtitle: isAr ? 'تسجيل إدخال محاسبي جديد' : 'Record a new accounting entry',
      href: `/${locale}/dashboard/accounting`,
      icon: BookOpen,
      gradient: 'from-fuchsia-500 via-purple-600 to-indigo-700',
    },
    {
      title: isAr ? 'عميل جديد' : 'New customer',
      subtitle: isAr ? 'إضافة عميل جديد إلى النظام' : 'Add a customer to your CRM',
      href: `/${locale}/dashboard/contacts`,
      icon: UserPlus,
      gradient: 'from-cyan-500 via-teal-600 to-emerald-700',
    },
    {
      title: isAr ? 'إنشاء فاتورة مبيعات' : 'Create sales invoice',
      subtitle: isAr ? 'إنشاء فاتورة مبيعات جديدة' : 'Issue a new sales invoice',
      href: `/${locale}/dashboard/invoices/new`,
      icon: Receipt,
      gradient: 'from-emerald-500 via-green-600 to-teal-700',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-6 sm:p-10">
        <div className="absolute inset-y-0 end-0 w-1/2 bg-[radial-gradient(circle_at_top_right,_rgba(20,83,45,0.08),transparent_60%)]" />
        <div className="relative text-center">
          <div className="mx-auto mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-3xl font-bold text-white shadow-lg">
            ع
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-4xl">{tApp('name')}</h1>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
            {isAr
              ? 'منصة شاملة لإدارة جميع جوانب أعمالك من المبيعات والمشتريات إلى الموارد البشرية والمحاسبة'
              : 'Run every side of your business — sales, purchases, payroll, accounting — in one place.'}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">{today}</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard tone="primary"     icon={Package}   label={tNav('products')}   value={productCount.toString()} />
        <StatCard tone="warning"     icon={FileText}  label={t('openInvoices')}  value={openInvoices.toString()} />
        <StatCard tone="success"     icon={Users}     label={tNav('contacts')}   value={activeContacts.toString()} />
        <StatCard tone="primary"     icon={Wallet}    label={t('salesMonth')}    value={m(Number(salesMonth._sum.total ?? 0))} />
      </div>

      {/* Quick actions — colorful gradient cards */}
      <div>
        <h2 className="text-xl font-bold">{isAr ? 'الأقسام الأساسية' : 'Core sections'}</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          {isAr ? 'الوصول السريع إلى الوحدات الرئيسية' : 'Quick access to your main modules'}
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {actions.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${a.gradient} p-5 text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-xl`}
            >
              <div className="absolute -end-6 -top-6 h-24 w-24 rounded-full bg-white/10 transition-transform group-hover:scale-110" />
              <div className="absolute -bottom-8 -start-8 h-32 w-32 rounded-full bg-white/5" />
              <div className="relative">
                <div className="mb-6 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
                  <a.icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold leading-tight">{a.title}</h3>
                <p className="mt-1 text-xs text-white/85">{a.subtitle}</p>
                <p className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-white/90 transition-opacity group-hover:text-white">
                  {isAr ? 'انقر للدخول →' : 'Open →'}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold">{isAr ? 'الرسوم البيانية للمبيعات' : 'Sales charts'}</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          {t('salesTrendCaption')}
        </p>
        <DashboardCharts />
      </div>

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
              <p className="mt-1 text-xs text-muted-foreground">{isAr ? 'موظف نشط' : 'Active employees'}</p>
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

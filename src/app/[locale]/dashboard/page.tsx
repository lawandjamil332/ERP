import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { Dates } from '@/lib/iraq';
import { getTranslations } from 'next-intl/server';
import { Calendar, AlertCircle, Wallet, Users, FileText, Package, Building2, ShoppingCart, BookOpen, UserPlus, Receipt, Plus } from 'lucide-react';
import { formatMoney } from '@/lib/iraq/money';
import { DashboardCharts } from '@/components/dashboard/Charts';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { StatCard } from '@/components/ui/stat-card';
import { tri } from '@/lib/i18n/tri';

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

  const hour = now.getUTCHours() + 3; // Iraq UTC+3
  const greeting = tri(locale, {
    ar: hour < 12 ? 'صباح الخير' : 'مساء الخير',
    ku: hour < 12 ? 'بەیانیت باش' : hour < 18 ? 'ئێوارەت باش' : 'شەوت باش',
    en: hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening',
  });
  const companyName = tri(locale, { ar: tenant?.nameAr ?? '', ku: tenant?.nameEn ?? tenant?.nameAr ?? '', en: tenant?.nameEn ?? tenant?.nameAr ?? '' });

  const actions = [
    {
      title: tri(locale, { ar: 'إضافة منتج جديد', ku: 'زیادکردنی کاڵای نوێ', en: tNav('products') + ' — Add' }),
      subtitle: tri(locale, { ar: 'بدء معاملة بيع جديدة', ku: 'دەستپێکردنی مامەڵەیەکی فرۆشتنی نوێ', en: 'Start a new sales transaction' }),
      href: `/${locale}/dashboard/products`,
      icon: ShoppingCart,
      gradient: 'from-indigo-500 via-violet-600 to-purple-700',
    },
    {
      title: tri(locale, { ar: 'إضافة قيد جديد', ku: 'تۆمارکردنی تۆمارێکی نوێ', en: 'New journal entry' }),
      subtitle: tri(locale, { ar: 'تسجيل إدخال محاسبي جديد', ku: 'تۆمارکردنی تۆمارێکی ژمێریاری نوێ', en: 'Record a new accounting entry' }),
      href: `/${locale}/dashboard/accounting`,
      icon: BookOpen,
      gradient: 'from-fuchsia-500 via-purple-600 to-indigo-700',
    },
    {
      title: tri(locale, { ar: 'عميل جديد', ku: 'کڕیاری نوێ', en: 'New customer' }),
      subtitle: tri(locale, { ar: 'إضافة عميل جديد إلى النظام', ku: 'زیادکردنی کڕیارێک بۆ سیستەم', en: 'Add a customer to your CRM' }),
      href: `/${locale}/dashboard/contacts`,
      icon: UserPlus,
      gradient: 'from-cyan-500 via-teal-600 to-emerald-700',
    },
    {
      title: tri(locale, { ar: 'إنشاء فاتورة مبيعات', ku: 'دروستکردنی پسوڵەی فرۆشتن', en: 'Create sales invoice' }),
      subtitle: tri(locale, { ar: 'إنشاء فاتورة مبيعات جديدة', ku: 'دەرکردنی پسوڵەی فرۆشتنی نوێ', en: 'Issue a new sales invoice' }),
      href: `/${locale}/dashboard/invoices/new`,
      icon: Receipt,
      gradient: 'from-emerald-500 via-green-600 to-teal-700',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Command-center header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{today}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            {greeting}{companyName ? <span className="font-normal text-muted-foreground">{tri(locale, { ar: ' — ', ku: ' — ', en: ', ' })}{companyName}</span> : ''}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {tri(locale, { ar: `مبيعات اليوم: ${m(Number(salesToday._sum.total ?? 0))}`, ku: `فرۆشتنی ئەمڕۆ: ${m(Number(salesToday._sum.total ?? 0))}`, en: `Today's sales: ${m(Number(salesToday._sum.total ?? 0))}` })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href={`/${locale}/dashboard/contacts`}><UserPlus className="h-4 w-4" /> {tri(locale, { ar: 'عميل جديد', ku: 'کڕیاری نوێ', en: 'New customer' })}</Link>
          </Button>
          <Button asChild>
            <Link href={`/${locale}/dashboard/invoices/new`}><Plus className="h-4 w-4" /> {tri(locale, { ar: 'فاتورة جديدة', ku: 'پسوڵەی نوێ', en: 'New invoice' })}</Link>
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard tone="primary"     icon={Wallet}    label={t('salesMonth')}    value={m(Number(salesMonth._sum.total ?? 0))} />
        <StatCard tone="warning"     icon={FileText}  label={t('openInvoices')}  value={openInvoices.toString()} />
        <StatCard tone="success"     icon={Users}     label={tNav('contacts')}   value={activeContacts.toString()} />
        <StatCard tone="primary"     icon={Package}   label={tNav('products')}   value={productCount.toString()} />
      </div>

      {/* Quick actions — colorful gradient cards */}
      <div>
        <h2 className="text-xl font-bold">
          {tri(locale, { ar: 'مخصّصة لدورك', ku: 'دیاریکراو بۆ ڕۆڵەکەت', en: 'Tailored to your role' })}{' '}
          <span className="rounded-md bg-primary/10 px-2 py-0.5 align-middle text-xs font-medium text-primary">{session.role}</span>
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          {session.role === 'CASHIER' ? tri(locale, { ar: 'مهامك السريعة: نقطة البيع وفتح وردية', ku: 'کارە خێراکانت: خاڵی فرۆشتن و کردنەوەی شیفت', en: 'Your quick actions: POS and shifts' })
            : session.role === 'ACCOUNTANT' ? tri(locale, { ar: 'مهامك السريعة: القيود والمدفوعات والتقارير', ku: 'کارە خێراکانت: تۆمارەکان، پارەدان، ڕاپۆرتەکان', en: 'Your quick actions: journals, payments, reports' })
            : session.role === 'SALES' ? tri(locale, { ar: 'مهامك السريعة: فاتورة جديدة وعرض سعر', ku: 'کارە خێراکانت: پسوڵەی نوێ و وەسڵی نرخدانان', en: 'Your quick actions: new invoice and quotation' })
            : session.role === 'HR' ? tri(locale, { ar: 'مهامك السريعة: الموظفون والرواتب', ku: 'کارە خێراکانت: فەرمانبەرەکان و موچە', en: 'Your quick actions: employees and payroll' })
            : tri(locale, { ar: 'الوصول السريع إلى الوحدات الرئيسية', ku: 'دەستگەیشتنی خێرا بۆ مۆدیولە سەرەکییەکان', en: 'Quick access to your main modules' })}
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
                  {tri(locale, { ar: 'انقر للدخول →', ku: 'کرتە بکە بۆ کردنەوە →', en: 'Open →' })}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold">{tri(locale, { ar: 'الرسوم البيانية للمبيعات', ku: 'هێڵکارییەکانی فرۆشتن', en: 'Sales charts' })}</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          {t('salesTrendCaption')}
        </p>
        <DashboardCharts />
      </div>

      <RecentActivity />

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
              <p className="mt-1 text-xs text-muted-foreground">{tri(locale, { ar: 'موظف نشط', ku: 'کارمەندی چالاک', en: 'Active employees' })}</p>
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
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
        <AlertCircle className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-tight">{label}</p>
        <p className="mt-1 text-xs tabular-nums text-muted-foreground">{date}</p>
      </div>
    </div>
  );
}

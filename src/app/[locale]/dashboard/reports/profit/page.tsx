'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { RollingKpiBar } from '@/components/ui/rolling-kpi-bar';
import { TrendingUp, RefreshCw } from 'lucide-react';
import { tri } from '@/lib/i18n/tri';

interface Row { label: string; revenue: number; cogs: number; profit: number; margin: number }
interface Resp {
  totals: { d7: number; d30: number; d365: number };
  byClient: Row[];
  byEmployee: Row[];
  daily: Row[];
  monthly: Row[];
  yearly: Row[];
}

export default function ProfitReportsPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const [data, setData] = useState<Resp | null>(null);
  const [tab, setTab] = useState<'byClient' | 'byEmployee' | 'daily' | 'monthly' | 'yearly'>('byClient');

  async function load() {
    setData(null);
    const r = await fetch('/api/reports/profit');
    if (r.ok) setData(await r.json());
  }
  useEffect(() => { load(); }, []);

  const rows = data?.[tab] ?? [];
  const fmt = (n: number) => n.toLocaleString(isAr ? 'ar-IQ' : 'en');

  return (
    <div className="space-y-6">
      <PageHeader
        title={tri(locale, { ar: 'تقارير الأرباح', ku: 'ڕاپۆرتەکانی قازانج', en: 'Profit Reports' })}
        description={tri(locale, { ar: 'هامش الربح حسب العميل أو الموظف أو الفترة', ku: 'ڕێژەی قازانج بەپێی کڕیار یان کارمەند یان ماوە', en: 'Profit margin by client, employee, or period' })}
        actions={
          <Button variant="outline" onClick={load}>
            <RefreshCw className="h-4 w-4" /> {tri(locale, { ar: 'تحديث', ku: 'نوێکردنەوە', en: 'Refresh' })}
          </Button>
        }
      />

      <RollingKpiBar
        d7={data?.totals.d7 ?? 0} d30={data?.totals.d30 ?? 0} d365={data?.totals.d365 ?? 0}
        currency="IQD" tone="emerald"
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4" />
            {tri(locale, { ar: 'تفاصيل الربح', ku: 'وردەکارییەکانی قازانج', en: 'Profit breakdown' })}
          </CardTitle>
          <div className="flex flex-wrap gap-1">
            {(['byClient', 'byEmployee', 'daily', 'monthly', 'yearly'] as const).map((k) => (
              <button key={k} type="button" onClick={() => setTab(k)}
                className={`rounded-md px-3 py-1 text-xs font-medium ${tab === k ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'}`}>
                {tri(locale, LABELS[k])}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr className="text-start">
                <th className="px-2 py-2 text-start font-semibold">{tri(locale, { ar: 'الفئة', ku: 'پۆل', en: 'Label' })}</th>
                <th className="px-2 py-2 text-end font-semibold">{tri(locale, { ar: 'الإيراد', ku: 'داهات', en: 'Revenue' })}</th>
                <th className="px-2 py-2 text-end font-semibold">{tri(locale, { ar: 'التكلفة', ku: 'تێچوو', en: 'COGS' })}</th>
                <th className="px-2 py-2 text-end font-semibold">{tri(locale, { ar: 'الربح', ku: 'قازانج', en: 'Profit' })}</th>
                <th className="px-2 py-2 text-end font-semibold">{tri(locale, { ar: 'الهامش %', ku: 'ڕێژە %', en: 'Margin %' })}</th>
              </tr>
            </thead>
            <tbody>
              {data === null ? (
                <tr><td colSpan={5} className="py-12 text-center text-muted-foreground">{tri(locale, { ar: 'جارٍ التحميل…', ku: 'بارکردن…', en: 'Loading…' })}</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={5} className="py-12 text-center text-muted-foreground">{tri(locale, { ar: 'لا توجد بيانات', ku: 'هیچ داتایەک نییە', en: 'No data' })}</td></tr>
              ) : rows.map((r, i) => (
                <tr key={i} className="border-b">
                  <td className="px-2 py-1.5">{r.label}</td>
                  <td className="px-2 py-1.5 text-end tabular-nums">{fmt(r.revenue)}</td>
                  <td className="px-2 py-1.5 text-end tabular-nums">{fmt(r.cogs)}</td>
                  <td className={`px-2 py-1.5 text-end tabular-nums font-medium ${r.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{fmt(r.profit)}</td>
                  <td className="px-2 py-1.5 text-end tabular-nums">{r.margin.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

const LABELS: Record<string, { ar: string; ku: string; en: string }> = {
  byClient: { ar: 'حسب العميل', ku: 'بەپێی کڕیار', en: 'By client' },
  byEmployee: { ar: 'حسب الموظف', ku: 'بەپێی کارمەند', en: 'By employee' },
  daily: { ar: 'يومي', ku: 'ڕۆژانە', en: 'Daily' },
  monthly: { ar: 'شهري', ku: 'مانگانە', en: 'Monthly' },
  yearly: { ar: 'سنوي', ku: 'ساڵانە', en: 'Yearly' },
};

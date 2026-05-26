'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { RollingKpiBar } from '@/components/ui/rolling-kpi-bar';
import { Receipt } from 'lucide-react';
import { tri } from '@/lib/i18n/tri';

interface Row { id: string; number: string; date: string; amount: string; method: string; contactName: string }

export default function ReceiptsPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const [totals, setTotals] = useState({ d7: 0, d30: 0, d365: 0 });
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    fetch('/api/reports/rolling-totals?kind=receipts').then((r) => r.ok ? r.json() : { d7: 0, d30: 0, d365: 0 }).then(setTotals);
    fetch('/api/payments?direction=IN').then((r) => r.ok ? r.json() : { data: [] }).then((b) => {
      setRows((b.data ?? []).map((p: { id: string; number: string; date: string; amount: string; method: string; contact?: { nameAr: string; nameEn?: string } }) => ({
        id: p.id, number: p.number, date: p.date, amount: p.amount, method: p.method,
        contactName: (isAr ? p.contact?.nameAr : (p.contact?.nameEn ?? p.contact?.nameAr)) ?? '—',
      })));
    });
  }, [isAr]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={tri(locale, { ar: 'سندات القبض', ku: 'سەنەدەکانی وەرگرتن', en: 'Receipt vouchers' })}
        description={tri(locale, { ar: 'مقبوضات الذمم من العملاء', ku: 'وەرگرتنی قەرزەکان لە کڕیارەکانەوە', en: 'Receivables receipts from customers' })}
      />

      <RollingKpiBar d7={totals.d7} d30={totals.d30} d365={totals.d365} tone="emerald" />

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Receipt className="h-4 w-4" /> {tri(locale, { ar: 'آخر السندات', ku: 'دوایین سەنەدەکان', en: 'Recent receipts' })}</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr>
                <th className="py-2 text-start font-semibold">{tri(locale, { ar: 'الرقم', ku: 'ژمارە', en: 'Number' })}</th>
                <th className="py-2 text-start font-semibold">{tri(locale, { ar: 'التاريخ', ku: 'بەروار', en: 'Date' })}</th>
                <th className="py-2 text-start font-semibold">{tri(locale, { ar: 'العميل', ku: 'کڕیار', en: 'Customer' })}</th>
                <th className="py-2 text-start font-semibold">{tri(locale, { ar: 'الطريقة', ku: 'شێواز', en: 'Method' })}</th>
                <th className="py-2 text-end font-semibold">{tri(locale, { ar: 'المبلغ', ku: 'بڕ', en: 'Amount' })}</th>
              </tr>
            </thead>
            <tbody>
              {rows === null ? (
                <tr><td colSpan={5} className="py-12 text-center text-muted-foreground">{tri(locale, { ar: 'جارٍ التحميل…', ku: 'بارکردن…', en: 'Loading…' })}</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={5} className="py-12 text-center text-muted-foreground">{tri(locale, { ar: 'لا توجد سندات قبض', ku: 'هیچ سەنەدی وەرگرتن نییە', en: 'No receipts yet' })}</td></tr>
              ) : rows.slice(0, 50).map((p) => (
                <tr key={p.id} className="border-b">
                  <td className="py-1.5 font-mono text-xs">{p.number}</td>
                  <td className="py-1.5 tabular-nums">{new Intl.DateTimeFormat(locale).format(new Date(p.date))}</td>
                  <td className="py-1.5">{p.contactName}</td>
                  <td className="py-1.5 text-xs">{p.method}</td>
                  <td className="py-1.5 text-end tabular-nums">{parseFloat(p.amount).toLocaleString(isAr ? 'ar-IQ' : 'en')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

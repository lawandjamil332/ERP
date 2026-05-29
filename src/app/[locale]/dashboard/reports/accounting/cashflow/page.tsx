'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { ArrowDownCircle, ArrowUpCircle, Wallet, Printer } from 'lucide-react';
import { tri } from '@/lib/i18n/tri';

interface ByMethod { method: string; in: number; out: number; net: number }
interface Monthly { month: string; in: number; out: number; net: number }
interface Data { cashIn: number; cashOut: number; netCashFlow: number; byMethod: ByMethod[]; monthly: Monthly[] }

const METHOD_LABELS: Record<string, { ar: string; ku: string; en: string }> = {
  CASH: { ar: 'نقدي', ku: 'نەقد', en: 'Cash' },
  BANK_TRANSFER: { ar: 'حوالة بنكية', ku: 'گواستنەوەی بانکی', en: 'Bank transfer' },
  CHEQUE: { ar: 'شيك', ku: 'چەک', en: 'Cheque' },
  CARD: { ar: 'بطاقة', ku: 'کارت', en: 'Card' },
  MOBILE: { ar: 'محفظة إلكترونية', ku: 'جزدانی ئەلیکترۆنی', en: 'Mobile wallet' },
  OTHER: { ar: 'أخرى', ku: 'هیتر', en: 'Other' },
};

export default function CashFlowPage() {
  const locale = useLocale();
  const y = new Date().getFullYear();
  const [from, setFrom] = useState(`${y}-01-01`);
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const [data, setData] = useState<Data | null>(null);

  async function load() {
    setData(null);
    const r = await fetch(`/api/reports/cashflow?from=${from}&to=${to}`);
    if (r.ok) setData((await r.json()).data);
  }
  useEffect(() => { load(); }, [from, to]);

  const fmt = (n: number) => n.toLocaleString(locale === 'ar' ? 'ar-IQ' : 'en', { minimumFractionDigits: 0 });

  return (
    <div className="space-y-6">
      <PageHeader
        title={tri(locale, { ar: 'التدفقات النقدية', ku: 'بڕی دراوی نەقدی', en: 'Cash Flow Statement' })}
        description={tri(locale, { ar: 'ملخص التدفقات النقدية الداخلة والخارجة', ku: 'پوختەی بڕی نەقدی هاتوو و چوو', en: 'Summary of cash inflows and outflows' })}
        actions={<Button variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4" /> {tri(locale, { ar: 'طباعة', ku: 'چاپکردن', en: 'Print' })}</Button>}
      />

      <div className="flex items-end gap-3 print:hidden">
        <div className="space-y-1.5">
          <Label>{tri(locale, { ar: 'من', ku: 'لە', en: 'From' })}</Label>
          <Input type="date" dir="ltr" value={from} onChange={(e) => setFrom(e.target.value)} className="w-44" />
        </div>
        <div className="space-y-1.5">
          <Label>{tri(locale, { ar: 'إلى', ku: 'بۆ', en: 'To' })}</Label>
          <Input type="date" dir="ltr" value={to} onChange={(e) => setTo(e.target.value)} className="w-44" />
        </div>
      </div>

      {data && (
        <>
          <div className="grid gap-3 sm:grid-cols-3 print:grid-cols-3">
            <Card>
              <CardContent className="flex items-center gap-3 pt-4">
                <ArrowDownCircle className="h-8 w-8 text-emerald-500" />
                <div>
                  <p className="text-xs text-muted-foreground">{tri(locale, { ar: 'النقد الداخل', ku: 'نەقدی هاتوو', en: 'Cash In' })}</p>
                  <p className="text-lg font-bold tabular-nums text-emerald-600">{fmt(data.cashIn)}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 pt-4">
                <ArrowUpCircle className="h-8 w-8 text-rose-500" />
                <div>
                  <p className="text-xs text-muted-foreground">{tri(locale, { ar: 'النقد الخارج', ku: 'نەقدی چوو', en: 'Cash Out' })}</p>
                  <p className="text-lg font-bold tabular-nums text-rose-600">{fmt(data.cashOut)}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 pt-4">
                <Wallet className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">{tri(locale, { ar: 'صافي التدفق', ku: 'نێتی بڕ', en: 'Net Cash Flow' })}</p>
                  <p className={`text-lg font-bold tabular-nums ${data.netCashFlow >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{fmt(data.netCashFlow)}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">{tri(locale, { ar: 'حسب طريقة الدفع', ku: 'بەپێی شێوازی پارەدان', en: 'By Payment Method' })}</CardTitle></CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr>
                      <th className="px-2 py-2 text-start">{tri(locale, { ar: 'الطريقة', ku: 'شێواز', en: 'Method' })}</th>
                      <th className="px-2 py-2 text-end text-emerald-600">{tri(locale, { ar: 'داخل', ku: 'هاتوو', en: 'In' })}</th>
                      <th className="px-2 py-2 text-end text-rose-600">{tri(locale, { ar: 'خارج', ku: 'چوو', en: 'Out' })}</th>
                      <th className="px-2 py-2 text-end">{tri(locale, { ar: 'صافي', ku: 'نێت', en: 'Net' })}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.byMethod.map((r) => (
                      <tr key={r.method} className="border-b">
                        <td className="px-2 py-1.5">
                          <Badge variant="outline">{tri(locale, METHOD_LABELS[r.method] ?? { ar: r.method, ku: r.method, en: r.method })}</Badge>
                        </td>
                        <td className="px-2 py-1.5 text-end tabular-nums text-emerald-600">{fmt(r.in)}</td>
                        <td className="px-2 py-1.5 text-end tabular-nums text-rose-600">{fmt(r.out)}</td>
                        <td className={`px-2 py-1.5 text-end tabular-nums font-medium ${r.net >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{fmt(r.net)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">{tri(locale, { ar: 'التدفق الشهري', ku: 'بڕی مانگانە', en: 'Monthly Flow' })}</CardTitle></CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr>
                      <th className="px-2 py-2 text-start">{tri(locale, { ar: 'الشهر', ku: 'مانگ', en: 'Month' })}</th>
                      <th className="px-2 py-2 text-end text-emerald-600">{tri(locale, { ar: 'داخل', ku: 'هاتوو', en: 'In' })}</th>
                      <th className="px-2 py-2 text-end text-rose-600">{tri(locale, { ar: 'خارج', ku: 'چوو', en: 'Out' })}</th>
                      <th className="px-2 py-2 text-end">{tri(locale, { ar: 'صافي', ku: 'نێت', en: 'Net' })}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.monthly.map((r) => {
                      const [y, m] = r.month.split('-');
                      const label = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short' }).format(new Date(parseInt(y), parseInt(m) - 1, 1));
                      return (
                        <tr key={r.month} className="border-b">
                          <td className="px-2 py-1.5">{label}</td>
                          <td className="px-2 py-1.5 text-end tabular-nums text-emerald-600">{fmt(r.in)}</td>
                          <td className="px-2 py-1.5 text-end tabular-nums text-rose-600">{fmt(r.out)}</td>
                          <td className={`px-2 py-1.5 text-end tabular-nums font-medium ${r.net >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{fmt(r.net)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-muted/40 font-semibold">
                    <tr>
                      <td className="px-2 py-2">{tri(locale, { ar: 'المجموع', ku: 'کۆ', en: 'Total' })}</td>
                      <td className="px-2 py-2 text-end tabular-nums text-emerald-600">{fmt(data.cashIn)}</td>
                      <td className="px-2 py-2 text-end tabular-nums text-rose-600">{fmt(data.cashOut)}</td>
                      <td className={`px-2 py-2 text-end tabular-nums ${data.netCashFlow >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{fmt(data.netCashFlow)}</td>
                    </tr>
                  </tfoot>
                </table>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {!data && (
        <div className="py-12 text-center text-muted-foreground">{tri(locale, { ar: 'جارٍ التحميل…', ku: 'بارکردن…', en: 'Loading…' })}</div>
      )}
    </div>
  );
}

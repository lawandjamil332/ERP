'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { Scale, Printer, ChevronDown, ChevronRight } from 'lucide-react';
import { tri } from '@/lib/i18n/tri';

interface Line {
  code: string; nameAr: string; nameEn: string; type: string;
  debit: string; credit: string; balance: string;
  accountId?: string;
}
interface LedgerEntry { date: string; number: string; description: string; debit: string; credit: string; balance: string }
interface Data {
  assets: string; liabilities: string; equity: string; currentYearProfit: string;
  lines: Line[];
}

export default function BalanceSheetPage() {
  const locale = useLocale();
  const [asOf, setAsOf] = useState(new Date().toISOString().slice(0, 10));
  const [data, setData] = useState<Data | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [ledger, setLedger] = useState<Record<string, LedgerEntry[]>>({});

  async function load() {
    setData(null);
    const r = await fetch(`/api/reports/balance-sheet?asOf=${asOf}`);
    if (r.ok) setData((await r.json()).data);
  }
  useEffect(() => { load(); }, [asOf]);

  async function drillDown(accountId: string) {
    if (expanded === accountId) { setExpanded(null); return; }
    setExpanded(accountId);
    if (ledger[accountId]) return;
    const r = await fetch(`/api/reports/account-ledger?accountId=${accountId}&to=${asOf}`);
    if (r.ok) {
      const d = await r.json();
      setLedger((prev) => ({ ...prev, [accountId]: d.data ?? [] }));
    }
  }

  const fmt = (v: string) => parseFloat(v).toLocaleString(locale === 'ar' ? 'ar-IQ' : 'en', { minimumFractionDigits: 2 });
  const sections = [
    { key: 'ASSET', label: tri(locale, { ar: 'الأصول', ku: 'سامانەکان', en: 'Assets' }), total: data?.assets },
    { key: 'LIABILITY', label: tri(locale, { ar: 'المطلوبات', ku: 'قەرزەکان', en: 'Liabilities' }), total: data?.liabilities },
    { key: 'EQUITY', label: tri(locale, { ar: 'حقوق الملكية', ku: 'مافەکانی خاوەنداری', en: 'Equity' }), total: data?.equity },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={tri(locale, { ar: 'الميزانية العمومية', ku: 'باڵانسی گشتی', en: 'Balance Sheet' })}
        description={tri(locale, { ar: 'الأصول والمطلوبات وحقوق الملكية بتاريخ معيّن', ku: 'سامان و قەرز و مافی خاوەنداری لە بەرواری دیاریکراودا', en: 'Assets, liabilities & equity as of a given date' })}
        actions={<Button variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4" /> {tri(locale, { ar: 'طباعة', ku: 'چاپکردن', en: 'Print' })}</Button>}
      />

      <div className="flex items-end gap-3">
        <div className="space-y-1.5">
          <Label>{tri(locale, { ar: 'بتاريخ', ku: 'لە بەرواری', en: 'As of' })}</Label>
          <Input type="date" dir="ltr" value={asOf} onChange={(e) => setAsOf(e.target.value)} className="w-44" />
        </div>
      </div>

      {data && (
        <div className="grid gap-3 sm:grid-cols-4 print:grid-cols-4">
          {sections.map((s) => (
            <Card key={s.key}>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-lg font-bold tabular-nums">{fmt(s.total ?? '0')}</p>
              </CardContent>
            </Card>
          ))}
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">{tri(locale, { ar: 'ربح السنة الحالية', ku: 'قازانجی ساڵی ئێستا', en: 'Current year profit' })}</p>
              <p className="text-lg font-bold tabular-nums">{fmt(data.currentYearProfit)}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {sections.map((s) => {
        const sectionLines = data?.lines.filter((l) => l.type === s.key) ?? [];
        if (sectionLines.length === 0 && !data) return null;
        return (
          <Card key={s.key}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Scale className="h-4 w-4 text-primary" /> {s.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="w-8 px-2 py-2"></th>
                    <th className="px-2 py-2 text-start">{tri(locale, { ar: 'الرمز', ku: 'کۆد', en: 'Code' })}</th>
                    <th className="px-2 py-2 text-start">{tri(locale, { ar: 'الحساب', ku: 'هەژمار', en: 'Account' })}</th>
                    <th className="px-2 py-2 text-end">{tri(locale, { ar: 'مدين', ku: 'قەرزدار', en: 'Debit' })}</th>
                    <th className="px-2 py-2 text-end">{tri(locale, { ar: 'دائن', ku: 'داینەر', en: 'Credit' })}</th>
                    <th className="px-2 py-2 text-end">{tri(locale, { ar: 'الرصيد', ku: 'باڵانس', en: 'Balance' })}</th>
                  </tr>
                </thead>
                <tbody>
                  {!data ? (
                    <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">{tri(locale, { ar: 'جارٍ التحميل…', ku: 'بارکردن…', en: 'Loading…' })}</td></tr>
                  ) : sectionLines.length === 0 ? (
                    <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">{tri(locale, { ar: 'لا توجد بيانات', ku: 'هیچ داتایەک نییە', en: 'No data' })}</td></tr>
                  ) : sectionLines.map((l, i) => {
                    const id = l.accountId ?? l.code;
                    const isExpanded = expanded === id;
                    return (
                      <>{/* eslint-disable-next-line react/jsx-key */}
                        <tr key={id} className={`border-b cursor-pointer hover:bg-muted/50 ${isExpanded ? 'bg-primary/5' : ''}`}
                          onClick={() => id && drillDown(id)}>
                          <td className="px-2 py-1.5 text-muted-foreground">
                            {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                          </td>
                          <td className="px-2 py-1.5 font-mono text-xs">{l.code}</td>
                          <td className="px-2 py-1.5">{locale === 'ar' ? l.nameAr : l.nameEn}</td>
                          <td className="px-2 py-1.5 text-end tabular-nums">{fmt(l.debit)}</td>
                          <td className="px-2 py-1.5 text-end tabular-nums">{fmt(l.credit)}</td>
                          <td className="px-2 py-1.5 text-end tabular-nums font-medium">{fmt(l.balance)}</td>
                        </tr>
                        {isExpanded && ledger[id] && (
                          <tr key={`${id}-ledger`}>
                            <td colSpan={6} className="bg-muted/30 px-4 py-2">
                              <p className="mb-2 text-xs font-semibold text-muted-foreground">{tri(locale, { ar: 'حركات الحساب', ku: 'جوڵەکانی هەژمار', en: 'Account transactions' })}</p>
                              <table className="w-full text-xs">
                                <thead><tr className="border-b">
                                  <th className="px-1 py-1 text-start">{tri(locale, { ar: 'التاريخ', ku: 'بەروار', en: 'Date' })}</th>
                                  <th className="px-1 py-1 text-start">{tri(locale, { ar: 'الرقم', ku: 'ژمارە', en: 'Ref' })}</th>
                                  <th className="px-1 py-1 text-start">{tri(locale, { ar: 'البيان', ku: 'وەسف', en: 'Description' })}</th>
                                  <th className="px-1 py-1 text-end">{tri(locale, { ar: 'مدين', ku: 'قەرزدار', en: 'Debit' })}</th>
                                  <th className="px-1 py-1 text-end">{tri(locale, { ar: 'دائن', ku: 'داینەر', en: 'Credit' })}</th>
                                  <th className="px-1 py-1 text-end">{tri(locale, { ar: 'الرصيد', ku: 'باڵانس', en: 'Balance' })}</th>
                                </tr></thead>
                                <tbody>
                                  {ledger[id].length === 0 ? (
                                    <tr><td colSpan={6} className="py-4 text-center text-muted-foreground">{tri(locale, { ar: 'لا توجد حركات', ku: 'هیچ جوڵەیەک نییە', en: 'No entries' })}</td></tr>
                                  ) : ledger[id].map((e, j) => (
                                    <tr key={j} className="border-b border-muted">
                                      <td className="px-1 py-0.5 tabular-nums">{new Intl.DateTimeFormat(locale).format(new Date(e.date))}</td>
                                      <td className="px-1 py-0.5 font-mono">{e.number}</td>
                                      <td className="px-1 py-0.5">{e.description}</td>
                                      <td className="px-1 py-0.5 text-end tabular-nums">{fmt(e.debit)}</td>
                                      <td className="px-1 py-0.5 text-end tabular-nums">{fmt(e.credit)}</td>
                                      <td className="px-1 py-0.5 text-end tabular-nums font-medium">{fmt(e.balance)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
                <tfoot className="bg-muted/40 font-semibold">
                  <tr>
                    <td colSpan={3} className="px-2 py-2 text-end">{tri(locale, { ar: 'المجموع', ku: 'کۆ', en: 'Total' })}</td>
                    <td className="px-2 py-2 text-end tabular-nums">{fmt(sectionLines.reduce((s, l) => s + parseFloat(l.debit), 0).toString())}</td>
                    <td className="px-2 py-2 text-end tabular-nums">{fmt(sectionLines.reduce((s, l) => s + parseFloat(l.credit), 0).toString())}</td>
                    <td className="px-2 py-2 text-end tabular-nums">{fmt(s.total ?? '0')}</td>
                  </tr>
                </tfoot>
              </table>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

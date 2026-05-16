'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { Scale } from 'lucide-react';

interface Row { contactId: string; name: string; notDue: number; d0_30: number; d31_60: number; d61_90: number; d91Plus: number; total: number }

export default function AgingLedgerPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    fetch('/api/reports/aging?mode=ledger').then((r) => r.ok ? r.json() : { rows: [] }).then((b) => setRows(b.rows ?? []));
  }, []);

  const fmt = (n: number) => n ? n.toLocaleString(isAr ? 'ar-IQ' : 'en') : '—';
  const total = (rows ?? []).reduce((s, r) => s + r.total, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={isAr ? 'أعمار الذمم (مستوى السجل GL)' : 'Aged debtors (GL ledger)'}
        description={isAr ? 'تجميع على مستوى دفتر الأستاذ — صافي بعد جميع المقبوضات الجزئية' : 'GL-style aggregation — net of all partial receipts'}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Scale className="h-4 w-4" /> {isAr ? 'الفئات العمرية' : 'Aging buckets'}</CardTitle>
          <CardDescription>{isAr ? 'مبني على رصيد كل عميل، ليس على الفواتير الفردية' : 'Computed from per-customer running balance, not per-invoice'}</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr>
                <th className="py-2 text-start font-semibold">{isAr ? 'الزبون' : 'Customer'}</th>
                <th className="px-2 text-end font-semibold">{isAr ? 'غير مستحقّ' : 'Not due'}</th>
                <th className="px-2 text-end font-semibold">0–30</th>
                <th className="px-2 text-end font-semibold">31–60</th>
                <th className="px-2 text-end font-semibold">61–90</th>
                <th className="px-2 text-end font-semibold">90+</th>
                <th className="px-2 text-end font-bold">{isAr ? 'المجموع' : 'Total'}</th>
              </tr>
            </thead>
            <tbody>
              {rows === null ? (
                <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">{isAr ? 'جارٍ التحميل…' : 'Loading…'}</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">{isAr ? 'لا توجد ذمم' : 'No outstanding receivables'}</td></tr>
              ) : rows.map((r) => (
                <tr key={r.contactId} className="border-b">
                  <td className="py-1.5 font-medium">{r.name}</td>
                  <td className="px-2 text-end tabular-nums">{fmt(r.notDue)}</td>
                  <td className="px-2 text-end tabular-nums">{fmt(r.d0_30)}</td>
                  <td className="px-2 text-end tabular-nums">{fmt(r.d31_60)}</td>
                  <td className="px-2 text-end tabular-nums">{fmt(r.d61_90)}</td>
                  <td className="px-2 text-end tabular-nums text-rose-600">{fmt(r.d91Plus)}</td>
                  <td className="px-2 text-end font-bold tabular-nums">{fmt(r.total)}</td>
                </tr>
              ))}
              {rows && rows.length > 0 && (
                <tr className="border-t-2 bg-muted/50">
                  <td colSpan={6} className="py-2 text-end font-bold">{isAr ? 'الإجمالي' : 'Grand Total'}</td>
                  <td className="px-2 text-end font-bold tabular-nums">{fmt(total)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

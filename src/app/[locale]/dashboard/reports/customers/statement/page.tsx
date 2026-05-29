'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Printer, Download, User } from 'lucide-react';
import { tri } from '@/lib/i18n/tri';

interface Contact { id: string; nameAr: string; nameEn: string | null }
interface Line { date: string; ref: string; kind: 'INVOICE' | 'PAYMENT'; debit: number; credit: number; balance: number }
interface Data {
  contact: { id: string; name: string; currency: string; openingBalance: number };
  lines: Line[];
  summary: { totalInvoiced: number; totalPaid: number; totalRefunded: number; currentBalance: number };
}

export default function CustomerStatementPage() {
  const locale = useLocale();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [pick, setPick] = useState('');
  const [data, setData] = useState<Data | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch('/api/contacts').then((r) => r.ok ? r.json() : { data: [] })
      .then((b) => setContacts((b.data ?? []).filter((c: { kind?: string }) => c.kind !== 'SUPPLIER')));
  }, []);

  async function load() {
    if (!pick) return;
    setBusy(true);
    const r = await fetch(`/api/reports/customer-statement?contactId=${pick}`);
    setBusy(false);
    if (r.ok) setData(await r.json());
  }

  const fmt = (n: number) => `${n.toLocaleString(locale === 'ar' ? 'ar-IQ' : locale === 'ku' ? 'ckb-IQ' : 'en')}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title={tri(locale, { ar: 'کشف حساب عميل', ku: 'کەشفی حیسابی کڕیار', en: 'Customer statement' })}
        description={tri(locale, { ar: 'كامل النشاط لكل عميل مع الرصيد الجاري', ku: 'هەموو چالاکی هەر کڕیارێک لەگەڵ باڵانسی جاری', en: 'Full account activity per customer with running balance' })}
        actions={
          data && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => window.print()}>
                <Printer className="h-4 w-4" /> {tri(locale, { ar: 'طباعة', ku: 'چاپ', en: 'Print' })}
              </Button>
              <Button variant="outline" onClick={() => downloadCsv(data)}>
                <Download className="h-4 w-4" /> CSV
              </Button>
            </div>
          )
        }
      />

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <label className="text-sm font-medium">{tri(locale, { ar: 'العميل', ku: 'کڕیار', en: 'Customer' })}</label>
            <Select value={pick} onValueChange={setPick}>
              <SelectTrigger><SelectValue placeholder={tri(locale, { ar: 'اختر العميل…', ku: 'کڕیار هەڵبژێرە…', en: 'Select customer…' })} /></SelectTrigger>
              <SelectContent>
                {contacts.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{tri(locale, { ar: c.nameAr, ku: c.nameEn ?? c.nameAr, en: c.nameEn ?? c.nameAr })}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={load} disabled={!pick || busy}>{busy ? '…' : tri(locale, { ar: 'عرض', ku: 'پیشاندان', en: 'Load' })}</Button>
        </CardContent>
      </Card>

      {data && (
        <>
          <div className="grid gap-3 sm:grid-cols-4">
            <KpiBox label={tri(locale, { ar: 'إجمالي مفوتر', ku: 'کۆی پسوڵەکراو', en: 'Total invoiced' })} value={fmt(data.summary.totalInvoiced)} currency={data.contact.currency} />
            <KpiBox label={tri(locale, { ar: 'إجمالي مدفوع', ku: 'کۆی پارەدراو', en: 'Total paid' })} value={fmt(data.summary.totalPaid)} currency={data.contact.currency} tone="emerald" />
            <KpiBox label={tri(locale, { ar: 'مرتجع', ku: 'گەڕاوە', en: 'Refunded' })} value={fmt(data.summary.totalRefunded)} currency={data.contact.currency} tone="rose" />
            <KpiBox label={tri(locale, { ar: 'الرصيد الحالي', ku: 'باڵانسی ئێستا', en: 'Current balance' })} value={fmt(data.summary.currentBalance)} currency={data.contact.currency} tone={data.summary.currentBalance > 0 ? 'amber' : 'sky'} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><User className="h-4 w-4" /> {data.contact.name}</CardTitle>
              <CardDescription>{tri(locale, { ar: `الرصيد الافتتاحي: ${fmt(data.contact.openingBalance)} ${data.contact.currency}`, ku: `باڵانسی کردنەوە: ${fmt(data.contact.openingBalance)} ${data.contact.currency}`, en: `Opening balance: ${fmt(data.contact.openingBalance)} ${data.contact.currency}` })}</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="px-2 py-2 text-start font-semibold">{tri(locale, { ar: 'التاريخ', ku: 'بەروار', en: 'Date' })}</th>
                    <th className="px-2 py-2 text-start font-semibold">{tri(locale, { ar: 'المرجع', ku: 'ژمارەی ئاماژە', en: 'Reference' })}</th>
                    <th className="px-2 py-2 text-start font-semibold">{tri(locale, { ar: 'النوع', ku: 'جۆر', en: 'Type' })}</th>
                    <th className="px-2 py-2 text-end font-semibold">{tri(locale, { ar: 'مدين', ku: 'قەرزدار', en: 'Debit' })}</th>
                    <th className="px-2 py-2 text-end font-semibold">{tri(locale, { ar: 'دائن', ku: 'داینەر', en: 'Credit' })}</th>
                    <th className="px-2 py-2 text-end font-semibold">{tri(locale, { ar: 'الرصيد', ku: 'باڵانس', en: 'Balance' })}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.lines.length === 0 ? (
                    <tr><td colSpan={6} className="py-12 text-center text-muted-foreground">{tri(locale, { ar: 'لا توجد حركات', ku: 'هیچ مامەڵەیەک نییە', en: 'No transactions' })}</td></tr>
                  ) : data.lines.map((l, i) => (
                    <tr key={i} className="border-b">
                      <td className="px-2 py-1.5 tabular-nums">{new Intl.DateTimeFormat(locale).format(new Date(l.date))}</td>
                      <td className="px-2 py-1.5 font-mono text-xs">{l.ref}</td>
                      <td className="px-2 py-1.5"><Badge variant={l.kind === 'INVOICE' ? 'outline' : 'secondary'}>{l.kind === 'INVOICE' ? tri(locale, { ar: 'فاتورة', ku: 'پسوڵە', en: 'Invoice' }) : tri(locale, { ar: 'دفعة', ku: 'پارەدان', en: 'Payment' })}</Badge></td>
                      <td className="px-2 py-1.5 text-end tabular-nums">{l.debit ? fmt(l.debit) : '—'}</td>
                      <td className="px-2 py-1.5 text-end tabular-nums">{l.credit ? fmt(l.credit) : '—'}</td>
                      <td className="px-2 py-1.5 text-end tabular-nums font-medium">{fmt(l.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function KpiBox({ label, value, currency, tone = 'sky' }: { label: string; value: string; currency: string; tone?: 'emerald' | 'rose' | 'amber' | 'sky' }) {
  const cls = {
    emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
    rose: 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
    sky: 'bg-sky-50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-400',
  }[tone];
  return (
    <div className={`rounded-lg ${cls} p-3`}>
      <p className="text-xs font-medium uppercase tracking-wide opacity-80">{label}</p>
      <p className="mt-1 text-xl font-bold tabular-nums">{value} <span className="text-xs font-normal">{currency}</span></p>
    </div>
  );
}

function downloadCsv(data: Data) {
  const rows = [['date', 'ref', 'kind', 'debit', 'credit', 'balance']];
  for (const l of data.lines) rows.push([l.date.slice(0, 10), l.ref, l.kind, String(l.debit), String(l.credit), String(l.balance)]);
  const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `customer-${data.contact.name}-statement.csv`;
  a.click();
}

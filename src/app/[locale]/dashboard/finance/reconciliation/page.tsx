'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { Landmark, Save, CheckCircle2 } from 'lucide-react';
import { toast } from '@/lib/toast';
import { tri } from '@/lib/i18n/tri';

interface BankAccount { id: string; bankName: string; accountNumber: string; currency: string }
interface Payment { id: string; number: string; date: string; amount: string; direction: 'IN' | 'OUT'; reference: string | null }

export default function ReconciliationPage() {
  const locale = useLocale();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [bankAccountId, setBankAccountId] = useState('');
  const [statementDate, setStatementDate] = useState(new Date().toISOString().slice(0, 10));
  const [opening, setOpening] = useState('0');
  const [closing, setClosing] = useState('0');
  const [candidates, setCandidates] = useState<Payment[]>([]);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch('/api/finance/bank-accounts').then((r) => r.ok ? r.json() : { data: [] }).then((b) => setAccounts(b.data ?? []));
  }, []);

  async function loadCandidates() {
    if (!bankAccountId) return;
    const r = await fetch('/api/bank-reconciliations', {
      method: 'PATCH', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ bankAccountId }),
    });
    if (r.ok) setCandidates((await r.json()).candidates ?? []);
  }

  useEffect(() => { void loadCandidates(); }, [bankAccountId]); // eslint-disable-line react-hooks/exhaustive-deps

  const matchedSum = candidates
    .filter((c) => matched.has(c.id))
    .reduce((s, c) => s + (c.direction === 'IN' ? parseFloat(c.amount) : -parseFloat(c.amount)), 0);
  const expectedDelta = parseFloat(closing) - parseFloat(opening);
  const balanced = Math.abs(matchedSum - expectedDelta) < 0.01;

  function toggle(id: string) {
    setMatched((curr) => {
      const next = new Set(curr);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function save(complete: boolean) {
    if (!bankAccountId) return;
    setBusy(true);
    const res = await fetch('/api/bank-reconciliations', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        bankAccountId,
        statementDate,
        openingBalance: parseFloat(opening),
        closingBalance: parseFloat(closing),
        matched: candidates.filter((c) => matched.has(c.id)).map((c) => ({
          paymentId: c.id, amount: c.direction === 'IN' ? parseFloat(c.amount) : -parseFloat(c.amount),
        })),
        complete,
      }),
    });
    setBusy(false);
    if (res.ok) {
      toast.success(tri(locale, { ar: 'تم الحفظ', ku: 'پاشەکەوت کرا', en: 'Saved' }));
      setMatched(new Set());
      loadCandidates();
    } else toast.error(tri(locale, { ar: 'فشل', ku: 'نەکرا', en: 'Failed' }));
  }

  const fmt = (n: number) => n.toLocaleString(locale === 'ar' ? 'ar-IQ' : locale === 'ku' ? 'ckb-IQ' : 'en', { minimumFractionDigits: 2 });

  return (
    <div className="space-y-6">
      <PageHeader
        title={tri(locale, { ar: 'تسوية البنك', ku: 'ڕێکخستنی بانک', en: 'Bank reconciliation' })}
        description={tri(locale, { ar: 'طابق دفعات النظام مع كشف الحساب البنكي', ku: 'پارەدانەکانی سیستەم لەگەڵ کەشفی هەژماری بانکدا ڕێکبخە', en: 'Match system payments to your bank statement' })}
      />

      <Card>
        <CardHeader><CardTitle>{tri(locale, { ar: 'کشف الحساب', ku: 'کەشفی هەژمار', en: 'Statement' })}</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-4">
          <div className="space-y-1.5">
            <Label>{tri(locale, { ar: 'الحساب البنكي', ku: 'هەژماری بانک', en: 'Bank account' })}</Label>
            <select className="h-9 w-full rounded-md border bg-background px-3 text-sm"
              value={bankAccountId} onChange={(e) => setBankAccountId(e.target.value)}>
              <option value="">—</option>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.bankName} ({a.accountNumber})</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>{tri(locale, { ar: 'تاريخ الكشف', ku: 'بەرواری کەشف', en: 'Statement date' })}</Label>
            <Input type="date" dir="ltr" value={statementDate} onChange={(e) => setStatementDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{tri(locale, { ar: 'الرصيد الافتتاحي', ku: 'باڵانسی دەستپێک', en: 'Opening balance' })}</Label>
            <Input type="number" step="0.01" dir="ltr" value={opening} onChange={(e) => setOpening(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{tri(locale, { ar: 'الرصيد الختامي', ku: 'باڵانسی کۆتایی', en: 'Closing balance' })}</Label>
            <Input type="number" step="0.01" dir="ltr" value={closing} onChange={(e) => setClosing(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Landmark className="h-5 w-5 text-primary" /> {tri(locale, { ar: 'الدفعات غير المطابَقة', ku: 'پارەدانە ڕێکنەخراوەکان', en: 'Unmatched payments' })}</CardTitle>
          <CardDescription>
            {tri(locale, { ar: 'حدّد الدفعات الظاهرة في كشف الحساب', ku: 'ئەو پارەدانانە دیاری بکە کە لە کەشف دەردەکەون', en: 'Tick payments that appear on your statement' })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {candidates.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{tri(locale, { ar: 'لا توجد دفعات معلّقة', ku: 'هیچ پارەدانێکی چاوەڕێ نییە', en: 'No pending payments' })}</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="px-2 py-2 w-8"></th>
                  <th className="px-2 py-2 text-start">{tri(locale, { ar: 'الرقم', ku: 'ژمارە', en: 'Number' })}</th>
                  <th className="px-2 py-2 text-start">{tri(locale, { ar: 'التاريخ', ku: 'بەروار', en: 'Date' })}</th>
                  <th className="px-2 py-2 text-start">{tri(locale, { ar: 'النوع', ku: 'جۆر', en: 'Direction' })}</th>
                  <th className="px-2 py-2 text-end">{tri(locale, { ar: 'المبلغ', ku: 'بڕ', en: 'Amount' })}</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((c) => (
                  <tr key={c.id} className={`border-b ${matched.has(c.id) ? 'bg-primary/5' : ''}`}>
                    <td className="px-2 py-1.5"><input type="checkbox" className="h-4 w-4" checked={matched.has(c.id)} onChange={() => toggle(c.id)} /></td>
                    <td className="px-2 py-1.5 font-mono text-xs">{c.number}</td>
                    <td className="px-2 py-1.5 tabular-nums">{new Intl.DateTimeFormat(locale).format(new Date(c.date))}</td>
                    <td className="px-2 py-1.5"><Badge variant={c.direction === 'IN' ? 'default' : 'secondary'}>{c.direction}</Badge></td>
                    <td className="px-2 py-1.5 text-end tabular-nums">{fmt(parseFloat(c.amount))}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-muted/40 text-sm">
                <tr><td colSpan={4} className="px-2 py-2 text-end font-medium">{tri(locale, { ar: 'مجموع المطابَق', ku: 'کۆی ڕێکخراو', en: 'Matched total' })}</td><td className="px-2 py-2 text-end tabular-nums font-bold">{fmt(matchedSum)}</td></tr>
                <tr><td colSpan={4} className="px-2 py-2 text-end font-medium">{tri(locale, { ar: 'الفرق المتوقع', ku: 'جیاوازی چاوەڕێکراو', en: 'Expected delta' })}</td><td className="px-2 py-2 text-end tabular-nums font-bold">{fmt(expectedDelta)}</td></tr>
                <tr><td colSpan={4} className="px-2 py-2 text-end font-medium">{tri(locale, { ar: 'الحالة', ku: 'دۆخ', en: 'Balanced?' })}</td>
                  <td className="px-2 py-2 text-end">
                    <Badge variant={balanced ? 'default' : 'destructive'}>{balanced ? tri(locale, { ar: 'متوازن', ku: 'هاوسەنگ', en: 'Balanced' }) : tri(locale, { ar: 'غير متوازن', ku: 'ناهاوسەنگ', en: 'Off' })}</Badge>
                  </td></tr>
              </tfoot>
            </table>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => save(false)} disabled={!bankAccountId || busy}><Save className="h-4 w-4" /> {tri(locale, { ar: 'حفظ كمسوّدة', ku: 'پاشەکەوت بکە وەک ڕەشنووس', en: 'Save draft' })}</Button>
        <Button onClick={() => save(true)} disabled={!bankAccountId || !balanced || busy}>
          <CheckCircle2 className="h-4 w-4" />
          {tri(locale, { ar: 'إكمال التسوية', ku: 'تەواوکردنی ڕێکخستن', en: 'Complete reconciliation' })}
        </Button>
      </div>
    </div>
  );
}

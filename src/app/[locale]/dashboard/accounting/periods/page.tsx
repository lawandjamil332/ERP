'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { Lock, Unlock, ShieldAlert } from 'lucide-react';
import { toast } from '@/lib/toast';
import { tri } from '@/lib/i18n/tri';

interface Period { id: string | null; year: number; month: number; status: 'OPEN' | 'CLOSED'; closedAt: string | null }

export default function PeriodsPage() {
  const locale = useLocale();
  const [year, setYear] = useState(new Date().getUTCFullYear());
  const [periods, setPeriods] = useState<Period[]>([]);
  const [busy, setBusy] = useState<number | null>(null);
  const [reauthOpen, setReauthOpen] = useState(false);
  const [pwd, setPwd] = useState('');
  const [pending, setPending] = useState<{ month: number; action: 'CLOSE' | 'REOPEN' } | null>(null);

  async function load() {
    const r = await fetch(`/api/accounting/periods?year=${year}`);
    if (r.ok) setPeriods((await r.json()).data ?? []);
  }
  useEffect(() => { load(); }, [year]); // eslint-disable-line react-hooks/exhaustive-deps

  async function toggle(month: number, current: 'OPEN' | 'CLOSED') {
    const action = current === 'OPEN' ? 'CLOSE' : 'REOPEN';
    setPending({ month, action });
    setReauthOpen(true);
  }

  async function confirmReauth(e: React.FormEvent) {
    e.preventDefault();
    if (!pending) return;
    setBusy(pending.month);
    const reauth = await fetch('/api/auth/reauth', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password: pwd }),
    });
    if (!reauth.ok) {
      setBusy(null);
      toast.error(tri(locale, { ar: 'كلمة المرور خاطئة', ku: 'تێپەڕەوشە هەڵەیە', en: 'Wrong password' }));
      return;
    }
    const res = await fetch('/api/accounting/periods', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ year, month: pending.month, action: pending.action }),
    });
    setBusy(null); setReauthOpen(false); setPwd(''); setPending(null);
    if (res.ok) {
      toast.success(tri(locale, { ar: 'تم', ku: 'کرا', en: 'Done' }));
      load();
    } else toast.error(tri(locale, { ar: 'فشل', ku: 'نەکرا', en: 'Failed' }));
  }

  const monthName = (m: number) => new Intl.DateTimeFormat(locale, { month: 'long' }).format(new Date(2026, m - 1, 1));

  return (
    <div className="space-y-6">
      <PageHeader
        title={tri(locale, { ar: 'إقفال الفترات المحاسبية', ku: 'داخستنی ماوە ژمێریارییەکان', en: 'Accounting periods' })}
        description={tri(locale, { ar: 'بعد إقفال شهر، لا يمكن ترحيل أو تعديل أي قيد فيه (مطلوب للتقديم الضريبي الشهري للهيئة العامة)', ku: 'دوای داخستنی مانگ، هیچ تۆمارێک ناتوانرێت لەو مانگەدا تۆماربکرێت یان دەستکاری بکرێت (پێویستە بۆ ڕاپۆرتی مانگانەی باج)', en: 'Once a month is closed, no entries can be posted or back-dated into it (required for monthly GCT filings)' })}
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>{year}</CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setYear(year - 1)}>‹</Button>
            <Button size="sm" variant="outline" onClick={() => setYear(year + 1)}>›</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {periods.map((p) => (
              <div key={p.month} className="rounded-lg border bg-card p-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{monthName(p.month)}</p>
                  <Badge variant={p.status === 'CLOSED' ? 'secondary' : 'default'}>
                    {p.status === 'CLOSED'
                      ? tri(locale, { ar: 'مغلق', ku: 'داخراو', en: 'Closed' })
                      : tri(locale, { ar: 'مفتوح', ku: 'کراوە', en: 'Open' })}
                  </Badge>
                </div>
                <Button size="sm" variant="outline" className="mt-3 w-full" disabled={busy === p.month}
                  onClick={() => toggle(p.month, p.status)}>
                  {p.status === 'OPEN'
                    ? <><Lock className="h-3.5 w-3.5" /> {tri(locale, { ar: 'إقفال', ku: 'داخستن', en: 'Close' })}</>
                    : <><Unlock className="h-3.5 w-3.5" /> {tri(locale, { ar: 'إعادة فتح', ku: 'کردنەوە', en: 'Reopen' })}</>}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {reauthOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" role="dialog" aria-modal="true">
          <form onSubmit={confirmReauth} className="w-full max-w-sm space-y-3 rounded-xl border bg-popover p-4 shadow-floating">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-500" />
              <CardTitle>{tri(locale, { ar: 'تأكيد كلمة المرور', ku: 'پشتڕاستکردنەوەی تێپەڕەوشە', en: 'Confirm your password' })}</CardTitle>
            </div>
            <CardDescription>{tri(locale, { ar: 'إجراء حساس — يلزم تأكيد كلمة المرور', ku: 'کرداری هەستیار — پێویستە تێپەڕەوشە بپشتڕاستبکرێتەوە', en: 'Sensitive action — password confirmation required' })}</CardDescription>
            <Input type="password" autoFocus value={pwd} onChange={(e) => setPwd(e.target.value)} placeholder={tri(locale, { ar: 'كلمة المرور', ku: 'تێپەڕەوشە', en: 'Password' })} />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => { setReauthOpen(false); setPwd(''); setPending(null); }}>
                {tri(locale, { ar: 'إلغاء', ku: 'هەڵوەشاندنەوە', en: 'Cancel' })}
              </Button>
              <Button type="submit" disabled={!pwd}>
                {tri(locale, { ar: 'تأكيد', ku: 'پشتڕاست', en: 'Confirm' })}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

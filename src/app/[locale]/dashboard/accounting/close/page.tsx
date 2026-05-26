'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/lib/toast';

export default function YearEndClosePage() {
  const t = useTranslations('close');
  const [year, setYear] = useState(new Date().getUTCFullYear() - 1);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function run() {
    if (!confirm(t('confirm', { year }))) return;
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch('/api/closing/year-end', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ fiscalYear: year }),
      });
      const body = await res.json();
      setResult(body);
      if (res.ok) toast.success(t('closed', { year, profit: body.data?.netProfit ?? '—' }));
      else toast.error(body.error ?? `HTTP ${res.status}`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('intro')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('runTitle')}</CardTitle>
          <CardDescription>{t('runIntro')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 sm:w-64">
            <Label>{t('fiscalYear')}</Label>
            <Input type="number" value={year} onChange={(e) => setYear(parseInt(e.target.value, 10))} />
          </div>
          <Button onClick={run} disabled={busy}>{busy ? t('closing') : t('run', { year })}</Button>

          {result && (
            <pre className="mt-4 max-h-64 overflow-auto rounded-md border bg-muted p-3 text-xs" dir="ltr">
              {JSON.stringify(result, null, 2)}
            </pre>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

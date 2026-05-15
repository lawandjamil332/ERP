'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/lib/toast';

export default function YearEndClosePage() {
  const [year, setYear] = useState(new Date().getUTCFullYear() - 1);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function run() {
    if (!confirm(
      `Close fiscal year ${year}? This posts the year-end closing journal and creates ` +
      `opening entries for ${year + 1}. The action is logged but cannot be auto-reversed.`
    )) return;
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
      if (res.ok) toast.success(`Closed FY${year} — net profit ${body.data?.netProfit}`);
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
        <h1 className="text-2xl font-bold">Year-end close</h1>
        <p className="text-muted-foreground">
          Close income and expense accounts to retained earnings. Run after all entries for
          the year are posted. Iraqi entities almost always use the calendar year (1 Jan – 31 Dec).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Run closing</CardTitle>
          <CardDescription>The IUAS chart closes 4xxx, 5xxx, 6xxx, 7xxx, 8xxx → 34 → 33.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 sm:w-64">
            <Label>Fiscal year</Label>
            <Input type="number" value={year} onChange={(e) => setYear(parseInt(e.target.value, 10))} />
          </div>
          <Button onClick={run} disabled={busy}>{busy ? 'Closing…' : `Close FY${year}`}</Button>

          {result && (
            <pre className="mt-4 max-h-64 overflow-auto rounded-md border bg-muted p-3 text-xs">
              {JSON.stringify(result, null, 2)}
            </pre>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

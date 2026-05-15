'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';

type Employee = {
  id: string; empNo: string; fullNameAr: string; fullNameEn: string | null;
  baseSalary: string | number; dependents: number;
};

export default function NewPayrollPage({ params }: { params: Promise<{ locale: string }> }) {
  const router = useRouter();
  const t = useTranslations('payroll');
  const tCommon = useTranslations('common');
  const [locale, setLocale] = useState('ar');
  const now = new Date();
  const defaultPeriod = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  const [period, setPeriod] = useState(defaultPeriod);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [overrides, setOverrides] = useState<Record<string, { allowances?: number; overtime?: number; bonuses?: number; otherDeductions?: number }>>({});
  const [postImmediately, setPostImmediately] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    params.then(({ locale }) => setLocale(locale));
    fetch('/api/employees').then((r) => r.ok ? r.json() : { data: [] }).then((j) => setEmployees(j.data ?? []));
  }, [params]);

  function update(empId: string, field: 'allowances' | 'overtime' | 'bonuses' | 'otherDeductions', value: number) {
    setOverrides((cur) => ({ ...cur, [empId]: { ...(cur[empId] ?? {}), [field]: value } }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch('/api/payroll', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ period, overrides, postImmediately }),
    });
    setSubmitting(false);
    if (res.ok) {
      router.push(`/${locale}/dashboard/payroll`);
      router.refresh();
    } else {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? 'Failed to run payroll');
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('newRun')}</h1>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>{tCommon('cancel')}</Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? tCommon('loading') : t('calculate')}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-destructive bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t('period')}</CardTitle>
          <CardDescription>
            One run per month. Iraq: PIT 3-15% progressive (KRG 5%), SS employee 5% + employer 12% (25% oil & gas).
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>{t('period')}</Label>
            <Input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} required dir="ltr" />
          </div>
          <label className="flex items-end gap-2 text-sm">
            <input type="checkbox" checked={postImmediately} onChange={(e) => setPostImmediately(e.target.checked)} />
            Post journal entries immediately
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Overrides (optional)</CardTitle>
          <CardDescription>
            Add allowances, overtime, bonuses, or other deductions per employee for this period.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <TR>
                <TH>Emp #</TH>
                <TH>{locale === 'en' ? 'Name' : 'الاسم'}</TH>
                <TH className="text-end">{t('baseSalary')}</TH>
                <TH className="text-end">Allowances</TH>
                <TH className="text-end">Overtime</TH>
                <TH className="text-end">Bonuses</TH>
                <TH className="text-end">Other ded.</TH>
              </TR>
            </THead>
            <TBody>
              {employees.length === 0 && (
                <TR><TD colSpan={7} className="py-8 text-center text-muted-foreground">No employees</TD></TR>
              )}
              {employees.map((e) => (
                <TR key={e.id}>
                  <TD className="font-mono text-xs">{e.empNo}</TD>
                  <TD>{locale === 'ar' ? e.fullNameAr : (e.fullNameEn ?? e.fullNameAr)}</TD>
                  <TD className="text-end tabular-nums">{Number(e.baseSalary).toLocaleString()}</TD>
                  <TD><Input type="number" step="1000" min="0" dir="ltr"
                    onChange={(ev) => update(e.id, 'allowances', Number(ev.target.value))} className="h-8" /></TD>
                  <TD><Input type="number" step="1000" min="0" dir="ltr"
                    onChange={(ev) => update(e.id, 'overtime', Number(ev.target.value))} className="h-8" /></TD>
                  <TD><Input type="number" step="1000" min="0" dir="ltr"
                    onChange={(ev) => update(e.id, 'bonuses', Number(ev.target.value))} className="h-8" /></TD>
                  <TD><Input type="number" step="1000" min="0" dir="ltr"
                    onChange={(ev) => update(e.id, 'otherDeductions', Number(ev.target.value))} className="h-8" /></TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </form>
  );
}

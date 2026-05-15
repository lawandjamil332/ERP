'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { computePayroll } from '@/lib/iraq/tax';
import { formatMoney } from '@/lib/iraq/money';

export default function NewEmployeePage({ params }: { params: Promise<{ locale: string }> }) {
  const router = useRouter();
  const [locale, setLocale] = useState('ar');
  const [form, setForm] = useState({
    empNo: '', fullNameAr: '', fullNameEn: '',
    nationalId: '', ssNumber: '',
    gender: 'MALE' as 'MALE' | 'FEMALE',
    dateOfBirth: '', governorate: 'Baghdad', phone: '', email: '',
    hireDate: new Date().toISOString().slice(0, 10),
    jobTitle: '', department: '',
    baseSalary: 1_000_000,
    dependents: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { params.then(({ locale }) => setLocale(locale)); }, [params]);

  const set = <K extends keyof typeof form>(k: K, v: typeof form[K]) => setForm({ ...form, [k]: v });

  const preview = computePayroll(
    {
      baseSalary: form.baseSalary || 0,
      dependents: form.dependents,
      isMarried: form.dependents > 0,
    },
    { region: 'FEDERAL', sector: 'GENERAL' }
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch('/api/employees', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        ...form,
        baseSalary: Number(form.baseSalary),
        dependents: Number(form.dependents),
        dateOfBirth: form.dateOfBirth ? new Date(form.dateOfBirth).toISOString() : undefined,
        hireDate: new Date(form.hireDate).toISOString(),
      }),
    });
    setSubmitting(false);
    if (res.ok) {
      router.push(`/${locale}/dashboard/hr`);
      router.refresh();
    } else {
      const b = await res.json().catch(() => ({}));
      setError(b.error ?? 'Failed');
    }
  }

  const m = (v: any) => formatMoney(Number(v.toString()), 'IQD', locale as 'ar');

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">New employee / موظف جديد</h1>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={submitting || !form.empNo || !form.fullNameAr}>Save</Button>
        </div>
      </div>
      {error && <div className="rounded-md border border-destructive bg-destructive/5 p-3 text-sm text-destructive">{error}</div>}

      <Card>
        <CardHeader><CardTitle>Identity / الهوية</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Employee #" required><Input dir="ltr" value={form.empNo} onChange={(e) => set('empNo', e.target.value)} required /></Field>
          <Field label="Arabic name / الاسم" required><Input dir="rtl" value={form.fullNameAr} onChange={(e) => set('fullNameAr', e.target.value)} required /></Field>
          <Field label="English name"><Input dir="ltr" value={form.fullNameEn} onChange={(e) => set('fullNameEn', e.target.value)} /></Field>
          <Field label="National ID / الرقم الوطني"><Input dir="ltr" value={form.nationalId} onChange={(e) => set('nationalId', e.target.value)} /></Field>
          <Field label="SS number / رقم الضمان"><Input dir="ltr" value={form.ssNumber} onChange={(e) => set('ssNumber', e.target.value)} /></Field>
          <Field label="Gender"><Select value={form.gender} onValueChange={(v) => set('gender', v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="MALE">ذكر / Male</SelectItem><SelectItem value="FEMALE">أنثى / Female</SelectItem></SelectContent>
          </Select></Field>
          <Field label="Date of birth"><Input type="date" dir="ltr" value={form.dateOfBirth} onChange={(e) => set('dateOfBirth', e.target.value)} /></Field>
          <Field label="Hire date" required><Input type="date" dir="ltr" value={form.hireDate} onChange={(e) => set('hireDate', e.target.value)} required /></Field>
          <Field label="Job title"><Input value={form.jobTitle} onChange={(e) => set('jobTitle', e.target.value)} /></Field>
          <Field label="Department"><Input value={form.department} onChange={(e) => set('department', e.target.value)} /></Field>
          <Field label="Phone"><Input dir="ltr" value={form.phone} onChange={(e) => set('phone', e.target.value)} /></Field>
          <Field label="Email"><Input type="email" dir="ltr" value={form.email} onChange={(e) => set('email', e.target.value)} /></Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Compensation / التعويضات</CardTitle>
          <p className="text-sm text-muted-foreground">
            Iraq: PIT 3-15% progressive + SS 5% employee / 12% employer.
          </p>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <Field label="Monthly base salary (IQD)" required>
            <Input type="number" min="100000" step="50000" dir="ltr"
              value={form.baseSalary} onChange={(e) => set('baseSalary', Number(e.target.value))} required /></Field>
          <Field label="Dependents (children)">
            <Input type="number" min="0" step="1" dir="ltr"
              value={form.dependents} onChange={(e) => set('dependents', Number(e.target.value))} /></Field>
        </CardContent>
        <CardContent className="border-t bg-muted/30 grid gap-2 text-sm sm:grid-cols-4">
          <div><p className="text-xs text-muted-foreground">Gross</p><p className="font-semibold tabular-nums">{m(preview.gross)}</p></div>
          <div><p className="text-xs text-muted-foreground">SS employee (5%)</p><p className="tabular-nums">{m(preview.ssEmployee)}</p></div>
          <div><p className="text-xs text-muted-foreground">Income tax</p><p className="tabular-nums">{m(preview.incomeTax)}</p></div>
          <div><p className="text-xs text-muted-foreground">Net pay</p><p className="font-semibold tabular-nums">{m(preview.net)}</p></div>
          <div className="sm:col-span-4 mt-2 border-t pt-2 text-xs text-muted-foreground">
            Employer cost: <span className="font-mono">{m(preview.employerCost)}</span> · Employer SS (12%): <span className="font-mono">{m(preview.ssEmployer)}</span>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}{required && <span className="text-destructive"> *</span>}</Label>
      {children}
    </div>
  );
}

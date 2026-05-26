'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export default function NewChequePage({ params }: { params: Promise<{ locale: string }> }) {
  const router = useRouter();
  const [locale, setLocale] = useState('ar');
  const [form, setForm] = useState({
    number: '', direction: 'IN' as 'IN' | 'OUT',
    bank: '', branch: '', drawer: '', beneficiary: '',
    amount: 0, currency: 'IQD',
    issueDate: new Date().toISOString().slice(0, 10),
    dueDate: new Date().toISOString().slice(0, 10),
    notes: '',
  });
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { params.then(({ locale }) => setLocale(locale)); }, [params]);
  const set = <K extends keyof typeof form>(k: K, v: typeof form[K]) => setForm({ ...form, [k]: v });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const res = await fetch('/api/cheques', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        ...form, amount: Number(form.amount),
        issueDate: new Date(form.issueDate).toISOString(),
        dueDate: new Date(form.dueDate).toISOString(),
      }),
    });
    setBusy(false);
    if (res.ok) { router.push(`/${locale}/dashboard/cheques`); router.refresh(); }
    else setErr((await res.json().catch(() => ({}))).error ?? 'Failed');
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">New cheque / صك جديد</h1>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={busy}>Save</Button>
        </div>
      </div>
      {err && <div className="rounded-md border border-destructive bg-destructive/5 p-3 text-sm text-destructive">{err}</div>}
      <Card>
        <CardHeader><CardTitle>Cheque details</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <F label="Cheque number" req>
            <Input dir="ltr" value={form.number} onChange={(e) => set('number', e.target.value)} required /></F>
          <F label="Direction">
            <Select value={form.direction} onValueChange={(v) => set('direction', v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="IN">IN (received / مستلم)</SelectItem>
                <SelectItem value="OUT">OUT (issued / صادر)</SelectItem>
              </SelectContent>
            </Select></F>
          <F label="Bank" req><Input value={form.bank} onChange={(e) => set('bank', e.target.value)} required /></F>
          <F label="Branch"><Input value={form.branch} onChange={(e) => set('branch', e.target.value)} /></F>
          <F label="Drawer / الساحب" req><Input value={form.drawer} onChange={(e) => set('drawer', e.target.value)} required /></F>
          <F label="Beneficiary / المستفيد" req><Input value={form.beneficiary} onChange={(e) => set('beneficiary', e.target.value)} required /></F>
          <F label="Amount" req>
            <Input type="number" min="1" dir="ltr" value={form.amount}
              onChange={(e) => set('amount', Number(e.target.value))} required /></F>
          <F label="Currency">
            <Select value={form.currency} onValueChange={(v) => set('currency', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {['IQD','USD','EUR'].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select></F>
          <F label="Issue date" req>
            <Input type="date" dir="ltr" value={form.issueDate} onChange={(e) => set('issueDate', e.target.value)} required /></F>
          <F label="Due date" req>
            <Input type="date" dir="ltr" value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} required /></F>
          <F label="Notes" full><Textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} /></F>
        </CardContent>
      </Card>
    </form>
  );
}

function F({ label, children, req, full }: { label: string; children: React.ReactNode; req?: boolean; full?: boolean }) {
  return (
    <div className={`space-y-1.5 ${full ? 'sm:col-span-2' : ''}`}>
      <Label>{label}{req && <span className="text-destructive"> *</span>}</Label>
      {children}
    </div>
  );
}

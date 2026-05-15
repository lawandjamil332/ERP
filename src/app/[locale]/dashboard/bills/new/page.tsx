'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import BigNumber from 'bignumber.js';

type SupplierLite = { id: string; nameAr: string; nameEn: string | null };
interface Line { description: string; quantity: number; unitPrice: number; taxRate: number; }
const EMPTY: Line = { description: '', quantity: 1, unitPrice: 0, taxRate: 0 };

export default function NewBillPage({ params }: { params: Promise<{ locale: string }> }) {
  const router = useRouter();
  const [locale, setLocale] = useState('ar');
  const [suppliers, setSuppliers] = useState<SupplierLite[]>([]);
  const [form, setForm] = useState({
    number: '', supplierId: '',
    date: new Date().toISOString().slice(0, 10),
    dueDate: '',
    currency: 'IQD', fxRate: 1,
    withholdingRate: 0,
    notes: '',
    postImmediately: false,
  });
  const [lines, setLines] = useState<Line[]>([{ ...EMPTY }]);
  const [err, setErr] = useState<string | null>(null); const [busy, setBusy] = useState(false);

  useEffect(() => {
    params.then(({ locale }) => setLocale(locale));
    fetch('/api/contacts?kind=SUPPLIER').then((r) => r.json()).then((j) => setSuppliers(j.data ?? []));
  }, [params]);

  const subtotal = lines.reduce((s, l) => s.plus(new BigNumber(l.quantity).times(l.unitPrice)), new BigNumber(0));
  const taxTotal = lines.reduce((s, l) => {
    const base = new BigNumber(l.quantity).times(l.unitPrice);
    return s.plus(base.times(l.taxRate));
  }, new BigNumber(0));
  const total = subtotal.plus(taxTotal);
  const wht = subtotal.times(form.withholdingRate);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const res = await fetch('/api/bills', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        ...form,
        date: new Date(form.date).toISOString(),
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : undefined,
        fxRate: Number(form.fxRate),
        withholdingRate: form.withholdingRate || undefined,
        lines: lines.map((l) => ({ ...l, quantity: Number(l.quantity), unitPrice: Number(l.unitPrice), taxRate: Number(l.taxRate) })),
      }),
    });
    setBusy(false);
    if (res.ok) { router.push(`/${locale}/dashboard/bills`); router.refresh(); }
    else setErr((await res.json().catch(() => ({}))).error ?? 'Failed');
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">New bill / فاتورة مورد</h1>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={busy || !form.supplierId || !form.number}>Save</Button>
        </div>
      </div>
      {err && <div className="rounded-md border border-destructive bg-destructive/5 p-3 text-sm text-destructive">{err}</div>}

      <Card>
        <CardHeader><CardTitle>Bill details</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5"><Label>Bill #</Label>
            <Input value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} required /></div>
          <div className="space-y-1.5"><Label>Supplier</Label>
            <Select value={form.supplierId} onValueChange={(v) => setForm({ ...form, supplierId: v })}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{locale === 'ar' ? s.nameAr : (s.nameEn ?? s.nameAr)}</SelectItem>
                ))}
              </SelectContent>
            </Select></div>
          <div className="space-y-1.5"><Label>Date</Label>
            <Input type="date" dir="ltr" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required /></div>
          <div className="space-y-1.5"><Label>Due date</Label>
            <Input type="date" dir="ltr" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Currency</Label>
            <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{['IQD','USD','EUR','TRY','AED'].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select></div>
          <div className="space-y-1.5"><Label>WHT rate (0.15 = 15% non-resident)</Label>
            <Input type="number" step="0.01" min="0" max="1" dir="ltr" value={form.withholdingRate}
              onChange={(e) => setForm({ ...form, withholdingRate: Number(e.target.value) })} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Lines</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={() => setLines([...lines, { ...EMPTY }])}>
              <Plus className="h-4 w-4" /> Add line
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {lines.map((l, i) => (
            <div key={i} className="grid items-end gap-2 rounded-md border p-3 sm:grid-cols-6">
              <div className="sm:col-span-2 space-y-1.5"><Label>Description</Label>
                <Input value={l.description} onChange={(e) => setLines(lines.map((x, idx) => idx === i ? { ...x, description: e.target.value } : x))} required /></div>
              <div className="space-y-1.5"><Label>Qty</Label>
                <Input type="number" step="0.01" dir="ltr" value={l.quantity}
                  onChange={(e) => setLines(lines.map((x, idx) => idx === i ? { ...x, quantity: Number(e.target.value) } : x))} required /></div>
              <div className="space-y-1.5"><Label>Unit price</Label>
                <Input type="number" step="0.01" dir="ltr" value={l.unitPrice}
                  onChange={(e) => setLines(lines.map((x, idx) => idx === i ? { ...x, unitPrice: Number(e.target.value) } : x))} required /></div>
              <div className="space-y-1.5"><Label>Tax</Label>
                <Input type="number" step="0.01" min="0" max="1" dir="ltr" value={l.taxRate}
                  onChange={(e) => setLines(lines.map((x, idx) => idx === i ? { ...x, taxRate: Number(e.target.value) } : x))} /></div>
              <Button type="button" variant="ghost" size="sm" onClick={() => setLines(lines.filter((_, idx) => idx !== i))}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-2 p-6 text-sm sm:grid-cols-4">
          <div className="flex justify-between"><span>Subtotal</span><span className="tabular-nums">{subtotal.toFixed(0)} {form.currency}</span></div>
          <div className="flex justify-between"><span>Tax</span><span className="tabular-nums">{taxTotal.toFixed(0)} {form.currency}</span></div>
          <div className="flex justify-between"><span>WHT</span><span className="tabular-nums">{wht.toFixed(0)} {form.currency}</span></div>
          <div className="flex justify-between font-semibold"><span>Total</span><span className="tabular-nums">{total.toFixed(0)} {form.currency}</span></div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.postImmediately}
              onChange={(e) => setForm({ ...form, postImmediately: e.target.checked })} />
            Post journal entries immediately
          </label>
        </CardContent>
      </Card>
    </form>
  );
}

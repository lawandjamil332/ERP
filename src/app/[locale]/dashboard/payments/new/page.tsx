'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type ContactLite = { id: string; nameAr: string; nameEn: string | null };

export default function NewPaymentPage({ params }: { params: Promise<{ locale: string }> }) {
  const router = useRouter();
  const [locale, setLocale] = useState('ar');
  const [contacts, setContacts] = useState<ContactLite[]>([]);
  const [form, setForm] = useState({
    number: '', direction: 'IN' as 'IN' | 'OUT',
    method: 'CASH' as 'CASH'|'BANK_TRANSFER'|'CHEQUE'|'CARD'|'ZAIN_CASH'|'ASIA_HAWALA'|'FIB'|'OTHER',
    contactId: '', date: new Date().toISOString().slice(0, 10),
    currency: 'IQD', amount: 0, reference: '', notes: '',
    cashAccountCode: '1111',
  });
  const [err, setErr] = useState<string | null>(null); const [busy, setBusy] = useState(false);

  useEffect(() => {
    params.then(({ locale }) => setLocale(locale));
    fetch('/api/contacts').then((r) => r.json()).then((j) => setContacts(j.data ?? []));
  }, [params]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const res = await fetch('/api/payments', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...form, amount: Number(form.amount), date: new Date(form.date).toISOString() }),
    });
    setBusy(false);
    if (res.ok) { router.push(`/${locale}/dashboard/payments`); router.refresh(); }
    else setErr((await res.json().catch(() => ({}))).error ?? 'Failed');
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">New payment / دفعة جديدة</h1>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={busy || !form.contactId || !form.number || !form.amount}>Save</Button>
        </div>
      </div>
      {err && <div className="rounded-md border border-destructive bg-destructive/5 p-3 text-sm text-destructive">{err}</div>}
      <Card>
        <CardHeader><CardTitle>Details</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5"><Label>Payment #</Label>
            <Input value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} required /></div>
          <div className="space-y-1.5"><Label>Direction</Label>
            <Select value={form.direction} onValueChange={(v) => setForm({ ...form, direction: v as any })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="IN">IN - Receive from customer</SelectItem>
                <SelectItem value="OUT">OUT - Pay supplier</SelectItem>
              </SelectContent>
            </Select></div>
          <div className="space-y-1.5"><Label>Method</Label>
            <Select value={form.method} onValueChange={(v) => setForm({ ...form, method: v as any })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {['CASH','BANK_TRANSFER','CHEQUE','CARD','ZAIN_CASH','ASIA_HAWALA','FIB','OTHER'].map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select></div>
          <div className="space-y-1.5"><Label>Contact</Label>
            <Select value={form.contactId} onValueChange={(v) => setForm({ ...form, contactId: v })}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                {contacts.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{locale === 'ar' ? c.nameAr : (c.nameEn ?? c.nameAr)}</SelectItem>
                ))}
              </SelectContent>
            </Select></div>
          <div className="space-y-1.5"><Label>Date</Label>
            <Input type="date" dir="ltr" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required /></div>
          <div className="space-y-1.5"><Label>Currency</Label>
            <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{['IQD','USD','EUR'].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select></div>
          <div className="space-y-1.5"><Label>Amount</Label>
            <Input type="number" min="1" step="100" dir="ltr" value={form.amount}
              onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} required /></div>
          <div className="space-y-1.5"><Label>Cash/Bank account</Label>
            <Select value={form.cashAccountCode} onValueChange={(v) => setForm({ ...form, cashAccountCode: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1111">1111 - Cash (IQD)</SelectItem>
                <SelectItem value="1112">1112 - Cash (USD)</SelectItem>
                <SelectItem value="1113">1113 - Bank (IQD)</SelectItem>
                <SelectItem value="1114">1114 - Bank (USD)</SelectItem>
                <SelectItem value="1115">1115 - Mobile wallets (Zain Cash, FIB)</SelectItem>
              </SelectContent>
            </Select></div>
          <div className="space-y-1.5"><Label>Reference</Label>
            <Input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} /></div>
        </CardContent>
      </Card>
    </form>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const IRAQI_GOVERNORATES = [
  'Baghdad','Basra','Nineveh','Erbil','Sulaymaniyah','Dohuk','Halabja',
  'Kirkuk','Anbar','Babil','Karbala','Najaf','Wasit','Diyala','Maysan',
  'Muthanna','Qadisiyyah','Salah al-Din','Dhi Qar',
];

export default function NewContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const router = useRouter();
  const [locale, setLocale] = useState('ar');
  const [form, setForm] = useState({
    kind: 'CUSTOMER' as 'CUSTOMER' | 'SUPPLIER' | 'BOTH',
    nameAr: '', nameEn: '', taxNumber: '', commercialReg: '',
    phone: '', email: '', addressAr: '', addressEn: '',
    governorate: 'Baghdad', currency: 'IQD', creditLimit: 0, notes: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { params.then(({ locale }) => setLocale(locale)); }, [params]);

  const set = (k: keyof typeof form) => (v: string | number) => setForm({ ...form, [k]: v });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch('/api/contacts', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...form, creditLimit: Number(form.creditLimit) }),
    });
    setSubmitting(false);
    if (res.ok) {
      router.push(`/${locale}/dashboard/contacts`);
      router.refresh();
    } else {
      const b = await res.json().catch(() => ({}));
      setError(b.error ?? 'Failed');
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">New contact / جهة جديدة</h1>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={submitting || !form.nameAr}>Save</Button>
        </div>
      </div>
      {error && <div className="rounded-md border border-destructive bg-destructive/5 p-3 text-sm text-destructive">{error}</div>}
      <Card>
        <CardHeader><CardTitle>Identity / الهوية</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Kind"><Select value={form.kind} onValueChange={(v) => set('kind')(v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="CUSTOMER">Customer / عميل</SelectItem>
              <SelectItem value="SUPPLIER">Supplier / مورد</SelectItem>
              <SelectItem value="BOTH">Both / كلاهما</SelectItem>
            </SelectContent></Select></Field>
          <Field label="Default currency"><Select value={form.currency} onValueChange={(v) => set('currency')(v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {['IQD','USD','EUR','TRY','AED','SAR','JOD','KWD','GBP','CNY'].map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent></Select></Field>
          <Field label="Arabic name / الاسم بالعربية" required>
            <Input dir="rtl" value={form.nameAr} onChange={(e) => set('nameAr')(e.target.value)} required /></Field>
          <Field label="English name / Name (EN)">
            <Input dir="ltr" value={form.nameEn} onChange={(e) => set('nameEn')(e.target.value)} /></Field>
          <Field label="Tax number / الرقم الضريبي">
            <Input dir="ltr" value={form.taxNumber} onChange={(e) => set('taxNumber')(e.target.value)} /></Field>
          <Field label="Commercial registration / السجل التجاري">
            <Input dir="ltr" value={form.commercialReg} onChange={(e) => set('commercialReg')(e.target.value)} /></Field>
          <Field label="Phone"><Input dir="ltr" value={form.phone} onChange={(e) => set('phone')(e.target.value)} /></Field>
          <Field label="Email"><Input type="email" dir="ltr" value={form.email} onChange={(e) => set('email')(e.target.value)} /></Field>
          <Field label="Governorate / المحافظة"><Select value={form.governorate} onValueChange={(v) => set('governorate')(v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {IRAQI_GOVERNORATES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
            </SelectContent></Select></Field>
          <Field label="Credit limit (IQD)">
            <Input type="number" min="0" step="100000" dir="ltr"
              value={form.creditLimit} onChange={(e) => set('creditLimit')(Number(e.target.value))} /></Field>
          <Field label="Address (Arabic)" className="sm:col-span-2">
            <Textarea dir="rtl" value={form.addressAr} onChange={(e) => set('addressAr')(e.target.value)} /></Field>
          <Field label="Notes" className="sm:col-span-2">
            <Textarea value={form.notes} onChange={(e) => set('notes')(e.target.value)} /></Field>
        </CardContent>
      </Card>
    </form>
  );
}

function Field({ label, children, className, required }: {
  label: string; children: React.ReactNode; className?: string; required?: boolean;
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ''}`}>
      <Label>{label}{required && <span className="text-destructive"> *</span>}</Label>
      {children}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

export default function NewProductPage({ params }: { params: Promise<{ locale: string }> }) {
  const router = useRouter();
  const [locale, setLocale] = useState('ar');
  const [form, setForm] = useState({
    sku: '', barcode: '', nameAr: '', nameEn: '',
    descriptionAr: '', descriptionEn: '',
    hsCode: '', countryOfOrigin: 'IQ', trademark: '',
    unitOfMeasure: 'PCS', category: '', salePrice: 0, cost: 0,
    isService: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { params.then(({ locale }) => setLocale(locale)); }, [params]);

  const set = <K extends keyof typeof form>(k: K, v: typeof form[K]) => setForm({ ...form, [k]: v });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch('/api/products', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        ...form,
        salePrice: Number(form.salePrice),
        cost: Number(form.cost),
        hsCode: form.hsCode || undefined,
        countryOfOrigin: form.countryOfOrigin || undefined,
      }),
    });
    setSubmitting(false);
    if (res.ok) {
      router.push(`/${locale}/dashboard/inventory`);
      router.refresh();
    } else {
      const b = await res.json().catch(() => ({}));
      setError(b.issues ? JSON.stringify(b.issues) : (b.error ?? 'Failed'));
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">New product / منتج جديد</h1>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={submitting || !form.sku || !form.nameAr || !form.nameEn}>Save</Button>
        </div>
      </div>
      {error && <div className="rounded-md border border-destructive bg-destructive/5 p-3 text-sm text-destructive">{error}</div>}

      <Card>
        <CardHeader><CardTitle>Product details</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="SKU" required>
            <Input dir="ltr" value={form.sku} onChange={(e) => set('sku', e.target.value)} required /></Field>
          <Field label="Barcode"><Input dir="ltr" value={form.barcode} onChange={(e) => set('barcode', e.target.value)} /></Field>
          <Field label="Arabic name / الاسم" required>
            <Input dir="rtl" value={form.nameAr} onChange={(e) => set('nameAr', e.target.value)} required /></Field>
          <Field label="English name" required>
            <Input dir="ltr" value={form.nameEn} onChange={(e) => set('nameEn', e.target.value)} required /></Field>
          <Field label="HS code (>=6 digits) - required for cross-border">
            <Input dir="ltr" pattern="\d{6,}" placeholder="100199" value={form.hsCode}
              onChange={(e) => set('hsCode', e.target.value)} /></Field>
          <Field label="Country of origin (ISO 3166-1 alpha-2)">
            <Input dir="ltr" maxLength={2} value={form.countryOfOrigin}
              onChange={(e) => set('countryOfOrigin', e.target.value.toUpperCase())} /></Field>
          <Field label="Trademark / brand"><Input value={form.trademark} onChange={(e) => set('trademark', e.target.value)} /></Field>
          <Field label="Unit of measure"><Input value={form.unitOfMeasure} onChange={(e) => set('unitOfMeasure', e.target.value)} /></Field>
          <Field label="Category"><Input value={form.category} onChange={(e) => set('category', e.target.value)} /></Field>
          <Field label="Sale price (IQD)">
            <Input type="number" min="0" step="100" dir="ltr"
              value={form.salePrice} onChange={(e) => set('salePrice', Number(e.target.value))} /></Field>
          <Field label="Cost (IQD)">
            <Input type="number" min="0" step="100" dir="ltr"
              value={form.cost} onChange={(e) => set('cost', Number(e.target.value))} /></Field>
          <Field label="Description (Arabic)" className="sm:col-span-2">
            <Textarea dir="rtl" value={form.descriptionAr} onChange={(e) => set('descriptionAr', e.target.value)} /></Field>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" checked={form.isService} onChange={(e) => set('isService', e.target.checked)} />
            This is a service (no stock tracking)
          </label>
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

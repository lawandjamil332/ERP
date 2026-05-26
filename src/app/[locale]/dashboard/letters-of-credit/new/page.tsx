'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/ui/page-header';
import { toast } from '@/lib/toast';
import { tri } from '@/lib/i18n/tri';

const today = () => new Date().toISOString().slice(0, 10);

export default function NewLcPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    lcNumber: '',
    issuingBank: '',
    advisingBank: '',
    beneficiary: '',
    beneficiaryCountry: '',
    applicant: '',
    currency: 'USD',
    amount: '0',
    issueDate: today(),
    expiryDate: '',
    lastShipmentDate: '',
    incoterms: 'CIF',
    cbiWindowDate: '',
    notes: '',
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch('/api/letters-of-credit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...form,
          amount: parseFloat(form.amount),
          advisingBank: form.advisingBank || undefined,
          beneficiaryCountry: form.beneficiaryCountry || undefined,
          lastShipmentDate: form.lastShipmentDate || undefined,
          incoterms: form.incoterms || undefined,
          cbiWindowDate: form.cbiWindowDate || undefined,
          notes: form.notes || undefined,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? `HTTP ${res.status}`);
        return;
      }
      toast.success(t('common.save'));
      router.push(`/${locale}/dashboard/letters-of-credit`);
    } catch (e: any) {
      setError(e?.message ?? t('common.errors.network'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title={tri(locale, { ar: 'فتح اعتماد مستندي جديد', ku: 'کردنەوەی خشتەی متمانەی نوێ', en: 'Open new letter of credit' })} />

      <form onSubmit={submit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>{tri(locale, { ar: 'تفاصيل الاعتماد', ku: 'وردەکارییەکانی متمانە', en: 'LC details' })}</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label={tri(locale, { ar: 'رقم الاعتماد', ku: 'ژمارەی متمانە', en: 'LC number' })} req>
              <Input dir="ltr" value={form.lcNumber} onChange={(e) => setForm({ ...form, lcNumber: e.target.value })} required />
            </Field>
            <Field label={tri(locale, { ar: 'مقدم الطلب', ku: 'داواکار', en: 'Applicant' })} req>
              <Input value={form.applicant} onChange={(e) => setForm({ ...form, applicant: e.target.value })} required />
            </Field>
            <Field label={tri(locale, { ar: 'البنك المُصدِر', ku: 'بانکی دەرکەر', en: 'Issuing bank' })} req>
              <Input value={form.issuingBank} onChange={(e) => setForm({ ...form, issuingBank: e.target.value })} required />
            </Field>
            <Field label={tri(locale, { ar: 'البنك المُبلّغ', ku: 'بانکی ئاگادارکەرەوە', en: 'Advising bank' })}>
              <Input value={form.advisingBank} onChange={(e) => setForm({ ...form, advisingBank: e.target.value })} />
            </Field>
            <Field label={tri(locale, { ar: 'المستفيد', ku: 'سوودمەند', en: 'Beneficiary' })} req>
              <Input value={form.beneficiary} onChange={(e) => setForm({ ...form, beneficiary: e.target.value })} required />
            </Field>
            <Field label={tri(locale, { ar: 'بلد المستفيد', ku: 'وڵاتی سوودمەند', en: 'Beneficiary country' })}>
              <Input value={form.beneficiaryCountry} onChange={(e) => setForm({ ...form, beneficiaryCountry: e.target.value })} placeholder="CN, TR, AE…" />
            </Field>
            <Field label={t('invoice.currency')}>
              <Input dir="ltr" maxLength={3} value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })} />
            </Field>
            <Field label={tri(locale, { ar: 'القيمة', ku: 'بڕ', en: 'Amount' })} req>
              <Input type="number" step="0.01" dir="ltr" value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
            </Field>
            <Field label={tri(locale, { ar: 'تاريخ الإصدار', ku: 'بەرواری دەرکردن', en: 'Issue date' })} req>
              <Input type="date" dir="ltr" value={form.issueDate}
                onChange={(e) => setForm({ ...form, issueDate: e.target.value })} required />
            </Field>
            <Field label={tri(locale, { ar: 'تاريخ الانتهاء', ku: 'بەرواری بەسەرچوون', en: 'Expiry date' })} req>
              <Input type="date" dir="ltr" value={form.expiryDate}
                onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} required />
            </Field>
            <Field label={tri(locale, { ar: 'آخر تاريخ للشحن', ku: 'دوایین بەرواری بارکردن', en: 'Last shipment date' })}>
              <Input type="date" dir="ltr" value={form.lastShipmentDate}
                onChange={(e) => setForm({ ...form, lastShipmentDate: e.target.value })} />
            </Field>
            <Field label="Incoterms">
              <Input dir="ltr" value={form.incoterms}
                onChange={(e) => setForm({ ...form, incoterms: e.target.value })} placeholder="CIF / FOB / DAP" />
            </Field>
            <Field label={tri(locale, { ar: 'تاريخ مزاد CBI', ku: 'بەرواری مەزادی CBI', en: 'CBI window date' })}>
              <Input type="date" dir="ltr" value={form.cbiWindowDate}
                onChange={(e) => setForm({ ...form, cbiWindowDate: e.target.value })} />
            </Field>
            <Field label={t('invoice.notes')}>
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </Field>
          </CardContent>
        </Card>

        {error && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => router.back()}>{t('common.cancel')}</Button>
          <Button type="submit" disabled={busy}>{busy ? t('common.saving') : t('common.save')}</Button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children, req }: { label: string; children: React.ReactNode; req?: boolean }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}{req && <span className="text-destructive"> *</span>}</Label>
      {children}
    </div>
  );
}

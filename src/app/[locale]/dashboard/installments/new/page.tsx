'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { PageHeader } from '@/components/ui/page-header';
import { toast } from '@/lib/toast';
import { tri } from '@/lib/i18n/tri';

interface Contact { id: string; nameAr: string; nameEn: string | null }

const today = () => new Date().toISOString().slice(0, 10);

export default function NewInstallmentPlanPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    contactId: '',
    productSummary: '',
    totalAmount: '0',
    downPayment: '0',
    numberOfInstallments: '12',
    interestRatePct: '0',
    startDate: today(),
    currency: 'IQD',
    guarantorName: '',
    guarantorPhone: '',
    guarantorId: '',
    notes: '',
  });

  useEffect(() => {
    fetch('/api/contacts').then((r) => r.ok ? r.json() : { data: [] })
      .then((b) => setContacts((b.data ?? []).filter((c: any) => c.isActive !== false)));
  }, []);

  // Live preview
  const preview = useMemo(() => {
    const total = parseFloat(form.totalAmount) || 0;
    const down = parseFloat(form.downPayment) || 0;
    const n = Math.max(1, parseInt(form.numberOfInstallments, 10) || 1);
    const rate = parseFloat(form.interestRatePct) || 0;
    const financed = Math.max(0, total - down);
    const interest = financed * rate;
    const repayable = financed + interest;
    const perInstallment = Math.round(repayable / n);
    return { financed, interest, repayable, perInstallment, n };
  }, [form.totalAmount, form.downPayment, form.numberOfInstallments, form.interestRatePct]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.contactId) { setError(tri(locale, { ar: 'العميل مطلوب', ku: 'کڕیار پێویستە', en: 'Customer required' })); return; }
    if (preview.financed <= 0) { setError(tri(locale, { ar: 'الدفعة المقدمة أكبر من السعر', ku: 'پێشەکی لە نرخی گشتی زیاترە', en: 'Down payment exceeds total' })); return; }
    setBusy(true);
    try {
      const res = await fetch('/api/installments', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          contactId: form.contactId,
          productSummary: form.productSummary,
          totalAmount: parseFloat(form.totalAmount),
          downPayment: parseFloat(form.downPayment),
          numberOfInstallments: parseInt(form.numberOfInstallments, 10),
          interestRatePct: parseFloat(form.interestRatePct),
          startDate: form.startDate,
          currency: form.currency,
          guarantorName: form.guarantorName || undefined,
          guarantorPhone: form.guarantorPhone || undefined,
          guarantorId: form.guarantorId || undefined,
          notes: form.notes || undefined,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? `HTTP ${res.status}`);
        return;
      }
      toast.success(t('common.save'));
      router.push(`/${locale}/dashboard/installments`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title={tri(locale, { ar: 'خطة تقسيط جديدة', ku: 'پلانی قیستی نوێ', en: 'New installment plan' })} />

      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>{tri(locale, { ar: 'البيانات الأساسية', ku: 'زانیارییە سەرەکییەکان', en: 'Plan details' })}</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Fld label={tri(locale, { ar: 'العميل', ku: 'کڕیار', en: 'Customer' })} req>
                <Select value={form.contactId} onValueChange={(v) => setForm({ ...form, contactId: v })}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    {contacts.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {tri(locale, { ar: c.nameAr, ku: c.nameEn ?? c.nameAr, en: c.nameEn ?? c.nameAr })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Fld>
              <Fld label={tri(locale, { ar: 'وصف المنتج', ku: 'پوختەی کاڵا', en: 'Product summary' })} req>
                <Input value={form.productSummary} onChange={(e) => setForm({ ...form, productSummary: e.target.value })}
                  placeholder={tri(locale, { ar: 'مثال: iPhone 17 Pro Max 256GB', ku: 'نموونە: iPhone 17 Pro Max 256GB', en: 'e.g. iPhone 17 Pro Max 256GB' })} required />
              </Fld>
              <Fld label={tri(locale, { ar: 'السعر الإجمالي', ku: 'نرخی گشتی', en: 'Total price' })} req>
                <Input type="number" step="1000" dir="ltr" value={form.totalAmount}
                  onChange={(e) => setForm({ ...form, totalAmount: e.target.value })} required />
              </Fld>
              <Fld label={tri(locale, { ar: 'الدفعة المقدمة', ku: 'پێشەکی', en: 'Down payment' })}>
                <Input type="number" step="1000" dir="ltr" value={form.downPayment}
                  onChange={(e) => setForm({ ...form, downPayment: e.target.value })} />
              </Fld>
              <Fld label={tri(locale, { ar: 'عدد الأقساط', ku: 'ژمارەی قیستەکان', en: 'Number of installments' })} req>
                <Input type="number" min={1} max={60} dir="ltr" value={form.numberOfInstallments}
                  onChange={(e) => setForm({ ...form, numberOfInstallments: e.target.value })} required />
              </Fld>
              <Fld label={tri(locale, { ar: 'نسبة الفائدة الكلية', ku: 'ڕێژەی سوودی گشتی', en: 'Total interest rate' })}>
                <Input type="number" step="0.01" min={0} max={1} dir="ltr" value={form.interestRatePct}
                  onChange={(e) => setForm({ ...form, interestRatePct: e.target.value })}
                  placeholder="0.10 = 10%" />
              </Fld>
              <Fld label={tri(locale, { ar: 'تاريخ البدء', ku: 'بەرواری دەستپێک', en: 'Start date' })} req>
                <Input type="date" dir="ltr" value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
              </Fld>
              <Fld label={tri(locale, { ar: 'العملة', ku: 'دراو', en: 'Currency' })}>
                <Input dir="ltr" maxLength={3} value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })} />
              </Fld>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{tri(locale, { ar: 'الضامن (اختياري)', ku: 'کەفیل (ئارەزوومەندانە)', en: 'Guarantor (optional)' })}</CardTitle>
              <CardDescription>
                {tri(locale, { ar: 'مطلوب لأغلب عمليات التقسيط في السوق العراقي', ku: 'بۆ زۆربەی مامەڵەکانی قیست لە بازاڕی عێراقی پێویستە', en: 'Required by most Iraqi installment vendors' })}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <Fld label={tri(locale, { ar: 'الاسم', ku: 'ناو', en: 'Name' })}>
                <Input value={form.guarantorName} onChange={(e) => setForm({ ...form, guarantorName: e.target.value })} />
              </Fld>
              <Fld label={tri(locale, { ar: 'الهاتف', ku: 'تەلەفۆن', en: 'Phone' })}>
                <Input dir="ltr" value={form.guarantorPhone} onChange={(e) => setForm({ ...form, guarantorPhone: e.target.value })} />
              </Fld>
              <Fld label={tri(locale, { ar: 'رقم البطاقة الموحدة', ku: 'ژمارەی کارتی نیشتمانی', en: 'National ID' })}>
                <Input dir="ltr" value={form.guarantorId} onChange={(e) => setForm({ ...form, guarantorId: e.target.value })} />
              </Fld>
            </CardContent>
          </Card>

          {error && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => router.back()}>{t('common.cancel')}</Button>
            <Button type="submit" disabled={busy}>{busy ? t('common.saving') : t('common.save')}</Button>
          </div>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>{tri(locale, { ar: 'معاينة الخطة', ku: 'پێشبینینی پلان', en: 'Plan preview' })}</CardTitle>
            <CardDescription>{tri(locale, { ar: 'الأرقام تتحدّث تلقائياً', ku: 'ژمارەکان بە شێوەی ئۆتۆماتیکی نوێ دەبنەوە', en: 'Live calculation' })}</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2 text-sm">
              <Row label={tri(locale, { ar: 'المبلغ المُموّل', ku: 'بڕی دارایی کراو', en: 'Financed amount' })} value={`${preview.financed.toLocaleString(locale === 'ar' ? 'ar-IQ' : locale === 'ku' ? 'ckb-IQ' : 'en')} ${form.currency}`} />
              <Row label={tri(locale, { ar: 'الفائدة الكلية', ku: 'سوودی گشتی', en: 'Total interest' })} value={`${preview.interest.toLocaleString(locale === 'ar' ? 'ar-IQ' : locale === 'ku' ? 'ckb-IQ' : 'en')} ${form.currency}`} />
              <Row label={tri(locale, { ar: 'إجمالي السداد', ku: 'کۆی گشتی گەڕانەوە', en: 'Total repayable' })} value={`${preview.repayable.toLocaleString(locale === 'ar' ? 'ar-IQ' : locale === 'ku' ? 'ckb-IQ' : 'en')} ${form.currency}`} />
              <div className="rounded-md bg-primary/10 p-3">
                <p className="text-xs uppercase tracking-wide text-primary">{tri(locale, { ar: 'قسط شهري', ku: 'قیستی مانگانە', en: 'Monthly installment' })}</p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-primary">
                  {preview.perInstallment.toLocaleString(locale === 'ar' ? 'ar-IQ' : locale === 'ku' ? 'ckb-IQ' : 'en')} {form.currency}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {tri(locale, { ar: `لـ ${preview.n} شهر`, ku: `بۆ ${preview.n} مانگ`, en: `for ${preview.n} months` })}
                </p>
              </div>
            </dl>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

function Fld({ label, children, req }: { label: string; children: React.ReactNode; req?: boolean }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}{req && <span className="text-destructive"> *</span>}</Label>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b pb-1.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium tabular-nums">{value}</dd>
    </div>
  );
}

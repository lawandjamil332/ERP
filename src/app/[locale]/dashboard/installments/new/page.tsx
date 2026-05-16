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

interface Contact { id: string; nameAr: string; nameEn: string | null }

const today = () => new Date().toISOString().slice(0, 10);

export default function NewInstallmentPlanPage() {
  const t = useTranslations();
  const locale = useLocale();
  const isAr = locale === 'ar';
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
    if (!form.contactId) { setError(isAr ? 'العميل مطلوب' : 'Customer required'); return; }
    if (preview.financed <= 0) { setError(isAr ? 'الدفعة المقدمة أكبر من السعر' : 'Down payment exceeds total'); return; }
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
      <PageHeader title={isAr ? 'خطة تقسيط جديدة' : 'New installment plan'} />

      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>{isAr ? 'البيانات الأساسية' : 'Plan details'}</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Fld label={isAr ? 'العميل' : 'Customer'} req>
                <Select value={form.contactId} onValueChange={(v) => setForm({ ...form, contactId: v })}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    {contacts.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {isAr ? c.nameAr : (c.nameEn ?? c.nameAr)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Fld>
              <Fld label={isAr ? 'وصف المنتج' : 'Product summary'} req>
                <Input value={form.productSummary} onChange={(e) => setForm({ ...form, productSummary: e.target.value })}
                  placeholder={isAr ? 'مثال: iPhone 17 Pro Max 256GB' : 'e.g. iPhone 17 Pro Max 256GB'} required />
              </Fld>
              <Fld label={isAr ? 'السعر الإجمالي' : 'Total price'} req>
                <Input type="number" step="1000" dir="ltr" value={form.totalAmount}
                  onChange={(e) => setForm({ ...form, totalAmount: e.target.value })} required />
              </Fld>
              <Fld label={isAr ? 'الدفعة المقدمة' : 'Down payment'}>
                <Input type="number" step="1000" dir="ltr" value={form.downPayment}
                  onChange={(e) => setForm({ ...form, downPayment: e.target.value })} />
              </Fld>
              <Fld label={isAr ? 'عدد الأقساط' : 'Number of installments'} req>
                <Input type="number" min={1} max={60} dir="ltr" value={form.numberOfInstallments}
                  onChange={(e) => setForm({ ...form, numberOfInstallments: e.target.value })} required />
              </Fld>
              <Fld label={isAr ? 'نسبة الفائدة الكلية' : 'Total interest rate'}>
                <Input type="number" step="0.01" min={0} max={1} dir="ltr" value={form.interestRatePct}
                  onChange={(e) => setForm({ ...form, interestRatePct: e.target.value })}
                  placeholder="0.10 = 10%" />
              </Fld>
              <Fld label={isAr ? 'تاريخ البدء' : 'Start date'} req>
                <Input type="date" dir="ltr" value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
              </Fld>
              <Fld label={isAr ? 'العملة' : 'Currency'}>
                <Input dir="ltr" maxLength={3} value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })} />
              </Fld>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{isAr ? 'الضامن (اختياري)' : 'Guarantor (optional)'}</CardTitle>
              <CardDescription>
                {isAr ? 'مطلوب لأغلب عمليات التقسيط في السوق العراقي' : 'Required by most Iraqi installment vendors'}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <Fld label={isAr ? 'الاسم' : 'Name'}>
                <Input value={form.guarantorName} onChange={(e) => setForm({ ...form, guarantorName: e.target.value })} />
              </Fld>
              <Fld label={isAr ? 'الهاتف' : 'Phone'}>
                <Input dir="ltr" value={form.guarantorPhone} onChange={(e) => setForm({ ...form, guarantorPhone: e.target.value })} />
              </Fld>
              <Fld label={isAr ? 'رقم البطاقة الموحدة' : 'National ID'}>
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
            <CardTitle>{isAr ? 'معاينة الخطة' : 'Plan preview'}</CardTitle>
            <CardDescription>{isAr ? 'الأرقام تتحدّث تلقائياً' : 'Live calculation'}</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2 text-sm">
              <Row label={isAr ? 'المبلغ المُموّل' : 'Financed amount'} value={`${preview.financed.toLocaleString(isAr ? 'ar-IQ' : 'en')} ${form.currency}`} />
              <Row label={isAr ? 'الفائدة الكلية' : 'Total interest'} value={`${preview.interest.toLocaleString(isAr ? 'ar-IQ' : 'en')} ${form.currency}`} />
              <Row label={isAr ? 'إجمالي السداد' : 'Total repayable'} value={`${preview.repayable.toLocaleString(isAr ? 'ar-IQ' : 'en')} ${form.currency}`} />
              <div className="rounded-md bg-primary/10 p-3">
                <p className="text-xs uppercase tracking-wide text-primary">{isAr ? 'قسط شهري' : 'Monthly installment'}</p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-primary">
                  {preview.perInstallment.toLocaleString(isAr ? 'ar-IQ' : 'en')} {form.currency}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {isAr ? `لـ ${preview.n} شهر` : `for ${preview.n} months`}
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

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/ui/page-header';
import { Plus, Trash2, Save } from 'lucide-react';
import BigNumber from 'bignumber.js';
import { toast } from '@/lib/toast';
import { tri } from '@/lib/i18n/tri';

type ContactLite = { id: string; nameAr: string; nameEn: string | null; currency: string };
type ProductLite = {
  id: string; sku: string; nameAr: string; nameEn: string;
  unitOfMeasure: string; salePrice: string | number;
};

interface Line {
  productId?: string;
  description: string;
  quantity: number;
  unitOfMeasure: string;
  unitPrice: number;
  discount: number;
  taxRate: number;
}

const EMPTY_LINE: Line = {
  description: '', quantity: 1, unitOfMeasure: 'PCS', unitPrice: 0, discount: 0, taxRate: 0,
};

export default function NewQuotationPage() {
  const router = useRouter();
  const locale = useLocale();
  const [contacts, setContacts] = useState<ContactLite[]>([]);
  const [products, setProducts] = useState<ProductLite[]>([]);
  const [contactId, setContactId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [validUntil, setValidUntil] = useState('');
  const [currency, setCurrency] = useState('IQD');
  const [fxRate, setFxRate] = useState(1);
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<Line[]>([{ ...EMPTY_LINE }]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/contacts?kind=CUSTOMER').then((r) => r.json()).then((j) => setContacts(j.data ?? []));
    fetch('/api/products').then((r) => r.json()).then((j) => setProducts(j.data ?? []));
  }, []);

  function updateLine(i: number, patch: Partial<Line>) {
    setLines((cur) => cur.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }
  function addLine() { setLines((cur) => [...cur, { ...EMPTY_LINE }]); }
  function removeLine(i: number) { setLines((cur) => cur.filter((_, idx) => idx !== i)); }

  function pickProduct(i: number, productId: string) {
    const p = products.find((pp) => pp.id === productId);
    if (!p) return;
    updateLine(i, {
      productId,
      description: tri(locale, { ar: p.nameAr, ku: p.nameEn ?? p.nameAr, en: p.nameEn ?? p.nameAr }),
      unitOfMeasure: p.unitOfMeasure,
      unitPrice: Number(p.salePrice),
    });
  }

  const subtotal = lines.reduce(
    (s, l) => s.plus(new BigNumber(l.quantity).times(l.unitPrice).minus(l.discount)),
    new BigNumber(0)
  );
  const taxTotal = lines.reduce((s, l) => {
    const base = new BigNumber(l.quantity).times(l.unitPrice).minus(l.discount);
    return s.plus(base.times(l.taxRate));
  }, new BigNumber(0));
  const total = subtotal.plus(taxTotal);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const res = await fetch('/api/quotations', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        contactId, currency, fxRate,
        date: new Date(date).toISOString(),
        validUntil: validUntil ? new Date(validUntil).toISOString() : undefined,
        notes: notes || undefined,
        lines: lines.map((l) => ({
          ...l,
          quantity: Number(l.quantity),
          unitPrice: Number(l.unitPrice),
          discount: Number(l.discount),
          taxRate: Number(l.taxRate),
        })),
      }),
    });
    setSubmitting(false);
    if (res.ok) {
      toast.success(tri(locale, { ar: 'تم إنشاء عرض السعر', ku: 'وەسڵی نرخدانان دروستکرا', en: 'Quotation created' }));
      router.push(`/${locale}/dashboard/quotations`);
      router.refresh();
    } else {
      const body = await res.json().catch(() => ({}));
      toast.error(body.error ?? tri(locale, { ar: 'فشل الحفظ', ku: 'پاشەکەوت نەکرا', en: 'Save failed' }));
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <PageHeader
        title={tri(locale, { ar: 'عرض سعر جديد', ku: 'وەسڵی نرخدانانی نوێ', en: 'New quotation' })}
        description={tri(locale, { ar: 'إصدار عرض سعر للعميل قبل الفاتورة', ku: 'دەرکردنی وەسڵی نرخدانان بۆ کڕیار پێش پسوڵە', en: 'Issue a price quote before invoicing' })}
        actions={
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              {tri(locale, { ar: 'إلغاء', ku: 'هەڵوەشاندنەوە', en: 'Cancel' })}
            </Button>
            <Button type="submit" disabled={submitting || !contactId || lines.length === 0}>
              <Save className="h-4 w-4" />
              {submitting ? tri(locale, { ar: 'جارٍ الحفظ…', ku: 'پاشەکەوت دەکرێت…', en: 'Saving…' }) : tri(locale, { ar: 'حفظ', ku: 'پاشەکەوتکردن', en: 'Save' })}
            </Button>
          </div>
        }
      />

      <Card>
        <CardHeader><CardTitle>{tri(locale, { ar: 'تفاصيل العرض', ku: 'وردەکارییەکانی وەسڵ', en: 'Quotation details' })}</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <Field label={tri(locale, { ar: 'العميل', ku: 'کڕیار', en: 'Customer' })}>
            <Select value={contactId} onValueChange={setContactId}>
              <SelectTrigger><SelectValue placeholder={tri(locale, { ar: 'اختر العميل…', ku: 'کڕیار هەڵبژێرە…', en: 'Select customer…' })} /></SelectTrigger>
              <SelectContent>
                {contacts.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {tri(locale, { ar: c.nameAr, ku: c.nameEn ?? c.nameAr, en: c.nameEn ?? c.nameAr })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label={tri(locale, { ar: 'العملة', ku: 'دراو', en: 'Currency' })}>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {['IQD','USD','EUR','TRY','AED','SAR','JOD','KWD','GBP','CNY'].map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label={tri(locale, { ar: 'سعر الصرف (إلى IQD)', ku: 'نرخی ئاڵوگۆڕ (بۆ IQD)', en: 'FX rate (to IQD)' })}>
            <Input type="number" step="0.0001" dir="ltr" value={fxRate}
              onChange={(e) => setFxRate(Number(e.target.value))} disabled={currency === 'IQD'} />
          </Field>
          <Field label={tri(locale, { ar: 'التاريخ', ku: 'بەروار', en: 'Date' })}>
            <Input type="date" dir="ltr" value={date} onChange={(e) => setDate(e.target.value)} required />
          </Field>
          <Field label={tri(locale, { ar: 'صالح حتى', ku: 'تا کاتی', en: 'Valid until' })}>
            <Input type="date" dir="ltr" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{tri(locale, { ar: 'البنود', ku: 'بڕگەکان', en: 'Lines' })}</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={addLine}>
            <Plus className="h-4 w-4" /> {tri(locale, { ar: 'إضافة بند', ku: 'زیادکردنی بڕگە', en: 'Add line' })}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {lines.map((l, i) => (
            <div key={i} className="rounded-md border p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium">{tri(locale, { ar: `بند ${i + 1}`, ku: `بڕگەی ${i + 1}`, en: `Line ${i + 1}` })}</span>
                {lines.length > 1 && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeLine(i)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-4">
                <Field label={tri(locale, { ar: 'المنتج (اختياري)', ku: 'بەرهەم (ئەختیاری)', en: 'Product (optional)' })}>
                  <Select value={l.productId ?? ''} onValueChange={(v) => pickProduct(i, v)}>
                    <SelectTrigger><SelectValue placeholder={tri(locale, { ar: 'اختر منتجاً…', ku: 'بەرهەم هەڵبژێرە…', en: 'Pick product…' })} /></SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.sku} — {tri(locale, { ar: p.nameAr, ku: p.nameEn ?? p.nameAr, en: p.nameEn ?? p.nameAr })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label={tri(locale, { ar: 'الوصف', ku: 'وەسف', en: 'Description' })} className="sm:col-span-3">
                  <Input value={l.description} onChange={(e) => updateLine(i, { description: e.target.value })} required />
                </Field>
                <Field label={tri(locale, { ar: 'الكمية', ku: 'بڕ', en: 'Quantity' })}>
                  <Input type="number" step="0.01" min="0.0001" dir="ltr" value={l.quantity}
                    onChange={(e) => updateLine(i, { quantity: Number(e.target.value) })} required />
                </Field>
                <Field label={tri(locale, { ar: 'وحدة القياس', ku: 'یەکەی پێوانە', en: 'UoM' })}>
                  <Input value={l.unitOfMeasure} onChange={(e) => updateLine(i, { unitOfMeasure: e.target.value })} />
                </Field>
                <Field label={tri(locale, { ar: 'سعر الوحدة', ku: 'نرخی یەکە', en: 'Unit price' })}>
                  <Input type="number" step="0.01" min="0" dir="ltr" value={l.unitPrice}
                    onChange={(e) => updateLine(i, { unitPrice: Number(e.target.value) })} required />
                </Field>
                <Field label={tri(locale, { ar: 'الخصم', ku: 'داشکاندن', en: 'Discount' })}>
                  <Input type="number" step="0.01" min="0" dir="ltr" value={l.discount}
                    onChange={(e) => updateLine(i, { discount: Number(e.target.value) })} />
                </Field>
                <Field label={tri(locale, { ar: 'نسبة الضريبة', ku: 'ڕێژەی باج', en: 'Tax rate' })}>
                  <Input type="number" step="0.01" min="0" max="1" dir="ltr" value={l.taxRate}
                    onChange={(e) => updateLine(i, { taxRate: Number(e.target.value) })} placeholder="0.10 = 10%" />
                </Field>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-2 p-6 text-sm sm:grid-cols-3">
          <div className="flex justify-between">
            <span>{tri(locale, { ar: 'المجموع الفرعي', ku: 'کۆی بنەڕەتی', en: 'Subtotal' })}</span>
            <span className="tabular-nums">{subtotal.toFixed(currency === 'IQD' ? 0 : 2)} {currency}</span>
          </div>
          <div className="flex justify-between">
            <span>{tri(locale, { ar: 'الضريبة', ku: 'باج', en: 'Tax' })}</span>
            <span className="tabular-nums">{taxTotal.toFixed(currency === 'IQD' ? 0 : 2)} {currency}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>{tri(locale, { ar: 'الإجمالي', ku: 'کۆی گشتی', en: 'Total' })}</span>
            <span className="tabular-nums">{total.toFixed(currency === 'IQD' ? 0 : 2)} {currency}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{tri(locale, { ar: 'ملاحظات', ku: 'تێبینییەکان', en: 'Notes' })}</CardTitle></CardHeader>
        <CardContent>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
        </CardContent>
      </Card>
    </form>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`space-y-1.5 ${className ?? ''}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

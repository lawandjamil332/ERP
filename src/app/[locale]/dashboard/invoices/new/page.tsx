'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2 } from 'lucide-react';
import BigNumber from 'bignumber.js';

type ContactLite = { id: string; nameAr: string; nameEn: string | null; currency: string };
type ProductLite = {
  id: string; sku: string; nameAr: string; nameEn: string;
  hsCode: string | null; countryOfOrigin: string | null; trademark: string | null;
  unitOfMeasure: string; salePrice: string | number;
};

interface Line {
  productId?: string;
  description: string;
  hsCode?: string;
  countryOfOrigin?: string;
  trademark?: string;
  quantity: number;
  unitOfMeasure: string;
  unitPrice: number;
  discount: number;
  taxRate: number;
}

const EMPTY_LINE: Line = {
  description: '', quantity: 1, unitOfMeasure: 'PCS', unitPrice: 0, discount: 0, taxRate: 0,
};

export default function NewInvoicePage({ params }: { params: Promise<{ locale: string }> }) {
  const router = useRouter();
  const t = useTranslations('invoice');
  const tCommon = useTranslations('common');
  const [locale, setLocale] = useState('ar');
  const [kind, setKind] = useState<'DOMESTIC_SALE' | 'EXPORT' | 'IMPORT'>('DOMESTIC_SALE');
  const [contactId, setContactId] = useState('');
  const [contacts, setContacts] = useState<ContactLite[]>([]);
  const [products, setProducts] = useState<ProductLite[]>([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState('');
  const [currency, setCurrency] = useState('IQD');
  const [fxRate, setFxRate] = useState(1);
  const [paymentTerms, setPaymentTerms] = useState('');
  const [shippingTerms, setShippingTerms] = useState('FOB');
  const [importerAddress, setImporterAddress] = useState('');
  const [exporterAddress, setExporterAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<Line[]>([{ ...EMPTY_LINE }]);
  const [postImmediately, setPostImmediately] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    params.then(({ locale }) => setLocale(locale));
    fetch('/api/contacts?kind=CUSTOMER').then((r) => r.json()).then((j) => setContacts(j.data ?? []));
    fetch('/api/products').then((r) => r.json()).then((j) => setProducts(j.data ?? []));
  }, [params]);

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
      description: locale === 'ar' ? p.nameAr : p.nameEn,
      hsCode: p.hsCode ?? undefined,
      countryOfOrigin: p.countryOfOrigin ?? undefined,
      trademark: p.trademark ?? undefined,
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
    setError(null);
    setSubmitting(true);

    const payload = {
      kind, contactId, currency, fxRate,
      date: new Date(date).toISOString(),
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      paymentTerms: paymentTerms || undefined,
      shippingTerms: kind !== 'DOMESTIC_SALE' ? shippingTerms : undefined,
      importerAddress: kind !== 'DOMESTIC_SALE' ? importerAddress : undefined,
      exporterAddress: kind !== 'DOMESTIC_SALE' ? exporterAddress : undefined,
      notes: notes || undefined,
      postImmediately,
      lines: lines.map((l) => ({
        ...l,
        quantity: Number(l.quantity),
        unitPrice: Number(l.unitPrice),
        discount: Number(l.discount),
        taxRate: Number(l.taxRate),
      })),
    };

    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setSubmitting(false);
    if (res.ok) {
      router.push(`/${locale}/dashboard/invoices`);
      router.refresh();
    } else {
      const body = await res.json().catch(() => ({}));
      if (body.error === 'iraq_compliance_failed' && Array.isArray(body.issues)) {
        setError(body.issues.map((i: any) => `${(i.path ?? []).join('.')}: ${i.message}`).join(' • '));
      } else {
        setError(body.error ?? 'Failed to create invoice');
      }
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('new')}</h1>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>{tCommon('cancel')}</Button>
          <Button type="submit" disabled={submitting || !contactId || lines.length === 0}>
            {submitting ? tCommon('loading') : tCommon('save')}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-destructive bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardHeader><CardTitle>{t('title')}</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <Field label="Kind">
            <Select value={kind} onValueChange={(v) => setKind(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="DOMESTIC_SALE">{t('kind.domesticSale')}</SelectItem>
                <SelectItem value="EXPORT">{t('kind.export')}</SelectItem>
                <SelectItem value="IMPORT">{t('kind.import')}</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label={t('customer')}>
            <Select value={contactId} onValueChange={setContactId}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                {contacts.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {locale === 'ar' ? c.nameAr : (c.nameEn ?? c.nameAr)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label={t('currency')}>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {['IQD','USD','EUR','TRY','AED','SAR','JOD','KWD','GBP','CNY'].map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label={t('date')}>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required dir="ltr" />
          </Field>
          <Field label={t('dueDate')}>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} dir="ltr" />
          </Field>
          <Field label="FX rate (to IQD)">
            <Input type="number" step="0.0001" value={fxRate}
              onChange={(e) => setFxRate(Number(e.target.value))} dir="ltr" disabled={currency === 'IQD'} />
          </Field>
        </CardContent>
      </Card>

      {kind !== 'DOMESTIC_SALE' && (
        <Card>
          <CardHeader>
            <CardTitle>Nov 2025 cross-border fields / حقول العبور الحدودي</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Shipping terms (Incoterms 2020)">
              <Select value={shippingTerms} onValueChange={setShippingTerms}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['EXW','FCA','CPT','CIP','DAP','DPU','DDP','FAS','FOB','CFR','CIF'].map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Payment terms">
              <Input value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} placeholder="Net 30 / Cash / L/C" />
            </Field>
            <Field label="Importer address / عنوان المستورد">
              <Textarea value={importerAddress} onChange={(e) => setImporterAddress(e.target.value)} />
            </Field>
            <Field label="Exporter address / عنوان المصدّر">
              <Textarea value={exporterAddress} onChange={(e) => setExporterAddress(e.target.value)} />
            </Field>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Lines</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addLine}>
              <Plus className="h-4 w-4" /> Add line
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {lines.map((l, i) => (
            <div key={i} className="rounded-md border p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium">Line {i + 1}</span>
                {lines.length > 1 && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeLine(i)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-4">
                <Field label="Product (optional)">
                  <Select value={l.productId ?? ''} onValueChange={(v) => pickProduct(i, v)}>
                    <SelectTrigger><SelectValue placeholder="Pick product…" /></SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.sku} — {locale === 'ar' ? p.nameAr : p.nameEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label={t('line.description')} className="sm:col-span-3">
                  <Input value={l.description} onChange={(e) => updateLine(i, { description: e.target.value })} required />
                </Field>
                {kind !== 'DOMESTIC_SALE' && (
                  <>
                    <Field label={t('line.hsCode')}>
                      <Input dir="ltr" value={l.hsCode ?? ''} onChange={(e) => updateLine(i, { hsCode: e.target.value })}
                        placeholder="100199" pattern="\d{6,}" />
                    </Field>
                    <Field label={t('line.countryOfOrigin')}>
                      <Input dir="ltr" value={l.countryOfOrigin ?? ''}
                        onChange={(e) => updateLine(i, { countryOfOrigin: e.target.value.toUpperCase() })}
                        placeholder="IQ" maxLength={2} />
                    </Field>
                    <Field label={t('line.trademark')}>
                      <Input value={l.trademark ?? ''} onChange={(e) => updateLine(i, { trademark: e.target.value })} />
                    </Field>
                    <div />
                  </>
                )}
                <Field label={t('line.qty')}>
                  <Input type="number" step="0.01" min="0.0001" value={l.quantity}
                    onChange={(e) => updateLine(i, { quantity: Number(e.target.value) })} dir="ltr" required />
                </Field>
                <Field label={t('line.uom')}>
                  <Input value={l.unitOfMeasure} onChange={(e) => updateLine(i, { unitOfMeasure: e.target.value })} />
                </Field>
                <Field label={t('line.unitPrice')}>
                  <Input type="number" step="0.01" min="0" value={l.unitPrice}
                    onChange={(e) => updateLine(i, { unitPrice: Number(e.target.value) })} dir="ltr" required />
                </Field>
                <Field label="Tax rate">
                  <Input type="number" step="0.01" min="0" max="1" value={l.taxRate}
                    onChange={(e) => updateLine(i, { taxRate: Number(e.target.value) })} dir="ltr" placeholder="0.10 = 10%" />
                </Field>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-2 p-6 text-sm sm:grid-cols-3">
          <div className="flex justify-between"><span>{t('subtotal')}</span><span className="tabular-nums">{subtotal.toFixed(currency === 'IQD' ? 0 : 2)} {currency}</span></div>
          <div className="flex justify-between"><span>{t('tax')}</span><span className="tabular-nums">{taxTotal.toFixed(currency === 'IQD' ? 0 : 2)} {currency}</span></div>
          <div className="flex justify-between font-semibold"><span>{t('total')}</span><span className="tabular-nums">{total.toFixed(currency === 'IQD' ? 0 : 2)} {currency}</span></div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-6">
          <Field label="Notes">
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={postImmediately} onChange={(e) => setPostImmediately(e.target.checked)} />
            Post journal entries immediately (otherwise save as draft)
          </label>
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

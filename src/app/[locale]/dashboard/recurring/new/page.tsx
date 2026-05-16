'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/lib/toast';
import { Plus, Trash2 } from 'lucide-react';

interface Contact { id: string; nameAr: string; nameEn: string | null }
interface Line { description: string; quantity: string; unitOfMeasure: string; unitPrice: string; taxRate: string }

const today = () => new Date().toISOString().slice(0, 10);

export default function NewRecurringTemplatePage() {
  const t = useTranslations('recurring');
  const tInv = useTranslations('invoice');
  const tc = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    contactId: '',
    cadence: 'MONTHLY' as 'DAILY'|'WEEKLY'|'MONTHLY'|'QUARTERLY'|'ANNUALLY',
    cadenceDay: '1',
    startDate: today(),
    endDate: '',
    autoPost: false,
    currency: 'IQD',
    fxRate: '1',
    paymentTerms: '',
    notes: '',
  });
  const [lines, setLines] = useState<Line[]>([
    { description: '', quantity: '1', unitOfMeasure: 'PCS', unitPrice: '0', taxRate: '0' },
  ]);

  useEffect(() => {
    fetch('/api/contacts')
      .then((r) => r.ok ? r.json() : { data: [] })
      .then((b) => setContacts((b.data ?? []).filter((c: any) => c.isActive !== false)))
      .catch(() => setContacts([]));
  }, []);

  function addLine() {
    setLines([...lines, { description: '', quantity: '1', unitOfMeasure: 'PCS', unitPrice: '0', taxRate: '0' }]);
  }
  function removeLine(i: number) {
    setLines(lines.length === 1 ? lines : lines.filter((_, idx) => idx !== i));
  }
  function setLine(i: number, patch: Partial<Line>) {
    setLines(lines.map((l, idx) => idx === i ? { ...l, ...patch } : l));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.name.trim()) { setError('name required'); return; }
    if (!form.contactId) { setError('customer required'); return; }
    if (lines.some((l) => !l.description.trim())) { setError('all lines need a description'); return; }

    setBusy(true);
    try {
      const res = await fetch('/api/recurring-invoices', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          contactId: form.contactId,
          cadence: form.cadence,
          cadenceDay: form.cadence === 'MONTHLY' ? parseInt(form.cadenceDay, 10) : undefined,
          startDate: form.startDate,
          endDate: form.endDate || undefined,
          autoPost: form.autoPost,
          currency: form.currency,
          fxRate: parseFloat(form.fxRate),
          paymentTerms: form.paymentTerms || undefined,
          notes: form.notes || undefined,
          lines: lines.map((l) => ({
            description: l.description,
            quantity: parseFloat(l.quantity),
            unitOfMeasure: l.unitOfMeasure,
            unitPrice: parseFloat(l.unitPrice),
            taxRate: parseFloat(l.taxRate),
          })),
        }),
      });
      const body = await res.json().catch(() => ({} as any));
      if (!res.ok) {
        const issuesText = Array.isArray(body.issues) && body.issues.length
          ? body.issues.map((i: any) => `${(i.path ?? []).join('.') || '(root)'}: ${i.message}`).join(' · ')
          : '';
        const detail = [body.error, issuesText].filter(Boolean).join(' — ') ||
          `HTTP ${res.status} ${JSON.stringify(body)}`;
        setError(detail);
        toast.error(detail);
        return;
      }
      toast.success(tc('save'));
      router.push(`/${locale}/dashboard/recurring`);
    } catch (e: any) {
      setError(e?.message ?? tc('errors.network'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('new')}</h1>
      </div>

      <form onSubmit={submit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>{tc('details')}</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label={tc('name')} req>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </Field>
            <Field label={tInv('customer')} req>
              <Select value={form.contactId} onValueChange={(v) => setForm({ ...form, contactId: v })}>
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
            <Field label={t('cadence')} req>
              <Select value={form.cadence} onValueChange={(v) => setForm({ ...form, cadence: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DAILY">{t('frequencies.DAILY')}</SelectItem>
                  <SelectItem value="WEEKLY">{t('frequencies.WEEKLY')}</SelectItem>
                  <SelectItem value="MONTHLY">{t('frequencies.MONTHLY')}</SelectItem>
                  <SelectItem value="QUARTERLY">{t('frequencies.QUARTERLY')}</SelectItem>
                  <SelectItem value="ANNUALLY">{t('frequencies.ANNUALLY')}</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            {form.cadence === 'MONTHLY' && (
              <Field label="Day of month (1–28)">
                <Input type="number" min={1} max={28} value={form.cadenceDay}
                  onChange={(e) => setForm({ ...form, cadenceDay: e.target.value })} />
              </Field>
            )}
            <Field label={t('startDate')} req>
              <Input type="date" value={form.startDate} dir="ltr"
                onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
            </Field>
            <Field label={t('endDate')}>
              <Input type="date" value={form.endDate} dir="ltr"
                onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </Field>
            <Field label={tInv('currency')}>
              <Input value={form.currency} dir="ltr" maxLength={3}
                onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })} />
            </Field>
            <Field label="FX rate">
              <Input type="number" step="0.0001" value={form.fxRate} dir="ltr"
                onChange={(e) => setForm({ ...form, fxRate: e.target.value })} />
            </Field>
            <div className="flex items-center gap-2 sm:col-span-2">
              <input id="autoPost" type="checkbox" checked={form.autoPost}
                onChange={(e) => setForm({ ...form, autoPost: e.target.checked })}
                className="h-4 w-4" />
              <Label htmlFor="autoPost">{t('autoPost')}</Label>
            </div>
            <Field label={tInv('notes')}>
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{tInv('line.description')}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {lines.map((l, i) => (
              <div key={i} className="grid grid-cols-1 gap-2 rounded-md border p-3 sm:grid-cols-12">
                <div className="sm:col-span-5">
                  <Label className="text-xs">{tInv('line.description')}</Label>
                  <Input value={l.description} onChange={(e) => setLine(i, { description: e.target.value })} required />
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-xs">{tInv('line.qty')}</Label>
                  <Input type="number" step="0.0001" value={l.quantity} dir="ltr"
                    onChange={(e) => setLine(i, { quantity: e.target.value })} required />
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-xs">{tInv('line.unitPrice')}</Label>
                  <Input type="number" step="0.01" value={l.unitPrice} dir="ltr"
                    onChange={(e) => setLine(i, { unitPrice: e.target.value })} required />
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-xs">{tInv('tax')} %</Label>
                  <Input type="number" step="0.0001" min={0} max={1} value={l.taxRate} dir="ltr"
                    onChange={(e) => setLine(i, { taxRate: e.target.value })} />
                </div>
                <div className="flex items-end justify-end sm:col-span-1">
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeLine(i)} disabled={lines.length === 1}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addLine}>
              <Plus className="h-4 w-4" /> {tc('add')}
            </Button>
          </CardContent>
        </Card>

        {error && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => router.back()}>{tc('cancel')}</Button>
          <Button type="submit" disabled={busy}>{busy ? tc('saving') : tc('save')}</Button>
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

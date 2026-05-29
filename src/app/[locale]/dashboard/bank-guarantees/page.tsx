'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Shield, Plus } from 'lucide-react';
import { toast } from '@/lib/toast';
import { tri } from '@/lib/i18n/tri';

interface BG {
  id: string; reference: string; kind: string; issuingBank: string;
  beneficiary: string; amount: string; currency: string;
  issueDate: string; expiryDate: string; status: string;
}

const KINDS_AR: Record<string, string> = {
  BID: 'كفالة عطاء', PERFORMANCE: 'كفالة حسن أداء', ADVANCE_PAYMENT: 'كفالة دفعة مقدمة',
  RETENTION: 'كفالة محتجزات', CUSTOMS: 'كفالة جمركية', OTHER: 'أخرى',
};

const KINDS_KU: Record<string, string> = {
  BID: 'زامنی پێشکەش', PERFORMANCE: 'زامنی باشی جێبەجێکردن', ADVANCE_PAYMENT: 'زامنی پێشەکی',
  RETENTION: 'زامنی ڕاگیراوە', CUSTOMS: 'زامنی گومرگی', OTHER: 'هیتر',
};

export default function BankGuaranteesPage() {
  const t = useTranslations();
  const locale = useLocale();
  const [rows, setRows] = useState<BG[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    reference: '', kind: 'PERFORMANCE',
    issuingBank: '', beneficiary: '',
    amount: '0', currency: 'IQD',
    issueDate: new Date().toISOString().slice(0, 10),
    expiryDate: '', notes: '',
  });

  async function load() {
    const r = await fetch('/api/bank-guarantees');
    if (r.ok) setRows((await r.json()).data ?? []);
  }
  useEffect(() => { load(); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch('/api/bank-guarantees', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
    });
    const body = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { toast.error(body.error ?? 'failed'); return; }
    toast.success(t('common.save'));
    setShowForm(false); load();
    setForm({ ...form, reference: '', amount: '0' });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={tri(locale, { ar: 'خطابات الضمان', ku: 'نامەکانی زامن', en: 'Bank guarantees' })}
        description={tri(locale, { ar: 'خطابات الضمان البنكية للعطاءات الحكومية والعقود', ku: 'نامەکانی زامنی بانکی بۆ مەزایدە حکومییەکان و گرێبەستەکان', en: 'Bank guarantees for tenders and contracts' })}
        actions={
          <Button onClick={() => setShowForm((s) => !s)}>
            <Plus className="h-4 w-4" /> {tri(locale, { ar: 'إضافة كفالة', ku: 'زیادکردنی زامن', en: 'New guarantee' })}
          </Button>
        }
      />

      {showForm && (
        <Card>
          <CardHeader><CardTitle>{tri(locale, { ar: 'كفالة جديدة', ku: 'زامنی نوێ', en: 'New guarantee' })}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
              <Fld label={tri(locale, { ar: 'الرقم المرجعي', ku: 'ژمارەی ئاماژە', en: 'Reference' })} req>
                <Input dir="ltr" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} required />
              </Fld>
              <Fld label={tri(locale, { ar: 'النوع', ku: 'جۆر', en: 'Kind' })}>
                <Select value={form.kind} onValueChange={(v) => setForm({ ...form, kind: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(KINDS_AR).map((k) => (
                      <SelectItem key={k} value={k}>{tri(locale, { ar: KINDS_AR[k], ku: KINDS_KU[k] ?? k, en: k })}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Fld>
              <Fld label={tri(locale, { ar: 'البنك المُصدِر', ku: 'بانکی دەرکەر', en: 'Issuing bank' })} req>
                <Input value={form.issuingBank} onChange={(e) => setForm({ ...form, issuingBank: e.target.value })} required />
              </Fld>
              <Fld label={tri(locale, { ar: 'المستفيد', ku: 'سوودمەند', en: 'Beneficiary' })} req>
                <Input value={form.beneficiary} onChange={(e) => setForm({ ...form, beneficiary: e.target.value })} required />
              </Fld>
              <Fld label={tri(locale, { ar: 'القيمة', ku: 'بڕ', en: 'Amount' })} req>
                <Input type="number" step="0.01" dir="ltr" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
              </Fld>
              <Fld label={tri(locale, { ar: 'العملة', ku: 'دراو', en: 'Currency' })}>
                <Input dir="ltr" maxLength={3} value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })} />
              </Fld>
              <Fld label={tri(locale, { ar: 'تاريخ الإصدار', ku: 'بەرواری دەرکردن', en: 'Issue date' })} req>
                <Input type="date" dir="ltr" value={form.issueDate} onChange={(e) => setForm({ ...form, issueDate: e.target.value })} required />
              </Fld>
              <Fld label={tri(locale, { ar: 'تاريخ الانتهاء', ku: 'بەرواری بەسەرچوون', en: 'Expiry date' })} req>
                <Input type="date" dir="ltr" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} required />
              </Fld>
              <div className="sm:col-span-2 flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>{t('common.cancel')}</Button>
                <Button type="submit" disabled={busy}>{busy ? t('common.saving') : t('common.save')}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {rows === null ? (
        <div className="py-12 text-center text-muted-foreground">{t('common.loading')}</div>
      ) : rows.length === 0 ? (
        <EmptyState icon={Shield} title={t('common.noData')} />
      ) : (
        <Card>
          <Table>
            <THead>
              <TR>
                <TH>{tri(locale, { ar: 'الرقم', ku: 'ژمارەی ئاماژە', en: 'Reference' })}</TH>
                <TH>{tri(locale, { ar: 'النوع', ku: 'جۆر', en: 'Kind' })}</TH>
                <TH>{tri(locale, { ar: 'البنك', ku: 'بانک', en: 'Bank' })}</TH>
                <TH>{tri(locale, { ar: 'المستفيد', ku: 'سوودمەند', en: 'Beneficiary' })}</TH>
                <TH className="text-end">{tri(locale, { ar: 'القيمة', ku: 'بڕ', en: 'Amount' })}</TH>
                <TH>{tri(locale, { ar: 'الانتهاء', ku: 'بەسەرچوون', en: 'Expiry' })}</TH>
                <TH>{tri(locale, { ar: 'الحالة', ku: 'دۆخ', en: 'Status' })}</TH>
              </TR>
            </THead>
            <TBody>
              {rows.map((r) => (
                <TR key={r.id}>
                  <TD className="font-mono text-xs">{r.reference}</TD>
                  <TD>{tri(locale, { ar: KINDS_AR[r.kind] ?? r.kind, ku: KINDS_KU[r.kind] ?? r.kind, en: r.kind })}</TD>
                  <TD>{r.issuingBank}</TD>
                  <TD>{r.beneficiary}</TD>
                  <TD className="text-end tabular-nums">{parseFloat(r.amount).toLocaleString(locale === 'ar' ? 'ar-IQ' : locale === 'ku' ? 'ckb-IQ' : 'en')} {r.currency}</TD>
                  <TD className="tabular-nums">{new Intl.DateTimeFormat(locale).format(new Date(r.expiryDate))}</TD>
                  <TD><Badge variant={r.status === 'ACTIVE' ? 'default' : r.status === 'EXPIRED' ? 'destructive' : 'outline'}>{r.status}</Badge></TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
      )}
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

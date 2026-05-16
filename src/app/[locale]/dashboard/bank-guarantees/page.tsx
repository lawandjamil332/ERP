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

interface BG {
  id: string; reference: string; kind: string; issuingBank: string;
  beneficiary: string; amount: string; currency: string;
  issueDate: string; expiryDate: string; status: string;
}

const KINDS_AR: Record<string, string> = {
  BID: 'كفالة عطاء', PERFORMANCE: 'كفالة حسن أداء', ADVANCE_PAYMENT: 'كفالة دفعة مقدمة',
  RETENTION: 'كفالة محتجزات', CUSTOMS: 'كفالة جمركية', OTHER: 'أخرى',
};

export default function BankGuaranteesPage() {
  const t = useTranslations();
  const locale = useLocale();
  const isAr = locale === 'ar';
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
        title={isAr ? 'خطابات الضمان' : 'Bank guarantees'}
        description={isAr ? 'خطابات الضمان البنكية للعطاءات الحكومية والعقود' : 'Bank guarantees for tenders and contracts'}
        actions={
          <Button onClick={() => setShowForm((s) => !s)}>
            <Plus className="h-4 w-4" /> {isAr ? 'إضافة كفالة' : 'New guarantee'}
          </Button>
        }
      />

      {showForm && (
        <Card>
          <CardHeader><CardTitle>{isAr ? 'كفالة جديدة' : 'New guarantee'}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
              <Fld label={isAr ? 'الرقم المرجعي' : 'Reference'} req>
                <Input dir="ltr" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} required />
              </Fld>
              <Fld label={isAr ? 'النوع' : 'Kind'}>
                <Select value={form.kind} onValueChange={(v) => setForm({ ...form, kind: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(KINDS_AR).map((k) => (
                      <SelectItem key={k} value={k}>{isAr ? KINDS_AR[k] : k}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Fld>
              <Fld label={isAr ? 'البنك المُصدِر' : 'Issuing bank'} req>
                <Input value={form.issuingBank} onChange={(e) => setForm({ ...form, issuingBank: e.target.value })} required />
              </Fld>
              <Fld label={isAr ? 'المستفيد' : 'Beneficiary'} req>
                <Input value={form.beneficiary} onChange={(e) => setForm({ ...form, beneficiary: e.target.value })} required />
              </Fld>
              <Fld label={isAr ? 'القيمة' : 'Amount'} req>
                <Input type="number" step="0.01" dir="ltr" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
              </Fld>
              <Fld label={isAr ? 'العملة' : 'Currency'}>
                <Input dir="ltr" maxLength={3} value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })} />
              </Fld>
              <Fld label={isAr ? 'تاريخ الإصدار' : 'Issue date'} req>
                <Input type="date" dir="ltr" value={form.issueDate} onChange={(e) => setForm({ ...form, issueDate: e.target.value })} required />
              </Fld>
              <Fld label={isAr ? 'تاريخ الانتهاء' : 'Expiry date'} req>
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
                <TH>{isAr ? 'الرقم' : 'Reference'}</TH>
                <TH>{isAr ? 'النوع' : 'Kind'}</TH>
                <TH>{isAr ? 'البنك' : 'Bank'}</TH>
                <TH>{isAr ? 'المستفيد' : 'Beneficiary'}</TH>
                <TH className="text-end">{isAr ? 'القيمة' : 'Amount'}</TH>
                <TH>{isAr ? 'الانتهاء' : 'Expiry'}</TH>
                <TH>{isAr ? 'الحالة' : 'Status'}</TH>
              </TR>
            </THead>
            <TBody>
              {rows.map((r) => (
                <TR key={r.id}>
                  <TD className="font-mono text-xs">{r.reference}</TD>
                  <TD>{isAr ? KINDS_AR[r.kind] ?? r.kind : r.kind}</TD>
                  <TD>{r.issuingBank}</TD>
                  <TD>{r.beneficiary}</TD>
                  <TD className="text-end tabular-nums">{parseFloat(r.amount).toLocaleString(isAr ? 'ar-IQ' : 'en')} {r.currency}</TD>
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

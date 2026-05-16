'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { EmptyState } from '@/components/ui/empty-state';
import { Users, Plus, AlertCircle } from 'lucide-react';
import { toast } from '@/lib/toast';
import { validateIraqiId } from '@/lib/iraq/iraqi-id';

interface BO {
  id: string; fullName: string; nationalId: string | null; nationality: string;
  ownershipPct: string; isPep: boolean;
  effectiveFrom: string; effectiveTo: string | null;
}

export default function BeneficialOwnersPage() {
  const t = useTranslations();
  const locale = useLocale();
  const isAr = locale === 'ar';
  const [rows, setRows] = useState<BO[] | null>(null);
  const [totalPct, setTotalPct] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    fullName: '', nationalId: '', nationality: 'IQ',
    dateOfBirth: '', ownershipPct: '0',
    controlMechanism: 'shareholding', isPep: false,
    effectiveFrom: new Date().toISOString().slice(0, 10),
  });

  async function load() {
    const r = await fetch('/api/beneficial-owners');
    if (r.ok) {
      const b = await r.json();
      setRows(b.data ?? []);
      setTotalPct(parseFloat(b.totalOwnershipPct ?? '0'));
    }
  }
  useEffect(() => { load(); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (form.nationalId && form.nationality === 'IQ') {
      const v = validateIraqiId(form.nationalId);
      if (!v.valid) { setError(`Iraqi ID invalid: ${v.reason}`); return; }
    }
    setBusy(true);
    const res = await fetch('/api/beneficial-owners', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        ...form,
        ownershipPct: parseFloat(form.ownershipPct),
        nationalId: form.nationalId || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
      }),
    });
    const body = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setError(body.error ?? `HTTP ${res.status}`); toast.error(body.error); return; }
    toast.success(t('common.save'));
    setShowForm(false); load();
    setForm({ ...form, fullName: '', nationalId: '', ownershipPct: '0' });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isAr ? 'سجل المستفيدين الحقيقيين' : 'Beneficial owners registry'}
        description={isAr
          ? 'إلزامي وفقاً لقرار مجلس الوزراء العراقي رقم 8 لسنة 2024'
          : 'Mandatory per Iraqi Council of Ministers Resolution 8 of 2024'}
        actions={
          <Button onClick={() => setShowForm((s) => !s)}>
            <Plus className="h-4 w-4" /> {isAr ? 'إضافة مستفيد' : 'Add owner'}
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          tone={totalPct >= 99.9 ? 'success' : totalPct >= 75 ? 'warning' : 'destructive'}
          icon={Users}
          label={isAr ? 'إجمالي الملكية المُسجَّلة' : 'Total registered ownership'}
          value={`${totalPct.toFixed(2)}%`}
        />
        <StatCard
          tone="primary"
          icon={Users}
          label={isAr ? 'عدد المستفيدين' : 'Owners on file'}
          value={rows?.length.toString() ?? '—'}
        />
        <StatCard
          tone={rows?.some((r) => r.isPep) ? 'warning' : 'default'}
          icon={AlertCircle}
          label={isAr ? 'مستفيدون من فئة PEP' : 'Politically-exposed persons'}
          value={rows?.filter((r) => r.isPep).length.toString() ?? '0'}
        />
      </div>

      {totalPct < 100 && rows && rows.length > 0 && (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          ⚠ {isAr
            ? `الملكية المُسجَّلة (${totalPct.toFixed(2)}%) أقل من 100%. تأكد من تسجيل جميع المستفيدين.`
            : `Registered ownership (${totalPct.toFixed(2)}%) is below 100%. Ensure all owners are recorded.`}
        </div>
      )}

      {showForm && (
        <Card>
          <CardHeader><CardTitle>{isAr ? 'مستفيد جديد' : 'New beneficial owner'}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
              <Fld label={isAr ? 'الاسم الكامل' : 'Full name'} req>
                <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
              </Fld>
              <Fld label={isAr ? 'الجنسية' : 'Nationality'}>
                <Input dir="ltr" maxLength={2} value={form.nationality}
                  onChange={(e) => setForm({ ...form, nationality: e.target.value.toUpperCase() })} />
              </Fld>
              <Fld label={isAr ? 'الرقم الوطني (للعراقيين)' : 'National ID (Iraqi)'}>
                <Input dir="ltr" value={form.nationalId}
                  onChange={(e) => setForm({ ...form, nationalId: e.target.value })}
                  placeholder="12 digits — Bitaqa Muwahhada" />
              </Fld>
              <Fld label={isAr ? 'تاريخ الميلاد' : 'Date of birth'}>
                <Input type="date" dir="ltr" value={form.dateOfBirth}
                  onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
              </Fld>
              <Fld label={isAr ? 'نسبة الملكية %' : 'Ownership %'} req>
                <Input type="number" step="0.01" min={0} max={100} dir="ltr"
                  value={form.ownershipPct}
                  onChange={(e) => setForm({ ...form, ownershipPct: e.target.value })} required />
              </Fld>
              <Fld label={isAr ? 'آلية السيطرة' : 'Control mechanism'}>
                <Input value={form.controlMechanism}
                  onChange={(e) => setForm({ ...form, controlMechanism: e.target.value })}
                  placeholder="shareholding / voting rights / board" />
              </Fld>
              <Fld label={isAr ? 'تاريخ السريان' : 'Effective from'} req>
                <Input type="date" dir="ltr" value={form.effectiveFrom}
                  onChange={(e) => setForm({ ...form, effectiveFrom: e.target.value })} required />
              </Fld>
              <div className="flex items-center gap-2 self-end">
                <input id="pep" type="checkbox" checked={form.isPep}
                  onChange={(e) => setForm({ ...form, isPep: e.target.checked })} className="h-4 w-4" />
                <Label htmlFor="pep">
                  {isAr ? 'شخصية سياسية معرّضة (PEP)' : 'Politically-exposed person (PEP)'}
                </Label>
              </div>
              {error && (
                <div className="sm:col-span-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
              )}
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
        <EmptyState icon={Users} title={t('common.noData')} />
      ) : (
        <Card>
          <Table>
            <THead>
              <TR>
                <TH>{isAr ? 'الاسم' : 'Name'}</TH>
                <TH>{isAr ? 'الجنسية' : 'Nationality'}</TH>
                <TH>{isAr ? 'الرقم الوطني' : 'National ID'}</TH>
                <TH className="text-end">{isAr ? 'الملكية' : 'Ownership %'}</TH>
                <TH>{isAr ? 'PEP' : 'PEP'}</TH>
                <TH>{isAr ? 'من تاريخ' : 'Effective from'}</TH>
              </TR>
            </THead>
            <TBody>
              {rows.map((r) => (
                <TR key={r.id}>
                  <TD className="font-medium">{r.fullName}</TD>
                  <TD>{r.nationality}</TD>
                  <TD className="font-mono text-xs">{r.nationalId ?? '—'}</TD>
                  <TD className="text-end tabular-nums">{r.ownershipPct}%</TD>
                  <TD>{r.isPep ? <Badge variant="warning">PEP</Badge> : <Badge variant="outline">—</Badge>}</TD>
                  <TD className="tabular-nums">{new Intl.DateTimeFormat(locale).format(new Date(r.effectiveFrom))}</TD>
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

'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/ui/page-header';
import { toast } from '@/lib/toast';

interface Tenant {
  id: string;
  nameAr: string; nameKu: string | null; nameEn: string;
  taxNumber: string | null;
  commercialReg: string | null;
  governorate: string | null;
  region: 'FEDERAL' | 'KURDISTAN';
  sector: string;
  defaultLocale: string;
  baseCurrency: string;
  ramadanMode: boolean;
  useArabicNumerals: boolean;
}

export default function SettingsPage() {
  const t = useTranslations();
  const locale = useLocale();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch('/api/tenants/me').then((r) => r.ok ? r.json() : { data: null }).then((b) => setTenant(b.data));
  }, []);

  async function save<K extends keyof Tenant>(key: K, value: Tenant[K]) {
    if (!tenant) return;
    setTenant({ ...tenant, [key]: value });
    setBusy(true);
    const res = await fetch('/api/tenants/me', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ [key]: value }),
    });
    setBusy(false);
    if (!res.ok) toast.error('Save failed');
    else toast.success(t('common.save'));
  }

  if (!tenant) return <div className="py-12 text-center text-muted-foreground">{t('common.loading')}</div>;
  const isAr = locale === 'ar';

  return (
    <div className="space-y-6">
      <PageHeader title={t('nav.settings')} description={isAr ? 'إعدادات شركتك' : 'Company-wide preferences'} />

      <Card>
        <CardHeader>
          <CardTitle>{isAr ? 'الهوية' : 'Identity'}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label={isAr ? 'الاسم بالعربية' : 'Name (Arabic)'}>
            <Input dir="rtl" value={tenant.nameAr}
              onChange={(e) => setTenant({ ...tenant, nameAr: e.target.value })}
              onBlur={() => save('nameAr', tenant.nameAr)} />
          </Field>
          <Field label={isAr ? 'الاسم بالإنجليزية' : 'Name (English)'}>
            <Input dir="ltr" value={tenant.nameEn}
              onChange={(e) => setTenant({ ...tenant, nameEn: e.target.value })}
              onBlur={() => save('nameEn', tenant.nameEn)} />
          </Field>
          <Field label={isAr ? 'الرقم الضريبي' : 'Tax number'}>
            <Input dir="ltr" readOnly value={tenant.taxNumber ?? ''} className="font-mono" />
          </Field>
          <Field label={isAr ? 'السجل التجاري' : 'Commercial registration'}>
            <Input dir="ltr" readOnly value={tenant.commercialReg ?? ''} className="font-mono" />
          </Field>
          <Field label={isAr ? 'المحافظة' : 'Governorate'}>
            <Input value={tenant.governorate ?? ''}
              onChange={(e) => setTenant({ ...tenant, governorate: e.target.value })}
              onBlur={() => save('governorate', tenant.governorate)} />
          </Field>
          <Field label={isAr ? 'اللغة الافتراضية' : 'Default language'}>
            <Select value={tenant.defaultLocale}
              onValueChange={(v) => save('defaultLocale', v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ar">العربية</SelectItem>
                <SelectItem value="ku">کوردی</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{isAr ? 'إعدادات عراقية' : 'Iraq-specific preferences'}</CardTitle>
          <CardDescription>
            {isAr ? 'تخصيصات قانون العمل العراقي والمتطلبات الضريبية' : 'Iraqi labor law and tax preferences'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <ToggleRow
            title={isAr ? 'وضع شهر رمضان' : 'Ramadan mode'}
            description={isAr
              ? 'يطبّق ساعات العمل المخفّضة (٦ ساعات/يوم) خلال شهر رمضان وفقاً لقانون العمل العراقي'
              : 'Apply 6-hour workdays during Ramadan per Iraqi Labor Law'}
            value={tenant.ramadanMode}
            onChange={(v) => save('ramadanMode', v)}
            disabled={busy}
          />
          <ToggleRow
            title={isAr ? 'استخدام الأرقام العربية (٠١٢٣)' : 'Use Arabic-Indic numerals (٠١٢٣)'}
            description={isAr
              ? 'مطلوب على نماذج الهيئة العامة للضرائب'
              : 'Required on General Commission for Taxes (GCT) forms'}
            value={tenant.useArabicNumerals}
            onChange={(v) => save('useArabicNumerals', v)}
            disabled={busy}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function ToggleRow({ title, description, value, onChange, disabled }: {
  title: string; description: string;
  value: boolean; onChange: (v: boolean) => void; disabled?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-lg border p-4 transition-colors hover:bg-accent/50">
      <div className="flex-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        disabled={disabled}
        className={`mt-1 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
          value ? 'bg-primary' : 'bg-muted-foreground/30'
        }`}
      >
        <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
          value ? 'translate-x-5 rtl:-translate-x-5' : 'translate-x-0.5 rtl:-translate-x-0.5'
        }`} />
      </button>
    </label>
  );
}

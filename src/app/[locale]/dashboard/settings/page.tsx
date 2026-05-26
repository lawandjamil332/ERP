'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/ui/page-header';
import { toast } from '@/lib/toast';
import { tri } from '@/lib/i18n/tri';

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

  return (
    <div className="space-y-6">
      <PageHeader title={t('nav.settings')} description={tri(locale, { ar: 'إعدادات شركتك', ku: 'ڕێکخستنەکانی کۆمپانیاکەت', en: 'Company-wide preferences' })} />

      <Card>
        <CardHeader>
          <CardTitle>{tri(locale, { ar: 'الهوية', ku: 'ناسنامە', en: 'Identity' })}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label={tri(locale, { ar: 'الاسم بالعربية', ku: 'ناو بە عەرەبی', en: 'Name (Arabic)' })}>
            <Input dir="rtl" value={tenant.nameAr}
              onChange={(e) => setTenant({ ...tenant, nameAr: e.target.value })}
              onBlur={() => save('nameAr', tenant.nameAr)} />
          </Field>
          <Field label={tri(locale, { ar: 'الاسم بالإنجليزية', ku: 'ناو بە ئینگلیزی', en: 'Name (English)' })}>
            <Input dir="ltr" value={tenant.nameEn}
              onChange={(e) => setTenant({ ...tenant, nameEn: e.target.value })}
              onBlur={() => save('nameEn', tenant.nameEn)} />
          </Field>
          <Field label={tri(locale, { ar: 'الرقم الضريبي', ku: 'ژمارەی باجی', en: 'Tax number' })}>
            <Input dir="ltr" readOnly value={tenant.taxNumber ?? ''} className="font-mono" />
          </Field>
          <Field label={tri(locale, { ar: 'السجل التجاري', ku: 'تۆماری بازرگانی', en: 'Commercial registration' })}>
            <Input dir="ltr" readOnly value={tenant.commercialReg ?? ''} className="font-mono" />
          </Field>
          <Field label={tri(locale, { ar: 'المحافظة', ku: 'پارێزگا', en: 'Governorate' })}>
            <Input value={tenant.governorate ?? ''}
              onChange={(e) => setTenant({ ...tenant, governorate: e.target.value })}
              onBlur={() => save('governorate', tenant.governorate)} />
          </Field>
          <Field label={tri(locale, { ar: 'اللغة الافتراضية', ku: 'زمانی بنەڕەت', en: 'Default language' })}>
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
          <CardTitle>{tri(locale, { ar: 'إعدادات عراقية', ku: 'ڕێکخستنە عێراقییەکان', en: 'Iraq-specific preferences' })}</CardTitle>
          <CardDescription>
            {tri(locale, { ar: 'تخصيصات قانون العمل العراقي والمتطلبات الضريبية', ku: 'ڕێکخستنەکانی یاسای کاری عێراقی و پێداویستییە باجییەکان', en: 'Iraqi labor law and tax preferences' })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <ToggleRow
            title={tri(locale, { ar: 'وضع شهر رمضان', ku: 'دۆخی ڕەمەزان', en: 'Ramadan mode' })}
            description={tri(locale, {
              ar: 'يطبّق ساعات العمل المخفّضة (٦ ساعات/يوم) خلال شهر رمضان وفقاً لقانون العمل العراقي',
              ku: 'کاتژمێری کاری کەمکراوە (٦ کاتژمێر/ڕۆژ) لە ماوەی ڕەمەزان جێبەجێ دەکات بەپێی یاسای کاری عێراقی',
              en: 'Apply 6-hour workdays during Ramadan per Iraqi Labor Law' })}
            value={tenant.ramadanMode}
            onChange={(v) => save('ramadanMode', v)}
            disabled={busy}
          />
          <ToggleRow
            title={tri(locale, { ar: 'استخدام الأرقام العربية (٠١٢٣)', ku: 'بەکارهێنانی ژمارە عەرەبییەکان (٠١٢٣)', en: 'Use Arabic-Indic numerals (٠١٢٣)' })}
            description={tri(locale, {
              ar: 'مطلوب على نماذج الهيئة العامة للضرائب',
              ku: 'پێویستە لەسەر فۆرمەکانی دەستەی گشتی باج',
              en: 'Required on General Commission for Taxes (GCT) forms' })}
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

'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/ui/page-header';
import { Download, Upload, ShieldAlert, Database, Clock } from 'lucide-react';
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

      <BackupRestore locale={locale} />
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

const AUTO_KEY = 'auto-backup-hours';

function BackupRestore({ locale }: { locale: string }) {
  const [downloading, setDownloading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [autoHours, setAutoHours] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = Number(localStorage.getItem(AUTO_KEY) ?? '0');
    setAutoHours(Number.isFinite(stored) ? stored : 0);
  }, []);

  // Auto-download while the app is open (browsers can't download when closed).
  useEffect(() => {
    if (!autoHours) return;
    const id = setInterval(() => { void download(true); }, autoHours * 3600_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoHours]);

  async function download(silent = false) {
    setDownloading(true);
    try {
      const res = await fetch('/api/backup/export');
      if (!res.ok) { toast.error(tri(locale, { ar: 'فشل التنزيل', ku: 'داگرتن سەرکەوتوو نەبوو', en: 'Download failed' })); return; }
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = res.headers.get('content-disposition')?.match(/filename="(.+?)"/)?.[1]
        ?? `erp-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
      if (!silent) toast.success(tri(locale, { ar: 'تم تنزيل النسخة الاحتياطية', ku: 'پاڵپشت داگیرا', en: 'Backup downloaded' }));
    } finally {
      setDownloading(false);
    }
  }

  async function restore(file: File) {
    const ok = window.confirm(tri(locale, {
      ar: 'سيتم استرجاع البيانات من الملف ودمجها مع بياناتك الحالية (لن يتم حذف شيء). متابعة؟',
      ku: 'داتاکان لە فایلەکەوە دەگەڕێنرێنەوە و تێکەڵ دەکرێن لەگەڵ داتای ئێستات (هیچ ناسڕێتەوە). بەردەوام بیت؟',
      en: 'This will restore data from the file and merge it into your current data (nothing is deleted). Continue?',
    }));
    if (!ok) return;
    setRestoring(true);
    try {
      const text = await file.text();
      const res = await fetch('/api/backup/restore', {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: text,
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error((body.detail ?? body.error) || tri(locale, { ar: 'فشل الاسترجاع', ku: 'گەڕاندنەوە سەرکەوتوو نەبوو', en: 'Restore failed' }));
        return;
      }
      toast.success(tri(locale, { ar: 'تم استرجاع البيانات', ku: 'داتاکان گەڕێنرانەوە', en: 'Data restored' }));
      setTimeout(() => window.location.reload(), 1200);
    } finally {
      setRestoring(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          {tri(locale, { ar: 'النسخ الاحتياطي والاسترجاع', ku: 'پاڵپشت و گەڕاندنەوە', en: 'Backup & Restore' })}
        </CardTitle>
        <CardDescription>
          {tri(locale, {
            ar: 'بياناتك محفوظة في قاعدة بيانات PostgreSQL على Railway. نزّل نسخة احتياطية إلى جهازك واسترجعها وقت الحاجة.',
            ku: 'داتاکانت لە بنکەی داتای PostgreSQL لەسەر Railway پاشەکەوتکراون. پاڵپشتێک بۆ ئامێرەکەت دابگرە و لە کاتی پێویستدا بیگەڕێنەوە.',
            en: 'Your data lives in a PostgreSQL database on Railway. Download a backup to your device and restore it whenever you need.',
          })}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border p-4">
            <p className="font-medium">{tri(locale, { ar: 'تنزيل نسخة احتياطية', ku: 'داگرتنی پاڵپشت', en: 'Download backup' })}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {tri(locale, { ar: 'ملف JSON يحوي كل بيانات شركتك', ku: 'فایلی JSON کە هەموو داتای کۆمپانیاکەت لەخۆدەگرێت', en: 'A JSON file with all your company data' })}
            </p>
            <Button className="mt-3" onClick={() => download()} disabled={downloading}>
              <Download className="h-4 w-4" />
              {downloading ? tri(locale, { ar: 'جارٍ التنزيل…', ku: 'داگرتن…', en: 'Downloading…' }) : tri(locale, { ar: 'تنزيل الآن', ku: 'ئێستا دابگرە', en: 'Download now' })}
            </Button>
          </div>

          <div className="rounded-lg border p-4">
            <p className="font-medium">{tri(locale, { ar: 'استرجاع من ملف', ku: 'گەڕاندنەوە لە فایل', en: 'Restore from file' })}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {tri(locale, { ar: 'ارفع ملف النسخة الاحتياطية لإعادة البيانات', ku: 'فایلی پاڵپشت باربکە بۆ گەڕاندنەوەی داتاکان', en: 'Upload a backup file to bring data back' })}
            </p>
            <input ref={fileRef} type="file" accept="application/json,.json" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) restore(f); }} />
            <Button variant="outline" className="mt-3" onClick={() => fileRef.current?.click()} disabled={restoring}>
              <Upload className="h-4 w-4" />
              {restoring ? tri(locale, { ar: 'جارٍ الاسترجاع…', ku: 'گەڕاندنەوە…', en: 'Restoring…' }) : tri(locale, { ar: 'رفع ملف…', ku: 'فایل باربکە…', en: 'Upload file…' })}
            </Button>
          </div>
        </div>

        <div className="flex items-start gap-2 rounded-lg border bg-muted/40 p-3">
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-sm font-medium">{tri(locale, { ar: 'تنزيل تلقائي دوري', ku: 'داگرتنی خۆکاری کاتبەند', en: 'Automatic periodic download' })}</p>
            <p className="text-xs text-muted-foreground">
              {tri(locale, { ar: 'ينزّل نسخة احتياطية تلقائياً كل عدة ساعات أثناء فتح التطبيق', ku: 'پاڵپشت بە خۆکاری دادەگرێت هەر چەند کاتژمێرێک کاتێک ئەپەکە کراوەیە', en: 'Auto-downloads a backup every few hours while the app is open' })}
            </p>
          </div>
          <select className="h-9 rounded-md border bg-background px-2 text-sm"
            value={autoHours}
            onChange={(e) => { const v = Number(e.target.value); setAutoHours(v); localStorage.setItem(AUTO_KEY, String(v)); }}>
            <option value={0}>{tri(locale, { ar: 'معطّل', ku: 'ناچالاک', en: 'Off' })}</option>
            <option value={3}>{tri(locale, { ar: 'كل ٣ ساعات', ku: 'هەر ٣ کاتژمێر', en: 'Every 3h' })}</option>
            <option value={5}>{tri(locale, { ar: 'كل ٥ ساعات', ku: 'هەر ٥ کاتژمێر', en: 'Every 5h' })}</option>
            <option value={12}>{tri(locale, { ar: 'كل ١٢ ساعة', ku: 'هەر ١٢ کاتژمێر', en: 'Every 12h' })}</option>
            <option value={24}>{tri(locale, { ar: 'يومياً', ku: 'ڕۆژانە', en: 'Daily' })}</option>
          </select>
        </div>

        <div className="flex items-start gap-2 rounded-lg border border-amber-300/50 bg-amber-50 p-3 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="text-xs">
            {tri(locale, {
              ar: 'الاسترجاع يدمج بيانات الملف مع بياناتك الحالية ولا يحذف أي شيء. احتفظ بملف النسخة الاحتياطية في مكان آمن.',
              ku: 'گەڕاندنەوە داتای فایلەکە تێکەڵ دەکات لەگەڵ داتای ئێستات و هیچ ناسڕێتەوە. فایلی پاڵپشت لە شوێنێکی سەلامەت بپارێزە.',
              en: 'Restore merges the file into your current data and deletes nothing. Keep your backup file somewhere safe.',
            })}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

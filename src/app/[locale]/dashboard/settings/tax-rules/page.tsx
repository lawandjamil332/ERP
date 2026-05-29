'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { Plus, Save, Percent, Info } from 'lucide-react';
import { toast } from '@/lib/toast';
import { tri } from '@/lib/i18n/tri';

interface TaxRate {
  id: string; code: string; nameAr: string; nameEn: string;
  rate: string; kind: string; isActive: boolean;
}

const KIND_LABELS: Record<string, { ar: string; ku: string; en: string }> = {
  SALES: { ar: 'مبيعات', ku: 'فرۆشتن', en: 'Sales' },
  WITHHOLDING: { ar: 'استقطاع', ku: 'بڕینەوە', en: 'Withholding' },
  CUSTOMS: { ar: 'جمارك', ku: 'گومرگ', en: 'Customs' },
  VAT: { ar: 'ض.ق.م', ku: 'VAT', en: 'VAT' },
  STAMP: { ar: 'طوابع', ku: 'تەمبر', en: 'Stamp' },
};

const BUILT_IN_RATES = [
  { code: 'PIT-FED', label: { ar: 'ضريبة الدخل الشخصي — اتحادي', ku: 'باجی داهاتی کەسی — فیدراڵی', en: 'Personal Income Tax — Federal' }, rates: '3%→5%→10%→15%' },
  { code: 'PIT-KRG', label: { ar: 'ضريبة الدخل الشخصي — كردستان', ku: 'باجی داهاتی کەسی — کوردستان', en: 'Personal Income Tax — Kurdistan' }, rates: '5% (عملي)' },
  { code: 'CIT-FED', label: { ar: 'ضريبة الشركات — اتحادي', ku: 'باجی کۆمپانیا — فیدراڵی', en: 'Corporate Income Tax — Federal' }, rates: '15% (عام) / 35% (نفط)' },
  { code: 'SS-EMP', label: { ar: 'ضمان اجتماعي — موظف', ku: 'ئاسایشی کۆمەڵایەتی — کارمەند', en: 'Social Security — Employee' }, rates: '5%' },
  { code: 'SS-ER', label: { ar: 'ضمان اجتماعي — صاحب عمل', ku: 'ئاسایشی کۆمەڵایەتی — خاوەنکار', en: 'Social Security — Employer' }, rates: '12% (عام) / 25% (نفط)' },
  { code: 'WHT', label: { ar: 'ضريبة استقطاع غير مقيمين', ku: 'باجی بڕینەوەی نانیشتەجێ', en: 'Non-resident WHT' }, rates: '15% (اتحادي)' },
];

export default function TaxRulesPage() {
  const locale = useLocale();
  const [rates, setRates] = useState<TaxRate[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: '', nameAr: '', nameEn: '', rate: '', kind: 'SALES' });
  const [busy, setBusy] = useState(false);

  async function load() {
    const r = await fetch('/api/tax-rates');
    if (r.ok) setRates((await r.json()).data ?? []);
  }
  useEffect(() => { load(); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch('/api/tax-rates', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...form, rate: parseFloat(form.rate) / 100 }),
    });
    setBusy(false);
    if (res.ok) {
      toast.success(tri(locale, { ar: 'تم الحفظ', ku: 'پاشەکەوت کرا', en: 'Saved' }));
      setShowForm(false); setForm({ code: '', nameAr: '', nameEn: '', rate: '', kind: 'SALES' });
      load();
    } else toast.error(tri(locale, { ar: 'فشل', ku: 'نەکرا', en: 'Failed' }));
  }

  async function toggleActive(id: string, current: boolean) {
    await fetch('/api/tax-rates', {
      method: 'PATCH', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id, isActive: !current }),
    });
    load();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={tri(locale, { ar: 'قواعد الضرائب', ku: 'یاسای باج', en: 'Tax Rules' })}
        description={tri(locale, { ar: 'إدارة معدلات الضرائب وقواعد الحساب — يتم تطبيقها تلقائياً على الفواتير وكشوف الرواتب', ku: 'بەڕێوەبردنی ڕێژەکانی باج و یاساکانی هەژمارکردن — بە شێوەی خۆکار جێبەجێ دەکرێن لەسەر پسوولە و مووچەکان', en: 'Manage tax rates and calculation rules — automatically applied to invoices and payroll' })}
        actions={
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4" /> {tri(locale, { ar: 'إضافة قاعدة', ku: 'زیادکردنی یاسا', en: 'Add rule' })}
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="h-4 w-4 text-blue-500" />
            {tri(locale, { ar: 'القواعد المدمجة (نظام الضرائب العراقي)', ku: 'یاساکانی ناوەکی (سیستەمی باجی عێراقی)', en: 'Built-in Rules (Iraqi Tax System)' })}
          </CardTitle>
          <CardDescription>{tri(locale, { ar: 'هذه القواعد مدمجة في محرك الرواتب ولا تحتاج إعداداً يدوياً', ku: 'ئەم یاسایانە لە مەکینەی مووچەدا هەن و پێویستی بە ڕێکخستنی دەستی نییە', en: 'These rules are built into the payroll engine and require no manual setup' })}</CardDescription>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr>
                <th className="px-2 py-2 text-start">{tri(locale, { ar: 'الرمز', ku: 'کۆد', en: 'Code' })}</th>
                <th className="px-2 py-2 text-start">{tri(locale, { ar: 'الوصف', ku: 'وەسف', en: 'Description' })}</th>
                <th className="px-2 py-2 text-end">{tri(locale, { ar: 'المعدل', ku: 'ڕێژە', en: 'Rate' })}</th>
              </tr>
            </thead>
            <tbody>
              {BUILT_IN_RATES.map((r) => (
                <tr key={r.code} className="border-b">
                  <td className="px-2 py-1.5 font-mono text-xs">{r.code}</td>
                  <td className="px-2 py-1.5">{tri(locale, r.label)}</td>
                  <td className="px-2 py-1.5 text-end tabular-nums">{r.rates}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>{tri(locale, { ar: 'قاعدة ضريبية جديدة', ku: 'یاسای باجی نوێ', en: 'New Tax Rule' })}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={submit} className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>{tri(locale, { ar: 'الرمز', ku: 'کۆد', en: 'Code' })}</Label>
                <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="SALES-15" required />
              </div>
              <div className="space-y-1.5">
                <Label>{tri(locale, { ar: 'الاسم (عربي)', ku: 'ناو (عەرەبی)', en: 'Name (Arabic)' })}</Label>
                <Input value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label>{tri(locale, { ar: 'الاسم (إنجليزي)', ku: 'ناو (ئینگلیزی)', en: 'Name (English)' })}</Label>
                <Input value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label>{tri(locale, { ar: 'النسبة %', ku: 'ڕێژە %', en: 'Rate %' })}</Label>
                <Input type="number" step="0.01" dir="ltr" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} placeholder="15" required />
              </div>
              <div className="space-y-1.5">
                <Label>{tri(locale, { ar: 'النوع', ku: 'جۆر', en: 'Kind' })}</Label>
                <select className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                  value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
                  {Object.entries(KIND_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{tri(locale, v)}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <Button type="submit" disabled={busy} className="w-full">
                  <Save className="h-4 w-4" /> {tri(locale, { ar: 'حفظ', ku: 'پاشەکەوت', en: 'Save' })}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Percent className="h-4 w-4 text-primary" />
            {tri(locale, { ar: 'القواعد المخصصة', ku: 'یاساکانی تایبەت', en: 'Custom Rules' })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rates.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{tri(locale, { ar: 'لا توجد قواعد مخصصة بعد', ku: 'هێشتا هیچ یاسایەکی تایبەت نییە', en: 'No custom rules yet' })}</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="px-2 py-2 text-start">{tri(locale, { ar: 'الرمز', ku: 'کۆد', en: 'Code' })}</th>
                  <th className="px-2 py-2 text-start">{tri(locale, { ar: 'الاسم', ku: 'ناو', en: 'Name' })}</th>
                  <th className="px-2 py-2 text-start">{tri(locale, { ar: 'النوع', ku: 'جۆر', en: 'Kind' })}</th>
                  <th className="px-2 py-2 text-end">{tri(locale, { ar: 'النسبة', ku: 'ڕێژە', en: 'Rate' })}</th>
                  <th className="px-2 py-2 text-center">{tri(locale, { ar: 'الحالة', ku: 'دۆخ', en: 'Status' })}</th>
                </tr>
              </thead>
              <tbody>
                {rates.map((r) => (
                  <tr key={r.id} className="border-b">
                    <td className="px-2 py-1.5 font-mono text-xs">{r.code}</td>
                    <td className="px-2 py-1.5">{locale === 'ar' ? r.nameAr : r.nameEn}</td>
                    <td className="px-2 py-1.5"><Badge variant="outline">{tri(locale, KIND_LABELS[r.kind] ?? { ar: r.kind, ku: r.kind, en: r.kind })}</Badge></td>
                    <td className="px-2 py-1.5 text-end tabular-nums">{(parseFloat(r.rate) * 100).toFixed(2)}%</td>
                    <td className="px-2 py-1.5 text-center">
                      <Button size="sm" variant={r.isActive ? 'default' : 'secondary'} onClick={() => toggleActive(r.id, r.isActive)}>
                        {r.isActive
                          ? tri(locale, { ar: 'فعال', ku: 'چالاک', en: 'Active' })
                          : tri(locale, { ar: 'معطل', ku: 'ناچالاک', en: 'Inactive' })}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

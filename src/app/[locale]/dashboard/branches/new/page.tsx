'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/ui/page-header';
import { Save } from 'lucide-react';
import { toast } from '@/lib/toast';
import { tri } from '@/lib/i18n/tri';

export default function NewBranchPage() {
  const locale = useLocale();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    nameAr: '', nameEn: '', email: '', phone: '', altPhone: '',
    taxNumber: '', commercialReg: '', governorate: '', address: '',
    city: '', state: '', postalCode: '', country: 'Iraq',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE' | 'CLOSED',
    description: '', notes: '',
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.nameAr || !form.nameEn) {
      setError(tri(locale, { ar: 'الاسم بالعربية والإنجليزية مطلوبان', ku: 'ناوی عەرەبی و ئینگلیزی پێویستن', en: 'Both Arabic and English names required' }));
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/branches', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify(form),
      });
      const body = await res.json();
      if (!res.ok) { setError(body.error ?? `HTTP ${res.status}`); return; }
      toast.success(tri(locale, { ar: 'تم إنشاء الفرع', ku: 'لقەکە دروستکرا', en: 'Branch created' }));
      router.push(`/${locale}/dashboard/branches`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title={tri(locale, { ar: 'فرع جديد', ku: 'لقەی نوێ', en: 'New branch' })} />

      <form onSubmit={submit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{tri(locale, { ar: 'البيانات الأساسية', ku: 'زانیاری بنەڕەتی', en: 'Basic information' })}</CardTitle>
            <CardDescription>
              {tri(locale, { ar: 'يُولَّد رمز الفرع تلقائياً بصيغة BRN-2026-00001', ku: 'کۆدی لقە بە شێوەی خۆکار دروست دەبێت بە فۆرماتی BRN-2026-00001', en: 'Branch code auto-generated as BRN-2026-00001' })}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Fld label={tri(locale, { ar: 'الاسم (عربي)', ku: 'ناو (عەرەبی)', en: 'Name (Arabic)' })} req>
              <Input value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} required />
            </Fld>
            <Fld label={tri(locale, { ar: 'الاسم (إنجليزي)', ku: 'ناو (ئینگلیزی)', en: 'Name (English)' })} req>
              <Input dir="ltr" value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} required />
            </Fld>
            <Fld label={tri(locale, { ar: 'الهاتف', ku: 'تەلەفۆن', en: 'Phone' })}>
              <Input dir="ltr" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Fld>
            <Fld label={tri(locale, { ar: 'هاتف بديل', ku: 'تەلەفۆنی جێگرەوە', en: 'Alt. phone' })}>
              <Input dir="ltr" value={form.altPhone} onChange={(e) => setForm({ ...form, altPhone: e.target.value })} />
            </Fld>
            <Fld label={tri(locale, { ar: 'البريد الإلكتروني', ku: 'ئیمەیڵ', en: 'Email' })}>
              <Input type="email" dir="ltr" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Fld>
            <Fld label={tri(locale, { ar: 'الرقم الضريبي', ku: 'ژمارەی باجی', en: 'Tax number' })}>
              <Input dir="ltr" value={form.taxNumber} onChange={(e) => setForm({ ...form, taxNumber: e.target.value })} />
            </Fld>
            <Fld label={tri(locale, { ar: 'السجل التجاري', ku: 'تۆماری بازرگانی', en: 'Commercial reg.' })}>
              <Input dir="ltr" value={form.commercialReg} onChange={(e) => setForm({ ...form, commercialReg: e.target.value })} />
            </Fld>
            <Fld label={tri(locale, { ar: 'الحالة', ku: 'دۆخ', en: 'Status' })}>
              <select className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as never })}>
                <option value="ACTIVE">{tri(locale, { ar: 'نشط', ku: 'چالاک', en: 'Active' })}</option>
                <option value="INACTIVE">{tri(locale, { ar: 'غير نشط', ku: 'ناچالاک', en: 'Inactive' })}</option>
                <option value="CLOSED">{tri(locale, { ar: 'مغلق', ku: 'داخراو', en: 'Closed' })}</option>
              </select>
            </Fld>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{tri(locale, { ar: 'العنوان', ku: 'ناونیشان', en: 'Address' })}</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Fld label={tri(locale, { ar: 'المحافظة', ku: 'پارێزگا', en: 'Governorate' })}>
              <Input value={form.governorate} onChange={(e) => setForm({ ...form, governorate: e.target.value })} />
            </Fld>
            <Fld label={tri(locale, { ar: 'المدينة', ku: 'شار', en: 'City' })}>
              <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </Fld>
            <Fld label={tri(locale, { ar: 'العنوان التفصيلي', ku: 'ناونیشانی وردەکاری', en: 'Street address' })}>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </Fld>
            <Fld label={tri(locale, { ar: 'الرمز البريدي', ku: 'کۆدی پۆستە', en: 'Postal code' })}>
              <Input dir="ltr" value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} />
            </Fld>
            <Fld label={tri(locale, { ar: 'الدولة', ku: 'وڵات', en: 'Country' })}>
              <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
            </Fld>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{tri(locale, { ar: 'ملاحظات', ku: 'تێبینییەکان', en: 'Notes' })}</CardTitle></CardHeader>
          <CardContent>
            <textarea className="min-h-[80px] w-full rounded-md border bg-background p-3 text-sm"
              value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder={tri(locale, { ar: 'ملاحظات داخلية…', ku: 'تێبینی ناوخۆیی…', en: 'Internal notes…' })} />
          </CardContent>
        </Card>

        {error && <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => router.back()}>{tri(locale, { ar: 'إلغاء', ku: 'هەڵوەشاندنەوە', en: 'Cancel' })}</Button>
          <Button type="submit" disabled={busy}>
            <Save className="h-4 w-4" />
            {busy ? tri(locale, { ar: 'جارٍ الحفظ…', ku: 'پاشەکەوت دەکرێت…', en: 'Saving…' }) : tri(locale, { ar: 'حفظ', ku: 'پاشەکەوتکردن', en: 'Save' })}
          </Button>
        </div>
      </form>
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

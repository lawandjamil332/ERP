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

export default function NewBranchPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';
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
      setError(isAr ? 'الاسم بالعربية والإنجليزية مطلوبان' : 'Both Arabic and English names required');
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
      toast.success(isAr ? 'تم إنشاء الفرع' : 'Branch created');
      router.push(`/${locale}/dashboard/branches`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title={isAr ? 'فرع جديد' : 'New branch'} />

      <form onSubmit={submit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{isAr ? 'البيانات الأساسية' : 'Basic information'}</CardTitle>
            <CardDescription>
              {isAr ? 'يُولَّد رمز الفرع تلقائياً بصيغة BRN-2026-00001' : 'Branch code auto-generated as BRN-2026-00001'}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Fld label={isAr ? 'الاسم (عربي)' : 'Name (Arabic)'} req>
              <Input value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} required />
            </Fld>
            <Fld label={isAr ? 'الاسم (إنجليزي)' : 'Name (English)'} req>
              <Input dir="ltr" value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} required />
            </Fld>
            <Fld label={isAr ? 'الهاتف' : 'Phone'}>
              <Input dir="ltr" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Fld>
            <Fld label={isAr ? 'هاتف بديل' : 'Alt. phone'}>
              <Input dir="ltr" value={form.altPhone} onChange={(e) => setForm({ ...form, altPhone: e.target.value })} />
            </Fld>
            <Fld label={isAr ? 'البريد الإلكتروني' : 'Email'}>
              <Input type="email" dir="ltr" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Fld>
            <Fld label={isAr ? 'الرقم الضريبي' : 'Tax number'}>
              <Input dir="ltr" value={form.taxNumber} onChange={(e) => setForm({ ...form, taxNumber: e.target.value })} />
            </Fld>
            <Fld label={isAr ? 'السجل التجاري' : 'Commercial reg.'}>
              <Input dir="ltr" value={form.commercialReg} onChange={(e) => setForm({ ...form, commercialReg: e.target.value })} />
            </Fld>
            <Fld label={isAr ? 'الحالة' : 'Status'}>
              <select className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as never })}>
                <option value="ACTIVE">{isAr ? 'نشط' : 'Active'}</option>
                <option value="INACTIVE">{isAr ? 'غير نشط' : 'Inactive'}</option>
                <option value="CLOSED">{isAr ? 'مغلق' : 'Closed'}</option>
              </select>
            </Fld>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{isAr ? 'العنوان' : 'Address'}</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Fld label={isAr ? 'المحافظة' : 'Governorate'}>
              <Input value={form.governorate} onChange={(e) => setForm({ ...form, governorate: e.target.value })} />
            </Fld>
            <Fld label={isAr ? 'المدينة' : 'City'}>
              <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </Fld>
            <Fld label={isAr ? 'العنوان التفصيلي' : 'Street address'}>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </Fld>
            <Fld label={isAr ? 'الرمز البريدي' : 'Postal code'}>
              <Input dir="ltr" value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} />
            </Fld>
            <Fld label={isAr ? 'الدولة' : 'Country'}>
              <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
            </Fld>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{isAr ? 'ملاحظات' : 'Notes'}</CardTitle></CardHeader>
          <CardContent>
            <textarea className="min-h-[80px] w-full rounded-md border bg-background p-3 text-sm"
              value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder={isAr ? 'ملاحظات داخلية…' : 'Internal notes…'} />
          </CardContent>
        </Card>

        {error && <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => router.back()}>{isAr ? 'إلغاء' : 'Cancel'}</Button>
          <Button type="submit" disabled={busy}>
            <Save className="h-4 w-4" />
            {busy ? (isAr ? 'جارٍ الحفظ…' : 'Saving…') : (isAr ? 'حفظ' : 'Save')}
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

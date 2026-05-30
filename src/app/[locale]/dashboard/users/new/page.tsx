'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/ui/page-header';
import { Save, RefreshCw } from 'lucide-react';
import { toast } from '@/lib/toast';
import { tri } from '@/lib/i18n/tri';

interface Branch { id: string; nameAr: string; nameEn: string; code: string }

function genTempPassword() {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}
function genUserId() {
  const y = new Date().getUTCFullYear().toString().slice(-2);
  const yd = Math.floor((Date.now() - new Date(Date.UTC(new Date().getUTCFullYear(), 0, 1)).getTime()) / 86400000) + 1;
  return `USR-${y}${String(yd).padStart(3, '0')}-${Math.floor(Math.random() * 99999).toString().padStart(5, '0')}`;
}

export default function NewUserPage() {
  const locale = useLocale();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [form, setForm] = useState({
    userId: genUserId(),
    fullName: '', email: '', phone: '',
    role: 'STAFF', password: genTempPassword(),
    locale: 'ar',
    branchId: '' as string | null,
  });

  useEffect(() => {
    fetch('/api/branches').then((r) => r.ok ? r.json() : { data: [] }).then((b) => setBranches(b.data ?? []));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fullName || !form.email) { toast.error(tri(locale, { ar: 'الاسم والبريد مطلوبان', ku: 'ناو و ئیمەیل پێویستن', en: 'Name and email required' })); return; }
    setBusy(true);
    const res = await fetch('/api/users', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ fullName: form.fullName, email: form.email, phone: form.phone, role: form.role, password: form.password, locale: form.locale, branchId: form.branchId }),
    });
    setBusy(false);
    if (res.ok) { toast.success(tri(locale, { ar: 'تم إنشاء المستخدم', ku: 'بەکارهێنەر دروستکرا', en: 'User created' })); router.push(`/${locale}/dashboard/users`); }
    else toast.error('failed');
  }

  return (
    <div className="space-y-6">
      <PageHeader title={tri(locale, { ar: 'مستخدم جديد', ku: 'بەکارهێنەری نوێ', en: 'New user' })} />

      <form onSubmit={submit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{tri(locale, { ar: 'بيانات الحساب', ku: 'زانیاری هەژمار', en: 'Account details' })}</CardTitle>
            <CardDescription>{tri(locale, { ar: 'يتم توليد رمز المستخدم وكلمة المرور المؤقتة تلقائياً', ku: 'کۆدی بەکارهێنەر و وشەی نهێنی کاتی بە شێوەی خۆکار دروست دەکرێن', en: 'User ID and temporary password are auto-generated' })}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <Fld label={tri(locale, { ar: 'رمز المستخدم', ku: 'کۆدی بەکارهێنەر', en: 'User ID' })}>
              <Input dir="ltr" value={form.userId} readOnly className="font-mono text-xs" />
            </Fld>
            <Fld label={tri(locale, { ar: 'الاسم الكامل', ku: 'ناوی تەواو', en: 'Full name' })} req>
              <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
            </Fld>
            <Fld label={tri(locale, { ar: 'البريد الإلكتروني', ku: 'ئیمەیل', en: 'Email' })} req>
              <Input dir="ltr" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </Fld>
            <Fld label={tri(locale, { ar: 'الهاتف', ku: 'تەلەفۆن', en: 'Phone' })}>
              <Input dir="ltr" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Fld>
            <Fld label={tri(locale, { ar: 'الدور', ku: 'ڕۆڵ', en: 'Role' })}>
              <select className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="OWNER">{tri(locale, { ar: 'مالك', ku: 'خاوەن', en: 'Owner' })}</option>
                <option value="ADMIN">{tri(locale, { ar: 'مدير', ku: 'بەڕێوەبەر', en: 'Admin' })}</option>
                <option value="ACCOUNTANT">{tri(locale, { ar: 'محاسب', ku: 'ژمێریار', en: 'Accountant' })}</option>
                <option value="SALES">{tri(locale, { ar: 'مبيعات', ku: 'فرۆشتن', en: 'Sales' })}</option>
                <option value="PURCHASES">{tri(locale, { ar: 'مشتريات', ku: 'کڕین', en: 'Purchases' })}</option>
                <option value="INVENTORY">{tri(locale, { ar: 'مخزون', ku: 'کۆگا', en: 'Inventory' })}</option>
                <option value="HR">{tri(locale, { ar: 'موارد بشرية', ku: 'سەرچاوە مرۆییەکان', en: 'HR' })}</option>
                <option value="CASHIER">{tri(locale, { ar: 'كاشير', ku: 'کاشێر', en: 'Cashier' })}</option>
                <option value="STAFF">{tri(locale, { ar: 'موظف', ku: 'کارمەند', en: 'Staff' })}</option>
                <option value="AUDITOR_READONLY">{tri(locale, { ar: 'مدقق (قراءة فقط)', ku: 'پشکنەر (تەنها خوێندنەوە)', en: 'Auditor (read-only)' })}</option>
              </select>
            </Fld>
            <Fld label={tri(locale, { ar: 'الفرع', ku: 'لق', en: 'Branch' })}>
              <select className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                value={form.branchId ?? ''} onChange={(e) => setForm({ ...form, branchId: e.target.value || null })}>
                <option value="">{tri(locale, { ar: 'جميع الفروع', ku: 'هەموو لقەکان', en: 'All branches' })}</option>
                {branches.map((br) => (
                  <option key={br.id} value={br.id}>{locale === 'ar' ? br.nameAr : br.nameEn} ({br.code})</option>
                ))}
              </select>
            </Fld>
            <Fld label={tri(locale, { ar: 'لغة الواجهة', ku: 'زمانی ڕووکار', en: 'UI language' })}>
              <select className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                value={form.locale} onChange={(e) => setForm({ ...form, locale: e.target.value })}>
                <option value="ar">العربية</option>
                <option value="ku">کوردی</option>
                <option value="en">English</option>
              </select>
            </Fld>
            <Fld label={tri(locale, { ar: 'كلمة المرور المؤقتة', ku: 'وشەی نهێنی کاتی', en: 'Temporary password' })}>
              <div className="flex gap-1">
                <Input dir="ltr" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="font-mono" />
                <Button type="button" variant="outline" onClick={() => setForm({ ...form, password: genTempPassword() })}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </Fld>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => router.back()}>{tri(locale, { ar: 'إلغاء', ku: 'پاشگەزبوونەوە', en: 'Cancel' })}</Button>
          <Button type="submit" disabled={busy}><Save className="h-4 w-4" /> {busy ? tri(locale, { ar: 'جارٍ الحفظ…', ku: 'پاشەکەوت دەکرێت…', en: 'Saving…' }) : tri(locale, { ar: 'حفظ', ku: 'پاشەکەوت', en: 'Save' })}</Button>
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

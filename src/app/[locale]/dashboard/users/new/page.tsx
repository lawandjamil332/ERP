'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/ui/page-header';
import { Save, RefreshCw } from 'lucide-react';
import { toast } from '@/lib/toast';

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
  const isAr = locale === 'ar';
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    userId: genUserId(),
    fullName: '', email: '', phone: '',
    role: 'STAFF', password: genTempPassword(),
    locale: 'ar',
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fullName || !form.email) { toast.error(isAr ? 'الاسم والبريد مطلوبان' : 'Name and email required'); return; }
    setBusy(true);
    const res = await fetch('/api/users', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...form }),
    });
    setBusy(false);
    if (res.ok) { toast.success(isAr ? 'تم إنشاء المستخدم' : 'User created'); router.push(`/${locale}/dashboard/users`); }
    else toast.error('failed');
  }

  return (
    <div className="space-y-6">
      <PageHeader title={isAr ? 'مستخدم جديد' : 'New user'} />

      <form onSubmit={submit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{isAr ? 'بيانات الحساب' : 'Account details'}</CardTitle>
            <CardDescription>{isAr ? 'يتم توليد رمز المستخدم وكلمة المرور المؤقتة تلقائياً' : 'User ID and temporary password are auto-generated'}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <Fld label={isAr ? 'رمز المستخدم' : 'User ID'}>
              <Input dir="ltr" value={form.userId} readOnly className="font-mono text-xs" />
            </Fld>
            <Fld label={isAr ? 'الاسم الكامل' : 'Full name'} req>
              <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
            </Fld>
            <Fld label={isAr ? 'البريد الإلكتروني' : 'Email'} req>
              <Input dir="ltr" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </Fld>
            <Fld label={isAr ? 'الهاتف' : 'Phone'}>
              <Input dir="ltr" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Fld>
            <Fld label={isAr ? 'الدور' : 'Role'}>
              <select className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="OWNER">{isAr ? 'مالك' : 'Owner'}</option>
                <option value="ADMIN">{isAr ? 'مدير' : 'Admin'}</option>
                <option value="ACCOUNTANT">{isAr ? 'محاسب' : 'Accountant'}</option>
                <option value="SALES">{isAr ? 'مبيعات' : 'Sales'}</option>
                <option value="PURCHASES">{isAr ? 'مشتريات' : 'Purchases'}</option>
                <option value="INVENTORY">{isAr ? 'مخزون' : 'Inventory'}</option>
                <option value="HR">{isAr ? 'موارد بشرية' : 'HR'}</option>
                <option value="CASHIER">{isAr ? 'كاشير' : 'Cashier'}</option>
                <option value="STAFF">{isAr ? 'موظف' : 'Staff'}</option>
                <option value="AUDITOR_READONLY">{isAr ? 'مدقق (قراءة فقط)' : 'Auditor (read-only)'}</option>
              </select>
            </Fld>
            <Fld label={isAr ? 'كلمة المرور المؤقتة' : 'Temporary password'}>
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
          <Button type="button" variant="ghost" onClick={() => router.back()}>{isAr ? 'إلغاء' : 'Cancel'}</Button>
          <Button type="submit" disabled={busy}><Save className="h-4 w-4" /> {busy ? (isAr ? 'جارٍ الحفظ…' : 'Saving…') : (isAr ? 'حفظ' : 'Save')}</Button>
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

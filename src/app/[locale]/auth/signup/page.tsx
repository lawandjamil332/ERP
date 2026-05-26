'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    nameAr: '', nameEn: '', taxNumber: '', governorate: 'Baghdad',
    region: 'FEDERAL' as 'FEDERAL' | 'KURDISTAN',
    sector: 'GENERAL',
    defaultLocale: 'ar' as 'ar' | 'ku' | 'en',
    email: '', password: '', fullName: '',
  });
  const [err, setErr] = useState<string | null>(null); const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const res = await fetch('/api/tenants/signup', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        tenant: {
          nameAr: form.nameAr, nameEn: form.nameEn,
          taxNumber: form.taxNumber || undefined,
          governorate: form.governorate, region: form.region,
          sector: form.sector, defaultLocale: form.defaultLocale,
        },
        owner: { email: form.email, password: form.password, fullName: form.fullName },
      }),
    });
    setBusy(false);
    if (res.ok) { router.push(`/${form.defaultLocale}/dashboard`); router.refresh(); }
    else setErr((await res.json().catch(() => ({}))).error ?? 'Signup failed');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 to-stone-100 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Create your Iraq ERP company</CardTitle>
          <CardDescription>إنشاء حساب شركة جديدة — يضم النظام المحاسبي الموحد تلقائياً</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
            <Fld label="Company (AR)" req><Input dir="rtl" value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} required /></Fld>
            <Fld label="Company (EN)" req><Input dir="ltr" value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} required /></Fld>
            <Fld label="Tax number"><Input dir="ltr" value={form.taxNumber} onChange={(e) => setForm({ ...form, taxNumber: e.target.value })} /></Fld>
            <Fld label="Governorate"><Input value={form.governorate} onChange={(e) => setForm({ ...form, governorate: e.target.value })} /></Fld>
            <Fld label="Tax region">
              <Select value={form.region} onValueChange={(v) => setForm({ ...form, region: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="FEDERAL">Federal Iraq</SelectItem>
                  <SelectItem value="KURDISTAN">Kurdistan (KRG)</SelectItem>
                </SelectContent>
              </Select>
            </Fld>
            <Fld label="Sector">
              <Select value={form.sector} onValueChange={(v) => setForm({ ...form, sector: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['GENERAL','OIL_GAS','TELECOM','HOSPITALITY','CONSTRUCTION','RETAIL','MANUFACTURING','AGRICULTURE','HEALTHCARE','EDUCATION','TRANSPORT']
                    .map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </Fld>
            <Fld label="Default locale">
              <Select value={form.defaultLocale} onValueChange={(v) => setForm({ ...form, defaultLocale: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ar">العربية</SelectItem>
                  <SelectItem value="ku">کوردی</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </Fld>
            <div className="sm:col-span-2 border-t pt-4 text-sm font-medium">Owner / المالك</div>
            <Fld label="Your name" req><Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required /></Fld>
            <Fld label="Email" req><Input type="email" dir="ltr" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></Fld>
            <Fld label="Password (≥8 chars)" req className="sm:col-span-2">
              <Input type="password" dir="ltr" minLength={8} value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} required /></Fld>

            {err && <div className="sm:col-span-2 rounded-md border border-destructive bg-destructive/5 p-3 text-sm text-destructive">{err}</div>}
            <div className="sm:col-span-2 flex items-center justify-between">
              <Link href="/auth/login" className="text-sm text-primary hover:underline">Have an account? Sign in</Link>
              <Button type="submit" disabled={busy}>{busy ? '...' : 'Create company'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Fld({ label, children, req, className }: { label: string; children: React.ReactNode; req?: boolean; className?: string }) {
  return (
    <div className={`space-y-1.5 ${className ?? ''}`}>
      <Label>{label}{req && <span className="text-destructive"> *</span>}</Label>
      {children}
    </div>
  );
}

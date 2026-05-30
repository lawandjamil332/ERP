'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { Tags, Plus } from 'lucide-react';
import { toast } from '@/lib/toast';
import { tri } from '@/lib/i18n/tri';

interface Cat { id: string; nameAr: string; nameEn: string; accountCode: string | null; parentId: string | null; isActive: boolean }

export default function ExpenseCategoriesPage() {
  const locale = useLocale();
  const [rows, setRows] = useState<Cat[]>([]);
  const [form, setForm] = useState({ nameAr: '', nameEn: '', accountCode: '', parentId: '' });

  async function load() {
    const r = await fetch('/api/expense-categories');
    if (r.ok) setRows((await r.json()).data ?? []);
  }
  useEffect(() => { load(); }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/expense-categories', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...form, parentId: form.parentId || undefined, accountCode: form.accountCode || undefined }),
    });
    if (res.ok) { toast.success(tri(locale, { ar: 'تمت الإضافة', ku: 'زیادکرا', en: 'Added' })); setForm({ nameAr: '', nameEn: '', accountCode: '', parentId: '' }); load(); }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={tri(locale, { ar: 'تصنيف المصروفات', ku: 'پۆلێنکردنی خەرجییەکان', en: 'Expense classification' })}
        description={tri(locale, { ar: 'مثال: الرواتب، الإيجار، الكهرباء، الاتصالات', ku: 'نموونە: مووچە، کرێ، کارەبا، پەیوەندییەکان', en: 'e.g. salaries, rent, utilities, telecom' })}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>{tri(locale, { ar: 'إضافة تصنيف', ku: 'زیادکردنی پۆلێن', en: 'Add category' })}</CardTitle>
            <CardDescription>{tri(locale, { ar: 'يُربط بحساب من شجرة الحسابات', ku: 'بە هەژمارێک لە دارەختی هەژمارەکان دەبەسترێتەوە', en: 'Linked to a chart-of-accounts code' })}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={add} className="space-y-3">
              <div className="space-y-1.5">
                <Label>{tri(locale, { ar: 'الاسم (عربي)', ku: 'ناو (عەرەبی)', en: 'Name (Arabic)' })}</Label>
                <Input value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label>{tri(locale, { ar: 'الاسم (إنجليزي)', ku: 'ناو (ئینگلیزی)', en: 'Name (English)' })}</Label>
                <Input dir="ltr" value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label>{tri(locale, { ar: 'رمز الحساب (اختياري)', ku: 'کۆدی هەژمار (ئیختیاری)', en: 'Account code (optional)' })}</Label>
                <Input dir="ltr" value={form.accountCode} onChange={(e) => setForm({ ...form, accountCode: e.target.value })} placeholder="5101" />
              </div>
              <div className="space-y-1.5">
                <Label>{tri(locale, { ar: 'التصنيف الأب (اختياري)', ku: 'پۆلێنی باوک (ئیختیاری)', en: 'Parent category (optional)' })}</Label>
                <select className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                  value={form.parentId} onChange={(e) => setForm({ ...form, parentId: e.target.value })}>
                  <option value="">—</option>
                  {rows.filter((r) => !r.parentId).map((r) => (
                    <option key={r.id} value={r.id}>{tri(locale, { ar: r.nameAr, ku: r.nameEn ?? r.nameAr, en: r.nameEn ?? r.nameAr })}</option>
                  ))}
                </select>
              </div>
              <Button type="submit" className="w-full"><Plus className="h-4 w-4" /> {tri(locale, { ar: 'إضافة', ku: 'زیادکردن', en: 'Add' })}</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>{tri(locale, { ar: `التصنيفات (${rows.length})`, ku: `پۆلێنەکان (${rows.length})`, en: `Categories (${rows.length})` })}</CardTitle></CardHeader>
          <CardContent>
            {rows.length === 0 ? (
              <div className="py-12 text-center">
                <Tags className="mx-auto h-8 w-8 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">{tri(locale, { ar: 'لا توجد تصنيفات', ku: 'هیچ پۆلێنێک نییە', en: 'No categories yet' })}</p>
              </div>
            ) : (
              <ul className="divide-y">
                {rows.map((c) => (
                  <li key={c.id} className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium">{c.parentId && <span className="text-muted-foreground">↳ </span>}{tri(locale, { ar: c.nameAr, ku: c.nameEn ?? c.nameAr, en: c.nameEn ?? c.nameAr })}</p>
                      {c.accountCode && <p className="font-mono text-xs text-muted-foreground">acct: {c.accountCode}</p>}
                    </div>
                    <Badge variant={c.isActive ? 'default' : 'secondary'}>{c.isActive ? tri(locale, { ar: 'نشط', ku: 'چالاک', en: 'Active' }) : tri(locale, { ar: 'متوقف', ku: 'ناچالاک', en: 'Inactive' })}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

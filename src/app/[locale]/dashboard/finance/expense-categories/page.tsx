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

interface Cat { id: string; nameAr: string; nameEn: string; accountCode: string | null; parentId: string | null; isActive: boolean }

export default function ExpenseCategoriesPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';
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
    if (res.ok) { toast.success(isAr ? 'تمت الإضافة' : 'Added'); setForm({ nameAr: '', nameEn: '', accountCode: '', parentId: '' }); load(); }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isAr ? 'تصنيف المصروفات' : 'Expense classification'}
        description={isAr ? 'مثال: الرواتب، الإيجار، الكهرباء، الاتصالات' : 'e.g. salaries, rent, utilities, telecom'}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>{isAr ? 'إضافة تصنيف' : 'Add category'}</CardTitle>
            <CardDescription>{isAr ? 'يُربط بحساب من شجرة الحسابات' : 'Linked to a chart-of-accounts code'}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={add} className="space-y-3">
              <div className="space-y-1.5">
                <Label>{isAr ? 'الاسم (عربي)' : 'Name (Arabic)'}</Label>
                <Input value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label>{isAr ? 'الاسم (إنجليزي)' : 'Name (English)'}</Label>
                <Input dir="ltr" value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label>{isAr ? 'رمز الحساب (اختياري)' : 'Account code (optional)'}</Label>
                <Input dir="ltr" value={form.accountCode} onChange={(e) => setForm({ ...form, accountCode: e.target.value })} placeholder="5101" />
              </div>
              <div className="space-y-1.5">
                <Label>{isAr ? 'التصنيف الأب (اختياري)' : 'Parent category (optional)'}</Label>
                <select className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                  value={form.parentId} onChange={(e) => setForm({ ...form, parentId: e.target.value })}>
                  <option value="">—</option>
                  {rows.filter((r) => !r.parentId).map((r) => (
                    <option key={r.id} value={r.id}>{isAr ? r.nameAr : r.nameEn}</option>
                  ))}
                </select>
              </div>
              <Button type="submit" className="w-full"><Plus className="h-4 w-4" /> {isAr ? 'إضافة' : 'Add'}</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>{isAr ? `التصنيفات (${rows.length})` : `Categories (${rows.length})`}</CardTitle></CardHeader>
          <CardContent>
            {rows.length === 0 ? (
              <div className="py-12 text-center">
                <Tags className="mx-auto h-8 w-8 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">{isAr ? 'لا توجد تصنيفات' : 'No categories yet'}</p>
              </div>
            ) : (
              <ul className="divide-y">
                {rows.map((c) => (
                  <li key={c.id} className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium">{c.parentId && <span className="text-muted-foreground">↳ </span>}{isAr ? c.nameAr : c.nameEn}</p>
                      {c.accountCode && <p className="font-mono text-xs text-muted-foreground">acct: {c.accountCode}</p>}
                    </div>
                    <Badge variant={c.isActive ? 'default' : 'secondary'}>{c.isActive ? (isAr ? 'نشط' : 'Active') : (isAr ? 'متوقف' : 'Inactive')}</Badge>
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

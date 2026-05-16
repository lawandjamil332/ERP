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

interface Brand { id: string; nameAr: string; nameEn: string; slug: string; isActive: boolean }

export default function BrandsPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const [rows, setRows] = useState<Brand[] | null>(null);
  const [form, setForm] = useState({ nameAr: '', nameEn: '' });
  const [busy, setBusy] = useState(false);

  async function load() {
    const r = await fetch('/api/brands');
    if (r.ok) setRows((await r.json()).data ?? []);
  }
  useEffect(() => { load(); }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nameAr || !form.nameEn) return;
    setBusy(true);
    const res = await fetch('/api/brands', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(form),
    });
    setBusy(false);
    if (res.ok) {
      toast.success(isAr ? 'تمت الإضافة' : 'Added');
      setForm({ nameAr: '', nameEn: '' });
      load();
    } else {
      toast.error('failed');
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isAr ? 'الماركات' : 'Brands'}
        description={isAr ? 'العلامات التجارية للمنتجات' : 'Product brands and trademarks'}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{isAr ? 'إضافة ماركة' : 'Add brand'}</CardTitle>
            <CardDescription>{isAr ? 'مثال: Samsung, Apple, LG' : 'e.g. Samsung, Apple, LG'}</CardDescription>
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
              <Button type="submit" disabled={busy} className="w-full">
                <Plus className="h-4 w-4" /> {busy ? (isAr ? 'جارٍ…' : 'Adding…') : (isAr ? 'إضافة' : 'Add')}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{isAr ? `الماركات (${rows?.length ?? 0})` : `Brands (${rows?.length ?? 0})`}</CardTitle>
          </CardHeader>
          <CardContent>
            {rows === null ? (
              <p className="py-6 text-center text-sm text-muted-foreground">{isAr ? 'جارٍ التحميل…' : 'Loading…'}</p>
            ) : rows.length === 0 ? (
              <div className="py-12 text-center">
                <Tags className="mx-auto h-8 w-8 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">{isAr ? 'لا توجد ماركات' : 'No brands yet'}</p>
              </div>
            ) : (
              <ul className="divide-y">
                {rows.map((b) => (
                  <li key={b.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium">{isAr ? b.nameAr : b.nameEn}</p>
                      <p className="font-mono text-xs text-muted-foreground">{b.slug}</p>
                    </div>
                    <Badge variant={b.isActive ? 'default' : 'secondary'}>
                      {b.isActive ? (isAr ? 'نشط' : 'Active') : (isAr ? 'غير نشط' : 'Inactive')}
                    </Badge>
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

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
      toast.success(tri(locale, { ar: 'تمت الإضافة', ku: 'زیادکرا', en: 'Added' }));
      setForm({ nameAr: '', nameEn: '' });
      load();
    } else {
      toast.error('failed');
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={tri(locale, { ar: 'الماركات', ku: 'مارکەکان', en: 'Brands' })}
        description={tri(locale, { ar: 'العلامات التجارية للمنتجات', ku: 'مارکە بازرگانییەکانی بەرهەمەکان', en: 'Product brands and trademarks' })}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{tri(locale, { ar: 'إضافة ماركة', ku: 'زیادکردنی مارکە', en: 'Add brand' })}</CardTitle>
            <CardDescription>{tri(locale, { ar: 'مثال: Samsung, Apple, LG', ku: 'نموونە: Samsung, Apple, LG', en: 'e.g. Samsung, Apple, LG' })}</CardDescription>
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
              <Button type="submit" disabled={busy} className="w-full">
                <Plus className="h-4 w-4" /> {busy ? tri(locale, { ar: 'جارٍ…', ku: 'زیاد دەکرێت…', en: 'Adding…' }) : tri(locale, { ar: 'إضافة', ku: 'زیادکردن', en: 'Add' })}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{tri(locale, { ar: `الماركات (${rows?.length ?? 0})`, ku: `مارکەکان (${rows?.length ?? 0})`, en: `Brands (${rows?.length ?? 0})` })}</CardTitle>
          </CardHeader>
          <CardContent>
            {rows === null ? (
              <p className="py-6 text-center text-sm text-muted-foreground">{tri(locale, { ar: 'جارٍ التحميل…', ku: 'بارکردن…', en: 'Loading…' })}</p>
            ) : rows.length === 0 ? (
              <div className="py-12 text-center">
                <Tags className="mx-auto h-8 w-8 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">{tri(locale, { ar: 'لا توجد ماركات', ku: 'هێشتا هیچ مارکەیەک نییە', en: 'No brands yet' })}</p>
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
                      {b.isActive ? tri(locale, { ar: 'نشط', ku: 'چالاک', en: 'Active' }) : tri(locale, { ar: 'غير نشط', ku: 'ناچالاک', en: 'Inactive' })}
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

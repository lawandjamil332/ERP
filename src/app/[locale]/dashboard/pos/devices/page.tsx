'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { Monitor, Plus } from 'lucide-react';
import { tri } from '@/lib/i18n/tri';

interface Device { id: string; code: string; nameAr: string; nameEn: string; isActive: boolean }

export default function PosDevicesPage() {
  const locale = useLocale();
  const [rows, setRows] = useState<Device[]>([]);
  const [form, setForm] = useState({ nameAr: '', nameEn: '', code: '' });

  async function load() {
    const r = await fetch('/api/pos-terminals');
    if (r.ok) setRows((await r.json()).data ?? []);
  }
  useEffect(() => { load(); }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/pos-terminals', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) { setForm({ nameAr: '', nameEn: '', code: '' }); load(); }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={tri(locale, { ar: 'أجهزة نقطة البيع', ku: 'ئامێرەکانی خاڵی فرۆشتن', en: 'POS devices' })}
        description={tri(locale, { ar: 'الطرفيات والطابعات والماسحات', ku: 'تێرمیناڵ و چاپکەر و سکانەرەکان', en: 'Terminals, printers, and scanners' })}
      />

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card>
          <CardHeader><CardTitle>{tri(locale, { ar: 'إضافة جهاز', ku: 'زیادکردنی ئامێر', en: 'Add device' })}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={add} className="space-y-3">
              <div className="space-y-1.5">
                <Label>{tri(locale, { ar: 'الرمز', ku: 'کۆد', en: 'Code' })}</Label>
                <Input dir="ltr" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="POS-01" required />
              </div>
              <div className="space-y-1.5">
                <Label>{tri(locale, { ar: 'الاسم (عربي)', ku: 'ناو (عەرەبی)', en: 'Name (Arabic)' })}</Label>
                <Input value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label>{tri(locale, { ar: 'الاسم (إنجليزي)', ku: 'ناو (ئینگلیزی)', en: 'Name (English)' })}</Label>
                <Input dir="ltr" value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} required />
              </div>
              <Button type="submit" className="w-full"><Plus className="h-4 w-4" /> {tri(locale, { ar: 'إضافة', ku: 'زیادکردن', en: 'Add' })}</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{tri(locale, { ar: `الأجهزة المسجّلة (${rows.length})`, ku: `ئامێرە تۆمارکراوەکان (${rows.length})`, en: `Registered devices (${rows.length})` })}</CardTitle></CardHeader>
          <CardContent>
            {rows.length === 0 ? (
              <div className="py-12 text-center">
                <Monitor className="mx-auto h-10 w-10 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">{tri(locale, { ar: 'لم يتم تسجيل أجهزة', ku: 'هێشتا هیچ ئامێرێک تۆمار نەکراوە', en: 'No devices registered yet' })}</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {rows.map((d) => (
                  <div key={d.id} className="flex items-center gap-3 rounded-lg border p-3">
                    <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                      <Monitor className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{tri(locale, { ar: d.nameAr, ku: d.nameEn ?? d.nameAr, en: d.nameEn ?? d.nameAr })}</p>
                      <p className="font-mono text-xs text-muted-foreground">{d.code}</p>
                    </div>
                    <Badge variant={d.isActive ? 'default' : 'secondary'}>{d.isActive ? tri(locale, { ar: 'نشط', ku: 'چالاک', en: 'Active' }) : tri(locale, { ar: 'متوقف', ku: 'ڕاگیراو', en: 'Inactive' })}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

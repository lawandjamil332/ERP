'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Plus, Package, Search, Filter, RefreshCw, Upload, Eye, Copy, Edit } from 'lucide-react';
import { toast } from '@/lib/toast';
import { tri } from '@/lib/i18n/tri';

interface Product {
  id: string; sku: string; barcode: string | null;
  nameAr: string; nameEn: string;
  salePrice: string; cost: string;
  unitOfMeasure: string; category: string | null;
  isActive: boolean; isService: boolean;
  stockQty?: number;
}

const STATUSES = ['ALL', 'ACTIVE', 'INACTIVE'] as const;

export default function ProductsPage() {
  const t = useTranslations();
  const locale = useLocale();
  const isAr = locale === 'ar';
  const [rows, setRows] = useState<Product[] | null>(null);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<typeof STATUSES[number]>('ALL');
  const [showFilters, setShowFilters] = useState(false);

  async function load() {
    const r = await fetch('/api/products');
    if (r.ok) {
      const b = await r.json();
      setRows((b.data ?? []).map((p: any) => ({
        ...p,
        stockQty: (p.stock ?? []).reduce((s: number, st: any) => s + Number(st.quantity), 0),
      })));
    }
  }
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!rows) return null;
    const q = query.trim().toLowerCase();
    return rows.filter((p) => {
      if (status === 'ACTIVE' && !p.isActive) return false;
      if (status === 'INACTIVE' && p.isActive) return false;
      if (!q) return true;
      return (
        p.sku.toLowerCase().includes(q) ||
        (p.barcode ?? '').toLowerCase().includes(q) ||
        p.nameAr.toLowerCase().includes(q) ||
        p.nameEn.toLowerCase().includes(q) ||
        (p.category ?? '').toLowerCase().includes(q)
      );
    });
  }, [rows, query, status]);

  async function copy(id: string) {
    const orig = rows?.find((p) => p.id === id);
    if (!orig) return;
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        sku: orig.sku + '-COPY-' + Date.now().toString(36),
        nameAr: orig.nameAr, nameEn: orig.nameEn,
        unitOfMeasure: orig.unitOfMeasure,
        salePrice: parseFloat(orig.salePrice), cost: parseFloat(orig.cost),
        category: orig.category ?? undefined,
        isService: orig.isService,
      }),
    });
    if (res.ok) { toast.success(tri(locale, { ar: 'تم النسخ', ku: 'کۆپی کرا', en: 'Copied' })); load(); }
    else toast.error(tri(locale, { ar: 'فشل النسخ', ku: 'کۆپیکردن سەرکەوتوو نەبوو', en: 'Copy failed' }));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={tri(locale, { ar: 'إدارة المنتجات', ku: 'بەڕێوەبردنی بەرهەمەکان', en: 'Product management' })}
        description={tri(locale, { ar: 'إدارة ومتابعة المنتجات', ku: 'بەڕێوەبردن و بەدواداچوونی بەرهەمەکان', en: 'Manage and track your product catalog' })}
        actions={
          <>
            <Button variant="outline" onClick={load}>
              <RefreshCw className="h-4 w-4" /> {tri(locale, { ar: 'تحديث', ku: 'نوێکردنەوە', en: 'Refresh' })}
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/${locale}/dashboard/import`}>
                <Upload className="h-4 w-4" /> {tri(locale, { ar: 'استيراد ملف اكسل', ku: 'هاوردەکردنی فایلی ئێکسڵ', en: 'Import Excel' })}
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/${locale}/dashboard/products/new`}>
                <Plus className="h-4 w-4" /> {tri(locale, { ar: 'منتج جديد', ku: 'بەرهەمی نوێ', en: 'New product' })}
              </Link>
            </Button>
          </>
        }
      />

      <Card>
        <div className="flex flex-wrap items-center gap-3 p-4">
          <div className="relative min-w-[260px] flex-1">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="ps-9" placeholder={tri(locale, { ar: 'البحث...', ku: 'گەڕان...', en: 'Search…' })}
              value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <select className="h-10 rounded-md border bg-background px-3 text-sm" value={status}
            onChange={(e) => setStatus(e.target.value as any)} dir="ltr">
            <option value="ALL">{tri(locale, { ar: 'جميع الحالات', ku: 'هەموو دۆخەکان', en: 'All statuses' })}</option>
            <option value="ACTIVE">{tri(locale, { ar: 'نشط', ku: 'چالاک', en: 'Active' })}</option>
            <option value="INACTIVE">{tri(locale, { ar: 'غير نشط', ku: 'ناچالاک', en: 'Inactive' })}</option>
          </select>
          <Button variant="outline" onClick={() => setShowFilters((s) => !s)}>
            <Filter className="h-4 w-4" /> {tri(locale, { ar: 'فلاتر متقدمة', ku: 'فلتەری پێشکەوتوو', en: 'Advanced filters' })}
          </Button>
        </div>
      </Card>

      <div>
        <h2 className="mb-3 text-base font-semibold">
          {tri(locale, { ar: `المنتجات (${filtered?.length ?? 0})`, ku: `بەرهەمەکان (${filtered?.length ?? 0})`, en: `Products (${filtered?.length ?? 0})` })}
        </h2>

        {filtered === null ? (
          <div className="py-12 text-center text-muted-foreground">{t('common.loading')}</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Package}
            title={t('common.noData')}
            action={
              <Button asChild>
                <Link href={`/${locale}/dashboard/products/new`}>
                  <Plus className="h-4 w-4" /> {tri(locale, { ar: 'منتج جديد', ku: 'بەرهەمی نوێ', en: 'New product' })}
                </Link>
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <Card key={p.id} className="group relative overflow-hidden p-5 transition-all hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-mono text-muted-foreground">{p.sku}</p>
                    <h3 className="mt-1 truncate text-base font-bold">
                      {isAr ? p.nameAr : p.nameEn}
                    </h3>
                    <p className="mt-1.5 text-xl font-bold tabular-nums text-primary">
                      {parseFloat(p.salePrice).toLocaleString(isAr ? 'ar-IQ' : 'en')}
                      <span className="ms-1 text-xs font-normal text-muted-foreground">د.ع</span>
                    </p>
                  </div>
                  <Badge variant={p.isActive ? 'success' : 'outline'} className="shrink-0">
                    {p.isActive ? tri(locale, { ar: 'نشط', ku: 'چالاک', en: 'Active' }) : tri(locale, { ar: 'غير نشط', ku: 'ناچالاک', en: 'Inactive' })}
                  </Badge>
                </div>

                <div className="mt-3 flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
                  <span>
                    {p.isService
                      ? tri(locale, { ar: 'خدمة', ku: 'خزمەتگوزاری', en: 'Service' })
                      : `${tri(locale, { ar: 'المخزون:', ku: 'کۆگا:', en: 'Stock:' })} ${(p.stockQty ?? 0).toLocaleString(isAr ? 'ar-IQ' : 'en')}`}
                  </span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => copy(p.id)} title={tri(locale, { ar: 'نسخ', ku: 'کۆپیکردن', en: 'Copy' })}
                      className="rounded p-1 hover:bg-accent">
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <Link href={`/${locale}/dashboard/products/${p.id}/edit`} title={tri(locale, { ar: 'تعديل', ku: 'دەستکاری', en: 'Edit' })}
                      className="rounded p-1 hover:bg-accent">
                      <Edit className="h-3.5 w-3.5" />
                    </Link>
                    <Link href={`/${locale}/dashboard/products/${p.id}`} title={tri(locale, { ar: 'عرض', ku: 'بینین', en: 'View' })}
                      className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 font-medium text-primary hover:bg-primary/20">
                      <Eye className="h-3 w-3" />
                      {tri(locale, { ar: 'عرض', ku: 'بینین', en: 'View' })}
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

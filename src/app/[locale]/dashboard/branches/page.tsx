'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Building2, Plus, RefreshCw, Search, Mail, Phone, MapPin } from 'lucide-react';
import { CardGridSkeleton } from '@/components/ui/skeleton';

interface Branch {
  id: string; code: string; nameAr: string; nameEn: string;
  email: string | null; phone: string | null; governorate: string | null;
  city: string | null; status: 'ACTIVE' | 'INACTIVE' | 'CLOSED';
}

export default function BranchesPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const [rows, setRows] = useState<Branch[] | null>(null);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE' | 'CLOSED'>('ALL');

  async function load() {
    setRows(null);
    const r = await fetch('/api/branches');
    if (r.ok) setRows((await r.json()).data ?? []);
  }
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!rows) return null;
    const qq = q.trim().toLowerCase();
    return rows.filter((b) => {
      if (status !== 'ALL' && b.status !== status) return false;
      if (!qq) return true;
      return [b.code, b.nameAr, b.nameEn, b.email, b.phone, b.city, b.governorate]
        .some((v) => v?.toLowerCase().includes(qq));
    });
  }, [rows, q, status]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={isAr ? 'الفروع' : 'Branches'}
        description={isAr ? 'إدارة الفروع والمنافذ' : 'Manage company branches'}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={load}><RefreshCw className="h-4 w-4" /> {isAr ? 'تحديث' : 'Refresh'}</Button>
            <Button asChild>
              <Link href={`/${locale}/dashboard/branches/new`}>
                <Plus className="h-4 w-4" /> {isAr ? 'فرع جديد' : 'New branch'}
              </Link>
            </Button>
          </div>
        }
      />

      <Card>
        <CardContent className="grid gap-3 p-4 sm:grid-cols-[1fr_200px]">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="ps-9" placeholder={isAr ? 'بحث بالاسم أو الرمز…' : 'Search by name or code…'} value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <select className="h-9 rounded-md border bg-background px-3 text-sm" value={status} onChange={(e) => setStatus(e.target.value as never)}>
            <option value="ALL">{isAr ? 'الكل' : 'All status'}</option>
            <option value="ACTIVE">{isAr ? 'نشط' : 'Active'}</option>
            <option value="INACTIVE">{isAr ? 'غير نشط' : 'Inactive'}</option>
            <option value="CLOSED">{isAr ? 'مغلق' : 'Closed'}</option>
          </select>
        </CardContent>
      </Card>

      {filtered === null ? (
        <CardGridSkeleton count={6} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={isAr ? 'لا توجد فروع' : 'No branches found'}
          description={isAr ? 'ابدأ بإضافة فرع جديد' : 'Get started by creating a new branch'}
          action={
            <Button asChild>
              <Link href={`/${locale}/dashboard/branches/new`}>
                <Plus className="h-4 w-4" /> {isAr ? 'فرع جديد' : 'New branch'}
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((b) => (
            <Card key={b.id} className="transition-all hover:-translate-y-0.5 hover:shadow-md">
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold leading-tight">{isAr ? b.nameAr : b.nameEn}</p>
                      <p className="font-mono text-[11px] text-muted-foreground">{b.code}</p>
                    </div>
                  </div>
                  <Badge variant={b.status === 'ACTIVE' ? 'default' : 'secondary'}>
                    {b.status === 'ACTIVE' ? (isAr ? 'نشط' : 'Active') : b.status === 'INACTIVE' ? (isAr ? 'غير نشط' : 'Inactive') : (isAr ? 'مغلق' : 'Closed')}
                  </Badge>
                </div>
                <dl className="space-y-1.5 text-xs text-muted-foreground">
                  {b.phone && <div className="flex items-center gap-2"><Phone className="h-3 w-3" /> <span dir="ltr">{b.phone}</span></div>}
                  {b.email && <div className="flex items-center gap-2"><Mail className="h-3 w-3" /> <span dir="ltr" className="truncate">{b.email}</span></div>}
                  {(b.city || b.governorate) && <div className="flex items-center gap-2"><MapPin className="h-3 w-3" /> {[b.city, b.governorate].filter(Boolean).join(', ')}</div>}
                </dl>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

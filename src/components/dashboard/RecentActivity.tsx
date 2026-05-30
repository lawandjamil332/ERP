'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, FileText, CreditCard, Users, Package, Pencil, Plus, Trash2 } from 'lucide-react';
import { tri } from '@/lib/i18n/tri';

interface AuditEntry {
  id: string; entity: string; action: string; entityId: string;
  user: { email: string; fullName: string } | null;
  createdAt: string;
}

const ACTION_ICONS: Record<string, typeof Plus> = {
  create: Plus, update: Pencil, delete: Trash2,
};

const ACTION_COLORS: Record<string, string> = {
  create: 'text-emerald-600', update: 'text-blue-600', delete: 'text-rose-600',
};

const ENTITY_LABELS: Record<string, { ar: string; ku: string; en: string }> = {
  Invoice: { ar: 'فاتورة', ku: 'پسوولە', en: 'Invoice' },
  Payment: { ar: 'دفعة', ku: 'پارەدان', en: 'Payment' },
  Contact: { ar: 'جهة اتصال', ku: 'پەیوەندی', en: 'Contact' },
  Product: { ar: 'منتج', ku: 'بەرهەم', en: 'Product' },
  Journal: { ar: 'قيد', ku: 'تۆمار', en: 'Journal' },
  Employee: { ar: 'موظف', ku: 'کارمەند', en: 'Employee' },
  User: { ar: 'مستخدم', ku: 'بەکارهێنەر', en: 'User' },
  Bill: { ar: 'فاتورة شراء', ku: 'پسوولەی کڕین', en: 'Bill' },
  Approval: { ar: 'موافقة', ku: 'پەسەندکردن', en: 'Approval' },
};

const ACTION_LABELS: Record<string, { ar: string; ku: string; en: string }> = {
  create: { ar: 'إنشاء', ku: 'دروستکردن', en: 'Created' },
  update: { ar: 'تعديل', ku: 'دەستکاری', en: 'Updated' },
  delete: { ar: 'حذف', ku: 'سڕینەوە', en: 'Deleted' },
};

export function RecentActivity() {
  const locale = useLocale();
  const [entries, setEntries] = useState<AuditEntry[]>([]);

  useEffect(() => {
    fetch('/api/audit?limit=10')
      .then((r) => r.ok ? r.json() : { data: [] })
      .then((d) => setEntries(d.data ?? []));
  }, []);

  if (entries.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4 text-primary" />
          {tri(locale, { ar: 'آخر النشاطات', ku: 'دوایین چالاکییەکان', en: 'Recent Activity' })}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {entries.map((e) => {
          const Icon = ACTION_ICONS[e.action] ?? Pencil;
          const color = ACTION_COLORS[e.action] ?? 'text-muted-foreground';
          const entityLabel = tri(locale, ENTITY_LABELS[e.entity] ?? { ar: e.entity, ku: e.entity, en: e.entity });
          const actionLabel = tri(locale, ACTION_LABELS[e.action] ?? { ar: e.action, ku: e.action, en: e.action });
          const time = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(new Date(e.createdAt));
          const date = new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(new Date(e.createdAt));

          return (
            <div key={e.id} className="flex items-center gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50">
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted ${color}`}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate">
                  <span className="font-medium">{e.user?.fullName ?? e.user?.email ?? '—'}</span>
                  {' '}
                  <span className="text-muted-foreground">{actionLabel}</span>
                  {' '}
                  <Badge variant="outline" className="text-[10px]">{entityLabel}</Badge>
                </p>
              </div>
              <p className="shrink-0 text-xs tabular-nums text-muted-foreground">{date} {time}</p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

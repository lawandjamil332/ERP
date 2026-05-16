'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { Save } from 'lucide-react';
import { toast } from '@/lib/toast';

type MfgSettings = {
  autoGenerateCode?: boolean;
  autoCreateJournalEntry?: boolean;
  allowNegativeStock?: boolean;
  defaultStatus?: 'DRAFT' | 'RELEASED' | 'IN_PROGRESS';
  costingMethod?: 'STANDARD' | 'FIFO' | 'LIFO' | 'AVERAGE';
};

export default function ManufacturingSettingsPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const [s, setS] = useState<MfgSettings>({ defaultStatus: 'DRAFT', costingMethod: 'STANDARD' });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch('/api/ui-settings').then((r) => r.ok ? r.json() : { data: {} })
      .then((b) => setS({ defaultStatus: 'DRAFT', costingMethod: 'STANDARD', ...(b.data?.manufacturing as MfgSettings ?? {}) }));
  }, []);

  async function save() {
    setBusy(true);
    const res = await fetch('/api/ui-settings', {
      method: 'PATCH', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ manufacturing: s }),
    });
    setBusy(false);
    if (res.ok) toast.success(isAr ? 'تم الحفظ' : 'Saved');
  }

  function Toggle({ k, label, hint }: { k: keyof MfgSettings; label: string; hint: string }) {
    const on = !!s[k];
    return (
      <div className="flex items-start justify-between gap-3 rounded-lg border bg-background p-4">
        <div className="flex-1">
          <p className="font-medium leading-tight">{label}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
        </div>
        <button type="button" onClick={() => setS({ ...s, [k]: !on })}
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? 'bg-primary' : 'bg-muted'}`}>
          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? 'start-[22px]' : 'start-0.5'}`} />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isAr ? 'إعدادات التصنيع' : 'Manufacturing settings'}
        description={isAr ? 'سلوك التصنيع وطريقة التكلفة' : 'Manufacturing behavior and costing method'}
        actions={<Button onClick={save} disabled={busy}><Save className="h-4 w-4" /> {busy ? '…' : (isAr ? 'حفظ' : 'Save')}</Button>}
      />

      <Card>
        <CardHeader>
          <CardTitle>{isAr ? 'الإعدادات العامة' : 'General settings'}</CardTitle>
          <CardDescription>{isAr ? 'سلوك أوامر التصنيع' : 'Manufacturing order behavior'}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Toggle k="autoGenerateCode"
            label={isAr ? 'توليد الرمز تلقائياً' : 'Auto-generate code'}
            hint={isAr ? 'توليد رموز أوامر التصنيع تلقائياً' : 'Auto-generate manufacturing order codes'} />
          <Toggle k="autoCreateJournalEntry"
            label={isAr ? 'قيد محاسبي تلقائي' : 'Auto-create journal entry'}
            hint={isAr ? 'إنشاء قيد عند اكتمال أمر التصنيع' : 'Create journal entry when order completes'} />
          <Toggle k="allowNegativeStock"
            label={isAr ? 'السماح بالمخزون السالب' : 'Allow negative stock'}
            hint={isAr ? 'السماح بالإنتاج حتى لو لم تتوفر المواد' : 'Allow production even if materials unavailable'} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{isAr ? 'الحالة الافتراضية' : 'Default status'}</CardTitle></CardHeader>
        <CardContent>
          <select className="h-9 w-full rounded-md border bg-background px-3 text-sm"
            value={s.defaultStatus} onChange={(e) => setS({ ...s, defaultStatus: e.target.value as never })}>
            <option value="DRAFT">{isAr ? 'مسودة' : 'Draft'}</option>
            <option value="RELEASED">{isAr ? 'مُطلَق' : 'Released'}</option>
            <option value="IN_PROGRESS">{isAr ? 'قيد التنفيذ' : 'In progress'}</option>
          </select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{isAr ? 'طريقة التكلفة' : 'Costing method'}</CardTitle>
          <CardDescription>{isAr ? 'كيفية احتساب كلفة المنتج النهائي' : 'How finished goods cost is calculated'}</CardDescription>
        </CardHeader>
        <CardContent>
          <select className="h-9 w-full rounded-md border bg-background px-3 text-sm"
            value={s.costingMethod} onChange={(e) => setS({ ...s, costingMethod: e.target.value as never })}>
            <option value="STANDARD">{isAr ? 'تكلفة معيارية' : 'Standard Costing'}</option>
            <option value="FIFO">FIFO ({isAr ? 'الوارد أولاً يصرف أولاً' : 'First-in first-out'})</option>
            <option value="LIFO">LIFO ({isAr ? 'الوارد أخيراً يصرف أولاً' : 'Last-in first-out'})</option>
            <option value="AVERAGE">{isAr ? 'متوسط متحرّك' : 'Moving average'}</option>
          </select>
        </CardContent>
      </Card>
    </div>
  );
}

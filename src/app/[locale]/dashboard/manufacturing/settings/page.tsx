'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { Save } from 'lucide-react';
import { toast } from '@/lib/toast';
import { tri } from '@/lib/i18n/tri';

type MfgSettings = {
  autoGenerateCode?: boolean;
  autoCreateJournalEntry?: boolean;
  allowNegativeStock?: boolean;
  defaultStatus?: 'DRAFT' | 'RELEASED' | 'IN_PROGRESS';
  costingMethod?: 'STANDARD' | 'FIFO' | 'LIFO' | 'AVERAGE';
};

export default function ManufacturingSettingsPage() {
  const locale = useLocale();
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
    if (res.ok) toast.success(tri(locale, { ar: 'تم الحفظ', ku: 'پاشەکەوتکرا', en: 'Saved' }));
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
        title={tri(locale, { ar: 'إعدادات التصنيع', ku: 'ڕێکخستنەکانی بەرهەمهێنان', en: 'Manufacturing settings' })}
        description={tri(locale, { ar: 'سلوك التصنيع وطريقة التكلفة', ku: 'ڕەفتاری بەرهەمهێنان و شێوازی تێچوو', en: 'Manufacturing behavior and costing method' })}
        actions={<Button onClick={save} disabled={busy}><Save className="h-4 w-4" /> {busy ? '…' : tri(locale, { ar: 'حفظ', ku: 'پاشەکەوت', en: 'Save' })}</Button>}
      />

      <Card>
        <CardHeader>
          <CardTitle>{tri(locale, { ar: 'الإعدادات العامة', ku: 'ڕێکخستنە گشتییەکان', en: 'General settings' })}</CardTitle>
          <CardDescription>{tri(locale, { ar: 'سلوك أوامر التصنيع', ku: 'ڕەفتاری فەرمانەکانی بەرهەمهێنان', en: 'Manufacturing order behavior' })}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Toggle k="autoGenerateCode"
            label={tri(locale, { ar: 'توليد الرمز تلقائياً', ku: 'دروستکردنی کۆد بەخۆکار', en: 'Auto-generate code' })}
            hint={tri(locale, { ar: 'توليد رموز أوامر التصنيع تلقائياً', ku: 'دروستکردنی کۆدی فەرمانەکانی بەرهەمهێنان بەخۆکار', en: 'Auto-generate manufacturing order codes' })} />
          <Toggle k="autoCreateJournalEntry"
            label={tri(locale, { ar: 'قيد محاسبي تلقائي', ku: 'تۆمارکردنی ژمێریاری خۆکار', en: 'Auto-create journal entry' })}
            hint={tri(locale, { ar: 'إنشاء قيد عند اكتمال أمر التصنيع', ku: 'دروستکردنی تۆمار کاتی تەواوبوونی فەرمانی بەرهەمهێنان', en: 'Create journal entry when order completes' })} />
          <Toggle k="allowNegativeStock"
            label={tri(locale, { ar: 'السماح بالمخزون السالب', ku: 'ڕێگەدان بە کۆگای نەرێنی', en: 'Allow negative stock' })}
            hint={tri(locale, { ar: 'السماح بالإنتاج حتى لو لم تتوفر المواد', ku: 'ڕێگەدان بە بەرهەمهێنان تەنانەت ئەگەر کەرەستەکان بەردەست نەبن', en: 'Allow production even if materials unavailable' })} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{tri(locale, { ar: 'الحالة الافتراضية', ku: 'دۆخی بنەڕەت', en: 'Default status' })}</CardTitle></CardHeader>
        <CardContent>
          <select className="h-9 w-full rounded-md border bg-background px-3 text-sm"
            value={s.defaultStatus} onChange={(e) => setS({ ...s, defaultStatus: e.target.value as never })}>
            <option value="DRAFT">{tri(locale, { ar: 'مسودة', ku: 'ڕەشنووس', en: 'Draft' })}</option>
            <option value="RELEASED">{tri(locale, { ar: 'مُطلَق', ku: 'بڵاوکراوە', en: 'Released' })}</option>
            <option value="IN_PROGRESS">{tri(locale, { ar: 'قيد التنفيذ', ku: 'لە جێبەجێکردندایە', en: 'In progress' })}</option>
          </select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{tri(locale, { ar: 'طريقة التكلفة', ku: 'شێوازی تێچوو', en: 'Costing method' })}</CardTitle>
          <CardDescription>{tri(locale, { ar: 'كيفية احتساب كلفة المنتج النهائي', ku: 'چۆنیەتی ژماردنی تێچووی بەرهەمی کۆتایی', en: 'How finished goods cost is calculated' })}</CardDescription>
        </CardHeader>
        <CardContent>
          <select className="h-9 w-full rounded-md border bg-background px-3 text-sm"
            value={s.costingMethod} onChange={(e) => setS({ ...s, costingMethod: e.target.value as never })}>
            <option value="STANDARD">{tri(locale, { ar: 'تكلفة معيارية', ku: 'تێچووی ستانداردی', en: 'Standard Costing' })}</option>
            <option value="FIFO">FIFO ({tri(locale, { ar: 'الوارد أولاً يصرف أولاً', ku: 'یەکەم هاتوو یەکەم دەردەچێت', en: 'First-in first-out' })})</option>
            <option value="LIFO">LIFO ({tri(locale, { ar: 'الوارد أخيراً يصرف أولاً', ku: 'دواهەمین هاتوو یەکەم دەردەچێت', en: 'Last-in first-out' })})</option>
            <option value="AVERAGE">{tri(locale, { ar: 'متوسط متحرّك', ku: 'تێکڕای جووڵاو', en: 'Moving average' })}</option>
          </select>
        </CardContent>
      </Card>
    </div>
  );
}

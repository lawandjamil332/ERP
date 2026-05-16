'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { Save } from 'lucide-react';
import { toast } from '@/lib/toast';

type InvSettings = {
  allowNegativeInventory?: boolean;
  stockOrdersSales?: boolean;
  stockOrdersPurchases?: boolean;
  trackExpiry?: boolean;
  trackLotNumber?: boolean;
  trackSerialNumber?: boolean;
  hideDiscountColumn?: boolean;
  hideTaxColumn?: boolean;
};

export default function InventorySettingsPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const [s, setS] = useState<InvSettings>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch('/api/ui-settings').then((r) => r.ok ? r.json() : { data: {} })
      .then((b) => setS((b.data?.inventory as InvSettings) ?? {}));
  }, []);

  async function save() {
    setBusy(true);
    const res = await fetch('/api/ui-settings', {
      method: 'PATCH', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ inventory: s }),
    });
    setBusy(false);
    if (res.ok) toast.success(isAr ? 'تم الحفظ' : 'Saved');
    else toast.error('failed');
  }

  function Toggle({ k, label, hint }: { k: keyof InvSettings; label: string; hint: string }) {
    const on = !!s[k];
    return (
      <div className="flex items-start justify-between gap-3 rounded-lg border bg-background p-4">
        <div className="flex-1">
          <p className="font-medium leading-tight">{label}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
        </div>
        <button type="button" onClick={() => setS({ ...s, [k]: !on })}
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? 'bg-primary' : 'bg-muted'}`}
          aria-pressed={on}>
          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? 'start-[22px]' : 'start-0.5'}`} />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isAr ? 'إعدادات المخزون' : 'Inventory settings'}
        description={isAr ? 'قواعد المخزون والتتبع والعرض' : 'Stock rules, tracking, and column visibility'}
        actions={
          <Button onClick={save} disabled={busy}>
            <Save className="h-4 w-4" /> {busy ? (isAr ? 'جارٍ الحفظ…' : 'Saving…') : (isAr ? 'حفظ' : 'Save settings')}
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>{isAr ? 'قواعد عامة' : 'General rules'}</CardTitle>
          <CardDescription>
            {isAr ? 'حدّد سلوك المخزون أثناء البيع والشراء' : 'Behavior during sales and purchases'}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Toggle k="allowNegativeInventory"
            label={isAr ? 'السماح بالمخزون السالب' : 'Allow negative inventory'}
            hint={isAr ? 'السماح بالبيع حتى لو لم تتوفر الكمية في المخزن' : 'Allow selling more than available stock'} />
          <Toggle k="stockOrdersSales"
            label={isAr ? 'أوامر مخزون — مبيعات' : 'Stock orders — sales'}
            hint={isAr ? 'تفعيل أوامر المخزون لفواتير البيع والمرتجعات' : 'Enable stock orders for invoices and returns'} />
          <Toggle k="stockOrdersPurchases"
            label={isAr ? 'أوامر مخزون — مشتريات' : 'Stock orders — purchases'}
            hint={isAr ? 'تفعيل أوامر المخزون لفواتير الشراء' : 'Enable stock orders for purchase invoices'} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{isAr ? 'التتبّع التفصيلي' : 'Detailed tracking'}</CardTitle>
          <CardDescription>
            {isAr ? 'تتبّع الأصناف بأرقام الإرسالية والتسلسل وتواريخ النفاد' : 'Track stock by lot, serial number, and expiry date'}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Toggle k="trackExpiry"
            label={isAr ? 'تواريخ النفاد' : 'Expiry dates'}
            hint={isAr ? 'مطلوب للأدوية والأغذية' : 'Required for pharma and food'} />
          <Toggle k="trackLotNumber"
            label={isAr ? 'أرقام الإرسالية (Lot)' : 'Lot numbers'}
            hint={isAr ? 'تتبّع دفعات الإنتاج' : 'Track production batches'} />
          <Toggle k="trackSerialNumber"
            label={isAr ? 'الأرقام التسلسلية' : 'Serial numbers'}
            hint={isAr ? 'للأجهزة والإلكترونيات' : 'For electronics and devices'} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{isAr ? 'عرض الأعمدة' : 'Column visibility'}</CardTitle>
          <CardDescription>
            {isAr ? 'إخفاء أعمدة لا تحتاجها على الفواتير' : 'Hide unused columns on invoices'}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Toggle k="hideDiscountColumn"
            label={isAr ? 'إخفاء عمود الخصم' : 'Hide discount column'}
            hint={isAr ? 'إخفاء عمود الخصم في الفواتير' : 'Hide discount column on invoices'} />
          <Toggle k="hideTaxColumn"
            label={isAr ? 'إخفاء عمود الضريبة' : 'Hide tax column'}
            hint={isAr ? 'إخفاء عمود الضريبة في الفواتير' : 'Hide tax column on invoices'} />
        </CardContent>
      </Card>
    </div>
  );
}

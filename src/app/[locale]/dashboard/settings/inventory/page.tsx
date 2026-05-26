'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { Save } from 'lucide-react';
import { toast } from '@/lib/toast';
import { tri } from '@/lib/i18n/tri';

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
    if (res.ok) toast.success(tri(locale, { ar: 'تم الحفظ', ku: 'پاشەکەوت کرا', en: 'Saved' }));
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
        title={tri(locale, { ar: 'إعدادات المخزون', ku: 'ڕێکخستنەکانی کۆگا', en: 'Inventory settings' })}
        description={tri(locale, { ar: 'قواعد المخزون والتتبع والعرض', ku: 'یاساکانی کۆگا و بەدواداچوون و پیشاندان', en: 'Stock rules, tracking, and column visibility' })}
        actions={
          <Button onClick={save} disabled={busy}>
            <Save className="h-4 w-4" /> {busy ? tri(locale, { ar: 'جارٍ الحفظ…', ku: 'پاشەکەوت دەکرێت…', en: 'Saving…' }) : tri(locale, { ar: 'حفظ', ku: 'پاشەکەوتکردنی ڕێکخستنەکان', en: 'Save settings' })}
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>{tri(locale, { ar: 'قواعد عامة', ku: 'یاسا گشتییەکان', en: 'General rules' })}</CardTitle>
          <CardDescription>
            {tri(locale, { ar: 'حدّد سلوك المخزون أثناء البيع والشراء', ku: 'ڕەفتاری کۆگا لە کاتی فرۆشتن و کڕیندا دیاری بکە', en: 'Behavior during sales and purchases' })}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Toggle k="allowNegativeInventory"
            label={tri(locale, { ar: 'السماح بالمخزون السالب', ku: 'ڕێگەدان بە کۆگای نەرێنی', en: 'Allow negative inventory' })}
            hint={tri(locale, { ar: 'السماح بالبيع حتى لو لم تتوفر الكمية في المخزن', ku: 'ڕێگەدان بە فرۆشتن تەنانەت ئەگەر بڕەکە لە کۆگادا نەبێت', en: 'Allow selling more than available stock' })} />
          <Toggle k="stockOrdersSales"
            label={tri(locale, { ar: 'أوامر مخزون — مبيعات', ku: 'داواکارییەکانی کۆگا — فرۆشتن', en: 'Stock orders — sales' })}
            hint={tri(locale, { ar: 'تفعيل أوامر المخزون لفواتير البيع والمرتجعات', ku: 'چالاککردنی داواکارییەکانی کۆگا بۆ پسوڵەکانی فرۆشتن و گەڕاوەکان', en: 'Enable stock orders for invoices and returns' })} />
          <Toggle k="stockOrdersPurchases"
            label={tri(locale, { ar: 'أوامر مخزون — مشتريات', ku: 'داواکارییەکانی کۆگا — کڕین', en: 'Stock orders — purchases' })}
            hint={tri(locale, { ar: 'تفعيل أوامر المخزون لفواتير الشراء', ku: 'چالاککردنی داواکارییەکانی کۆگا بۆ پسوڵەکانی کڕین', en: 'Enable stock orders for purchase invoices' })} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{tri(locale, { ar: 'التتبّع التفصيلي', ku: 'بەدواداچوونی وردەکاری', en: 'Detailed tracking' })}</CardTitle>
          <CardDescription>
            {tri(locale, { ar: 'تتبّع الأصناف بأرقام الإرسالية والتسلسل وتواريخ النفاد', ku: 'بەدواداچوونی کاڵاکان بە ژمارەی لۆت و زنجیرە و بەرواری بەسەرچوون', en: 'Track stock by lot, serial number, and expiry date' })}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Toggle k="trackExpiry"
            label={tri(locale, { ar: 'تواريخ النفاد', ku: 'بەرواری بەسەرچوون', en: 'Expiry dates' })}
            hint={tri(locale, { ar: 'مطلوب للأدوية والأغذية', ku: 'پێویستە بۆ دەرمان و خواردن', en: 'Required for pharma and food' })} />
          <Toggle k="trackLotNumber"
            label={tri(locale, { ar: 'أرقام الإرسالية (Lot)', ku: 'ژمارەی لۆت (Lot)', en: 'Lot numbers' })}
            hint={tri(locale, { ar: 'تتبّع دفعات الإنتاج', ku: 'بەدواداچوونی بەشەکانی بەرهەمهێنان', en: 'Track production batches' })} />
          <Toggle k="trackSerialNumber"
            label={tri(locale, { ar: 'الأرقام التسلسلية', ku: 'ژمارە زنجیرەییەکان', en: 'Serial numbers' })}
            hint={tri(locale, { ar: 'للأجهزة والإلكترونيات', ku: 'بۆ ئامێر و ئەلیکترۆنیات', en: 'For electronics and devices' })} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{tri(locale, { ar: 'عرض الأعمدة', ku: 'پیشاندانی ستوونەکان', en: 'Column visibility' })}</CardTitle>
          <CardDescription>
            {tri(locale, { ar: 'إخفاء أعمدة لا تحتاجها على الفواتير', ku: 'شاردنەوەی ئەو ستوونانەی پێویستت پێیان نییە لەسەر پسوڵەکان', en: 'Hide unused columns on invoices' })}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Toggle k="hideDiscountColumn"
            label={tri(locale, { ar: 'إخفاء عمود الخصم', ku: 'شاردنەوەی ستوونی داشکاندن', en: 'Hide discount column' })}
            hint={tri(locale, { ar: 'إخفاء عمود الخصم في الفواتير', ku: 'شاردنەوەی ستوونی داشکاندن لە پسوڵەکاندا', en: 'Hide discount column on invoices' })} />
          <Toggle k="hideTaxColumn"
            label={tri(locale, { ar: 'إخفاء عمود الضريبة', ku: 'شاردنەوەی ستوونی باج', en: 'Hide tax column' })}
            hint={tri(locale, { ar: 'إخفاء عمود الضريبة في الفواتير', ku: 'شاردنەوەی ستوونی باج لە پسوڵەکاندا', en: 'Hide tax column on invoices' })} />
        </CardContent>
      </Card>
    </div>
  );
}

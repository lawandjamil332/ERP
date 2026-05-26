'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { FileText, Receipt, ShoppingCart, Truck, ScrollText, Banknote } from 'lucide-react';
import { tri } from '@/lib/i18n/tri';

const KINDS = [
  { kind: 'SALES_INVOICE', titleAr: 'فاتورة بيع', titleKu: 'پسوڵەی فرۆشتن', titleEn: 'Sales invoice', Icon: FileText, tone: 'from-emerald-500 to-emerald-700' },
  { kind: 'PURCHASE_INVOICE', titleAr: 'فاتورة شراء', titleKu: 'پسوڵەی کڕین', titleEn: 'Purchase invoice', Icon: ShoppingCart, tone: 'from-teal-500 to-teal-700' },
  { kind: 'QUOTATION', titleAr: 'عرض سعر', titleKu: 'نرخاندن', titleEn: 'Quotation', Icon: ScrollText, tone: 'from-violet-500 to-violet-700' },
  { kind: 'PAYMENT_RECEIPT', titleAr: 'إيصال قبض', titleKu: 'پسووڵەی وەرگرتن', titleEn: 'Payment receipt', Icon: Receipt, tone: 'from-fuchsia-500 to-fuchsia-700' },
  { kind: 'EXPENSE_VOUCHER', titleAr: 'سند صرف', titleKu: 'سەنەدی خەرجکردن', titleEn: 'Expense voucher', Icon: Banknote, tone: 'from-amber-500 to-amber-700' },
  { kind: 'DELIVERY_NOTE', titleAr: 'إذن تسليم', titleKu: 'مۆڵەتی گەیاندن', titleEn: 'Delivery note', Icon: Truck, tone: 'from-sky-500 to-sky-700' },
];

export default function PrintableTemplatesPage() {
  const locale = useLocale();

  return (
    <div className="space-y-6">
      <PageHeader
        title={tri(locale, { ar: 'قوالب الطباعة', ku: 'قاڵبەکانی چاپ', en: 'Printable templates' })}
        description={tri(locale, { ar: 'خصّص شكل وألوان كل مستند مطبوع', ku: 'شێوە و ڕەنگی هەر بەڵگەنامەیەکی چاپکراو دیاری بکە', en: 'Customize layout, colors, and text of every printable' })}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {KINDS.map((k) => (
          <Link key={k.kind} href={`/${locale}/dashboard/templates/${k.kind.toLowerCase()}`}>
            <Card className="group h-full overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lg">
              <div className={`bg-gradient-to-br ${k.tone} p-8 text-center text-white`}>
                <k.Icon className="mx-auto h-10 w-10 opacity-90" />
              </div>
              <CardContent className="p-3">
                <p className="text-sm font-semibold">{tri(locale, { ar: k.titleAr, ku: k.titleKu, en: k.titleEn })}</p>
                <p className="text-xs text-muted-foreground">
                  {tri(locale, { ar: 'اضغط لتحرير القالب', ku: 'بۆ دەستکاری قاڵب کلیک بکە', en: 'Click to edit layout' })}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

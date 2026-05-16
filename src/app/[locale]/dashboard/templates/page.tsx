'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { FileText, Receipt, ShoppingCart, Truck, ScrollText, Banknote } from 'lucide-react';

const KINDS = [
  { kind: 'SALES_INVOICE', titleAr: 'فاتورة بيع', titleEn: 'Sales invoice', Icon: FileText, tone: 'from-emerald-500 to-emerald-700' },
  { kind: 'PURCHASE_INVOICE', titleAr: 'فاتورة شراء', titleEn: 'Purchase invoice', Icon: ShoppingCart, tone: 'from-teal-500 to-teal-700' },
  { kind: 'QUOTATION', titleAr: 'عرض سعر', titleEn: 'Quotation', Icon: ScrollText, tone: 'from-violet-500 to-violet-700' },
  { kind: 'PAYMENT_RECEIPT', titleAr: 'إيصال قبض', titleEn: 'Payment receipt', Icon: Receipt, tone: 'from-fuchsia-500 to-fuchsia-700' },
  { kind: 'EXPENSE_VOUCHER', titleAr: 'سند صرف', titleEn: 'Expense voucher', Icon: Banknote, tone: 'from-amber-500 to-amber-700' },
  { kind: 'DELIVERY_NOTE', titleAr: 'إذن تسليم', titleEn: 'Delivery note', Icon: Truck, tone: 'from-sky-500 to-sky-700' },
];

export default function PrintableTemplatesPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';

  return (
    <div className="space-y-6">
      <PageHeader
        title={isAr ? 'قوالب الطباعة' : 'Printable templates'}
        description={isAr ? 'خصّص شكل وألوان كل مستند مطبوع' : 'Customize layout, colors, and text of every printable'}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {KINDS.map((k) => (
          <Link key={k.kind} href={`/${locale}/dashboard/templates/${k.kind.toLowerCase()}`}>
            <Card className="group h-full overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lg">
              <div className={`bg-gradient-to-br ${k.tone} p-8 text-center text-white`}>
                <k.Icon className="mx-auto h-10 w-10 opacity-90" />
              </div>
              <CardContent className="p-3">
                <p className="text-sm font-semibold">{isAr ? k.titleAr : k.titleEn}</p>
                <p className="text-xs text-muted-foreground">
                  {isAr ? 'اضغط لتحرير القالب' : 'Click to edit layout'}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

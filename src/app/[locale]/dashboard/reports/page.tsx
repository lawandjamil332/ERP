'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import {
  ShoppingCart, Truck, Calculator, Boxes, Users, Store,
  FileText, ArrowRight, TrendingUp, TrendingDown, ShieldQuestion,
} from 'lucide-react';
import { tri } from '@/lib/i18n/tri';

interface Group {
  id: string;
  titleAr: string; titleKu: string; titleEn: string;
  descAr: string; descKu: string; descEn: string;
  href: string;
  tone: string;
  Icon: typeof FileText;
}

const GROUPS: Group[] = [
  { id: 'sales', titleAr: 'تقارير المبيعات', titleKu: 'ڕاپۆرتەکانی فرۆشتن', titleEn: 'Sales Reports', descAr: 'الفواتير والمدفوعات والأرباح', descKu: 'پسوڵەکان و پارەدانەکان و قازانج', descEn: 'Invoices, payments, and profit', href: 'reports/sales', tone: 'from-emerald-600 to-emerald-800', Icon: ShoppingCart },
  { id: 'purchases', titleAr: 'تقارير المشتريات', titleKu: 'ڕاپۆرتەکانی کڕین', titleEn: 'Purchase Reports', descAr: 'فواتير المشتريات والمدفوعات', descKu: 'پسوڵەکانی کڕین و پارەدانەکان', descEn: 'Purchase invoices and payments', href: 'reports/purchases', tone: 'from-teal-600 to-teal-800', Icon: Truck },
  { id: 'accounting', titleAr: 'التقارير المحاسبية', titleKu: 'ڕاپۆرتە ژمێریارییەکان', titleEn: 'Accounting Reports', descAr: 'المقبوضات والمصروفات والقوائم الرئيسية', descKu: 'وەرگیراوەکان و خەرجییەکان و لیستە سەرەکییەکان', descEn: 'Receipts, expenses, financial statements', href: 'reports/accounting', tone: 'from-violet-600 to-purple-800', Icon: Calculator },
  { id: 'inventory', titleAr: 'تقارير المخزون', titleKu: 'ڕاپۆرتەکانی کۆگا', titleEn: 'Inventory Reports', descAr: 'الرصيد والحركة والتقييم', descKu: 'باڵانس و جووڵە و نرخاندن', descEn: 'Stock, movement, and valuation', href: 'reports/inventory', tone: 'from-sky-600 to-blue-800', Icon: Boxes },
  { id: 'customers', titleAr: 'تقارير العملاء', titleKu: 'ڕاپۆرتەکانی کڕیاران', titleEn: 'Customer Reports', descAr: 'كشوف الحساب وأعمار الذمم', descKu: 'کەشفی حیساب و تەمەنی قەرزەکان', descEn: 'Statements and aging', href: 'reports/customers', tone: 'from-blue-600 to-indigo-800', Icon: Users },
  { id: 'suppliers', titleAr: 'تقارير الموردين', titleKu: 'ڕاپۆرتەکانی دابینکەران', titleEn: 'Supplier Reports', descAr: 'نشاط حساب المورد', descKu: 'چالاکی حیسابی دابینکەر', descEn: 'Supplier account activity', href: 'reports/suppliers', tone: 'from-cyan-600 to-teal-800', Icon: Store },
  { id: 'profit', titleAr: 'تقارير الأرباح', titleKu: 'ڕاپۆرتەکانی قازانج', titleEn: 'Profit Reports', descAr: 'يومي / أسبوعي / شهري / سنوي', descKu: 'ڕۆژانە / هەفتانە / مانگانە / ساڵانە', descEn: 'Daily / weekly / monthly / yearly', href: 'reports/profit', tone: 'from-fuchsia-600 to-pink-800', Icon: TrendingUp },
  { id: 'aging', titleAr: 'أعمار الذمم', titleKu: 'تەمەنی قەرزەکان', titleEn: 'Aging Reports', descAr: 'فواتير وحركات الحساب', descKu: 'ئاستی پسوڵە و جووڵەی حیساب', descEn: 'Invoice-level and ledger-level', href: 'reports/aging', tone: 'from-rose-600 to-red-800', Icon: TrendingDown },
  { id: 'diwan', titleAr: 'تدقيق ديوان الرقابة', titleKu: 'پشکنینی دیوانی چاودێری', titleEn: 'Diwan Audit', descAr: 'حزمة التدقيق الرسمية', descKu: 'پاکێجی پشکنینی فەرمی', descEn: 'Official audit pack', href: 'reports/diwan', tone: 'from-amber-600 to-orange-800', Icon: ShieldQuestion },
];

export default function ReportsHubPage() {
  const locale = useLocale();

  return (
    <div className="space-y-6">
      <PageHeader
        title={tri(locale, { ar: 'التقارير والتحليلات', ku: 'ڕاپۆرت و شیکارییەکان', en: 'Reports & Analytics' })}
        description={tri(locale, { ar: 'كل التقارير الرسمية والتحليلية في مكان واحد', ku: 'هەموو ڕاپۆرتە فەرمی و شیکارییەکان لە یەک شوێندا', en: 'Every official and analytical report in one place' })}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {GROUPS.map((g) => (
          <Link key={g.id} href={`/${locale}/dashboard/${g.href}`}>
            <Card className="group h-full overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lg">
              <div className={`bg-gradient-to-br ${g.tone} p-4 text-white`}>
                <div className="flex items-start justify-between">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-white/20 backdrop-blur">
                    <g.Icon className="h-5 w-5" />
                  </div>
                  <ArrowRight className="h-4 w-4 opacity-60 transition-transform group-hover:translate-x-0.5" />
                </div>
                <p className="mt-3 text-lg font-bold">{tri(locale, { ar: g.titleAr, ku: g.titleKu, en: g.titleEn })}</p>
                <p className="text-xs text-white/80">{tri(locale, { ar: g.descAr, ku: g.descKu, en: g.descEn })}</p>
              </div>
              <CardContent className="p-3 text-xs text-muted-foreground">
                {tri(locale, { ar: 'افتح المجموعة لاستعراض التقارير', ku: 'گرووپەکە بکەرەوە بۆ بینینی ڕاپۆرتەکان', en: 'Open the group to browse reports' })}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

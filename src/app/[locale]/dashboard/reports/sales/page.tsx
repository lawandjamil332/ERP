'use client';

import { ReportCatalog } from '@/components/ui/report-catalog';
import { ShoppingCart, FileText, CreditCard, TrendingUp, CalendarDays, CalendarRange, Calendar } from 'lucide-react';

export default function SalesReportsPage() {
  return (
    <ReportCatalog
      bannerTone="from-emerald-600 to-emerald-800"
      bannerTitleAr="تقارير المبيعات" bannerTitleEn="Sales Reports"
      bannerDescAr="فواتير، مدفوعات، أرباح" bannerDescEn="Invoices, payments, and profit"
      BannerIcon={ShoppingCart}
      sections={[
        { labelAr: 'نظرة عامة', labelEn: 'Overview', items: [
          { href: 'reports/sales/invoices', titleAr: 'تقارير الفواتير', titleEn: 'Invoice Reports', descAr: 'قائمة الفواتير والمجاميع', descEn: 'Sales invoices listing and totals', Icon: FileText },
          { href: 'reports/sales/payments', titleAr: 'تقارير المدفوعات', titleEn: 'Payment Reports', descAr: 'مقبوضات العملاء', descEn: 'Incoming customer payments', Icon: CreditCard },
          { href: 'reports/profit', titleAr: 'تقارير الأرباح', titleEn: 'Profit Reports', descAr: 'الهامش والربحية', descEn: 'Margin and profitability', Icon: TrendingUp },
        ]},
        { labelAr: 'الفواتير', labelEn: 'Invoices', items: [
          { href: 'reports/sales/by-client', titleAr: 'المبيعات حسب الزبون', titleEn: 'Invoices by Client', descAr: 'البنود مجمّعة حسب الزبون', descEn: 'Invoice rows grouped by customer' },
          { href: 'reports/sales/by-employee', titleAr: 'المبيعات حسب البائع', titleEn: 'Invoices by Employee', descAr: 'البنود مجمّعة حسب البائع', descEn: 'Invoice rows grouped by staff' },
          { href: 'reports/sales/daily', titleAr: 'مبيعات يومية', titleEn: 'Daily Invoice Sales', descAr: 'مجمّع حسب اليوم', descEn: 'Invoices grouped by day', Icon: CalendarDays },
          { href: 'reports/sales/weekly', titleAr: 'مبيعات أسبوعية', titleEn: 'Weekly Invoice Sales', descAr: 'مجمّع حسب الأسبوع', descEn: 'Invoices grouped by week', Icon: CalendarRange },
          { href: 'reports/sales/monthly', titleAr: 'مبيعات شهرية', titleEn: 'Monthly Invoice Sales', descAr: 'مجمّع حسب الشهر', descEn: 'Invoices grouped by month', Icon: Calendar },
          { href: 'reports/sales/yearly', titleAr: 'مبيعات سنوية', titleEn: 'Yearly Invoice Sales', descAr: 'مجمّع حسب السنة', descEn: 'Invoices grouped by year', Icon: Calendar },
        ]},
        { labelAr: 'المدفوعات', labelEn: 'Payments', items: [
          { href: 'reports/sales/payments-by-client', titleAr: 'المدفوعات حسب الزبون', titleEn: 'Payments by Client', descAr: 'مجمّع حسب الزبون', descEn: 'Grouped by customer' },
          { href: 'reports/sales/payments-by-employee', titleAr: 'المدفوعات حسب الموظف', titleEn: 'Payments by Employee', descAr: 'مجمّع حسب الموظف', descEn: 'Grouped by staff' },
          { href: 'reports/sales/payments-daily', titleAr: 'مدفوعات يومية', titleEn: 'Daily Payments', descAr: 'مجمّع حسب اليوم', descEn: 'Grouped by day' },
          { href: 'reports/sales/payments-monthly', titleAr: 'مدفوعات شهرية', titleEn: 'Monthly Payments', descAr: 'مجمّع حسب الشهر', descEn: 'Grouped by month' },
        ]},
        { labelAr: 'الأرباح', labelEn: 'Profit', items: [
          { href: 'reports/profit/by-client', titleAr: 'الربح حسب الزبون', titleEn: 'Profit by Client', descAr: 'هامش الربح لكل زبون', descEn: 'Profit margin per customer' },
          { href: 'reports/profit/by-employee', titleAr: 'الربح حسب الموظف', titleEn: 'Profit by Employee', descAr: 'هامش الربح لكل موظف', descEn: 'Profit margin per staff' },
          { href: 'reports/profit/daily', titleAr: 'ربح يومي', titleEn: 'Daily Profits', descAr: 'مجمّع حسب اليوم', descEn: 'Grouped by day' },
          { href: 'reports/profit/monthly', titleAr: 'ربح شهري', titleEn: 'Monthly Profits', descAr: 'مجمّع حسب الشهر', descEn: 'Grouped by month' },
        ]},
      ]}
    />
  );
}

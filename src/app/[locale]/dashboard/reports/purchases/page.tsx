'use client';

import { ReportCatalog } from '@/components/ui/report-catalog';
import { Truck, FileText, CreditCard, CalendarDays, Calendar, CalendarRange, Store } from 'lucide-react';

export default function PurchaseReportsPage() {
  return (
    <ReportCatalog
      bannerTone="from-teal-600 to-teal-800"
      bannerTitleAr="تقارير المشتريات" bannerTitleEn="Purchase Reports"
      bannerDescAr="فواتير المشتريات والمدفوعات" bannerDescEn="Purchase invoices and payments"
      BannerIcon={Truck}
      sections={[
        { labelAr: 'نظرة عامة', labelEn: 'Overview', items: [
          { href: 'reports/purchases/invoices', titleAr: 'تقارير الفواتير', titleEn: 'Invoice Reports', descAr: 'فواتير المشتريات', descEn: 'Purchase invoices', Icon: FileText },
          { href: 'reports/purchases/payments', titleAr: 'تقارير المدفوعات', titleEn: 'Payment Reports', descAr: 'مدفوعات الموردين', descEn: 'Outgoing supplier payments', Icon: CreditCard },
        ]},
        { labelAr: 'الفواتير', labelEn: 'Invoices', items: [
          { href: 'reports/purchases/by-supplier', titleAr: 'المشتريات حسب المورد', titleEn: 'Purchases by Supplier', descAr: 'البنود مجمّعة حسب المورد', descEn: 'Invoice rows grouped by supplier' },
          { href: 'reports/purchases/by-employee', titleAr: 'المشتريات حسب الموظف', titleEn: 'Purchases by Employee', descAr: 'البنود مجمّعة حسب الموظف', descEn: 'Invoice rows grouped by staff' },
          { href: 'reports/purchases/daily', titleAr: 'مشتريات يومية', titleEn: 'Daily Purchase Invoices', descAr: 'مجمّع حسب اليوم', descEn: 'Grouped by day', Icon: CalendarDays },
          { href: 'reports/purchases/weekly', titleAr: 'مشتريات أسبوعية', titleEn: 'Weekly Purchase Invoices', descAr: 'مجمّع حسب الأسبوع', descEn: 'Grouped by week', Icon: CalendarRange },
          { href: 'reports/purchases/monthly', titleAr: 'مشتريات شهرية', titleEn: 'Monthly Purchase Invoices', descAr: 'مجمّع حسب الشهر', descEn: 'Grouped by month', Icon: Calendar },
          { href: 'reports/purchases/yearly', titleAr: 'مشتريات سنوية', titleEn: 'Yearly Purchase Invoices', descAr: 'مجمّع حسب السنة', descEn: 'Grouped by year', Icon: Calendar },
        ]},
        { labelAr: 'المدفوعات', labelEn: 'Payments', items: [
          { href: 'reports/purchases/payments-by-supplier', titleAr: 'المدفوعات حسب المورد', titleEn: 'Payments by Supplier', descAr: 'مجمّع حسب المورد', descEn: 'Grouped by supplier' },
          { href: 'reports/purchases/payments-by-employee', titleAr: 'المدفوعات حسب الموظف', titleEn: 'Payments by Employee', descAr: 'مجمّع حسب الموظف', descEn: 'Grouped by staff' },
          { href: 'reports/purchases/payments-daily', titleAr: 'مدفوعات يومية', titleEn: 'Daily Payments', descAr: 'مجمّع حسب اليوم', descEn: 'Grouped by day' },
          { href: 'reports/purchases/payments-monthly', titleAr: 'مدفوعات شهرية', titleEn: 'Monthly Payments', descAr: 'مجمّع حسب الشهر', descEn: 'Grouped by month' },
        ]},
        { labelAr: 'المورد', labelEn: 'Supplier', items: [
          { href: 'reports/suppliers/statement', titleAr: 'كشوف الموردين', titleEn: 'Supplier Statements', descAr: 'الرصيد الجاري لكل مورد', descEn: 'Running balance per supplier', Icon: Store },
        ]},
      ]}
    />
  );
}

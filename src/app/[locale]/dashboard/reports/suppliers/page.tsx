'use client';

import { ReportCatalog } from '@/components/ui/report-catalog';
import { Store, FileText } from 'lucide-react';

export default function SupplierReportsPage() {
  return (
    <ReportCatalog
      bannerTone="from-cyan-600 to-teal-800"
      bannerTitleAr="تقارير الموردين" bannerTitleEn="Supplier Reports"
      bannerDescAr="نشاط حساب المورد" bannerDescEn="Supplier account activity"
      BannerIcon={Store}
      sections={[
        { labelAr: 'الموردون', labelEn: 'Suppliers', items: [
          { href: 'reports/suppliers/statement', titleAr: 'كشوف الموردين', titleEn: 'Supplier Statements', descAr: 'الرصيد الجاري لكل مورد', descEn: 'Running balance per supplier', Icon: FileText },
          { href: 'reports/suppliers/balance', titleAr: 'أرصدة الموردين', titleEn: 'Suppliers Balance', descAr: 'الرصيد الجاري', descEn: 'Running balance per supplier' },
          { href: 'reports/suppliers/purchases', titleAr: 'مشتريات الموردين', titleEn: 'Suppliers Purchases', descAr: 'مجمّع حسب المورد', descEn: 'Grouped by supplier' },
          { href: 'reports/suppliers/payments', titleAr: 'مدفوعات الموردين', titleEn: 'Suppliers Payments', descAr: 'مجمّع حسب المورد', descEn: 'Grouped by supplier' },
        ]},
      ]}
    />
  );
}

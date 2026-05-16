'use client';

import { ReportCatalog } from '@/components/ui/report-catalog';
import { Boxes, Package, ArrowLeftRight, ScanBarcode, Calculator, FileText } from 'lucide-react';

export default function InventoryReportsPage() {
  return (
    <ReportCatalog
      bannerTone="from-sky-600 to-blue-800"
      bannerTitleAr="تقارير المخزون" bannerTitleEn="Inventory Reports"
      bannerDescAr="الرصيد والحركة والتقييم" bannerDescEn="Stock, movement, and valuation"
      BannerIcon={Boxes}
      sections={[
        { labelAr: 'الرصيد والتقييم', labelEn: 'Stock & valuation', items: [
          { href: 'reports/inventory/sheet', titleAr: 'كشف المخزون', titleEn: 'Inventory Sheet', descAr: 'الرصيد الحالي لكل منتج', descEn: 'Current stock by product', Icon: Package },
          { href: 'reports/inventory/value', titleAr: 'تقدير قيمة المخزون', titleEn: 'Estimated Inventory Value', descAr: 'القيمة الدفترية للمخزون', descEn: 'Stock valuation', Icon: Calculator },
          { href: 'reports/inventory/transactions-summary', titleAr: 'ملخص حركات المخزون', titleEn: 'Inventory Transactions Summary', descAr: 'وارد / صادر', descEn: 'Inward / outward summary', Icon: FileText },
        ]},
        { labelAr: 'الحركة والتتبّع', labelEn: 'Movement & tracking', items: [
          { href: 'reports/inventory/movement', titleAr: 'حركة المخزون', titleEn: 'Inventory Movement', descAr: 'النقل والتسويات', descEn: 'Transfers and adjustments', Icon: ArrowLeftRight },
          { href: 'reports/inventory/tracking', titleAr: 'تقرير التتبع', titleEn: 'Tracking Report', descAr: 'أرقام الإرسالية والتسلسل', descEn: 'Lots and serial numbers', Icon: ScanBarcode },
        ]},
      ]}
    />
  );
}

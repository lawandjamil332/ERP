'use client';

import { ReportCatalog } from '@/components/ui/report-catalog';
import { Users, FileText, TrendingDown, Scale } from 'lucide-react';

export default function CustomerReportsPage() {
  return (
    <ReportCatalog
      bannerTone="from-blue-600 to-indigo-800"
      bannerTitleAr="تقارير العملاء" bannerTitleEn="Customer Reports"
      bannerDescAr="كشوف الحساب وأعمار الذمم" bannerDescEn="Statements and aging"
      BannerIcon={Users}
      sections={[
        { labelAr: 'أعمار الذمم', labelEn: 'Aging', items: [
          { href: 'reports/aging', titleAr: 'أعمار الذمم (الفواتير)', titleEn: 'Aged Debtors (Invoices)', descAr: 'تجميع على مستوى الفاتورة', descEn: 'Invoice-level aging buckets', Icon: TrendingDown },
          { href: 'reports/aging/ledger', titleAr: 'أعمار الذمم (السجل)', titleEn: 'Aged Debtors (Ledger)', descAr: 'تجميع على مستوى دفتر الأستاذ', descEn: 'GL-style aging buckets', Icon: Scale },
        ]},
        { labelAr: 'العملاء', labelEn: 'Clients', items: [
          { href: 'reports/customers/list', titleAr: 'قائمة العملاء', titleEn: 'Clients List', descAr: 'تصفّح وإدارة العملاء', descEn: 'Browse and manage customers' },
          { href: 'reports/customers/balance', titleAr: 'أرصدة العملاء', titleEn: 'Clients Balance', descAr: 'الرصيد الجاري لكل عميل', descEn: 'Running balance per customer' },
          { href: 'reports/customers/sales', titleAr: 'مبيعات العملاء', titleEn: 'Clients Sales', descAr: 'الفواتير مجمّعة حسب العميل', descEn: 'Sales invoices grouped by customer' },
          { href: 'reports/customers/payments', titleAr: 'مدفوعات العملاء', titleEn: 'Clients Payments', descAr: 'المدفوعات مجمّعة حسب العميل', descEn: 'Payments grouped by customer' },
          { href: 'reports/customers/statement', titleAr: 'كشف حساب عميل', titleEn: 'Clients Statement', descAr: 'كامل النشاط لكل عميل', descEn: 'Full account activity per customer', Icon: FileText },
        ]},
      ]}
    />
  );
}

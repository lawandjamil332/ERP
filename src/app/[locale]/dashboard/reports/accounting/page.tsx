'use client';

import { ReportCatalog } from '@/components/ui/report-catalog';
import { Calculator, Receipt, Wallet, CalendarDays, Calendar, CalendarRange, BookOpen, Scale } from 'lucide-react';

export default function AccountingReportsPage() {
  return (
    <ReportCatalog
      bannerTone="from-violet-600 to-purple-800"
      bannerTitleAr="التقارير المحاسبية" bannerTitleEn="Accounting Reports"
      bannerDescAr="المقبوضات والمصروفات والقوائم الرئيسية" bannerDescEn="Receipts, expenses, financial statements"
      BannerIcon={Calculator}
      sections={[
        { labelAr: 'القوائم الرئيسية', labelEn: 'Statements', items: [
          { href: 'reports/accounting/trial-balance', titleAr: 'ميزان المراجعة', titleEn: 'Trial Balance', descAr: 'ملخص قيود اليومية المرحّلة', descEn: 'Posted journal entries summary', Icon: Scale },
          { href: 'reports/accounting/income-statement', titleAr: 'قائمة الدخل', titleEn: 'Income Statement', descAr: 'الإيرادات والمصروفات وصافي الربح', descEn: 'Revenue, expenses, and net profit', Icon: BookOpen },
          { href: 'reports/accounting/balance-sheet', titleAr: 'الميزانية العمومية', titleEn: 'Balance Sheet', descAr: 'الأصول والمطلوبات وحقوق الملكية', descEn: 'Assets, liabilities, equity', Icon: Scale },
          { href: 'reports/accounting/cashflow', titleAr: 'التدفقات النقدية', titleEn: 'Cash Flow', descAr: 'وارد مقابل صادر', descEn: 'Inflows vs outflows', Icon: Wallet },
        ]},
        { labelAr: 'نظرة عامة', labelEn: 'Overview', items: [
          { href: 'reports/accounting/receipts', titleAr: 'مقبوضات الفواتير', titleEn: 'Receipt Vouchers', descAr: 'المتحصلات من الذمم', descEn: 'Receivables receipts', Icon: Receipt },
          { href: 'reports/accounting/expenses', titleAr: 'المصاريف', titleEn: 'Expenses', descAr: 'حركات المصاريف', descEn: 'Expense transactions', Icon: Wallet },
        ]},
        { labelAr: 'المصاريف', labelEn: 'Expense', items: [
          { href: 'reports/accounting/expenses-by-category', titleAr: 'المصاريف حسب التصنيف', titleEn: 'Expenses by Category', descAr: 'مجمّع حسب التصنيف', descEn: 'Grouped by category' },
          { href: 'reports/accounting/expenses-by-supplier', titleAr: 'المصاريف حسب المورد', titleEn: 'Expenses by Supplier', descAr: 'مجمّع حسب المورد', descEn: 'Grouped by supplier' },
          { href: 'reports/accounting/expenses-by-staff', titleAr: 'المصاريف حسب الموظف', titleEn: 'Expenses by Staff', descAr: 'مجمّع حسب الموظف', descEn: 'Grouped by staff' },
          { href: 'reports/accounting/expenses-by-client', titleAr: 'المصاريف حسب العميل', titleEn: 'Expenses by Client', descAr: 'مجمّع حسب العميل', descEn: 'Grouped by client' },
        ]},
        { labelAr: 'دوري', labelEn: 'Periodic', items: [
          { href: 'reports/accounting/expenses-daily', titleAr: 'مصاريف يومية', titleEn: 'Daily Expenses', descAr: 'مجمّع حسب اليوم', descEn: 'Grouped by day', Icon: CalendarDays },
          { href: 'reports/accounting/expenses-weekly', titleAr: 'مصاريف أسبوعية', titleEn: 'Weekly Expenses', descAr: 'مجمّع حسب الأسبوع', descEn: 'Grouped by week', Icon: CalendarRange },
          { href: 'reports/accounting/expenses-monthly', titleAr: 'مصاريف شهرية', titleEn: 'Monthly Expenses', descAr: 'مجمّع حسب الشهر', descEn: 'Grouped by month', Icon: Calendar },
          { href: 'reports/accounting/expenses-yearly', titleAr: 'مصاريف سنوية', titleEn: 'Yearly Expenses', descAr: 'مجمّع حسب السنة', descEn: 'Grouped by year', Icon: Calendar },
        ]},
      ]}
    />
  );
}

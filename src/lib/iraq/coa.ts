/**
 * Iraqi Unified Accounting System (IUAS) — النظام المحاسبي الموحد
 *
 * The IUAS was reformed in 2024 and mandated for full implementation by 2026.
 * It is hierarchical, decimal-based, and aligned with IFRS. The top-level
 * groups mirror the Iraqi Federal Board of Supreme Audit specification.
 *
 *   1xxx — Assets               (الأصول)
 *   2xxx — Liabilities          (المطلوبات)
 *   3xxx — Equity               (حقوق الملكية)
 *   4xxx — Income / Revenue     (الإيرادات)
 *   5xxx — Operating Expenses   (المصروفات التشغيلية)
 *   6xxx — Cost of Goods Sold   (تكلفة البضاعة المباعة)
 *   7xxx — Manufacturing Costs  (تكاليف التصنيع)        — IUAS cost-accounting band
 *   8xxx — Service Costs        (تكاليف الخدمات)         — IUAS cost-accounting band
 *   9xxx — Memo / Off-balance   (حسابات نظامية)         — IUAS cost-accounting band
 *
 * This seed is intentionally a compact, production-usable starter. Tenants
 * extend it for their sector (construction WBS, oil&gas cost centres, etc.).
 */

export type SeedAccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'INCOME' | 'EXPENSE';

export interface SeedAccount {
  code: string;
  nameAr: string;
  nameEn: string;
  type: SeedAccountType;
  isPostable: boolean;
  parentCode?: string;
}

export const IUAS_CHART_OF_ACCOUNTS: SeedAccount[] = [
  // ── 1 Assets ────────────────────────────────────────────────────────
  { code: '1',    nameAr: 'الأصول',                       nameEn: 'Assets',                       type: 'ASSET',     isPostable: false },
  { code: '11',   nameAr: 'الأصول المتداولة',             nameEn: 'Current Assets',               type: 'ASSET',     isPostable: false, parentCode: '1' },
  { code: '111',  nameAr: 'النقد وما في حكمه',            nameEn: 'Cash & Cash Equivalents',       type: 'ASSET',     isPostable: false, parentCode: '11' },
  { code: '1111', nameAr: 'الصندوق - دينار عراقي',         nameEn: 'Cash on Hand — IQD',            type: 'ASSET',     isPostable: true,  parentCode: '111' },
  { code: '1112', nameAr: 'الصندوق - دولار أمريكي',        nameEn: 'Cash on Hand — USD',            type: 'ASSET',     isPostable: true,  parentCode: '111' },
  { code: '1113', nameAr: 'المصارف - دينار عراقي',         nameEn: 'Bank Accounts — IQD',           type: 'ASSET',     isPostable: true,  parentCode: '111' },
  { code: '1114', nameAr: 'المصارف - دولار أمريكي',        nameEn: 'Bank Accounts — USD',           type: 'ASSET',     isPostable: true,  parentCode: '111' },
  { code: '1115', nameAr: 'الزين كاش / FIB / المحافظ الإلكترونية', nameEn: 'Mobile Wallets (Zain Cash, FIB)', type: 'ASSET', isPostable: true, parentCode: '111' },

  { code: '112',  nameAr: 'الذمم المدينة',                nameEn: 'Accounts Receivable',           type: 'ASSET',     isPostable: false, parentCode: '11' },
  { code: '1121', nameAr: 'ذمم العملاء',                  nameEn: 'Trade Receivables',             type: 'ASSET',     isPostable: true,  parentCode: '112' },
  { code: '1122', nameAr: 'ذمم الموظفين',                 nameEn: 'Employee Advances',             type: 'ASSET',     isPostable: true,  parentCode: '112' },
  { code: '1123', nameAr: 'مخصص الديون المشكوك فيها',     nameEn: 'Allowance for Doubtful Debts',  type: 'ASSET',     isPostable: true,  parentCode: '112' },

  { code: '113',  nameAr: 'المخزون',                      nameEn: 'Inventory',                     type: 'ASSET',     isPostable: false, parentCode: '11' },
  { code: '1131', nameAr: 'بضاعة جاهزة',                  nameEn: 'Finished Goods',                type: 'ASSET',     isPostable: true,  parentCode: '113' },
  { code: '1132', nameAr: 'مواد أولية',                   nameEn: 'Raw Materials',                 type: 'ASSET',     isPostable: true,  parentCode: '113' },
  { code: '1133', nameAr: 'إنتاج تحت التشغيل',            nameEn: 'Work in Progress',              type: 'ASSET',     isPostable: true,  parentCode: '113' },
  { code: '1134', nameAr: 'بضاعة بالطريق',                nameEn: 'Goods in Transit',              type: 'ASSET',     isPostable: true,  parentCode: '113' },

  { code: '114',  nameAr: 'مدفوعات مقدماً وضرائب',         nameEn: 'Prepayments & Tax Assets',      type: 'ASSET',     isPostable: false, parentCode: '11' },
  { code: '1141', nameAr: 'إيجارات مدفوعة مقدماً',         nameEn: 'Prepaid Rent',                  type: 'ASSET',     isPostable: true,  parentCode: '114' },
  { code: '1142', nameAr: 'ضريبة استقطاع - مدفوعة',       nameEn: 'Withholding Tax — Receivable',  type: 'ASSET',     isPostable: true,  parentCode: '114' },
  { code: '1143', nameAr: 'رسوم جمركية مدفوعة مقدماً',     nameEn: 'Prepaid Customs Duty',          type: 'ASSET',     isPostable: true,  parentCode: '114' },

  { code: '12',   nameAr: 'الأصول الثابتة',               nameEn: 'Fixed (Non-current) Assets',    type: 'ASSET',     isPostable: false, parentCode: '1' },
  { code: '121',  nameAr: 'الأراضي',                      nameEn: 'Land',                          type: 'ASSET',     isPostable: true,  parentCode: '12' },
  { code: '122',  nameAr: 'المباني',                      nameEn: 'Buildings',                     type: 'ASSET',     isPostable: true,  parentCode: '12' },
  { code: '123',  nameAr: 'الآلات والمعدات',              nameEn: 'Machinery & Equipment',         type: 'ASSET',     isPostable: true,  parentCode: '12' },
  { code: '124',  nameAr: 'وسائط النقل',                  nameEn: 'Vehicles',                      type: 'ASSET',     isPostable: true,  parentCode: '12' },
  { code: '125',  nameAr: 'أثاث وتجهيزات',                nameEn: 'Furniture & Fixtures',          type: 'ASSET',     isPostable: true,  parentCode: '12' },
  { code: '126',  nameAr: 'أجهزة حاسوب وبرمجيات',         nameEn: 'IT Equipment & Software',       type: 'ASSET',     isPostable: true,  parentCode: '12' },
  { code: '128',  nameAr: 'مجمع الإهلاك',                 nameEn: 'Accumulated Depreciation',      type: 'ASSET',     isPostable: true,  parentCode: '12' },

  // ── 2 Liabilities ──────────────────────────────────────────────────
  { code: '2',    nameAr: 'المطلوبات',                    nameEn: 'Liabilities',                   type: 'LIABILITY', isPostable: false },
  { code: '21',   nameAr: 'المطلوبات المتداولة',          nameEn: 'Current Liabilities',           type: 'LIABILITY', isPostable: false, parentCode: '2' },
  { code: '211',  nameAr: 'ذمم الموردين',                 nameEn: 'Trade Payables',                type: 'LIABILITY', isPostable: true,  parentCode: '21' },
  { code: '212',  nameAr: 'أجور ومرتبات مستحقة',         nameEn: 'Accrued Salaries & Wages',      type: 'LIABILITY', isPostable: true,  parentCode: '21' },
  { code: '213',  nameAr: 'ضرائب مستحقة',                nameEn: 'Taxes Payable',                 type: 'LIABILITY', isPostable: false, parentCode: '21' },
  { code: '2131', nameAr: 'ضريبة دخل العاملين المستقطعة',  nameEn: 'Employee PIT Withheld',         type: 'LIABILITY', isPostable: true,  parentCode: '213' },
  { code: '2132', nameAr: 'ضمان اجتماعي - حصة العامل',     nameEn: 'Social Security — Employee Share',  type: 'LIABILITY', isPostable: true,  parentCode: '213' },
  { code: '2133', nameAr: 'ضمان اجتماعي - حصة صاحب العمل', nameEn: 'Social Security — Employer Share',  type: 'LIABILITY', isPostable: true,  parentCode: '213' },
  { code: '2134', nameAr: 'ضريبة المبيعات / VAT',          nameEn: 'Sales Tax / VAT Payable',       type: 'LIABILITY', isPostable: true,  parentCode: '213' },
  { code: '2135', nameAr: 'ضريبة الاستقطاع - مستحقة',      nameEn: 'Withholding Tax Payable',       type: 'LIABILITY', isPostable: true,  parentCode: '213' },
  { code: '2136', nameAr: 'ضريبة الدخل الشركات',            nameEn: 'Corporate Income Tax Payable',  type: 'LIABILITY', isPostable: true,  parentCode: '213' },
  { code: '214',  nameAr: 'سلف وقروض قصيرة الأجل',         nameEn: 'Short-term Loans',              type: 'LIABILITY', isPostable: true,  parentCode: '21' },
  { code: '215',  nameAr: 'إيرادات مقبوضة مقدماً',          nameEn: 'Deferred Revenue',              type: 'LIABILITY', isPostable: true,  parentCode: '21' },

  { code: '22',   nameAr: 'المطلوبات طويلة الأجل',         nameEn: 'Long-term Liabilities',         type: 'LIABILITY', isPostable: false, parentCode: '2' },
  { code: '221',  nameAr: 'قروض طويلة الأجل',              nameEn: 'Long-term Loans',               type: 'LIABILITY', isPostable: true,  parentCode: '22' },
  { code: '222',  nameAr: 'مكافأة نهاية الخدمة',           nameEn: 'End-of-Service Indemnity',      type: 'LIABILITY', isPostable: true,  parentCode: '22' },

  // ── 3 Equity ───────────────────────────────────────────────────────
  { code: '3',    nameAr: 'حقوق الملكية',                  nameEn: 'Equity',                        type: 'EQUITY',    isPostable: false },
  { code: '31',   nameAr: 'رأس المال',                     nameEn: 'Share Capital',                 type: 'EQUITY',    isPostable: true,  parentCode: '3' },
  { code: '32',   nameAr: 'الاحتياطيات',                   nameEn: 'Reserves',                      type: 'EQUITY',    isPostable: true,  parentCode: '3' },
  { code: '33',   nameAr: 'الأرباح المرحلة',                nameEn: 'Retained Earnings',             type: 'EQUITY',    isPostable: true,  parentCode: '3' },
  { code: '34',   nameAr: 'أرباح / خسائر العام الحالي',     nameEn: 'Current Year P/L',              type: 'EQUITY',    isPostable: true,  parentCode: '3' },

  // ── 4 Income ───────────────────────────────────────────────────────
  { code: '4',    nameAr: 'الإيرادات',                     nameEn: 'Income',                        type: 'INCOME',    isPostable: false },
  { code: '41',   nameAr: 'إيرادات المبيعات',              nameEn: 'Sales Revenue',                 type: 'INCOME',    isPostable: false, parentCode: '4' },
  { code: '411',  nameAr: 'مبيعات بضاعة - محلية',           nameEn: 'Sales — Domestic',              type: 'INCOME',    isPostable: true,  parentCode: '41' },
  { code: '412',  nameAr: 'مبيعات بضاعة - تصدير',           nameEn: 'Sales — Export',                type: 'INCOME',    isPostable: true,  parentCode: '41' },
  { code: '413',  nameAr: 'إيرادات خدمات',                 nameEn: 'Service Revenue',               type: 'INCOME',    isPostable: true,  parentCode: '41' },
  { code: '414',  nameAr: 'مردودات وخصومات المبيعات',       nameEn: 'Sales Returns & Discounts',     type: 'INCOME',    isPostable: true,  parentCode: '41' },
  { code: '42',   nameAr: 'إيرادات أخرى',                  nameEn: 'Other Income',                  type: 'INCOME',    isPostable: false, parentCode: '4' },
  { code: '421',  nameAr: 'فوائد دائنة',                   nameEn: 'Interest Income',               type: 'INCOME',    isPostable: true,  parentCode: '42' },
  { code: '422',  nameAr: 'أرباح فروق عملة',                nameEn: 'FX Gains',                       type: 'INCOME',    isPostable: true,  parentCode: '42' },

  // ── 5 Operating Expenses ───────────────────────────────────────────
  { code: '5',    nameAr: 'المصروفات التشغيلية',           nameEn: 'Operating Expenses',            type: 'EXPENSE',   isPostable: false },
  { code: '51',   nameAr: 'مصاريف الرواتب والأجور',         nameEn: 'Salaries & Wages',              type: 'EXPENSE',   isPostable: false, parentCode: '5' },
  { code: '511',  nameAr: 'الرواتب الأساسية',              nameEn: 'Base Salaries',                 type: 'EXPENSE',   isPostable: true,  parentCode: '51' },
  { code: '512',  nameAr: 'بدلات وعلاوات',                 nameEn: 'Allowances',                    type: 'EXPENSE',   isPostable: true,  parentCode: '51' },
  { code: '513',  nameAr: 'العمل الإضافي',                 nameEn: 'Overtime',                      type: 'EXPENSE',   isPostable: true,  parentCode: '51' },
  { code: '514',  nameAr: 'مكافآت ومنح',                  nameEn: 'Bonuses',                       type: 'EXPENSE',   isPostable: true,  parentCode: '51' },
  { code: '515',  nameAr: 'حصة صاحب العمل - الضمان',       nameEn: 'Employer Social Security',      type: 'EXPENSE',   isPostable: true,  parentCode: '51' },
  { code: '52',   nameAr: 'مصاريف إدارية',                nameEn: 'Administrative Expenses',       type: 'EXPENSE',   isPostable: false, parentCode: '5' },
  { code: '521',  nameAr: 'إيجار',                        nameEn: 'Rent',                          type: 'EXPENSE',   isPostable: true,  parentCode: '52' },
  { code: '522',  nameAr: 'كهرباء وماء',                  nameEn: 'Utilities',                     type: 'EXPENSE',   isPostable: true,  parentCode: '52' },
  { code: '523',  nameAr: 'اتصالات وإنترنت',              nameEn: 'Telecom & Internet',            type: 'EXPENSE',   isPostable: true,  parentCode: '52' },
  { code: '524',  nameAr: 'قرطاسية ومطبوعات',             nameEn: 'Office Supplies',               type: 'EXPENSE',   isPostable: true,  parentCode: '52' },
  { code: '525',  nameAr: 'صيانة',                        nameEn: 'Repairs & Maintenance',         type: 'EXPENSE',   isPostable: true,  parentCode: '52' },
  { code: '526',  nameAr: 'أتعاب مهنية',                  nameEn: 'Professional Fees',             type: 'EXPENSE',   isPostable: true,  parentCode: '52' },
  { code: '53',   nameAr: 'مصاريف بيع وتسويق',             nameEn: 'Selling & Marketing',           type: 'EXPENSE',   isPostable: false, parentCode: '5' },
  { code: '531',  nameAr: 'دعاية وإعلان',                 nameEn: 'Advertising',                   type: 'EXPENSE',   isPostable: true,  parentCode: '53' },
  { code: '532',  nameAr: 'عمولات بيع',                   nameEn: 'Sales Commissions',             type: 'EXPENSE',   isPostable: true,  parentCode: '53' },
  { code: '533',  nameAr: 'نقل ومناولة',                  nameEn: 'Freight & Handling',            type: 'EXPENSE',   isPostable: true,  parentCode: '53' },
  { code: '54',   nameAr: 'إهلاك واستهلاك',               nameEn: 'Depreciation & Amortization',   type: 'EXPENSE',   isPostable: true,  parentCode: '5' },
  { code: '55',   nameAr: 'خسائر فروق عملة',              nameEn: 'FX Losses',                     type: 'EXPENSE',   isPostable: true,  parentCode: '5' },
  { code: '56',   nameAr: 'ضرائب ورسوم',                  nameEn: 'Taxes & Duties (non-income)',   type: 'EXPENSE',   isPostable: true,  parentCode: '5' },

  // ── 6 Cost of Goods Sold ───────────────────────────────────────────
  { code: '6',    nameAr: 'تكلفة البضاعة المباعة',         nameEn: 'Cost of Goods Sold',            type: 'EXPENSE',   isPostable: false },
  { code: '61',   nameAr: 'تكلفة المبيعات - بضائع',         nameEn: 'COGS — Goods',                  type: 'EXPENSE',   isPostable: true,  parentCode: '6' },
  { code: '62',   nameAr: 'تكلفة المبيعات - خدمات',         nameEn: 'COGS — Services',               type: 'EXPENSE',   isPostable: true,  parentCode: '6' },

  // ── 7 Manufacturing Cost (IUAS cost accounting band) ───────────────
  { code: '7',    nameAr: 'تكاليف التصنيع',                nameEn: 'Manufacturing Costs',           type: 'EXPENSE',   isPostable: false },
  { code: '71',   nameAr: 'مواد مباشرة',                   nameEn: 'Direct Materials',              type: 'EXPENSE',   isPostable: true,  parentCode: '7' },
  { code: '72',   nameAr: 'أجور مباشرة',                   nameEn: 'Direct Labor',                  type: 'EXPENSE',   isPostable: true,  parentCode: '7' },
  { code: '73',   nameAr: 'تكاليف صناعية غير مباشرة',       nameEn: 'Manufacturing Overhead',        type: 'EXPENSE',   isPostable: true,  parentCode: '7' },

  // ── 8 Service Cost (IUAS cost accounting band) ─────────────────────
  { code: '8',    nameAr: 'تكاليف الخدمات',                nameEn: 'Service Costs',                 type: 'EXPENSE',   isPostable: false },
  { code: '81',   nameAr: 'تكاليف خدمات مباشرة',            nameEn: 'Direct Service Costs',          type: 'EXPENSE',   isPostable: true,  parentCode: '8' },
  { code: '82',   nameAr: 'تكاليف خدمات غير مباشرة',         nameEn: 'Indirect Service Costs',        type: 'EXPENSE',   isPostable: true,  parentCode: '8' },

  // ── 9 Memo / Off-balance (IUAS) ────────────────────────────────────
  { code: '9',    nameAr: 'حسابات نظامية',                 nameEn: 'Memo / Off-balance',            type: 'ASSET',     isPostable: false },
  { code: '91',   nameAr: 'كفالات وضمانات صادرة',          nameEn: 'Guarantees Issued',             type: 'ASSET',     isPostable: true,  parentCode: '9' },
  { code: '92',   nameAr: 'كفالات وضمانات مستلمة',         nameEn: 'Guarantees Received',           type: 'ASSET',     isPostable: true,  parentCode: '9' },
];

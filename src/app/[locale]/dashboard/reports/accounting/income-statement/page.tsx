'use client';

import { useEffect, useState, useCallback } from 'react';
import { useLocale } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import {
  BookOpen, Printer, RefreshCw, ChevronDown, ChevronUp,
  Loader2, TrendingUp, TrendingDown, DollarSign, ShoppingCart,
} from 'lucide-react';
import { tri } from '@/lib/i18n/tri';
import BigNumber from 'bignumber.js';

/* ---------- types ---------- */

interface PLLine {
  accountId: string;
  code: string;
  nameAr: string;
  nameEn: string;
  type: string;
  debit: string;
  credit: string;
  balance: string;
}

interface PLData {
  revenue: string;
  cogs: string;
  grossProfit: string;
  operatingExpenses: string;
  otherIncome: string;
  netProfit: string;
  lines: PLLine[];
}

interface LedgerEntry {
  date: string;
  number: string;
  description: string;
  debit: string;
  credit: string;
  balance: string;
}

/* ---------- helpers ---------- */

function fmtIQD(value: string, locale: string): string {
  const n = Number(value);
  if (locale === 'ar') return n.toLocaleString('ar-IQ', { style: 'currency', currency: 'IQD', minimumFractionDigits: 0, maximumFractionDigits: 0 });
  return n.toLocaleString('en-IQ', { style: 'currency', currency: 'IQD', minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function startOfYear() {
  return `${new Date().getFullYear()}-01-01`;
}
function today() {
  return new Date().toISOString().slice(0, 10);
}

/* ---------- component ---------- */

export default function IncomeStatementPage() {
  const locale = useLocale();

  const [from, setFrom] = useState(startOfYear());
  const [to, setTo] = useState(today());
  const [data, setData] = useState<PLData | null>(null);
  const [loading, setLoading] = useState(true);

  // drill-down
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  /* ---- fetch P&L ---- */
  const load = useCallback(async () => {
    setLoading(true);
    setExpandedId(null);
    try {
      const r = await fetch(`/api/reports/profit-loss?from=${from}&to=${to}`);
      if (r.ok) {
        const json = await r.json();
        setData(json.data ?? null);
      }
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => { load(); }, [load]);

  /* ---- drill-down ---- */
  const toggleDrillDown = useCallback(async (accountId: string) => {
    if (expandedId === accountId) {
      setExpandedId(null);
      setLedger([]);
      return;
    }
    setExpandedId(accountId);
    setLedgerLoading(true);
    try {
      const r = await fetch(`/api/reports/account-ledger?accountId=${accountId}&from=${from}&to=${to}`);
      if (r.ok) {
        const json = await r.json();
        setLedger(json.data ?? []);
      }
    } finally {
      setLedgerLoading(false);
    }
  }, [expandedId, from, to]);

  /* ---- group lines by section ---- */
  const revenueLines = data?.lines.filter((l) => l.code.startsWith('41') || l.code.startsWith('42')) ?? [];
  const cogsLines = data?.lines.filter((l) => l.code.startsWith('6')) ?? [];
  const expenseLines = data?.lines.filter((l) => l.code.startsWith('5')) ?? [];

  /* ---- labels ---- */
  const t = {
    title: tri(locale, { ar: 'قائمة الدخل', ku: 'لیستەی داهات', en: 'Income Statement' }),
    desc: tri(locale, {
      ar: 'الإيرادات والمصروفات وصافي الربح للفترة المحددة',
      ku: 'داهات و خەرجییەکان و قازانجی ڕەها بۆ ماوەی دیاریکراو',
      en: 'Revenue, expenses, and net profit for the selected period',
    }),
    from: tri(locale, { ar: 'من تاريخ', ku: 'لە بەرواری', en: 'From' }),
    to: tri(locale, { ar: 'إلى تاريخ', ku: 'تا بەرواری', en: 'To' }),
    refresh: tri(locale, { ar: 'تحديث', ku: 'نوێکردنەوە', en: 'Refresh' }),
    print: tri(locale, { ar: 'طباعة', ku: 'چاپکردن', en: 'Print' }),
    loading: tri(locale, { ar: 'جارٍ التحميل…', ku: 'بارکردن…', en: 'Loading...' }),
    noData: tri(locale, { ar: 'لا توجد بيانات', ku: 'هیچ داتایەک نییە', en: 'No data' }),
    revenue: tri(locale, { ar: 'الإيرادات', ku: 'داهات', en: 'Revenue' }),
    cogs: tri(locale, { ar: 'تكلفة البضاعة المباعة', ku: 'تێچووی کاڵای فرۆشراو', en: 'Cost of Goods Sold' }),
    grossProfit: tri(locale, { ar: 'مجمل الربح', ku: 'قازانجی کۆ', en: 'Gross Profit' }),
    opex: tri(locale, { ar: 'مصاريف تشغيلية', ku: 'خەرجییە کارگێڕییەکان', en: 'Operating Expenses' }),
    netProfit: tri(locale, { ar: 'صافي الربح', ku: 'قازانجی ڕەها', en: 'Net Profit' }),
    code: tri(locale, { ar: 'رمز الحساب', ku: 'کۆدی ئەکاونت', en: 'Account Code' }),
    name: tri(locale, { ar: 'اسم الحساب', ku: 'ناوی ئەکاونت', en: 'Account Name' }),
    amount: tri(locale, { ar: 'المبلغ', ku: 'بڕ', en: 'Amount' }),
    ledgerDate: tri(locale, { ar: 'التاريخ', ku: 'بەروار', en: 'Date' }),
    ledgerRef: tri(locale, { ar: 'رقم القيد', ku: 'ژمارەی تۆمار', en: 'Ref #' }),
    ledgerDesc: tri(locale, { ar: 'البيان', ku: 'وەسف', en: 'Description' }),
    debit: tri(locale, { ar: 'مدين', ku: 'قەرزار', en: 'Debit' }),
    credit: tri(locale, { ar: 'دائن', ku: 'داینەر', en: 'Credit' }),
    ledgerBal: tri(locale, { ar: 'الرصيد التراكمي', ku: 'باڵانسی کۆگا', en: 'Running Balance' }),
  };

  const accountName = (line: PLLine) => locale === 'ar' || locale === 'ku' ? line.nameAr : line.nameEn;

  return (
    <div className="space-y-6 print:space-y-4">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 print:hidden" />
            {t.title}
          </span>
        }
        description={t.desc}
        actions={
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <Button variant="outline" onClick={load}>
              <RefreshCw className="h-4 w-4" /> {t.refresh}
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="h-4 w-4" /> {t.print}
            </Button>
          </div>
        }
      />

      {/* date filters */}
      <Card className="print:hidden">
        <CardContent className="flex flex-wrap items-end gap-4 pt-6">
          <div className="space-y-1">
            <label className="text-sm font-medium">{t.from}</label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} dir="ltr" className="w-44" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">{t.to}</label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} dir="ltr" className="w-44" />
          </div>
          <Button onClick={load}>{t.refresh}</Button>
        </CardContent>
      </Card>

      {/* KPI cards */}
      {data && !loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 print:grid-cols-4">
          <KpiCard
            label={t.revenue}
            value={data.revenue}
            locale={locale}
            icon={<DollarSign className="h-5 w-5" />}
            tone="emerald"
          />
          <KpiCard
            label={t.cogs}
            value={data.cogs}
            locale={locale}
            icon={<ShoppingCart className="h-5 w-5" />}
            tone="amber"
          />
          <KpiCard
            label={t.grossProfit}
            value={data.grossProfit}
            locale={locale}
            icon={<TrendingUp className="h-5 w-5" />}
            tone="blue"
          />
          <KpiCard
            label={t.netProfit}
            value={data.netProfit}
            locale={locale}
            icon={<TrendingDown className="h-5 w-5" />}
            tone={Number(data.netProfit) >= 0 ? 'emerald' : 'rose'}
          />
        </div>
      )}

      {/* main statement */}
      {loading ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="mt-2">{t.loading}</span>
          </CardContent>
        </Card>
      ) : !data ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">{t.noData}</CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Revenue section */}
          <SectionCard
            title={t.revenue}
            total={data.revenue}
            lines={revenueLines}
            locale={locale}
            labels={t}
            accountName={accountName}
            expandedId={expandedId}
            ledger={ledger}
            ledgerLoading={ledgerLoading}
            onToggle={toggleDrillDown}
            tone="emerald"
          />

          {/* COGS section */}
          <SectionCard
            title={t.cogs}
            total={data.cogs}
            lines={cogsLines}
            locale={locale}
            labels={t}
            accountName={accountName}
            expandedId={expandedId}
            ledger={ledger}
            ledgerLoading={ledgerLoading}
            onToggle={toggleDrillDown}
            tone="amber"
          />

          {/* Gross Profit */}
          <SummaryRow label={t.grossProfit} value={data.grossProfit} locale={locale} bold />

          {/* Operating Expenses section */}
          <SectionCard
            title={t.opex}
            total={data.operatingExpenses}
            lines={expenseLines}
            locale={locale}
            labels={t}
            accountName={accountName}
            expandedId={expandedId}
            ledger={ledger}
            ledgerLoading={ledgerLoading}
            onToggle={toggleDrillDown}
            tone="rose"
          />

          {/* Net Profit */}
          <SummaryRow label={t.netProfit} value={data.netProfit} locale={locale} bold highlight />
        </div>
      )}
    </div>
  );
}

/* ---------- KPI card ---------- */

function KpiCard({ label, value, locale, icon, tone }: {
  label: string;
  value: string;
  locale: string;
  icon: React.ReactNode;
  tone: 'emerald' | 'amber' | 'blue' | 'rose';
}) {
  const toneClasses: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    blue: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    rose: 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
  };

  return (
    <Card>
      <CardContent className="flex items-center gap-3 pt-6">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${toneClasses[tone]}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-bold tabular-nums">{fmtIQD(value, locale)}</p>
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------- section card (revenue / cogs / opex) ---------- */

function SectionCard({
  title, total, lines, locale, labels, accountName, expandedId, ledger, ledgerLoading, onToggle, tone,
}: {
  title: string;
  total: string;
  lines: PLLine[];
  locale: string;
  labels: Record<string, string>;
  accountName: (l: PLLine) => string;
  expandedId: string | null;
  ledger: LedgerEntry[];
  ledgerLoading: boolean;
  onToggle: (id: string) => void;
  tone: 'emerald' | 'amber' | 'rose';
}) {
  const toneHeader: Record<string, string> = {
    emerald: 'border-l-emerald-500',
    amber: 'border-l-amber-500',
    rose: 'border-l-rose-500',
  };

  return (
    <Card className={`border-l-4 ${toneHeader[tone]}`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <span>{title}</span>
          <span className="tabular-nums font-bold">{fmtIQD(total, locale)}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {lines.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">{labels.noData}</p>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>{labels.code}</TH>
                <TH>{labels.name}</TH>
                <TH className="text-end">{labels.amount}</TH>
                <TH className="w-8 print:hidden" />
              </TR>
            </THead>
            <TBody>
              {lines.map((line) => (
                <PLLineRow
                  key={line.accountId}
                  line={line}
                  locale={locale}
                  name={accountName(line)}
                  labels={labels}
                  expanded={expandedId === line.accountId}
                  ledger={expandedId === line.accountId ? ledger : []}
                  ledgerLoading={expandedId === line.accountId && ledgerLoading}
                  onToggle={() => onToggle(line.accountId)}
                />
              ))}
            </TBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

/* ---------- P&L line row with drill-down ---------- */

function PLLineRow({
  line, locale, name, labels, expanded, ledger, ledgerLoading, onToggle,
}: {
  line: PLLine;
  locale: string;
  name: string;
  labels: Record<string, string>;
  expanded: boolean;
  ledger: LedgerEntry[];
  ledgerLoading: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <TR className="cursor-pointer hover:bg-accent/50 print:cursor-default" onClick={onToggle}>
        <TD className="font-mono text-sm">{line.code}</TD>
        <TD>{name}</TD>
        <TD className="text-end tabular-nums font-medium">{fmtIQD(line.balance, locale)}</TD>
        <TD className="print:hidden">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </TD>
      </TR>

      {expanded && (
        <TR className="print:hidden">
          <TD colSpan={4} className="bg-muted/20 p-0">
            <div className="px-6 py-3">
              <h4 className="mb-2 text-sm font-semibold">
                {tri(locale, { ar: 'قيود الحساب', ku: 'تۆمارەکانی ئەکاونت', en: 'Account Journal Entries' })}
                {' - '}{name}
              </h4>
              {ledgerLoading ? (
                <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {labels.loading}
                </div>
              ) : ledger.length === 0 ? (
                <p className="py-4 text-sm text-muted-foreground">{labels.noData}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b text-xs text-muted-foreground">
                      <tr>
                        <th className="px-2 py-1.5 text-start font-medium">{labels.ledgerDate}</th>
                        <th className="px-2 py-1.5 text-start font-medium">{labels.ledgerRef}</th>
                        <th className="px-2 py-1.5 text-start font-medium">{labels.ledgerDesc}</th>
                        <th className="px-2 py-1.5 text-end font-medium">{labels.debit}</th>
                        <th className="px-2 py-1.5 text-end font-medium">{labels.credit}</th>
                        <th className="px-2 py-1.5 text-end font-medium">{labels.ledgerBal}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ledger.map((entry, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="px-2 py-1.5 tabular-nums">{new Date(entry.date).toLocaleDateString(locale === 'ar' ? 'ar-IQ' : locale === 'ku' ? 'ckb-IQ' : 'en-IQ')}</td>
                          <td className="px-2 py-1.5 font-mono text-xs">{entry.number}</td>
                          <td className="px-2 py-1.5">{entry.description}</td>
                          <td className="px-2 py-1.5 text-end tabular-nums">{fmtIQD(entry.debit, locale)}</td>
                          <td className="px-2 py-1.5 text-end tabular-nums">{fmtIQD(entry.credit, locale)}</td>
                          <td className={`px-2 py-1.5 text-end tabular-nums font-medium ${Number(entry.balance) < 0 ? 'text-rose-600' : ''}`}>
                            {fmtIQD(entry.balance, locale)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TD>
        </TR>
      )}
    </>
  );
}

/* ---------- summary row ---------- */

function SummaryRow({ label, value, locale, bold, highlight }: {
  label: string;
  value: string;
  locale: string;
  bold?: boolean;
  highlight?: boolean;
}) {
  const num = Number(value);
  return (
    <Card className={highlight ? 'border-2 border-primary/30' : ''}>
      <CardContent className={`flex items-center justify-between pt-6 ${bold ? 'text-lg font-bold' : 'text-base font-semibold'}`}>
        <span>{label}</span>
        <span className={`tabular-nums ${num < 0 ? 'text-rose-600' : num > 0 ? 'text-emerald-600' : ''}`}>
          {fmtIQD(value, locale)}
        </span>
      </CardContent>
    </Card>
  );
}

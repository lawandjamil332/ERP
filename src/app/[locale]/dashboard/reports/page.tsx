import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getTranslations } from 'next-intl/server';
import { formatMoney } from '@/lib/iraq/money';
import { trialBalance, incomeStatement, balanceSheet } from '@/lib/iraq/reports';

export default async function ReportsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await requireSession();
  const t = await getTranslations('nav');

  const now = new Date();
  const yearStart = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));

  const [tb, is, bs] = await Promise.all([
    trialBalance(db, session.tenantId),
    incomeStatement(db, session.tenantId, yearStart, now),
    balanceSheet(db, session.tenantId, now),
  ]);

  const m = (v: any) => formatMoney(Number(v), 'IQD', locale as 'ar');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('reports')}</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard title="Net profit YTD / صافي الربح" value={m(is.netProfit)} />
        <KpiCard title="Total assets / إجمالي الأصول" value={m(bs.assets)} />
        <KpiCard title="Total liabilities / إجمالي المطلوبات" value={m(bs.liabilities)} />
      </div>

      <Card id="income-statement">
        <CardHeader>
          <CardTitle>Income Statement / قائمة الدخل (YTD)</CardTitle>
          <CardDescription>IFRS-aligned (IUAS 2026) — period: Jan 1 → today</CardDescription>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <tbody>
              <Row label="Revenue / الإيرادات" value={m(is.revenue)} />
              <Row label="(–) Cost of goods sold" value={m(is.cogs)} />
              <Row label="Gross profit / إجمالي الربح" value={m(is.grossProfit)} bold />
              <Row label="(–) Operating expenses" value={m(is.operatingExpenses)} />
              <Row label="(+) Other income" value={m(is.otherIncome)} />
              <Row label="Net profit / صافي الربح" value={m(is.netProfit)} bold />
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card id="balance-sheet">
        <CardHeader>
          <CardTitle>Balance Sheet / الميزانية العمومية</CardTitle>
          <CardDescription>As of {new Intl.DateTimeFormat(locale).format(now)}</CardDescription>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <tbody>
              <Row label="Total assets / الأصول" value={m(bs.assets)} bold />
              <Row label="Total liabilities / المطلوبات" value={m(bs.liabilities)} />
              <Row label="Equity / حقوق الملكية" value={m(bs.equity)} />
              <Row label="  of which: current-year P/L" value={m(bs.currentYearProfit)} />
              <Row label="Liabilities + Equity" value={m(bs.liabilities.plus(bs.equity))} bold />
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card id="trial-balance">
        <CardHeader>
          <CardTitle>Trial Balance / ميزان المراجعة</CardTitle>
          <CardDescription>Posted journal entries summary</CardDescription>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr>
                <th className="px-2 py-2 text-start">Code</th>
                <th className="px-2 py-2 text-start">Account</th>
                <th className="px-2 py-2 text-end">Debit</th>
                <th className="px-2 py-2 text-end">Credit</th>
                <th className="px-2 py-2 text-end">Balance</th>
              </tr>
            </thead>
            <tbody>
              {tb.length === 0 && (
                <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">No posted activity yet</td></tr>
              )}
              {tb.map((r) => (
                <tr key={r.code} className="border-b">
                  <td className="px-2 py-2 font-mono text-xs">{r.code}</td>
                  <td className="px-2 py-2">{locale === 'ar' ? r.nameAr : r.nameEn}</td>
                  <td className="px-2 py-2 text-end tabular-nums">{m(r.debit)}</td>
                  <td className="px-2 py-2 text-end tabular-nums">{m(r.credit)}</td>
                  <td className="px-2 py-2 text-end tabular-nums">{m(r.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2"><CardDescription>{title}</CardDescription></CardHeader>
      <CardContent><p className="text-2xl font-bold tabular-nums">{value}</p></CardContent>
    </Card>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <tr className={`border-b ${bold ? 'font-semibold' : ''}`}>
      <td className="px-2 py-2">{label}</td>
      <td className="px-2 py-2 text-end tabular-nums">{value}</td>
    </tr>
  );
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useLocale } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { Scale, Printer, RefreshCw, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { tri } from '@/lib/i18n/tri';
import BigNumber from 'bignumber.js';

/* ---------- types ---------- */

interface TrialRow {
  accountId: string;
  code: string;
  nameAr: string;
  nameEn: string;
  type: string;
  debit: string;
  credit: string;
  balance: string;
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
  if (locale === 'ku') return n.toLocaleString('en-IQ', { style: 'currency', currency: 'IQD', minimumFractionDigits: 0, maximumFractionDigits: 0 });
  return n.toLocaleString('en-IQ', { style: 'currency', currency: 'IQD', minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

/* ---------- component ---------- */

export default function TrialBalancePage() {
  const locale = useLocale();

  const [asOf, setAsOf] = useState(today());
  const [rows, setRows] = useState<TrialRow[]>([]);
  const [loading, setLoading] = useState(true);

  // drill-down state: which row is expanded + its ledger data
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  /* ---- fetch trial balance ---- */
  const load = useCallback(async () => {
    setLoading(true);
    setExpandedId(null);
    try {
      const r = await fetch(`/api/reports/trial-balance?asOf=${asOf}`);
      if (r.ok) {
        const json = await r.json();
        setRows(json.data ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [asOf]);

  useEffect(() => { load(); }, [load]);

  /* ---- drill-down: fetch account ledger ---- */
  const toggleDrillDown = useCallback(async (accountId: string) => {
    if (expandedId === accountId) {
      setExpandedId(null);
      setLedger([]);
      return;
    }
    setExpandedId(accountId);
    setLedgerLoading(true);
    try {
      const r = await fetch(`/api/reports/account-ledger?accountId=${accountId}&to=${asOf}`);
      if (r.ok) {
        const json = await r.json();
        setLedger(json.data ?? []);
      }
    } finally {
      setLedgerLoading(false);
    }
  }, [expandedId, asOf]);

  /* ---- totals ---- */
  const totalDebit = rows.reduce((s, r) => s.plus(r.debit), new BigNumber(0));
  const totalCredit = rows.reduce((s, r) => s.plus(r.credit), new BigNumber(0));

  /* ---- labels ---- */
  const t = {
    title: tri(locale, { ar: 'ميزان المراجعة', ku: 'مەیزانی پشکنین', en: 'Trial Balance' }),
    desc: tri(locale, { ar: 'ملخص أرصدة جميع الحسابات حتى تاريخ معيّن', ku: 'پوختەی باڵانسی هەموو ئەکاونتەکان تا بەروارێکی دیاریکراو', en: 'Summary of all account balances as of a specific date' }),
    asOf: tri(locale, { ar: 'حتى تاريخ', ku: 'تا بەرواری', en: 'As of date' }),
    code: tri(locale, { ar: 'رمز الحساب', ku: 'کۆدی ئەکاونت', en: 'Account Code' }),
    name: tri(locale, { ar: 'اسم الحساب', ku: 'ناوی ئەکاونت', en: 'Account Name' }),
    debit: tri(locale, { ar: 'مدين', ku: 'قەرزار', en: 'Debit' }),
    credit: tri(locale, { ar: 'دائن', ku: 'داینەر', en: 'Credit' }),
    balance: tri(locale, { ar: 'الرصيد', ku: 'باڵانس', en: 'Balance' }),
    total: tri(locale, { ar: 'المجموع', ku: 'کۆی گشتی', en: 'Total' }),
    refresh: tri(locale, { ar: 'تحديث', ku: 'نوێکردنەوە', en: 'Refresh' }),
    print: tri(locale, { ar: 'طباعة', ku: 'چاپکردن', en: 'Print' }),
    loading: tri(locale, { ar: 'جارٍ التحميل…', ku: 'بارکردن…', en: 'Loading...' }),
    noData: tri(locale, { ar: 'لا توجد بيانات', ku: 'هیچ داتایەک نییە', en: 'No data' }),
    ledgerDate: tri(locale, { ar: 'التاريخ', ku: 'بەروار', en: 'Date' }),
    ledgerRef: tri(locale, { ar: 'رقم القيد', ku: 'ژمارەی تۆمار', en: 'Ref #' }),
    ledgerDesc: tri(locale, { ar: 'البيان', ku: 'وەسف', en: 'Description' }),
    ledgerBal: tri(locale, { ar: 'الرصيد التراكمي', ku: 'باڵانسی کۆگا', en: 'Running Balance' }),
  };

  const accountName = (row: TrialRow) => locale === 'ar' || locale === 'ku' ? row.nameAr : row.nameEn;

  return (
    <div className="space-y-6 print:space-y-4">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <Scale className="h-6 w-6 print:hidden" />
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

      {/* date filter */}
      <Card className="print:hidden">
        <CardContent className="flex flex-wrap items-end gap-4 pt-6">
          <div className="space-y-1">
            <label className="text-sm font-medium">{t.asOf}</label>
            <Input type="date" value={asOf} onChange={(e) => setAsOf(e.target.value)} dir="ltr" className="w-44" />
          </div>
          <Button onClick={load}>{t.refresh}</Button>
        </CardContent>
      </Card>

      {/* table */}
      <Card>
        <CardHeader className="print:pb-2">
          <CardTitle className="text-base">{t.title} - {asOf}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <TR>
                <TH>{t.code}</TH>
                <TH>{t.name}</TH>
                <TH className="text-end">{t.debit}</TH>
                <TH className="text-end">{t.credit}</TH>
                <TH className="text-end">{t.balance}</TH>
                <TH className="w-8 print:hidden" />
              </TR>
            </THead>
            <TBody>
              {loading ? (
                <TR>
                  <TD colSpan={6} className="py-12 text-center text-muted-foreground">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                    <span className="mt-2 block">{t.loading}</span>
                  </TD>
                </TR>
              ) : rows.length === 0 ? (
                <TR>
                  <TD colSpan={6} className="py-12 text-center text-muted-foreground">{t.noData}</TD>
                </TR>
              ) : (
                <>
                  {rows.map((row) => (
                    <TrialRow
                      key={row.accountId}
                      row={row}
                      locale={locale}
                      accountName={accountName(row)}
                      labels={t}
                      expanded={expandedId === row.accountId}
                      ledger={expandedId === row.accountId ? ledger : []}
                      ledgerLoading={expandedId === row.accountId && ledgerLoading}
                      onToggle={() => toggleDrillDown(row.accountId)}
                    />
                  ))}

                  {/* totals */}
                  <TR className="bg-muted/30 font-bold">
                    <TD colSpan={2}>{t.total}</TD>
                    <TD className="text-end tabular-nums">{fmtIQD(totalDebit.toString(), locale)}</TD>
                    <TD className="text-end tabular-nums">{fmtIQD(totalCredit.toString(), locale)}</TD>
                    <TD className="text-end tabular-nums">{fmtIQD(totalDebit.minus(totalCredit).toString(), locale)}</TD>
                    <TD className="print:hidden" />
                  </TR>
                </>
              )}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------- row sub-component ---------- */

function TrialRow({
  row,
  locale,
  accountName,
  labels,
  expanded,
  ledger,
  ledgerLoading,
  onToggle,
}: {
  row: TrialRow;
  locale: string;
  accountName: string;
  labels: Record<string, string>;
  expanded: boolean;
  ledger: LedgerEntry[];
  ledgerLoading: boolean;
  onToggle: () => void;
}) {
  const balNum = Number(row.balance);

  return (
    <>
      <TR
        className="cursor-pointer hover:bg-accent/50 print:cursor-default"
        onClick={onToggle}
      >
        <TD className="font-mono text-sm">{row.code}</TD>
        <TD>
          <span className="flex items-center gap-2">
            {accountName}
            <Badge variant="outline" className="text-[10px] uppercase">
              {row.type}
            </Badge>
          </span>
        </TD>
        <TD className="text-end tabular-nums">{fmtIQD(row.debit, locale)}</TD>
        <TD className="text-end tabular-nums">{fmtIQD(row.credit, locale)}</TD>
        <TD className={`text-end tabular-nums font-medium ${balNum < 0 ? 'text-rose-600' : ''}`}>
          {fmtIQD(row.balance, locale)}
        </TD>
        <TD className="print:hidden">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </TD>
      </TR>

      {/* drill-down: journal entries */}
      {expanded && (
        <TR className="print:hidden">
          <TD colSpan={6} className="bg-muted/20 p-0">
            <div className="px-6 py-3">
              <h4 className="mb-2 text-sm font-semibold">
                {tri(locale, { ar: 'قيود الحساب', ku: 'تۆمارەکانی ئەکاونت', en: 'Account Journal Entries' })}
                {' - '}{accountName}
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

import Link from 'next/link';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { agedReceivables, agedPayables, bucketToObject } from '@/lib/iraq/aging';
import { formatMoney } from '@/lib/iraq/money';
import { tri } from '@/lib/i18n/tri';

export default async function AgingPage({
  params, searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const session = await requireSession();
  const kind = (sp.kind ?? 'AR').toUpperCase() as 'AR' | 'AP';
  const asOf = sp.asOf ? new Date(sp.asOf) : new Date();
  const result = kind === 'AP'
    ? await agedPayables(db, session.tenantId, asOf)
    : await agedReceivables(db, session.tenantId, asOf);
  const m = (v: any) => formatMoney(Number(v), 'IQD', locale as 'ar');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">
          {kind === 'AR' ? tri(locale, { ar: 'ذمم العملاء', ku: 'قەرزەکانی کڕیاران', en: 'Aged Receivables' }) : tri(locale, { ar: 'ذمم الموردين', ku: 'قەرزەکانی دابینکەران', en: 'Aged Payables' })}
        </h1>
        <div className="flex gap-2">
          <Link href="?kind=AR" className={`rounded-md border px-3 py-1.5 text-sm ${kind === 'AR' ? 'bg-primary text-primary-foreground' : ''}`}>{tri(locale, { ar: 'المدينون', ku: 'قەرزداران', en: 'Receivables' })}</Link>
          <Link href="?kind=AP" className={`rounded-md border px-3 py-1.5 text-sm ${kind === 'AP' ? 'bg-primary text-primary-foreground' : ''}`}>{tri(locale, { ar: 'الدائنون', ku: 'داینەران', en: 'Payables' })}</Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>As of {new Intl.DateTimeFormat(locale).format(asOf)}</CardTitle>
          <CardDescription>
            {tri(locale, { ar: 'أرصدة مفتوحة مصنّفة حسب أيام التأخير — لتحديد أولويات التحصيل/الدفع', ku: 'باڵانسە کراوەکان بەپێی ڕۆژەکانی دواکەوتن — بۆ دیاریکردنی ئەولەویەتی کۆکردنەوە/پارەدان', en: 'Open balances bucketed by days past due. Use this to drive collection / payment priorities.' })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <TR>
                <TH>{tri(locale, { ar: 'الجهة', ku: 'لایەن', en: 'Contact' })}</TH>
                <TH className="text-end">{tri(locale, { ar: 'غير مستحقّ', ku: 'نەگەیشتووی کات', en: 'Not due' })}</TH>
                <TH className="text-end">0–30</TH>
                <TH className="text-end">31–60</TH>
                <TH className="text-end">61–90</TH>
                <TH className="text-end">90+</TH>
                <TH className="text-end">{tri(locale, { ar: 'المجموع', ku: 'کۆ', en: 'Total' })}</TH>
              </TR>
            </THead>
            <TBody>
              {result.rows.length === 0 && (
                <TR><TD colSpan={7} className="py-12 text-center text-muted-foreground">{tri(locale, { ar: 'لا توجد أرصدة مفتوحة', ku: 'هیچ باڵانسێکی کراوە نییە', en: 'No open balances' })}</TD></TR>
              )}
              {result.rows.map((r) => {
                const b = bucketToObject(r.buckets);
                return (
                  <TR key={r.contactId}>
                    <TD>{r.contactName}</TD>
                    <TD className="text-end tabular-nums">{m(b.notDue)}</TD>
                    <TD className="text-end tabular-nums">{m(b.current)}</TD>
                    <TD className="text-end tabular-nums">{m(b.d31_60)}</TD>
                    <TD className="text-end tabular-nums text-amber-600">{m(b.d61_90)}</TD>
                    <TD className="text-end tabular-nums font-semibold text-destructive">{m(b.d91_plus)}</TD>
                    <TD className="text-end tabular-nums font-semibold">{m(b.total)}</TD>
                  </TR>
                );
              })}
              {result.rows.length > 0 && (
                <TR className="bg-muted/30 font-semibold">
                  <TD>{tri(locale, { ar: 'المجموع', ku: 'کۆ', en: 'TOTAL' })}</TD>
                  <TD className="text-end tabular-nums">{m(bucketToObject(result.totals).notDue)}</TD>
                  <TD className="text-end tabular-nums">{m(bucketToObject(result.totals).current)}</TD>
                  <TD className="text-end tabular-nums">{m(bucketToObject(result.totals).d31_60)}</TD>
                  <TD className="text-end tabular-nums">{m(bucketToObject(result.totals).d61_90)}</TD>
                  <TD className="text-end tabular-nums">{m(bucketToObject(result.totals).d91_plus)}</TD>
                  <TD className="text-end tabular-nums">{m(bucketToObject(result.totals).total)}</TD>
                </TR>
              )}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

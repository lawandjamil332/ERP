import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getTranslations } from 'next-intl/server';
import { formatMoney } from '@/lib/iraq/money';
import Link from 'next/link';

export default async function ReportsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await requireSession();
  const t = await getTranslations('nav');

  const lines = await db.journalLine.findMany({
    where: { journal: { tenantId: session.tenantId, isPosted: true } },
    include: { account: true },
  });

  const tb = new Map<string, { code: string; nameAr: string; nameEn: string; debit: number; credit: number }>();
  for (const l of lines) {
    const key = l.account.code;
    const e = tb.get(key) ?? { code: l.account.code, nameAr: l.account.nameAr, nameEn: l.account.nameEn, debit: 0, credit: 0 };
    e.debit  += Number(l.debit);
    e.credit += Number(l.credit);
    tb.set(key, e);
  }
  const rows = Array.from(tb.values()).sort((a, b) => a.code.localeCompare(b.code));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('reports')}</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link href={`/${locale}/dashboard/reports#trial-balance`}>
          <Card className="hover:shadow-md">
            <CardHeader>
              <CardTitle>Trial Balance / ميزان المراجعة</CardTitle>
              <CardDescription>{rows.length} accounts with activity</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Card>
          <CardHeader>
            <CardTitle>Income Statement / قائمة الدخل</CardTitle>
            <CardDescription>IFRS-aligned (IUAS 2026)</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Balance Sheet / الميزانية العمومية</CardTitle>
            <CardDescription>IFRS-aligned (IUAS 2026)</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <Card id="trial-balance">
        <CardHeader>
          <CardTitle>Trial Balance</CardTitle>
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
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">No posted activity yet</td></tr>
              )}
              {rows.map((r) => (
                <tr key={r.code} className="border-b">
                  <td className="px-2 py-2 font-mono text-xs">{r.code}</td>
                  <td className="px-2 py-2">{locale === 'ar' ? r.nameAr : r.nameEn}</td>
                  <td className="px-2 py-2 text-end tabular-nums">{formatMoney(r.debit, 'IQD', locale as 'ar')}</td>
                  <td className="px-2 py-2 text-end tabular-nums">{formatMoney(r.credit, 'IQD', locale as 'ar')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

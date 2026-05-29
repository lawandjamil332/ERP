import { getTranslations } from 'next-intl/server';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { tri } from '@/lib/i18n/tri';

export default async function AccountingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await verifySession();
  if (!session) redirect(`/${locale}/auth/login`);
  const t = await getTranslations('nav');

  const accounts = await db.account.findMany({
    where: { tenantId: session.tenantId, isActive: true },
    orderBy: { code: 'asc' },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('accounting')}</h1>
        <p className="text-sm text-muted-foreground">
          Iraqi Unified Accounting System (النظام المحاسبي الموحد) — IFRS-aligned, 2026 mandate
        </p>
      </div>

      <Card>
        <Table>
          <THead>
            <TR>
              <TH>{tri(locale, { ar: 'الرمز', ku: 'کۆد', en: 'Code' })}</TH>
              <TH>{tri(locale, { ar: 'الاسم', ku: 'ناو (عەرەبی)', en: 'Name (Arabic)' })}</TH>
              <TH>{tri(locale, { ar: 'الاسم بالإنجليزية', ku: 'ناو (ئینگلیزی)', en: 'Name (English)' })}</TH>
              <TH>{tri(locale, { ar: 'النوع', ku: 'جۆر', en: 'Type' })}</TH>
              <TH>{tri(locale, { ar: 'قابل للترحيل', ku: 'قابیلی تۆمارکردن', en: 'Postable' })}</TH>
            </TR>
          </THead>
          <TBody>
            {accounts.map((a) => (
              <TR key={a.id}>
                <TD className="font-mono text-xs">{a.code}</TD>
                <TD dir="rtl">{a.nameAr}</TD>
                <TD>{a.nameEn}</TD>
                <TD>{a.type}</TD>
                <TD>{a.isPostable ? '✓' : ''}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>
    </div>
  );
}

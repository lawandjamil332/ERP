import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getTranslations } from 'next-intl/server';

export default async function SettingsPage() {
  const session = await requireSession();
  const t = await getTranslations('nav');
  const tenant = await db.tenant.findUnique({ where: { id: session.tenantId } });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('settings')}</h1>
      <Card>
        <CardHeader>
          <CardTitle>Company / الشركة</CardTitle>
          <CardDescription>Tenant information used on invoices and tax filings</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm sm:grid-cols-2">
          <Row label="Trade name (AR)" value={tenant?.nameAr} />
          <Row label="Trade name (EN)" value={tenant?.nameEn} />
          <Row label="Tax number" value={tenant?.taxNumber} mono />
          <Row label="Commercial registration" value={tenant?.commercialReg} mono />
          <Row label="Governorate" value={tenant?.governorate} />
          <Row label="Tax region" value={tenant?.region} />
          <Row label="Sector" value={tenant?.sector} />
          <Row label="Base currency" value={tenant?.baseCurrency} />
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4 border-b pb-2">
      <span className="text-muted-foreground">{label}</span>
      <span className={mono ? 'font-mono' : ''}>{value ?? '—'}</span>
    </div>
  );
}

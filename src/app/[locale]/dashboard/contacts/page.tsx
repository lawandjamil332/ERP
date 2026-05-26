import Link from 'next/link';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

export default async function ContactsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await requireSession();
  const t = await getTranslations('nav');
  const contacts = await db.contact.findMany({ where: { tenantId: session.tenantId, isActive: true }, orderBy: { nameAr: 'asc' } });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('contacts')}</h1>
        <Button asChild>
          <Link href={`/${locale}/dashboard/contacts/new`}>
            <Plus className="h-4 w-4" /> New
          </Link>
        </Button>
      </div>
      <Card>
        <Table>
          <THead>
            <TR>
              <TH>{locale === 'en' ? 'Name' : 'الاسم'}</TH>
              <TH>Type</TH>
              <TH>Tax #</TH>
              <TH>Phone</TH>
              <TH>{locale === 'en' ? 'Governorate' : 'المحافظة'}</TH>
              <TH>{locale === 'en' ? 'Currency' : 'العملة'}</TH>
            </TR>
          </THead>
          <TBody>
            {contacts.length === 0 && (
              <TR><TD colSpan={6} className="py-12 text-center text-muted-foreground">No contacts yet</TD></TR>
            )}
            {contacts.map((c) => (
              <TR key={c.id}>
                <TD>{locale === 'ar' ? c.nameAr : (c.nameEn ?? c.nameAr)}</TD>
                <TD><Badge variant={c.kind === 'CUSTOMER' ? 'default' : c.kind === 'SUPPLIER' ? 'secondary' : 'outline'}>{c.kind}</Badge></TD>
                <TD className="font-mono text-xs">{c.taxNumber ?? '—'}</TD>
                <TD className="font-mono text-xs" dir="ltr">{c.phone ?? '—'}</TD>
                <TD>{c.governorate ?? '—'}</TD>
                <TD>{c.currency}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>
    </div>
  );
}

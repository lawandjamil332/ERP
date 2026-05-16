import Link from 'next/link';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { RunNowButton } from './RunNowButton';

export default async function RecurringInvoicesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await requireSession();
  const t = await getTranslations('recurring');
  const tc = await getTranslations('common');

  const templates = await db.recurringInvoiceTemplate.findMany({
    where: { tenantId: session.tenantId, isActive: true },
    include: { lines: true },
    orderBy: { nextIssueAt: 'asc' },
  });
  const contacts = await db.contact.findMany({
    where: { tenantId: session.tenantId, isActive: true },
    select: { id: true, nameAr: true, nameEn: true },
  });
  const cmap = new Map(contacts.map((c) => [c.id, c]));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
        </div>
        <div className="flex gap-2">
          <RunNowButton />
          <Button asChild>
            <Link href={`/${locale}/dashboard/recurring/new`}>
              <Plus className="h-4 w-4" /> {t('new')}
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <Table>
          <THead>
            <TR>
              <TH>{tc('name')}</TH>
              <TH>{t('cadence')}</TH>
              <TH>{t('nextIssue')}</TH>
              <TH>{t('startDate')}</TH>
              <TH>{t('autoPost')}</TH>
            </TR>
          </THead>
          <TBody>
            {templates.length === 0 && (
              <TR><TD colSpan={5} className="py-12 text-center text-muted-foreground">{tc('noData')}</TD></TR>
            )}
            {templates.map((tpl) => {
              const c = cmap.get(tpl.contactId);
              const cadenceLabel = t(`frequencies.${tpl.cadence}` as any);
              return (
                <TR key={tpl.id}>
                  <TD className="font-medium">
                    {tpl.name}
                    {c && <div className="text-xs text-muted-foreground">{locale === 'ar' ? c.nameAr : (c.nameEn ?? c.nameAr)}</div>}
                  </TD>
                  <TD><Badge variant="outline">{cadenceLabel}{tpl.cadenceDay ? ` · ${tpl.cadenceDay}` : ''}</Badge></TD>
                  <TD className="tabular-nums">{new Intl.DateTimeFormat(locale).format(tpl.nextIssueAt)}</TD>
                  <TD className="tabular-nums">{new Intl.DateTimeFormat(locale).format(tpl.startDate)}</TD>
                  <TD>{tpl.autoPost ? <Badge variant="success">{tc('yes')}</Badge> : <Badge variant="outline">{tc('no')}</Badge>}</TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      </Card>
    </div>
  );
}

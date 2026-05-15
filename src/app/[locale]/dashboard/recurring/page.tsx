import Link from 'next/link';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Play } from 'lucide-react';

export default async function RecurringInvoicesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await requireSession();
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Recurring invoices / فواتير متكررة</h1>
          <p className="text-sm text-muted-foreground">Subscriptions, monthly rent, retainers — auto-generated on schedule.</p>
        </div>
        <div className="flex gap-2">
          <form action="/api/recurring-invoices/run" method="POST">
            <Button type="submit" variant="outline"><Play className="h-4 w-4" /> Run now</Button>
          </form>
          <Button asChild>
            <Link href={`/${locale}/dashboard/recurring/new`}><Plus className="h-4 w-4" /> New template</Link>
          </Button>
        </div>
      </div>

      <Card>
        <Table>
          <THead>
            <TR>
              <TH>Name</TH><TH>Customer</TH><TH>Cadence</TH>
              <TH>Next issue</TH><TH>Last issued</TH><TH>Auto-post</TH>
            </TR>
          </THead>
          <TBody>
            {templates.length === 0 && (
              <TR><TD colSpan={6} className="py-12 text-center text-muted-foreground">No recurring templates yet</TD></TR>
            )}
            {templates.map((t) => {
              const c = cmap.get(t.contactId);
              return (
                <TR key={t.id}>
                  <TD className="font-medium">{t.name}</TD>
                  <TD>{locale === 'ar' ? c?.nameAr : (c?.nameEn ?? c?.nameAr)}</TD>
                  <TD><Badge variant="outline">{t.cadence}{t.cadenceDay ? ` · day ${t.cadenceDay}` : ''}</Badge></TD>
                  <TD className="tabular-nums">{new Intl.DateTimeFormat(locale).format(t.nextIssueAt)}</TD>
                  <TD className="tabular-nums">{t.lastIssuedAt ? new Intl.DateTimeFormat(locale).format(t.lastIssuedAt) : '—'}</TD>
                  <TD>{t.autoPost ? <Badge variant="success">Yes</Badge> : <Badge variant="outline">No</Badge>}</TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      </Card>
    </div>
  );
}

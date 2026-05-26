import Link from 'next/link';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import { formatMoney } from '@/lib/iraq/money';

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline'> = {
  REGISTERED: 'outline', DEPOSITED: 'default', CLEARED: 'success',
  BOUNCED: 'destructive', CANCELLED: 'secondary', REPLACED: 'warning',
};

export default async function ChequesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await requireSession();
  const cheques = await db.cheque.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { dueDate: 'asc' },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Cheques / الصكوك</h1>
        <Button asChild>
          <Link href={`/${locale}/dashboard/cheques/new`}>
            <Plus className="h-4 w-4" /> New cheque
          </Link>
        </Button>
      </div>
      <Card>
        <Table>
          <THead>
            <TR>
              <TH>#</TH><TH>Direction</TH><TH>Bank</TH><TH>Drawer</TH>
              <TH>Issue</TH><TH>Due</TH><TH className="text-end">Amount</TH><TH>Status</TH>
            </TR>
          </THead>
          <TBody>
            {cheques.length === 0 && (
              <TR><TD colSpan={8} className="py-12 text-center text-muted-foreground">No cheques registered</TD></TR>
            )}
            {cheques.map((c) => (
              <TR key={c.id}>
                <TD className="font-mono text-xs">{c.number}</TD>
                <TD><Badge variant={c.direction === 'IN' ? 'success' : 'secondary'}>{c.direction}</Badge></TD>
                <TD>{c.bank}</TD>
                <TD>{c.drawer}</TD>
                <TD className="tabular-nums">{new Intl.DateTimeFormat(locale).format(c.issueDate)}</TD>
                <TD className="tabular-nums">{new Intl.DateTimeFormat(locale).format(c.dueDate)}</TD>
                <TD className="text-end tabular-nums">{formatMoney(Number(c.amount), c.currency as 'IQD', locale as 'ar')}</TD>
                <TD><Badge variant={STATUS_VARIANT[c.status]}>{c.status}</Badge></TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>
    </div>
  );
}

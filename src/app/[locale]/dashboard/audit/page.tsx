import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { Card } from '@/components/ui/card';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export default async function AuditPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await requireSession();
  const logs = await db.auditLog.findMany({
    where: { tenantId: session.tenantId },
    include: { user: { select: { email: true, fullName: true } } },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Audit log / سجل التدقيق</h1>
      <Card>
        <Table>
          <THead>
            <TR>
              <TH>When</TH><TH>User</TH><TH>Action</TH><TH>Entity</TH><TH>IP</TH>
            </TR>
          </THead>
          <TBody>
            {logs.length === 0 && (
              <TR><TD colSpan={5} className="py-12 text-center text-muted-foreground">No audit entries yet</TD></TR>
            )}
            {logs.map((l) => (
              <TR key={l.id}>
                <TD className="tabular-nums">{new Intl.DateTimeFormat(locale, { dateStyle: 'short', timeStyle: 'short' }).format(l.createdAt)}</TD>
                <TD>{l.user?.email ?? '—'}</TD>
                <TD><Badge>{l.action}</Badge></TD>
                <TD>{l.entity}{l.entityId ? ` · ${l.entityId.slice(0, 8)}` : ''}</TD>
                <TD className="font-mono text-xs" dir="ltr">{l.ip ?? '—'}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>
    </div>
  );
}

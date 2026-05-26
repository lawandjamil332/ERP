import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { seedIraqLeaveTypes } from '@/lib/iraq/leave';

export default async function LeavePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await requireSession();

  // Auto-seed Iraqi default leave types on first visit
  const existing = await db.leaveType.count({ where: { tenantId: session.tenantId } });
  if (existing === 0) await seedIraqLeaveTypes(db, session.tenantId);

  const year = new Date().getUTCFullYear();
  const [requests, balances, types, employees] = await Promise.all([
    db.leaveRequest.findMany({
      where: { tenantId: session.tenantId },
      orderBy: { createdAt: 'desc' }, take: 50,
    }),
    db.leaveBalance.findMany({
      where: { tenantId: session.tenantId, year },
      include: { leaveType: true },
    }),
    db.leaveType.findMany({ where: { tenantId: session.tenantId, isActive: true } }),
    db.employee.findMany({
      where: { tenantId: session.tenantId, isActive: true, deletedAt: null },
      select: { id: true, empNo: true, fullNameAr: true, fullNameEn: true },
    }),
  ]);
  const emap = new Map(employees.map((e) => [e.id, e]));
  const tmap = new Map(types.map((t) => [t.id, t]));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Leave / الإجازات</h1>

      <Card>
        <CardHeader>
          <CardTitle>Leave types (Iraqi defaults)</CardTitle>
          <CardDescription>Pre-seeded per Iraqi Labor Law. Per-tenant edits welcome.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {types.map((t) => (
              <Badge key={t.id} variant={t.paid ? 'default' : 'outline'}>
                {locale === 'ar' ? t.nameAr : t.nameEn} · {t.annualEntitlement}d
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Balances · {year}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <THead><TR>
              <TH>Employee</TH><TH>Type</TH>
              <TH className="text-end">Entitled</TH><TH className="text-end">Carried in</TH>
              <TH className="text-end">Used</TH><TH className="text-end">Remaining</TH>
            </TR></THead>
            <TBody>
              {balances.length === 0 && (
                <TR><TD colSpan={6} className="py-12 text-center text-muted-foreground">
                  No balances yet — call <code>POST /api/leave/balances</code> with {`{ "year": ${year} }`} to accrue.
                </TD></TR>
              )}
              {balances.map((b) => {
                const e = emap.get(b.employeeId);
                const remaining = b.entitled + b.carriedIn - b.used;
                return (
                  <TR key={b.id}>
                    <TD>{locale === 'ar' ? e?.fullNameAr : (e?.fullNameEn ?? e?.fullNameAr)}</TD>
                    <TD>{locale === 'ar' ? b.leaveType.nameAr : b.leaveType.nameEn}</TD>
                    <TD className="text-end tabular-nums">{b.entitled}</TD>
                    <TD className="text-end tabular-nums">{b.carriedIn}</TD>
                    <TD className="text-end tabular-nums">{b.used}</TD>
                    <TD className="text-end tabular-nums font-semibold">{remaining}</TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent requests</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <THead><TR>
              <TH>Employee</TH><TH>Type</TH><TH>From</TH><TH>To</TH>
              <TH className="text-end">Days</TH><TH>Status</TH>
            </TR></THead>
            <TBody>
              {requests.length === 0 && (
                <TR><TD colSpan={6} className="py-12 text-center text-muted-foreground">No leave requests yet</TD></TR>
              )}
              {requests.map((r) => {
                const e = emap.get(r.employeeId);
                const t = tmap.get(r.leaveTypeId);
                return (
                  <TR key={r.id}>
                    <TD>{locale === 'ar' ? e?.fullNameAr : (e?.fullNameEn ?? e?.fullNameAr)}</TD>
                    <TD>{locale === 'ar' ? t?.nameAr : t?.nameEn}</TD>
                    <TD className="tabular-nums">{new Intl.DateTimeFormat(locale).format(r.startDate)}</TD>
                    <TD className="tabular-nums">{new Intl.DateTimeFormat(locale).format(r.endDate)}</TD>
                    <TD className="text-end tabular-nums">{r.days}</TD>
                    <TD><Badge variant={
                      r.status === 'APPROVED' ? 'success' :
                      r.status === 'REJECTED' ? 'destructive' :
                      r.status === 'CANCELLED' ? 'secondary' : 'warning'
                    }>{r.status}</Badge></TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

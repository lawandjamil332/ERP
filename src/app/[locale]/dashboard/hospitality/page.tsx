import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { Card } from '@/components/ui/card';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import BigNumber from 'bignumber.js';
import { formatMoney } from '@/lib/iraq/money';

export default async function HospitalityPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await requireSession();
  const folios = await db.hotelFolio.findMany({
    where: { tenantId: session.tenantId },
    include: { charges: true },
    orderBy: { checkIn: 'desc' },
    take: 100,
  });
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Hospitality / الضيافة</h1>
      <p className="text-sm text-muted-foreground">
        Folios for hotels & restaurants. Iraqi hospitality tax (10%) applied per charge.
      </p>
      <Card>
        <Table>
          <THead><TR>
            <TH>Folio #</TH><TH>Guest</TH><TH>Room</TH>
            <TH>Check-in</TH><TH>Check-out</TH>
            <TH className="text-end">Total</TH><TH>Status</TH>
          </TR></THead>
          <TBody>
            {folios.length === 0 && (
              <TR><TD colSpan={7} className="py-12 text-center text-muted-foreground">No open folios</TD></TR>
            )}
            {folios.map((f) => {
              const total = f.charges.reduce(
                (s, c) => s.plus(c.amount.toString()).plus(c.taxAmount.toString()),
                new BigNumber(0)
              );
              return (
                <TR key={f.id}>
                  <TD className="font-mono text-xs">{f.number}</TD>
                  <TD>{f.guestName}</TD>
                  <TD>{f.roomNumber}</TD>
                  <TD className="tabular-nums">{new Intl.DateTimeFormat(locale).format(f.checkIn)}</TD>
                  <TD className="tabular-nums">{f.checkOut ? new Intl.DateTimeFormat(locale).format(f.checkOut) : '—'}</TD>
                  <TD className="text-end tabular-nums">{formatMoney(Number(total), 'IQD', locale as 'ar')}</TD>
                  <TD><Badge variant={f.status === 'OPEN' ? 'success' : 'secondary'}>{f.status}</Badge></TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      </Card>
    </div>
  );
}

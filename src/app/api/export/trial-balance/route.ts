import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { trialBalance } from '@/lib/iraq/reports';
import { toXmlSpreadsheet } from '@/lib/iraq/excel';

export async function GET(req: Request) {
  const session = await requireSession();
  const { searchParams } = new URL(req.url);
  const asOf = searchParams.get('asOf');
  const rows = await trialBalance(db, session.tenantId, asOf ? new Date(asOf) : undefined);
  const xml = toXmlSpreadsheet([{
    name: 'Trial Balance',
    headers: ['Code', 'Account (AR)', 'Account (EN)', 'Type', 'Debit', 'Credit', 'Balance'],
    rows: rows.map((r) => [r.code, r.nameAr, r.nameEn, r.type, Number(r.debit.toString()), Number(r.credit.toString()), Number(r.balance.toString())]),
  }]);
  return new Response(xml, {
    status: 200,
    headers: {
      'content-type': 'application/vnd.ms-excel; charset=utf-8',
      'content-disposition': `attachment; filename="trial-balance${asOf ? '-' + asOf : ''}.xls"`,
    },
  });
}

import { NextResponse } from 'next/server';
import BigNumber from 'bignumber.js';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { rasheedCsv, tbiCsv, rafidainFixed, fibJson, type PayoutBatch } from '@/lib/iraq/bank-payout';

export async function GET(req: Request, ctx: { params: Promise<{ runId: string }> }) {
  const { runId } = await ctx.params;
  const session = await requireSession();
  const url = new URL(req.url);
  const format = url.searchParams.get('format') ?? 'rasheed';
  const payerAccount = url.searchParams.get('payerAccount') ?? '';
  const payerName = url.searchParams.get('payerName') ?? '';

  const run = await db.payrollRun.findFirst({
    where: { id: runId, tenantId: session.tenantId },
    include: {
      lines: { include: { employee: true } },
    },
  });
  if (!run) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const lines = run.lines.map((l) => ({
    empNo: l.employee.empNo,
    fullName: l.employee.fullNameEn ?? l.employee.fullNameAr,
    beneficiaryBankAccount: l.employee.ssNumber ?? '',  // placeholder; the Employee model would need bankAccount field
    netAmount: l.net.toString(),
    currency: 'IQD',
    memo: `Salary ${run.period} for ${l.employee.empNo}`,
  }));

  const total = lines.reduce(
    (s, l) => s.plus(new BigNumber(l.netAmount)),
    new BigNumber(0)
  ).toString();

  const batch: PayoutBatch = {
    payerAccount, payerName,
    valueDate: new Date().toISOString().slice(0, 10),
    lines,
    totalAmount: total,
  };

  let body: string;
  let ext: string;
  let contentType: string;
  switch (format) {
    case 'tbi':
      body = tbiCsv(batch);
      ext = 'csv';
      contentType = 'text/csv';
      break;
    case 'rafidain':
      body = rafidainFixed(batch);
      ext = 'txt';
      contentType = 'text/plain';
      break;
    case 'fib':
      body = fibJson(batch);
      ext = 'json';
      contentType = 'application/json';
      break;
    case 'rasheed':
    default:
      body = rasheedCsv(batch);
      ext = 'csv';
      contentType = 'text/csv';
  }
  return new Response(body, {
    headers: {
      'content-type': contentType,
      'content-disposition': `attachment; filename="payroll-${run.period}-${format}.${ext}"`,
    },
  });
}

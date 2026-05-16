/**
 * Iraqi withholding-tax certificate (شهادة استقطاع ضريبي).
 *
 * Iraqi B2B service buyers must withhold tax and issue the supplier a
 * certificate that the supplier presents to the General Commission for Taxes
 * as proof of tax paid on their behalf.
 *
 * Pass a billId or a manual payload; route returns an HTML print page (Arabic
 * RTL) that the user can print to PDF.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import BigNumber from 'bignumber.js';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { formatHijri } from '@/lib/iraq/dates';

const Query = z.object({
  billId: z.string().optional(),
  supplier: z.string().optional(),
  supplierTaxNumber: z.string().optional(),
  amount: z.string().optional(),
  rate: z.string().optional(),
  period: z.string().optional(),
});

export async function GET(req: Request) {
  const session = await requireSession();
  const url = new URL(req.url);
  const q = Query.parse(Object.fromEntries(url.searchParams.entries()));

  let payload: {
    supplier: string;
    supplierTaxNumber: string;
    grossAmount: BigNumber;
    rate: BigNumber;
    withholdingAmount: BigNumber;
    netAmount: BigNumber;
    period: string;
    reference: string;
  };

  if (q.billId) {
    const bill = await db.bill.findFirst({
      where: { id: q.billId, tenantId: session.tenantId, deletedAt: null },
      include: { supplier: true },
    });
    if (!bill) return NextResponse.json({ error: 'bill_not_found' }, { status: 404 });
    const wh = new BigNumber(bill.withholding.toString());
    const gross = new BigNumber(bill.total.toString());
    const rate = gross.gt(0) ? wh.div(gross) : new BigNumber(0);
    payload = {
      supplier: bill.supplier.nameAr,
      supplierTaxNumber: bill.supplier.taxNumber ?? '—',
      grossAmount: gross,
      rate,
      withholdingAmount: wh,
      netAmount: gross.minus(wh),
      period: bill.date.toISOString().slice(0, 7),
      reference: bill.number,
    };
  } else {
    if (!q.supplier || !q.amount) {
      return NextResponse.json({ error: 'supplier_and_amount_required' }, { status: 400 });
    }
    const rate = new BigNumber(q.rate ?? '0.03');
    const gross = new BigNumber(q.amount);
    const wh = gross.times(rate);
    payload = {
      supplier: q.supplier,
      supplierTaxNumber: q.supplierTaxNumber ?? '—',
      grossAmount: gross, rate,
      withholdingAmount: wh,
      netAmount: gross.minus(wh),
      period: q.period ?? new Date().toISOString().slice(0, 7),
      reference: 'MANUAL-' + Date.now().toString(36).toUpperCase(),
    };
  }

  const tenant = await db.tenant.findUnique({ where: { id: session.tenantId } });
  const issued = new Date();
  const issuedHijri = formatHijri(issued);
  const fmt = (n: BigNumber) =>
    new Intl.NumberFormat('ar-IQ', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n.toNumber());

  const html = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8" />
<title>شهادة استقطاع ضريبي ${payload.reference}</title>
<style>
  @page { size: A4; margin: 22mm; }
  body { font-family: 'Tajawal','Cairo',system-ui,sans-serif; color:#0c1a14; line-height: 1.6; }
  .frame { border: 3px double #134e3a; padding: 24px; position: relative; }
  .frame::before {
    content: ""; position: absolute; inset: 6px;
    border: 1px solid #d8c89a; pointer-events: none;
  }
  h1 { font-size: 22px; text-align: center; color: #134e3a; margin: 0 0 4px; }
  .subtitle { text-align: center; font-size: 12px; color: #666; margin-bottom: 18px; }
  .hdr { display: flex; justify-content: space-between; border-bottom: 1px solid #d8c89a; padding-bottom: 12px; margin-bottom: 14px; font-size: 12px; }
  table { width: 100%; border-collapse: collapse; margin-top: 1rem; font-size: 13px; }
  th, td { padding: 9px 12px; border: 1px solid #d8c89a; text-align: start; }
  th { background: #f6f4ec; color: #134e3a; font-weight: 600; }
  .grand { font-size: 16px; font-weight: bold; background: #f6f4ec; }
  .legal {
    margin-top: 2.5rem; font-size: 11px; line-height: 1.8;
    background: #fcfaf2; border: 1px dashed #d8c89a; padding: 12px;
  }
  .sig { margin-top: 2.5rem; display: flex; justify-content: space-between; font-size: 12px; }
  .sig div { border-top: 1px solid #000; padding-top: 4px; width: 30%; text-align:center; }
  .small { font-size: 10px; color: #555; }
  .ref { display:inline-block; padding: 2px 8px; border: 1px solid #134e3a; border-radius: 4px; font-family: monospace; font-size: 11px; }
</style>
</head>
<body>
  <div class="frame">
    <h1>شهادة استقطاع ضريبي</h1>
    <p class="subtitle">Withholding Tax Certificate — جمهورية العراق · الهيئة العامة للضرائب</p>

    <div class="hdr">
      <div>
        <strong>${tenant?.nameAr ?? ''}</strong>
        <div class="small">${tenant?.nameEn ?? ''}</div>
        <div class="small">الرقم الضريبي: ${tenant?.taxNumber ?? '—'}</div>
        <div class="small">السجل التجاري: ${tenant?.commercialReg ?? '—'}</div>
      </div>
      <div style="text-align:end">
        <div>الرقم المرجعي: <span class="ref">${payload.reference}</span></div>
        <div class="small">${new Intl.DateTimeFormat('ar-IQ').format(issued)}</div>
        <div class="small">${issuedHijri}</div>
      </div>
    </div>

    <p>
      نشهد نحن <strong>${tenant?.nameAr ?? ''}</strong> أنه قد تم استقطاع الضريبة المبيّنة أدناه
      من المبالغ المدفوعة للمستفيد، وذلك وفقاً لأحكام قانون ضريبة الدخل العراقي رقم ١١٣
      لسنة ١٩٨٢ المعدّل، وقد تم توريد هذه الضريبة إلى الهيئة العامة للضرائب.
    </p>

    <table>
      <tr><th style="width:38%">اسم المستفيد</th><td>${payload.supplier}</td></tr>
      <tr><th>الرقم الضريبي للمستفيد</th><td style="font-family: monospace">${payload.supplierTaxNumber}</td></tr>
      <tr><th>الفترة المحاسبية</th><td>${payload.period}</td></tr>
    </table>

    <table>
      <thead>
        <tr><th>البيان</th><th style="text-align:end">المبلغ (دينار عراقي)</th></tr>
      </thead>
      <tbody>
        <tr><td>المبلغ الإجمالي قبل الاستقطاع</td><td style="text-align:end">${fmt(payload.grossAmount)}</td></tr>
        <tr><td>نسبة الاستقطاع</td><td style="text-align:end">${payload.rate.times(100).toFixed(2)}٪</td></tr>
        <tr class="grand"><td>قيمة الاستقطاع الضريبي</td><td style="text-align:end">${fmt(payload.withholdingAmount)}</td></tr>
        <tr><td>صافي المبلغ المدفوع للمستفيد</td><td style="text-align:end">${fmt(payload.netAmount)}</td></tr>
      </tbody>
    </table>

    <div class="legal">
      <strong>ملاحظات:</strong>
      <ul style="padding-inline-start: 18px; margin: 6px 0 0;">
        <li>هذه الشهادة وثيقة رسمية تُقدَّم إلى الهيئة العامة للضرائب كإثبات لاستقطاع الضريبة.</li>
        <li>يجب الاحتفاظ بنسخة منها لمدة لا تقل عن ٥ سنوات وفقاً لقانون ضريبة الدخل العراقي.</li>
        <li>أي اعتراض يُقدَّم خلال ٣٠ يوماً من تاريخ هذه الشهادة.</li>
      </ul>
    </div>

    <div class="sig">
      <div>توقيع المُصدر · المحاسب القانوني</div>
      <div>توقيع المستفيد</div>
      <div>الختم الرسمي</div>
    </div>

    <p style="margin-top: 2.5rem; text-align:center; font-size: 9px; color:#666">
      صادرة بواسطة Iraq ERP · صالحة إلكترونياً · يمكن التحقق منها لدى الهيئة العامة للضرائب
    </p>
  </div>
  <script>window.onload = () => setTimeout(() => window.print(), 200);</script>
</body>
</html>`;

  return new Response(html, {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}

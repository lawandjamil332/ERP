import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { formatHijri } from '@/lib/iraq/dates';
import { formatMoney } from '@/lib/iraq/money';

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const session = await requireSession();
  const inv = await db.invoice.findFirst({
    where: { id, tenantId: session.tenantId },
    include: { contact: true, lines: true },
  });
  if (!inv) return new Response('Not found', { status: 404 });
  const tenant = await db.tenant.findUnique({ where: { id: session.tenantId } });

  const fmt = (n: any) => formatMoney(Number(n.toString()), inv.currency as 'IQD', 'ar');
  const date = new Intl.DateTimeFormat('ar-IQ').format(inv.date);

  const html = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8" />
<title>${inv.number}</title>
<style>
  @page { size: A4; margin: 20mm; }
  body { font-family: 'Tajawal','Cairo',system-ui,sans-serif; color:#000; }
  h1, h2 { margin: 0; }
  table { width:100%; border-collapse:collapse; margin-top:1rem; font-size:12px; }
  th, td { border-bottom:1px solid #ddd; padding:6px 8px; text-align:start; }
  .totals { margin-top:1rem; width:50%; margin-inline-start:auto; }
  .totals td { border:0; padding:2px 8px; }
  .totals .grand { border-top:1px solid #000; font-weight:bold; }
  .hdr { display:flex; justify-content:space-between; border-bottom:2px solid #000; padding-bottom:8px; }
  .small { font-size:11px; color:#444; }
  .sig { margin-top:2.5rem; display:flex; justify-content:space-between; font-size:11px; }
  .sig div { border-top:1px solid #000; padding-top:4px; width:30%; }
</style>
</head>
<body>
  <div class="hdr">
    <div>
      <h2>${tenant?.nameAr ?? ''}</h2>
      <div class="small">${tenant?.nameEn ?? ''}</div>
      <div class="small">الرقم الضريبي: ${tenant?.taxNumber ?? '—'}</div>
      <div class="small">السجل التجاري: ${tenant?.commercialReg ?? '—'}</div>
    </div>
    <div style="text-align:end">
      <h1>فاتورة / Invoice</h1>
      <div>#${inv.number}</div>
      <div class="small">${date}</div>
      <div class="small">${formatHijri(inv.date)}</div>
    </div>
  </div>
  <div style="margin-top:1rem">
    <strong>إلى / Bill to:</strong> ${inv.contact.nameAr}${inv.contact.nameEn ? ' / ' + inv.contact.nameEn : ''}
    ${inv.contact.taxNumber ? `<div class="small">الرقم الضريبي: ${inv.contact.taxNumber}</div>` : ''}
  </div>
  <table>
    <thead>
      <tr><th>#</th><th>الوصف</th><th>HS</th><th>الكمية</th><th>السعر</th><th>الضريبة</th><th>الإجمالي</th></tr>
    </thead>
    <tbody>
      ${inv.lines.map((l, i) => `<tr>
        <td>${i + 1}</td>
        <td>${escape(l.description)}${l.trademark ? ` <span class="small">(${escape(l.trademark)})</span>` : ''}</td>
        <td>${l.hsCode ?? '—'}</td>
        <td>${l.quantity.toString()} ${l.unitOfMeasure}</td>
        <td>${fmt(l.unitPrice)}</td>
        <td>${fmt(l.taxAmount)}</td>
        <td>${fmt(l.lineTotal)}</td>
      </tr>`).join('')}
    </tbody>
  </table>
  <table class="totals">
    <tr><td>المجموع الفرعي</td><td style="text-align:end">${fmt(inv.subtotal)}</td></tr>
    <tr><td>الضريبة</td><td style="text-align:end">${fmt(inv.taxTotal)}</td></tr>
    <tr class="grand"><td>الإجمالي</td><td style="text-align:end">${fmt(inv.total)}</td></tr>
  </table>
  <div class="sig">
    <div>توقيع المُصدر / Issuer</div>
    <div>توقيع المستلم / Recipient</div>
  </div>
  <p style="margin-top:2rem;text-align:center;font-size:10px;color:#666">
    صادرة وفقاً للنظام المحاسبي العراقي الموحد (IUAS) ومتطلبات الهيئة العامة للضرائب
  </p>
  <script>window.onload = () => setTimeout(() => window.print(), 100);</script>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}

function escape(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

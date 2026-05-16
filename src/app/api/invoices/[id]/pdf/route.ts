import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { formatHijri } from '@/lib/iraq/dates';
import { formatMoney } from '@/lib/iraq/money';

/**
 * Invoice print page (auto-prints on load).
 *
 * Query params:
 *   ?lang=ar  Arabic-only (default)
 *   ?lang=en  English-only
 *   ?lang=bi  Bilingual side-by-side (Arabic header on right + English on left)
 *             — required by some GCT auditors and for cross-border buyers.
 */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const session = await requireSession();
  const inv = await db.invoice.findFirst({
    where: { id, tenantId: session.tenantId },
    include: { contact: true, lines: true },
  });
  if (!inv) return new Response('Not found', { status: 404 });
  const tenant = await db.tenant.findUnique({ where: { id: session.tenantId } });

  const url = new URL(req.url);
  const lang = (url.searchParams.get('lang') ?? 'ar') as 'ar' | 'en' | 'bi';

  const fmtMoney = (n: any) => formatMoney(Number(n.toString()), inv.currency as 'IQD', lang === 'en' ? 'en' : 'ar');
  const date = new Intl.DateTimeFormat(lang === 'en' ? 'en-IQ' : 'ar-IQ').format(inv.date);
  const dueDate = inv.dueDate ? new Intl.DateTimeFormat(lang === 'en' ? 'en-IQ' : 'ar-IQ').format(inv.dueDate) : '—';

  const kindAr =
    inv.kind === 'CREDIT_NOTE' ? 'إشعار دائن' :
    inv.kind === 'DEBIT_NOTE'  ? 'إشعار مدين' :
    inv.kind === 'EXPORT'      ? 'فاتورة تصدير' :
    inv.kind === 'IMPORT'      ? 'فاتورة استيراد' : 'فاتورة';
  const kindEn =
    inv.kind === 'CREDIT_NOTE' ? 'Credit Note' :
    inv.kind === 'DEBIT_NOTE'  ? 'Debit Note'  :
    inv.kind === 'EXPORT'      ? 'Export Invoice' :
    inv.kind === 'IMPORT'      ? 'Import Invoice' : 'Invoice';

  const dir = lang === 'en' ? 'ltr' : 'rtl';
  const htmlLang = lang === 'en' ? 'en' : 'ar';

  const html = `<!doctype html>
<html lang="${htmlLang}" dir="${dir}">
<head>
<meta charset="utf-8" />
<title>${inv.number}</title>
<style>
  @page { size: A4; margin: 18mm; }
  body { font-family: 'Tajawal','Cairo','Helvetica',system-ui,sans-serif; color:#0c1a14; line-height: 1.45; }
  h1, h2 { margin: 0; }
  .hdr { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px double #134e3a; padding-bottom: 12px; margin-bottom: 12px; }
  .hdr-block { width: 48%; }
  .hdr-block .name-ar { font-size: 18px; font-weight: 700; color: #134e3a; }
  .hdr-block .name-en { font-size: 14px; color: #555; }
  .small { font-size: 11px; color: #555; }
  .title-row { display: flex; justify-content: space-between; align-items: baseline; margin-top: 6px; }
  .title-row h1 { font-size: 22px; color: #134e3a; }
  .num-box { display: inline-block; padding: 4px 10px; border: 2px solid #134e3a; font-family: monospace; font-weight: bold; border-radius: 4px; }
  .bill-to { background: #f6f4ec; padding: 10px 14px; border: 1px solid #d8c89a; border-radius: 6px; margin-top: 10px; }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 11.5px; }
  th { background: #134e3a; color: #fff; padding: 7px 8px; font-weight: 600; text-align: start; }
  td { border-bottom: 1px solid #e3decb; padding: 6px 8px; vertical-align: top; }
  td.num, th.num { text-align: end; font-family: monospace; }
  .desc-bi { display: flex; flex-direction: column; }
  .desc-bi .desc-en { font-size: 10px; color: #777; }
  .totals { width: 50%; margin-${dir === 'rtl' ? 'inline-start' : 'inline-start'}: auto; margin-top: 14px; font-size: 12.5px; }
  .totals td { padding: 4px 8px; border: 0; }
  .totals .grand { border-top: 2px solid #134e3a; font-weight: bold; font-size: 14px; }
  .legal { margin-top: 14px; font-size: 10px; color: #555; background: #fcfaf2; padding: 8px 12px; border: 1px dashed #d8c89a; }
  .sig { margin-top: 28px; display: flex; justify-content: space-between; font-size: 11px; }
  .sig div { border-top: 1px solid #000; padding-top: 4px; width: 30%; text-align: center; }
  .footer-bar { margin-top: 22px; padding-top: 8px; border-top: 1px solid #d8c89a; text-align: center; font-size: 9px; color: #777; }
</style>
</head>
<body>
  <div class="hdr">
    <div class="hdr-block">
      <div class="name-ar">${tenant?.nameAr ?? ''}</div>
      <div class="name-en">${tenant?.nameEn ?? ''}</div>
      <div class="small">الرقم الضريبي / TIN: <strong>${tenant?.taxNumber ?? '—'}</strong></div>
      <div class="small">السجل التجاري / CR: <strong>${tenant?.commercialReg ?? '—'}</strong></div>
      <div class="small">${tenant?.governorate ?? ''}</div>
    </div>
    <div class="hdr-block" style="text-align:${dir === 'rtl' ? 'start' : 'end'}">
      ${lang === 'bi'
        ? `<h1>${kindAr} <span style="font-size: 14px; color:#777">— ${kindEn}</span></h1>`
        : `<h1>${lang === 'en' ? kindEn : kindAr}</h1>`}
      <div class="title-row">
        <span class="num-box">#${inv.number}</span>
      </div>
      <div class="small" style="margin-top:6px">${lang === 'en' ? 'Date' : 'التاريخ'}: <strong>${date}</strong></div>
      <div class="small">${lang === 'en' ? 'Due' : 'الاستحقاق'}: <strong>${dueDate}</strong></div>
      <div class="small">${formatHijri(inv.date)}</div>
    </div>
  </div>

  <div class="bill-to">
    <strong>${lang === 'bi' ? 'إلى / Bill to' : (lang === 'en' ? 'Bill to' : 'إلى')}:</strong>
    ${inv.contact.nameAr}${inv.contact.nameEn ? ' · ' + inv.contact.nameEn : ''}
    ${inv.contact.taxNumber ? `<div class="small">${lang === 'en' ? 'TIN' : 'الرقم الضريبي'}: ${inv.contact.taxNumber}</div>` : ''}
    ${inv.contact.governorate ? `<div class="small">${inv.contact.governorate}</div>` : ''}
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 3%">#</th>
        <th>${lang === 'bi' ? 'الوصف / Description' : (lang === 'en' ? 'Description' : 'الوصف')}</th>
        <th style="width: 10%">${lang === 'en' ? 'HS' : 'الرمز'}</th>
        <th class="num" style="width: 9%">${lang === 'bi' ? 'الكمية / Qty' : (lang === 'en' ? 'Qty' : 'الكمية')}</th>
        <th class="num" style="width: 12%">${lang === 'bi' ? 'السعر / Price' : (lang === 'en' ? 'Unit price' : 'سعر الوحدة')}</th>
        <th class="num" style="width: 10%">${lang === 'en' ? 'Tax' : 'الضريبة'}</th>
        <th class="num" style="width: 14%">${lang === 'bi' ? 'الإجمالي / Total' : (lang === 'en' ? 'Line total' : 'الإجمالي')}</th>
      </tr>
    </thead>
    <tbody>
      ${inv.lines.map((l, i) => `<tr>
        <td>${i + 1}</td>
        <td>
          ${lang === 'bi'
            ? `<div class="desc-bi"><span>${escape(l.description)}</span></div>`
            : escape(l.description)}
          ${l.trademark ? `<div class="small">${escape(l.trademark)}</div>` : ''}
        </td>
        <td class="small">${l.hsCode ?? '—'}</td>
        <td class="num">${l.quantity.toString()} ${l.unitOfMeasure}</td>
        <td class="num">${fmtMoney(l.unitPrice)}</td>
        <td class="num">${fmtMoney(l.taxAmount)}</td>
        <td class="num">${fmtMoney(l.lineTotal)}</td>
      </tr>`).join('')}
    </tbody>
  </table>

  <table class="totals">
    <tr><td>${lang === 'bi' ? 'المجموع الفرعي / Subtotal' : (lang === 'en' ? 'Subtotal' : 'المجموع الفرعي')}</td><td class="num">${fmtMoney(inv.subtotal)}</td></tr>
    <tr><td>${lang === 'bi' ? 'الضريبة / Tax' : (lang === 'en' ? 'Tax' : 'الضريبة')}</td><td class="num">${fmtMoney(inv.taxTotal)}</td></tr>
    ${Number(inv.discountTotal.toString()) > 0 ? `<tr><td>${lang === 'en' ? 'Discount' : 'الخصم'}</td><td class="num">-${fmtMoney(inv.discountTotal)}</td></tr>` : ''}
    <tr class="grand"><td>${lang === 'bi' ? 'الإجمالي / Total' : (lang === 'en' ? 'Total' : 'الإجمالي')}</td><td class="num">${fmtMoney(inv.total)}</td></tr>
  </table>

  ${inv.notes ? `<div class="legal"><strong>${lang === 'en' ? 'Notes' : 'ملاحظات'}:</strong> ${escape(inv.notes)}</div>` : ''}

  <div class="sig">
    <div>${lang === 'bi' ? 'توقيع المُصدر / Issuer' : (lang === 'en' ? 'Issuer' : 'توقيع المُصدر')}</div>
    <div>${lang === 'bi' ? 'الختم الرسمي / Official stamp' : (lang === 'en' ? 'Official stamp' : 'الختم الرسمي')}</div>
    <div>${lang === 'bi' ? 'توقيع المستلم / Recipient' : (lang === 'en' ? 'Recipient' : 'توقيع المستلم')}</div>
  </div>

  <div class="footer-bar">
    ${lang === 'en'
      ? 'Issued per the Iraqi Unified Accounting System (IUAS) and GCT requirements'
      : 'صادرة وفقاً للنظام المحاسبي العراقي الموحد (IUAS) ومتطلبات الهيئة العامة للضرائب'}
  </div>
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

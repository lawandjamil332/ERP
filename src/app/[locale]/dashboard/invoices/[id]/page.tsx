import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatMoney } from '@/lib/iraq/money';
import { formatHijri } from '@/lib/iraq/dates';
import { PrintButton } from '@/components/PrintButton';

export default async function InvoiceDetailPage({
  params,
}: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  const session = await requireSession();

  const invoice = await db.invoice.findFirst({
    where: { id, tenantId: session.tenantId },
    include: { contact: true, lines: { include: { product: true } } },
  });
  if (!invoice) notFound();
  const tenant = await db.tenant.findUnique({ where: { id: session.tenantId } });

  const fmt = (n: number) => formatMoney(n, invoice.currency as 'IQD', locale as 'ar');
  const localeStr = locale === 'ar' ? 'ar-IQ' : locale === 'ku' ? 'ckb-IQ' : 'en-IQ';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold">{invoice.number}</h1>
          <p className="text-sm text-muted-foreground">{invoice.status}</p>
        </div>
        <PrintButton>Print / طباعة</PrintButton>
      </div>

      <div className="bg-white p-8 text-black print:p-0">
        <div className="mb-8 flex items-start justify-between border-b pb-4">
          <div>
            <h2 className="text-2xl font-bold">{tenant?.nameAr}</h2>
            <p className="text-sm">{tenant?.nameEn}</p>
            <p className="mt-2 font-mono text-xs">الرقم الضريبي: {tenant?.taxNumber ?? '—'}</p>
            <p className="font-mono text-xs">السجل التجاري: {tenant?.commercialReg ?? '—'}</p>
            <p className="text-xs">{tenant?.governorate}</p>
          </div>
          <div className="text-end">
            <h3 className="text-xl font-bold">فاتورة / Invoice</h3>
            <p className="mt-1 font-mono text-sm">#{invoice.number}</p>
            <p className="mt-2 text-xs">
              التاريخ: {new Intl.DateTimeFormat(localeStr).format(invoice.date)}
            </p>
            <p className="text-xs text-muted-foreground">{formatHijri(invoice.date)}</p>
            {invoice.dueDate && (
              <p className="text-xs">
                الاستحقاق: {new Intl.DateTimeFormat(localeStr).format(invoice.dueDate)}
              </p>
            )}
          </div>
        </div>

        <div className="mb-6 grid gap-4 text-sm sm:grid-cols-2">
          <Card className="print:border-0 print:shadow-none">
            <CardHeader className="pb-2"><CardTitle className="text-base">إلى / Bill to</CardTitle></CardHeader>
            <CardContent className="pt-0 text-sm">
              <p className="font-medium">{invoice.contact.nameAr}</p>
              {invoice.contact.nameEn && <p>{invoice.contact.nameEn}</p>}
              {invoice.contact.taxNumber && <p className="font-mono text-xs">الرقم الضريبي: {invoice.contact.taxNumber}</p>}
              {invoice.contact.addressAr && <p className="text-xs">{invoice.contact.addressAr}</p>}
              {invoice.contact.phone && <p dir="ltr" className="font-mono text-xs">{invoice.contact.phone}</p>}
            </CardContent>
          </Card>
          {(invoice.shippingTerms || invoice.importerAddress || invoice.exporterAddress) && (
            <Card className="print:border-0 print:shadow-none">
              <CardHeader className="pb-2"><CardTitle className="text-base">Cross-border</CardTitle></CardHeader>
              <CardContent className="pt-0 text-xs space-y-1">
                {invoice.shippingTerms && <p>Incoterms: <span className="font-mono">{invoice.shippingTerms}</span></p>}
                {invoice.paymentTerms && <p>Payment terms: {invoice.paymentTerms}</p>}
                {invoice.importerAddress && <p>Importer: {invoice.importerAddress}</p>}
                {invoice.exporterAddress && <p>Exporter: {invoice.exporterAddress}</p>}
              </CardContent>
            </Card>
          )}
        </div>

        <table className="w-full text-sm">
          <thead className="border-b bg-muted/30">
            <tr>
              <th className="px-2 py-2 text-start">#</th>
              <th className="px-2 py-2 text-start">الوصف / Description</th>
              <th className="px-2 py-2 text-start">HS</th>
              <th className="px-2 py-2 text-end">الكمية</th>
              <th className="px-2 py-2 text-end">السعر</th>
              <th className="px-2 py-2 text-end">الضريبة</th>
              <th className="px-2 py-2 text-end">الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lines.map((l, i) => (
              <tr key={l.id} className="border-b">
                <td className="px-2 py-2 align-top">{i + 1}</td>
                <td className="px-2 py-2 align-top">
                  <p>{l.description}</p>
                  {(l.countryOfOrigin || l.trademark) && (
                    <p className="text-xs text-muted-foreground">
                      {l.countryOfOrigin && `Origin: ${l.countryOfOrigin}`}
                      {l.countryOfOrigin && l.trademark && ' • '}
                      {l.trademark && `${l.trademark}`}
                    </p>
                  )}
                </td>
                <td className="px-2 py-2 align-top font-mono text-xs">{l.hsCode ?? '—'}</td>
                <td className="px-2 py-2 text-end align-top tabular-nums">
                  {Number(l.quantity).toLocaleString()} {l.unitOfMeasure}
                </td>
                <td className="px-2 py-2 text-end align-top tabular-nums">{fmt(Number(l.unitPrice))}</td>
                <td className="px-2 py-2 text-end align-top tabular-nums">{fmt(Number(l.taxAmount))}</td>
                <td className="px-2 py-2 text-end align-top tabular-nums">{fmt(Number(l.lineTotal))}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 flex justify-end">
          <table className="text-sm">
            <tbody>
              <tr>
                <td className="px-4 py-1 text-end text-muted-foreground">المجموع الفرعي / Subtotal</td>
                <td className="px-4 py-1 text-end tabular-nums">{fmt(Number(invoice.subtotal))}</td>
              </tr>
              <tr>
                <td className="px-4 py-1 text-end text-muted-foreground">الخصم / Discount</td>
                <td className="px-4 py-1 text-end tabular-nums">{fmt(Number(invoice.discountTotal))}</td>
              </tr>
              <tr>
                <td className="px-4 py-1 text-end text-muted-foreground">الضريبة / Tax</td>
                <td className="px-4 py-1 text-end tabular-nums">{fmt(Number(invoice.taxTotal))}</td>
              </tr>
              <tr className="border-t font-bold">
                <td className="px-4 py-2 text-end">الإجمالي / Total</td>
                <td className="px-4 py-2 text-end tabular-nums">{fmt(Number(invoice.total))}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {invoice.notes && (
          <div className="mt-6 rounded-md border bg-muted/30 p-3 text-sm">
            <p className="mb-1 text-xs font-medium text-muted-foreground">ملاحظات / Notes</p>
            <p>{invoice.notes}</p>
          </div>
        )}

        <div className="mt-8 grid grid-cols-2 gap-8 text-xs">
          <div>
            <div className="mt-12 border-t pt-1">توقيع المُصدر / Issuer signature</div>
          </div>
          <div>
            <div className="mt-12 border-t pt-1">توقيع المستلم / Recipient signature</div>
          </div>
        </div>
        <p className="mt-4 text-center text-[10px] text-muted-foreground">
          هذه فاتورة صادرة وفقاً للنظام المحاسبي العراقي الموحد ومتطلبات الهيئة العامة للضرائب
        </p>
      </div>
    </div>
  );
}

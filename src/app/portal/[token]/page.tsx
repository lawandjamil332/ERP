import { notFound } from 'next/navigation';
import { headers } from 'next/headers';

export default async function PortalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const h = await headers();
  const proto = h.get('x-forwarded-proto') ?? 'http';
  const host = h.get('host');
  const res = await fetch(`${proto}://${host}/api/portal/${token}`, { cache: 'no-store' });
  if (!res.ok) notFound();
  const { data } = await res.json();

  return (
    <html lang="ar" dir="rtl">
      <body style={{ fontFamily: 'Tajawal, Cairo, system-ui, sans-serif', padding: '2rem', maxWidth: 960, margin: '0 auto', color: '#111' }}>
        <header style={{ borderBottom: '2px solid #007A3D', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
          <h1 style={{ margin: 0 }}>{data.tenant.nameAr}</h1>
          <p style={{ margin: 0, color: '#666', fontSize: 14 }}>{data.tenant.nameEn}</p>
        </header>

        <h2 style={{ fontSize: 18 }}>كشف حساب / Statement</h2>
        <p style={{ color: '#666' }}>
          <strong>{data.contact.nameAr}</strong>
          {data.contact.taxNumber && ` · الرقم الضريبي ${data.contact.taxNumber}`}
        </p>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={{ padding: 8, textAlign: 'start' }}>رقم</th>
              <th style={{ padding: 8, textAlign: 'start' }}>التاريخ</th>
              <th style={{ padding: 8, textAlign: 'end' }}>الإجمالي</th>
              <th style={{ padding: 8, textAlign: 'end' }}>المدفوع</th>
              <th style={{ padding: 8, textAlign: 'end' }}>المتبقي</th>
              <th style={{ padding: 8 }}>الحالة</th>
            </tr>
          </thead>
          <tbody>
            {data.invoices.map((i: any) => {
              const balance = Number(i.total) - Number(i.amountPaid);
              return (
                <tr key={i.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: 8, fontFamily: 'monospace' }}>{i.number}</td>
                  <td style={{ padding: 8 }}>{new Date(i.date).toLocaleDateString('ar-IQ')}</td>
                  <td style={{ padding: 8, textAlign: 'end' }}>{Number(i.total).toLocaleString()} {i.currency}</td>
                  <td style={{ padding: 8, textAlign: 'end' }}>{Number(i.amountPaid).toLocaleString()} {i.currency}</td>
                  <td style={{ padding: 8, textAlign: 'end', fontWeight: 'bold' }}>{balance.toLocaleString()} {i.currency}</td>
                  <td style={{ padding: 8 }}>{i.status}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p style={{ marginTop: '2rem', textAlign: 'center', fontSize: 12, color: '#999' }}>
          هذه نسخة للقراءة فقط · صادرة عبر بوابة عميل آمنة
        </p>
      </body>
    </html>
  );
}

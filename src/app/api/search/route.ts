import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';

/**
 * Global search across the main entities. Returns up to 5 of each kind.
 * Used by the command palette for live results.
 */
export async function GET(req: Request) {
  const session = await requireSession();
  const q = (new URL(req.url).searchParams.get('q') ?? '').trim();
  if (q.length < 2) return NextResponse.json({ results: [] });

  const tenantId = session.tenantId;
  const ci = { contains: q, mode: 'insensitive' as const };

  const [invoices, contacts, products] = await Promise.all([
    db.invoice.findMany({
      where: { tenantId, deletedAt: null, OR: [{ number: ci }, { contact: { nameAr: { contains: q } } }, { contact: { nameEn: ci } }] },
      select: { id: true, number: true, total: true, currency: true, contact: { select: { nameAr: true, nameEn: true } } },
      take: 5, orderBy: { date: 'desc' },
    }),
    db.contact.findMany({
      where: { tenantId, deletedAt: null, OR: [{ nameAr: { contains: q } }, { nameEn: ci }, { phone: ci }, { reference: ci }] },
      select: { id: true, nameAr: true, nameEn: true, phone: true, kind: true },
      take: 5,
    }),
    db.product.findMany({
      where: { tenantId, deletedAt: null, OR: [{ sku: ci }, { barcode: ci }, { nameAr: { contains: q } }, { nameEn: ci }] },
      select: { id: true, sku: true, nameAr: true, nameEn: true, salePrice: true },
      take: 5,
    }),
  ]);

  const results = [
    ...invoices.map((i) => ({
      kind: 'invoice' as const, id: i.id, href: `/dashboard/invoices/${i.id}`,
      title: i.number, subtitle: i.contact.nameEn || i.contact.nameAr,
      meta: `${Number(i.total).toLocaleString()} ${i.currency}`,
    })),
    ...contacts.map((c) => ({
      kind: 'contact' as const, id: c.id, href: `/dashboard/contacts`,
      title: c.nameEn || c.nameAr, subtitle: c.phone ?? '', meta: c.kind,
    })),
    ...products.map((p) => ({
      kind: 'product' as const, id: p.id, href: `/dashboard/products`,
      title: p.nameEn || p.nameAr, subtitle: p.sku, meta: Number(p.salePrice).toLocaleString(),
    })),
  ];

  return NextResponse.json({ results });
}

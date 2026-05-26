# Iraq GCT E-Invoicing Integration

## Status (May 2026)

The General Commission for Taxes (GCT) has not yet published a production
e-invoicing API. As of the IMF's 2024 GCT Strategic Direction technical-assistance
report, e-invoicing rollout is in early planning, likely to phase in across
2026–2028 by taxpayer revenue band, similar to Saudi Arabia's ZATCA and
Egypt's ETA models.

We have prepared the system so the integration is **one well-defined file away**.

## Already in place

### Data model — `prisma/schema.prisma`

```prisma
model Invoice {
  ...
  eInvoiceUuid    String?    // assigned by GCT after submission
  eInvoiceStatus  String?    // "SUBMITTED" | "ACCEPTED" | "REJECTED"
}
```

### Environment variables — `.env.example`

```
IQ_GCT_API_URL=""
IQ_GCT_API_KEY=""
```

## What to build when GCT publishes the spec

1. **Implement `src/lib/iraq/einvoicing.ts`** with:
   - `submitInvoice(invoice, tenant) -> { uuid, status }`
   - `cancelInvoice(invoiceId, reason) -> status`
   - `pollStatus(uuid) -> status`

2. **Hook into `src/app/api/invoices/route.ts`**, after the in-transaction journal posting:

```ts
if (body.postImmediately && process.env.IQ_GCT_API_URL) {
  const result = await submitInvoice(created, tenant);
  await db.invoice.update({
    where: { id: created.id },
    data: { eInvoiceUuid: result.uuid, eInvoiceStatus: result.status },
  });
}
```

3. **Expected payload shape** (based on regional precedents):
   - Tenant tax number
   - Customer tax number / national ID
   - ISO 8601 issue date + Hijri equivalent (already on `Invoice.dateHijri`)
   - Per-line: HS code, quantity, unit price, tax, country of origin, trademark
   - Embedded digital signature (X.509 from GCT taxpayer portal)
   - Format: likely UBL 2.1 XML or JSON envelope

4. **QR code on invoice PDF** — add a QR-rendering step in
   `src/app/api/invoices/[id]/pdf/route.ts` once GCT specifies the encoding.

## Reference systems to mirror

- **ZATCA Phase 2 (Saudi Arabia)** — closest regional analog
- **Egypt ETA** — taxpayer-portal-based with JWT auth
- **PINT-AE (UAE)** — Peppol-based

When the GCT spec is published, expect 2–4 hours of work to wire it in.

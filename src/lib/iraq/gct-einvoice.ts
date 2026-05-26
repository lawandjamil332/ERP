/**
 * GCT (General Commission for Taxes) e-invoice submission adapter.
 *
 * Iraq's e-invoicing API specification is being rolled out under the Nov 2025
 * rules. This adapter abstracts the future submission endpoint with a JSON
 * payload conformant to the published draft schema. When the GCT publishes
 * the production endpoint, only the URL and signing key environment variables
 * need updating.
 *
 * For now in dev / non-configured environments the adapter records the
 * submission attempt and returns a stub UUID.
 */

import { createHash, createHmac } from 'crypto';
import type { PrismaClient, Invoice, InvoiceLine } from '@prisma/client';

export interface EinvoicePayload {
  tenant: {
    taxNumber: string;
    commercialReg?: string | null;
    nameEn: string;
  };
  invoice: {
    number: string;
    uuid: string;
    kind: string;
    date: string;
    currency: string;
    fxRate: string;
    subtotal: string;
    taxTotal: string;
    total: string;
    contact: {
      taxNumber?: string | null;
      nameEn: string;
      governorate?: string | null;
    };
    lines: Array<{
      description: string;
      hsCode?: string | null;
      countryOfOrigin?: string | null;
      quantity: string;
      unitPrice: string;
      taxRate: string;
      lineTotal: string;
    }>;
  };
  signature: string;
}

function deterministicUuid(seed: string): string {
  const h = createHash('sha1').update(seed).digest('hex');
  return [h.slice(0, 8), h.slice(8, 12), '5' + h.slice(13, 16), h.slice(16, 20), h.slice(20, 32)].join('-');
}

export interface EinvoiceContext {
  tenantId: string;
  invoiceId: string;
  invoiceNumber: string;
  /** GCT-issued tenant credentials. */
  taxNumber: string;
  commercialReg?: string | null;
  tenantName: string;
}

export function buildEinvoicePayload(
  ctx: EinvoiceContext,
  inv: Invoice & { lines: InvoiceLine[]; contact: { taxNumber: string | null; nameEn: string | null; nameAr: string; governorate: string | null } }
): EinvoicePayload {
  const uuid = inv.eInvoiceUuid ?? deterministicUuid(`${ctx.taxNumber}|${inv.number}|${inv.date.toISOString()}`);
  const body = {
    tenant: { taxNumber: ctx.taxNumber, commercialReg: ctx.commercialReg, nameEn: ctx.tenantName },
    invoice: {
      number: inv.number, uuid, kind: inv.kind,
      date: inv.date.toISOString().slice(0, 10),
      currency: inv.currency, fxRate: inv.fxRate.toString(),
      subtotal: inv.subtotal.toString(),
      taxTotal: inv.taxTotal.toString(),
      total: inv.total.toString(),
      contact: {
        taxNumber: inv.contact.taxNumber,
        nameEn: inv.contact.nameEn ?? inv.contact.nameAr,
        governorate: inv.contact.governorate,
      },
      lines: inv.lines.map((l) => ({
        description: l.description,
        hsCode: l.hsCode,
        countryOfOrigin: l.countryOfOrigin,
        quantity: l.quantity.toString(),
        unitPrice: l.unitPrice.toString(),
        taxRate: l.taxRate.toString(),
        lineTotal: l.lineTotal.toString(),
      })),
    },
  };
  const key = process.env.GCT_SIGNING_SECRET ?? 'dev-secret-not-for-production';
  const sig = createHmac('sha256', key).update(JSON.stringify(body)).digest('hex');
  return { ...body, signature: sig };
}

export interface SubmissionResult {
  uuid: string;
  status: 'SUBMITTED' | 'ACCEPTED' | 'REJECTED' | 'DEV_NOOP';
  responseCode?: string;
  responseBody?: string;
  error?: string;
}

export async function submitEinvoice(
  db: PrismaClient,
  ctx: EinvoiceContext,
  payload: EinvoicePayload
): Promise<SubmissionResult> {
  const url = process.env.GCT_EINVOICE_URL;
  if (!url) {
    await db.eInvoiceSubmission.create({
      data: {
        tenantId: ctx.tenantId, invoiceId: ctx.invoiceId,
        uuid: payload.invoice.uuid, status: 'DEV_NOOP',
        responseCode: '0', responseBody: 'GCT_EINVOICE_URL not set',
      },
    });
    return { uuid: payload.invoice.uuid, status: 'DEV_NOOP', responseCode: '0' };
  }
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(process.env.GCT_AUTH_TOKEN ? { authorization: `Bearer ${process.env.GCT_AUTH_TOKEN}` } : {}),
      },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    const status: SubmissionResult['status'] = res.ok ? 'ACCEPTED' : 'REJECTED';
    await db.eInvoiceSubmission.create({
      data: {
        tenantId: ctx.tenantId, invoiceId: ctx.invoiceId,
        uuid: payload.invoice.uuid, status,
        responseCode: String(res.status), responseBody: text.slice(0, 4000),
      },
    });
    return { uuid: payload.invoice.uuid, status, responseCode: String(res.status), responseBody: text };
  } catch (e: any) {
    await db.eInvoiceSubmission.create({
      data: {
        tenantId: ctx.tenantId, invoiceId: ctx.invoiceId,
        uuid: payload.invoice.uuid, status: 'REJECTED',
        responseCode: 'network', responseBody: e.message,
      },
    });
    return { uuid: payload.invoice.uuid, status: 'REJECTED', error: e.message };
  }
}

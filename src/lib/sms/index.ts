import { logger } from '@/lib/observability/logger';
import { normalizeIraqiPhone } from '@/lib/iraq/whatsapp';

/**
 * Iraqi SMS adapter. Supports Zain Iraq, Asia Cell, and generic HTTP gateways.
 * Falls back to no-op in dev. Provider is auto-selected from env vars:
 *
 *   SMS_PROVIDER=zain  → ZAIN_SMS_API_URL, ZAIN_SMS_TOKEN, ZAIN_SMS_FROM
 *   SMS_PROVIDER=asia  → ASIA_SMS_API_URL, ASIA_SMS_TOKEN, ASIA_SMS_FROM
 *   SMS_PROVIDER=http  → SMS_API_URL (POST), SMS_API_TOKEN
 */

export interface SendSmsArgs {
  to: string;
  message: string;
  /** Optional tenant id for billing/audit. */
  tenantId?: string;
}

export interface SendSmsResult {
  id: string;
  provider: string;
  status: 'sent' | 'queued' | 'failed' | 'noop';
  error?: string;
}

export async function sendSms(args: SendSmsArgs): Promise<SendSmsResult> {
  const e164 = normalizeIraqiPhone(args.to);
  if (!e164) {
    return { id: 'invalid', provider: 'noop', status: 'failed', error: 'invalid_iraqi_phone' };
  }
  const provider = process.env.SMS_PROVIDER;

  if (provider === 'zain') {
    return zain({ ...args, to: e164 });
  }
  if (provider === 'asia') {
    return asia({ ...args, to: e164 });
  }
  if (provider === 'http' && process.env.SMS_API_URL) {
    return generic({ ...args, to: e164 });
  }

  logger.info({ to: args.to, len: args.message.length }, 'sms (dev): no SMS_PROVIDER configured');
  return { id: 'dev', provider: 'noop', status: 'noop' };
}

async function zain(a: { to: string; message: string }): Promise<SendSmsResult> {
  const url = process.env.ZAIN_SMS_API_URL;
  const token = process.env.ZAIN_SMS_TOKEN;
  const from = process.env.ZAIN_SMS_FROM ?? 'IraqERP';
  if (!url || !token) return { id: 'nocfg', provider: 'zain', status: 'failed', error: 'zain_not_configured' };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'authorization': `Bearer ${token}` },
      body: JSON.stringify({ from, to: a.to, text: a.message }),
    });
    const body = await res.json().catch(() => ({} as any));
    if (!res.ok) {
      return { id: body.id ?? 'err', provider: 'zain', status: 'failed', error: body.error ?? `HTTP ${res.status}` };
    }
    return { id: body.id ?? body.messageId ?? 'ok', provider: 'zain', status: body.status ?? 'sent' };
  } catch (e: any) {
    return { id: 'err', provider: 'zain', status: 'failed', error: e.message };
  }
}

async function asia(a: { to: string; message: string }): Promise<SendSmsResult> {
  const url = process.env.ASIA_SMS_API_URL;
  const token = process.env.ASIA_SMS_TOKEN;
  const from = process.env.ASIA_SMS_FROM ?? 'IraqERP';
  if (!url || !token) return { id: 'nocfg', provider: 'asia', status: 'failed', error: 'asia_not_configured' };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'authorization': `Bearer ${token}` },
      body: JSON.stringify({ sender: from, recipient: a.to, message: a.message }),
    });
    const body = await res.json().catch(() => ({} as any));
    if (!res.ok) {
      return { id: body.id ?? 'err', provider: 'asia', status: 'failed', error: body.error ?? `HTTP ${res.status}` };
    }
    return { id: body.id ?? 'ok', provider: 'asia', status: body.status ?? 'sent' };
  } catch (e: any) {
    return { id: 'err', provider: 'asia', status: 'failed', error: e.message };
  }
}

async function generic(a: { to: string; message: string }): Promise<SendSmsResult> {
  const url = process.env.SMS_API_URL!;
  const token = process.env.SMS_API_TOKEN;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ to: a.to, text: a.message }),
    });
    const body = await res.json().catch(() => ({} as any));
    if (!res.ok) {
      return { id: 'err', provider: 'http', status: 'failed', error: body.error ?? `HTTP ${res.status}` };
    }
    return { id: body.id ?? 'ok', provider: 'http', status: 'sent' };
  } catch (e: any) {
    return { id: 'err', provider: 'http', status: 'failed', error: e.message };
  }
}

export function buildPaymentReminderSms(args: {
  tenantName: string;
  invoiceNumber: string;
  total: string;
  currency: string;
  dueDate?: string;
  locale: 'ar' | 'ku' | 'en';
}): string {
  const L = args.locale === 'en'
    ? `Reminder from ${args.tenantName}: invoice ${args.invoiceNumber} for ${args.total} ${args.currency}${args.dueDate ? ` is due ${args.dueDate}` : ''}.`
    : args.locale === 'ku'
    ? `بیرخستنەوە لە ${args.tenantName}: وەسڵی ژمارە ${args.invoiceNumber} بە بڕی ${args.total} ${args.currency}${args.dueDate ? ` کاتی گەیشتنی ${args.dueDate}` : ''}.`
    : `تذكير من ${args.tenantName}: الفاتورة ${args.invoiceNumber} بقيمة ${args.total} ${args.currency}${args.dueDate ? ` تستحق ${args.dueDate}` : ''}.`;
  return L;
}

/**
 * Iraqi mobile wallet integrations.
 *
 * Stubs for the major Iraqi mobile-wallet providers. Each accepts a payment
 * request and either calls the provider's REST API (when configured via env)
 * or returns a no-op DEV result.
 *
 * Provider env conventions:
 *   ZAIN_CASH_URL, ZAIN_CASH_API_KEY, ZAIN_CASH_MSISDN
 *   FASTPAY_URL, FASTPAY_API_KEY, FASTPAY_MERCHANT_ID
 *   FIB_URL, FIB_CLIENT_ID, FIB_CLIENT_SECRET
 *   ASIA_HAWALA_URL, ASIA_HAWALA_API_KEY
 */

import { normalizeIraqiPhone } from './whatsapp';
import { logger } from '@/lib/observability/logger';

export interface WalletChargeArgs {
  to: string;
  amountIqd: number;
  reference: string;
  description?: string;
}

export interface WalletChargeResult {
  provider: 'zain' | 'fastpay' | 'fib' | 'asia' | 'noop';
  status: 'OK' | 'PENDING' | 'FAILED' | 'DEV_NOOP';
  providerTxnId?: string;
  error?: string;
  raw?: any;
}

async function postJson(url: string, headers: Record<string, string>, body: any): Promise<{ ok: boolean; status: number; body: any }> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20_000),
  });
  let data: any;
  try { data = await res.json(); } catch { data = await res.text(); }
  return { ok: res.ok, status: res.status, body: data };
}

export async function chargeZainCash(args: WalletChargeArgs): Promise<WalletChargeResult> {
  const url = process.env.ZAIN_CASH_URL;
  const key = process.env.ZAIN_CASH_API_KEY;
  if (!url || !key) return { provider: 'zain', status: 'DEV_NOOP' };
  const to = normalizeIraqiPhone(args.to);
  if (!to) return { provider: 'zain', status: 'FAILED', error: 'invalid_phone' };
  try {
    const r = await postJson(url, { authorization: `Bearer ${key}` }, {
      msisdn: to, amount: args.amountIqd, currency: 'IQD',
      reference: args.reference, description: args.description ?? args.reference,
      merchant: process.env.ZAIN_CASH_MSISDN,
    });
    return {
      provider: 'zain', status: r.ok ? 'OK' : 'FAILED',
      providerTxnId: r.body?.transactionId ?? r.body?.id, error: r.ok ? undefined : `HTTP ${r.status}`, raw: r.body,
    };
  } catch (e: any) {
    logger.warn({ err: e?.message }, 'zain-cash-failed');
    return { provider: 'zain', status: 'FAILED', error: e?.message };
  }
}

export async function chargeFastPay(args: WalletChargeArgs): Promise<WalletChargeResult> {
  const url = process.env.FASTPAY_URL;
  const key = process.env.FASTPAY_API_KEY;
  if (!url || !key) return { provider: 'fastpay', status: 'DEV_NOOP' };
  const to = normalizeIraqiPhone(args.to);
  if (!to) return { provider: 'fastpay', status: 'FAILED', error: 'invalid_phone' };
  try {
    const r = await postJson(url, { 'x-api-key': key }, {
      msisdn: to, amount: args.amountIqd, currency: 'IQD',
      orderId: args.reference, merchantId: process.env.FASTPAY_MERCHANT_ID,
    });
    return {
      provider: 'fastpay', status: r.ok ? 'OK' : 'FAILED',
      providerTxnId: r.body?.txn_id, error: r.ok ? undefined : `HTTP ${r.status}`, raw: r.body,
    };
  } catch (e: any) {
    return { provider: 'fastpay', status: 'FAILED', error: e?.message };
  }
}

export async function chargeFib(args: WalletChargeArgs): Promise<WalletChargeResult> {
  const url = process.env.FIB_URL;
  const clientId = process.env.FIB_CLIENT_ID;
  const clientSecret = process.env.FIB_CLIENT_SECRET;
  if (!url || !clientId || !clientSecret) return { provider: 'fib', status: 'DEV_NOOP' };
  const to = normalizeIraqiPhone(args.to);
  try {
    const r = await postJson(url, { authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}` }, {
      mobile: to, amount: args.amountIqd, currency: 'IQD', orderId: args.reference,
    });
    return {
      provider: 'fib', status: r.ok ? 'OK' : 'FAILED',
      providerTxnId: r.body?.id, error: r.ok ? undefined : `HTTP ${r.status}`, raw: r.body,
    };
  } catch (e: any) {
    return { provider: 'fib', status: 'FAILED', error: e?.message };
  }
}

export async function chargeAsiaHawala(args: WalletChargeArgs): Promise<WalletChargeResult> {
  const url = process.env.ASIA_HAWALA_URL;
  const key = process.env.ASIA_HAWALA_API_KEY;
  if (!url || !key) return { provider: 'asia', status: 'DEV_NOOP' };
  const to = normalizeIraqiPhone(args.to);
  try {
    const r = await postJson(url, { authorization: `Bearer ${key}` }, {
      recipient: to, amount: args.amountIqd, currency: 'IQD', reference: args.reference,
    });
    return {
      provider: 'asia', status: r.ok ? 'OK' : 'FAILED',
      providerTxnId: r.body?.reference, error: r.ok ? undefined : `HTTP ${r.status}`, raw: r.body,
    };
  } catch (e: any) {
    return { provider: 'asia', status: 'FAILED', error: e?.message };
  }
}

export async function charge(
  provider: 'zain' | 'fastpay' | 'fib' | 'asia',
  args: WalletChargeArgs
): Promise<WalletChargeResult> {
  switch (provider) {
    case 'zain':    return chargeZainCash(args);
    case 'fastpay': return chargeFastPay(args);
    case 'fib':     return chargeFib(args);
    case 'asia':    return chargeAsiaHawala(args);
  }
}

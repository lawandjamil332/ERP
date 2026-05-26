/**
 * Central Bank of Iraq (CBI) daily exchange rate fetcher.
 *
 * The CBI publishes the official USD/IQD rate at cbiraq.org (currently pegged
 * at IQD 1,320/USD). For other currencies we use cross-rates from openexchangerates
 * if configured.
 *
 * Strategy:
 *   1. Hit CBI's series chart page and scrape the latest published rate
 *   2. Fall back to a sane default (env CBI_FALLBACK_RATE or 1320)
 *   3. Write to ExchangeRate table for every active tenant, dated today (UTC)
 *
 * Schedule via Railway cron: `0 8 * * 1-5` (08:00 UTC on weekdays).
 */

import type { PrismaClient } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { logger } from '@/lib/observability/logger';

export interface RateRow {
  currency: string;
  rate: number;
  source: string;
  date: Date;
}

const CBI_PEGGED_USD_IQD = 1320;

export async function fetchCbiUsdRate(): Promise<RateRow> {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  // Primary: CBI series page (HTML scrape — they don't have a public JSON API).
  // The actual page renders the rate inside a <span id="lblRate">value</span> element.
  // If it fails we fall back to the pegged rate.
  const url = process.env.CBI_RATE_URL ?? 'https://cbiraq.org/Serieschart.aspx?TseriesID=297';
  try {
    const res = await fetch(url, {
      headers: { 'user-agent': 'iraq-erp/0.4 (compliance bot)' },
      signal: AbortSignal.timeout(15_000),
    });
    if (res.ok) {
      const html = await res.text();
      const m = html.match(/(\d{3,5}(?:\.\d+)?)\s*IQD\s*\/\s*USD/i)
        ?? html.match(/lblRate[^>]*>\s*([\d.,]+)/i)
        ?? html.match(/(?:Sell|sell|Selling)[^<>\d]*?(\d{3,5}(?:\.\d+)?)/);
      if (m) {
        const value = parseFloat(m[1].replace(/,/g, ''));
        if (value > 100 && value < 10000) {
          return { currency: 'USD', rate: value, source: 'CBI', date: today };
        }
      }
    }
  } catch (e: any) {
    logger.warn({ err: e?.message }, 'cbi-rate-fetch-failed');
  }
  return {
    currency: 'USD',
    rate: Number(process.env.CBI_FALLBACK_RATE ?? CBI_PEGGED_USD_IQD),
    source: 'CBI_FALLBACK',
    date: today,
  };
}

export async function refreshAllTenantRates(db: PrismaClient): Promise<{ updated: number; rate: RateRow }> {
  const rate = await fetchCbiUsdRate();
  const tenants = await db.tenant.findMany({ select: { id: true } });
  let updated = 0;
  for (const t of tenants) {
    await db.exchangeRate.upsert({
      where: {
        tenantId_currency_date: { tenantId: t.id, currency: rate.currency, date: rate.date },
      },
      create: {
        tenantId: t.id,
        currency: rate.currency,
        rate: new Prisma.Decimal(rate.rate),
        date: rate.date,
        source: rate.source,
      },
      update: { rate: new Prisma.Decimal(rate.rate), source: rate.source },
    });
    updated++;
  }
  return { updated, rate };
}

/**
 * Iraqi Dinar (IQD) formatting & multi-currency helpers.
 *
 * IQD conventions:
 *   - No decimal places in practice (smallest circulating note is 250 IQD).
 *   - Often written with commas every 3 digits: 1,500,000
 *   - Dual quoting with USD is very common in Iraq.
 *
 * Other currencies seen in Iraq:
 *   USD (primary trade), EUR (some imports), TRY (Turkish imports),
 *   AED (Gulf trade), KRW/CNY (machinery), JOD/SAR (regional).
 */

import BigNumber from 'bignumber.js';

export const SUPPORTED_CURRENCIES = [
  'IQD', 'USD', 'EUR', 'TRY', 'AED', 'SAR', 'JOD', 'KWD', 'GBP', 'CNY',
] as const;
export type Currency = (typeof SUPPORTED_CURRENCIES)[number];

export const CURRENCY_DECIMALS: Record<Currency, number> = {
  IQD: 0, USD: 2, EUR: 2, TRY: 2, AED: 2, SAR: 2,
  JOD: 3, KWD: 3, GBP: 2, CNY: 2,
};

export function formatMoney(
  amount: BigNumber.Value,
  currency: Currency,
  locale: 'ar' | 'ku' | 'en' = 'ar'
) {
  const decimals = CURRENCY_DECIMALS[currency];
  const value = new BigNumber(amount).decimalPlaces(decimals).toFixed(decimals);

  const formatter = new Intl.NumberFormat(
    locale === 'ar' ? 'ar-IQ' : locale === 'ku' ? 'ckb-IQ' : 'en-IQ',
    {
      style: 'currency',
      currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }
  );
  try {
    return formatter.format(Number(value));
  } catch {
    return `${value} ${currency}`;
  }
}

/**
 * Convert an amount from one currency to another using a quoted FX rate.
 * Rates are stored as "IQD per 1 unit of foreign currency" by convention.
 */
export function convert(
  amount: BigNumber.Value,
  fromRateToIqd: BigNumber.Value,
  toRateToIqd: BigNumber.Value
): BigNumber {
  return new BigNumber(amount)
    .times(fromRateToIqd)
    .div(toRateToIqd);
}

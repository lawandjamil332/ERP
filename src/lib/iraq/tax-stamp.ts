/**
 * Iraqi tax stamps (طوابع مالية).
 *
 * Stamp duty applies to invoices over a governorate-set threshold. The default
 * stamp on commercial invoices is IQD 1,000 per stamp, charged once the invoice
 * crosses IQD 250,000. Some governorates use different thresholds and rates;
 * these defaults match the most common federal practice.
 */

import BigNumber from 'bignumber.js';

export interface StampPolicy {
  /** Invoices below this total are exempt. */
  thresholdIqd: number;
  /** Flat stamp amount once threshold is crossed (IQD). */
  flatIqd: number;
  /** Optional incremental fee per IQD bracket above threshold. */
  perBracketIqd?: number;
  /** Bracket size in IQD (e.g. 250000 = one extra stamp per 250k). */
  bracketSizeIqd?: number;
}

const DEFAULT_POLICY: StampPolicy = {
  thresholdIqd: 250_000,
  flatIqd: 1_000,
  perBracketIqd: 1_000,
  bracketSizeIqd: 250_000,
};

const GOVERNORATE_POLICIES: Record<string, StampPolicy> = {
  // Most governorates use the federal default; override exceptions here when verified.
};

export function policyFor(governorate?: string | null): StampPolicy {
  if (governorate && GOVERNORATE_POLICIES[governorate]) {
    return GOVERNORATE_POLICIES[governorate];
  }
  return DEFAULT_POLICY;
}

export interface StampResult {
  applies: boolean;
  stampAmount: string;
  reasonAr: string;
  reasonEn: string;
}

export function computeTaxStamp(args: {
  invoiceTotalIqd: BigNumber.Value;
  governorate?: string | null;
}): StampResult {
  const total = new BigNumber(args.invoiceTotalIqd);
  const p = policyFor(args.governorate);
  if (total.lt(p.thresholdIqd)) {
    return {
      applies: false,
      stampAmount: '0',
      reasonAr: `إجمالي الفاتورة (${total.toFixed(0)}) أقل من حد الطابع (${p.thresholdIqd}).`,
      reasonEn: `Invoice total below stamp threshold of ${p.thresholdIqd} IQD.`,
    };
  }
  let amount = new BigNumber(p.flatIqd);
  if (p.perBracketIqd && p.bracketSizeIqd) {
    const extra = total.minus(p.thresholdIqd).div(p.bracketSizeIqd);
    amount = amount.plus(extra.integerValue(BigNumber.ROUND_FLOOR).times(p.perBracketIqd));
  }
  return {
    applies: true,
    stampAmount: amount.toFixed(0),
    reasonAr: `طابع مالي مستحق: ${amount.toFixed(0)} دينار.`,
    reasonEn: `Tax stamp due: ${amount.toFixed(0)} IQD.`,
  };
}

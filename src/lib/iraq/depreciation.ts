/**
 * Iraqi fixed-asset depreciation.
 *
 * Iraq's tax law accepts straight-line and declining-balance methods, both
 * with sector-prescribed useful lives. IUAS requires assets be tracked at
 * acquisition cost less accumulated depreciation.
 *
 * Common useful lives (Iraqi GCT guidance):
 *   Buildings              — 50 years
 *   Vehicles                — 5 years
 *   Office furniture        — 10 years
 *   Machinery               — 10 years
 *   IT equipment            — 4 years
 *   Software (intangible)   — 4 years
 */

import BigNumber from 'bignumber.js';

export const IRAQ_USEFUL_LIFE_YEARS: Record<string, number> = {
  Buildings: 50,
  Vehicles: 5,
  Machinery: 10,
  Furniture: 10,
  IT: 4,
  Software: 4,
  Land: 0,
};

export interface AssetForDepreciation {
  acquisitionCost: BigNumber.Value;
  salvageValue?: BigNumber.Value;
  usefulLife: number;
  method: 'STRAIGHT_LINE' | 'DECLINING_BALANCE';
  decliningRate?: BigNumber.Value;
  accumulatedDepreciation: BigNumber.Value;
  monthsInService: number;
}

export function monthlyDepreciation(a: AssetForDepreciation): BigNumber {
  if (!a.usefulLife) return new BigNumber(0);
  const cost     = new BigNumber(a.acquisitionCost);
  const salvage  = new BigNumber(a.salvageValue ?? 0);
  const accum    = new BigNumber(a.accumulatedDepreciation);
  const nbv      = cost.minus(accum);
  if (nbv.lte(salvage)) return new BigNumber(0);

  if (a.method === 'STRAIGHT_LINE') {
    const monthly = cost.minus(salvage).div(a.usefulLife * 12);
    return BigNumber.minimum(monthly, nbv.minus(salvage));
  }
  const annualRate = new BigNumber(a.decliningRate ?? 0);
  const monthly = nbv.times(annualRate).div(12);
  return BigNumber.minimum(monthly, nbv.minus(salvage));
}

export function endOfMonth(yearMonth: string): Date {
  const [y, m] = yearMonth.split('-').map(Number);
  return new Date(Date.UTC(y, m, 0));
}

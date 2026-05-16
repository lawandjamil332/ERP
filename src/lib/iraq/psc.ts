/**
 * Production Sharing Contract (PSC) accounting for oil & gas.
 *
 * Standard PSC waterfall:
 *   1. Gross revenue from oil sold
 *   2. Pay royalty to government (royaltyRate × gross)
 *   3. Recover costs up to costRecoveryCap (capped fraction of revenue net of royalty)
 *   4. Remaining "profit oil" is split: contractorProfitShare to operator,
 *      rest to government
 */

import BigNumber from 'bignumber.js';

export interface PscPeriodInputs {
  grossRevenue: BigNumber.Value;
  recoverableCosts: BigNumber.Value;
  costRecoveryCap: BigNumber.Value;
  contractorProfitShare: BigNumber.Value;
  royaltyRate: BigNumber.Value;
}

export interface PscPeriodResult {
  royaltyPaid: string;
  netRevenueAfterRoyalty: string;
  recoveryCap: string;
  costRecovered: string;
  carryforwardCost: string;
  profitOil: string;
  contractorShare: string;
  governmentShare: string;
}

export function computePscPeriod(args: PscPeriodInputs): PscPeriodResult {
  const gross = new BigNumber(args.grossRevenue);
  const royalty = gross.times(args.royaltyRate);
  const afterRoyalty = gross.minus(royalty);
  const cap = afterRoyalty.times(args.costRecoveryCap);
  const costRecovered = BigNumber.min(new BigNumber(args.recoverableCosts), cap);
  const carryforward = new BigNumber(args.recoverableCosts).minus(costRecovered);
  const profitOil = afterRoyalty.minus(costRecovered);
  const contractor = profitOil.times(args.contractorProfitShare);
  const government = profitOil.minus(contractor).plus(royalty);

  return {
    royaltyPaid: royalty.toFixed(4),
    netRevenueAfterRoyalty: afterRoyalty.toFixed(4),
    recoveryCap: cap.toFixed(4),
    costRecovered: costRecovered.toFixed(4),
    carryforwardCost: carryforward.toFixed(4),
    profitOil: profitOil.toFixed(4),
    contractorShare: contractor.toFixed(4),
    governmentShare: government.toFixed(4),
  };
}

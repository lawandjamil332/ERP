/**
 * Future-VAT module placeholder. Iraq has not yet introduced a general VAT.
 * See docs/VAT_FUTURE.md.
 */

import BigNumber from 'bignumber.js';

export interface VatConfig {
  standardRate: number;
  zeroRatedCategories: string[];
  exemptCategories: string[];
  registrationThreshold: number;
  filingPeriod: 'MONTHLY' | 'QUARTERLY';
}

export const DEFAULT_VAT_CONFIG_PLACEHOLDER: VatConfig = {
  standardRate: 0,
  zeroRatedCategories: [],
  exemptCategories: ['EDUCATION', 'HEALTHCARE', 'FINANCIAL_SERVICES'],
  registrationThreshold: 100_000_000,
  filingPeriod: 'MONTHLY',
};

export interface VatReturn {
  outputVat: BigNumber;
  inputVat: BigNumber;
  netPayable: BigNumber;
  refundable: boolean;
}

export function computeVatReturn(args: {
  taxableSales: BigNumber.Value;
  taxablePurchases: BigNumber.Value;
  config: VatConfig;
}): VatReturn {
  const output = new BigNumber(args.taxableSales).times(args.config.standardRate);
  const input  = new BigNumber(args.taxablePurchases).times(args.config.standardRate);
  const net = output.minus(input);
  return {
    outputVat: output, inputVat: input,
    netPayable: net.abs(),
    refundable: net.lt(0),
  };
}

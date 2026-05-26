/**
 * End-of-Service Indemnity (مكافأة نهاية الخدمة) under Iraqi Labor Law.
 */

import BigNumber from 'bignumber.js';

export type EosiReason =
  | 'RESIGNATION'
  | 'TERMINATION_WITHOUT_CAUSE'
  | 'TERMINATION_FOR_CAUSE'
  | 'DEATH_OR_DISABILITY'
  | 'END_OF_CONTRACT';

export interface EosiInputs {
  hireDate: Date;
  endDate: Date;
  lastMonthlySalary: BigNumber.Value;
  reason: EosiReason;
}

export interface EosiResult {
  yearsOfService: number;
  monthsExtra: number;
  factorPerYear: number;
  amount: string;
  notes: string;
}

export function computeEosi(args: EosiInputs): EosiResult {
  const ms = args.endDate.getTime() - args.hireDate.getTime();
  const yearsExact = ms / (365.25 * 24 * 3_600_000);
  const yearsOfService = Math.floor(yearsExact);
  const monthsExtra = Math.floor((yearsExact - yearsOfService) * 12);

  let factorPerYear = 0;
  let notes = '';
  switch (args.reason) {
    case 'TERMINATION_FOR_CAUSE':
      factorPerYear = 0;
      notes = 'Forfeited under Iraqi labor law (terminated for cause).';
      break;
    case 'RESIGNATION':
      factorPerYear = yearsOfService < 5 ? 0.5 : 1;
      notes = yearsOfService < 5
        ? 'Resignation under 5 years: ½ month per year.'
        : 'Resignation after ≥5 years: 1 month per year.';
      break;
    case 'TERMINATION_WITHOUT_CAUSE':
    case 'DEATH_OR_DISABILITY':
    case 'END_OF_CONTRACT':
      factorPerYear = 1;
      notes = 'Full 1 month per year of service.';
      break;
  }

  const monthly = new BigNumber(args.lastMonthlySalary);
  const totalYears = new BigNumber(yearsOfService).plus(new BigNumber(monthsExtra).div(12));
  const amount = monthly.times(factorPerYear).times(totalYears);

  return {
    yearsOfService, monthsExtra, factorPerYear,
    amount: amount.toFixed(0),
    notes,
  };
}

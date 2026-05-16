/**
 * Installment plan (تقسيط) helpers — Iraqi retail standard for big-ticket items
 * (phones, appliances, furniture) sold on monthly payments.
 *
 * Two pricing models supported:
 *   1. Flat (no interest): financedAmount split equally across installments
 *   2. Flat interest: simple interest applied to the financed amount, then split
 *
 * Iraqi retail almost exclusively uses simple flat rates ("نسبة ثابتة"),
 * not amortized compound interest like Western auto loans.
 */

import BigNumber from 'bignumber.js';

export interface InstallmentPlanInputs {
  totalAmount: BigNumber.Value;
  downPayment?: BigNumber.Value;
  numberOfInstallments: number;
  /** Total simple-interest rate over the whole tenor, e.g. 0.10 = 10%. */
  interestRatePct?: BigNumber.Value;
  startDate: Date;
}

export interface InstallmentRow {
  sequence: number;
  dueDate: Date;
  amount: string;
}

export interface InstallmentPlanResult {
  totalAmount: string;
  downPayment: string;
  financedAmount: string;
  totalRepayable: string;
  installmentAmount: string;
  totalInterest: string;
  schedule: InstallmentRow[];
}

export function buildInstallmentPlan(args: InstallmentPlanInputs): InstallmentPlanResult {
  const total = new BigNumber(args.totalAmount);
  const down = new BigNumber(args.downPayment ?? 0);
  const financed = total.minus(down);
  const rate = new BigNumber(args.interestRatePct ?? 0);
  const interest = financed.times(rate);
  const repayable = financed.plus(interest);
  const n = Math.max(1, Math.floor(args.numberOfInstallments));
  const perInstallment = repayable.div(n);

  const schedule: InstallmentRow[] = [];
  let rolling = new BigNumber(0);
  for (let i = 1; i <= n; i++) {
    const due = new Date(args.startDate);
    due.setUTCMonth(due.getUTCMonth() + i);
    // Final installment absorbs rounding remainder.
    const amount = i === n
      ? repayable.minus(rolling)
      : perInstallment.integerValue(BigNumber.ROUND_HALF_UP);
    schedule.push({ sequence: i, dueDate: due, amount: amount.toFixed(2) });
    rolling = rolling.plus(amount);
  }

  return {
    totalAmount: total.toFixed(2),
    downPayment: down.toFixed(2),
    financedAmount: financed.toFixed(2),
    totalRepayable: repayable.toFixed(2),
    installmentAmount: perInstallment.integerValue(BigNumber.ROUND_HALF_UP).toFixed(2),
    totalInterest: interest.toFixed(2),
    schedule,
  };
}

export function applyPaymentToSchedule(
  schedule: { sequence: number; amount: string; paidAmount: string; status: string }[],
  payment: BigNumber.Value
): { allocations: Array<{ sequence: number; applied: string; newPaid: string; newStatus: string }>; remaining: string } {
  let remaining = new BigNumber(payment);
  const allocations: ReturnType<typeof applyPaymentToSchedule>['allocations'] = [];
  for (const row of schedule.sort((a, b) => a.sequence - b.sequence)) {
    if (remaining.lte(0)) break;
    const due = new BigNumber(row.amount).minus(row.paidAmount);
    if (due.lte(0)) continue;
    const applied = BigNumber.min(due, remaining);
    const newPaid = new BigNumber(row.paidAmount).plus(applied);
    const newStatus = newPaid.gte(row.amount) ? 'PAID' : 'PARTIAL';
    allocations.push({
      sequence: row.sequence,
      applied: applied.toFixed(2),
      newPaid: newPaid.toFixed(2),
      newStatus,
    });
    remaining = remaining.minus(applied);
  }
  return { allocations, remaining: remaining.toFixed(2) };
}

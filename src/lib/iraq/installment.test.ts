import { describe, it, expect } from 'vitest';
import { buildInstallmentPlan, applyPaymentToSchedule } from './installment';

describe('buildInstallmentPlan', () => {
  it('flat plan with no interest splits financed amount equally', () => {
    const r = buildInstallmentPlan({
      totalAmount: 1_200_000, downPayment: 0,
      numberOfInstallments: 12, startDate: new Date(Date.UTC(2026, 0, 1)),
    });
    expect(r.financedAmount).toBe('1200000.00');
    expect(r.totalRepayable).toBe('1200000.00');
    expect(r.schedule).toHaveLength(12);
    expect(r.schedule[0].amount).toBe('100000.00');
    expect(r.schedule[11].dueDate.toISOString().slice(0, 7)).toBe('2027-01');
  });

  it('respects down payment', () => {
    const r = buildInstallmentPlan({
      totalAmount: 1_000_000, downPayment: 200_000,
      numberOfInstallments: 8, startDate: new Date(Date.UTC(2026, 5, 1)),
    });
    expect(r.financedAmount).toBe('800000.00');
    expect(r.schedule).toHaveLength(8);
    expect(r.schedule[0].amount).toBe('100000.00');
  });

  it('applies simple interest as a flat add-on', () => {
    const r = buildInstallmentPlan({
      totalAmount: 1_000_000, downPayment: 0,
      numberOfInstallments: 10, interestRatePct: 0.10,
      startDate: new Date(Date.UTC(2026, 0, 1)),
    });
    expect(r.totalInterest).toBe('100000.00');
    expect(r.totalRepayable).toBe('1100000.00');
    expect(r.installmentAmount).toBe('110000.00');
  });
});

describe('applyPaymentToSchedule', () => {
  it('applies payment in sequence order, marking PAID when due is met', () => {
    const sched = [
      { sequence: 1, amount: '100', paidAmount: '0', status: 'PENDING' },
      { sequence: 2, amount: '100', paidAmount: '0', status: 'PENDING' },
      { sequence: 3, amount: '100', paidAmount: '0', status: 'PENDING' },
    ];
    const out = applyPaymentToSchedule(sched, 150);
    expect(out.allocations).toHaveLength(2);
    expect(out.allocations[0]).toMatchObject({ sequence: 1, newStatus: 'PAID' });
    expect(out.allocations[1]).toMatchObject({ sequence: 2, newStatus: 'PARTIAL', applied: '50.00' });
    expect(out.remaining).toBe('0.00');
  });

  it('skips already-paid installments', () => {
    const sched = [
      { sequence: 1, amount: '100', paidAmount: '100', status: 'PAID' },
      { sequence: 2, amount: '100', paidAmount: '0', status: 'PENDING' },
    ];
    const out = applyPaymentToSchedule(sched, 50);
    expect(out.allocations).toHaveLength(1);
    expect(out.allocations[0].sequence).toBe(2);
  });

  it('returns remaining when payment exceeds all dues', () => {
    const sched = [
      { sequence: 1, amount: '100', paidAmount: '0', status: 'PENDING' },
    ];
    const out = applyPaymentToSchedule(sched, 250);
    expect(out.remaining).toBe('150.00');
  });
});

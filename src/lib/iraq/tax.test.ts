import { describe, it, expect } from 'vitest';
import {
  computePayroll, computeCIT,
  PIT_BRACKETS_FEDERAL_ANNUAL, ALLOWANCES_ANNUAL, SS_RATES, CIT_RATES,
} from './tax';

describe('Iraq tax — constants & sources', () => {
  it('PIT federal brackets match law (3/5/10/15%)', () => {
    expect(PIT_BRACKETS_FEDERAL_ANNUAL.map((b) => b.rate)).toEqual([0.03, 0.05, 0.10, 0.15]);
  });
  it('allowances match GCT (2.5M single, 4.5M married)', () => {
    expect(ALLOWANCES_ANNUAL.single).toBe(2_500_000);
    expect(ALLOWANCES_ANNUAL.married).toBe(4_500_000);
    expect(ALLOWANCES_ANNUAL.perChild).toBe(200_000);
  });
  it('SS rates: 5%/12%, oil&gas 25%', () => {
    expect(SS_RATES.employee).toBe(0.05);
    expect(SS_RATES.employer.default).toBe(0.12);
    expect(SS_RATES.employer.oilGas).toBe(0.25);
  });
  it('CIT: federal 15% general / 35% oil&gas; KRG flat 15%', () => {
    expect(CIT_RATES.federal.general).toBe(0.15);
    expect(CIT_RATES.federal.oilGas).toBe(0.35);
    expect(CIT_RATES.kurdistan.oilGas).toBe(0.15);
  });
});

describe('computePayroll — federal Iraq', () => {
  it('oil & gas sector uses 25% employer SS', () => {
    const r = computePayroll({ baseSalary: 1_000_000 }, { region: 'FEDERAL', sector: 'OIL_GAS' });
    expect(r.ssEmployer.toFixed(0)).toBe('250000');
  });

  it('KRG defaults to flat 5% practical rate', () => {
    const r = computePayroll({ baseSalary: 1_000_000 }, { region: 'KURDISTAN', sector: 'GENERAL' });
    expect(Number(r.incomeTax.toFixed(0))).toBeGreaterThan(35_000);
    expect(Number(r.incomeTax.toFixed(0))).toBeLessThan(45_000);
  });

  it('KRG official rate (15%) opt-in produces ~3x the tax of practical', () => {
    const a = computePayroll({ baseSalary: 1_000_000 }, { region: 'KURDISTAN', sector: 'GENERAL' });
    const b = computePayroll({ baseSalary: 1_000_000 }, { region: 'KURDISTAN', sector: 'GENERAL', krgUseOfficialRate: true });
    expect(Number(b.incomeTax)).toBeGreaterThan(Number(a.incomeTax));
  });

  it('dependents reduce taxable income', () => {
    const single = computePayroll({ baseSalary: 1_000_000 }, { region: 'FEDERAL', sector: 'GENERAL' });
    const married2 = computePayroll(
      { baseSalary: 1_000_000, isMarried: true, dependents: 2 },
      { region: 'FEDERAL', sector: 'GENERAL' }
    );
    expect(Number(married2.incomeTax)).toBeLessThan(Number(single.incomeTax));
  });

  it('net = gross - SS - PIT - other', () => {
    const r = computePayroll(
      { baseSalary: 1_000_000, otherDeductions: 50_000 },
      { region: 'FEDERAL', sector: 'GENERAL' }
    );
    const expected = r.gross.minus(r.ssEmployee).minus(r.incomeTax).minus(r.otherDeductions);
    expect(r.net.toFixed(2)).toBe(expected.toFixed(2));
  });

  it('employerCost = gross + employer SS', () => {
    const r = computePayroll({ baseSalary: 1_000_000 }, { region: 'FEDERAL', sector: 'GENERAL' });
    expect(r.employerCost.toFixed(0)).toBe(r.gross.plus(r.ssEmployer).toFixed(0));
  });

  it('applyIncomeTax=false zeroes PIT but keeps SS', () => {
    const r = computePayroll({ baseSalary: 5_000_000 }, { region: 'FEDERAL', sector: 'GENERAL', applyIncomeTax: false });
    expect(r.incomeTax.toNumber()).toBe(0);
    expect(r.ssEmployee.toNumber()).toBeGreaterThan(0);
    expect(r.net.toFixed(0)).toBe(r.gross.minus(r.ssEmployee).toFixed(0));
  });

  it('applySocialSecurity=false zeroes both SS shares but keeps PIT', () => {
    const r = computePayroll({ baseSalary: 5_000_000 }, { region: 'FEDERAL', sector: 'GENERAL', applySocialSecurity: false });
    expect(r.ssEmployee.toNumber()).toBe(0);
    expect(r.ssEmployer.toNumber()).toBe(0);
    expect(r.incomeTax.toNumber()).toBeGreaterThan(0);
    expect(r.employerCost.toFixed(0)).toBe(r.gross.toFixed(0));
  });

  it('both off → net equals gross minus other deductions only', () => {
    const r = computePayroll(
      { baseSalary: 5_000_000, otherDeductions: 100_000 },
      { region: 'FEDERAL', sector: 'GENERAL', applyIncomeTax: false, applySocialSecurity: false },
    );
    expect(r.net.toFixed(0)).toBe(r.gross.minus(100_000).toFixed(0));
  });
});

describe('computeCIT', () => {
  it('federal general: 15%', () => {
    expect(computeCIT(1_000_000, { region: 'FEDERAL', sector: 'GENERAL' }).toFixed(0)).toBe('150000');
  });
  it('federal oil&gas: 35%', () => {
    expect(computeCIT(1_000_000, { region: 'FEDERAL', sector: 'OIL_GAS' }).toFixed(0)).toBe('350000');
  });
  it('KRG oil&gas stays at 15%', () => {
    expect(computeCIT(1_000_000, { region: 'KURDISTAN', sector: 'OIL_GAS' }).toFixed(0)).toBe('150000');
  });
});

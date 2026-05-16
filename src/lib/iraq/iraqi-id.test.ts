import { describe, it, expect } from 'vitest';
import { validateIraqiId, normalizeIraqiId, checkDigitIraqiId, isLegacyNationalId } from './iraqi-id';

describe('normalizeIraqiId', () => {
  it('converts Arabic-Indic numerals to Latin', () => {
    expect(normalizeIraqiId('٠١٢٣٤٥٦٧٨٩١٢')).toBe('012345678912');
  });
  it('strips non-digits', () => {
    expect(normalizeIraqiId('01-2345-67891-2')).toBe('012345678912');
  });
});

describe('validateIraqiId', () => {
  it('rejects wrong length', () => {
    const r = validateIraqiId('12345');
    expect(r.valid).toBe(false);
    expect(r.reason).toMatch(/12 digits/);
  });
  it('rejects invalid governorate code', () => {
    const id = '99' + '0000000000';
    const fixed = id.slice(0, 11) + checkDigitIraqiId(id.slice(0, 11));
    const r = validateIraqiId(fixed);
    expect(r.valid).toBe(false);
    expect(r.reason).toMatch(/governorate/);
  });
  it('validates a well-formed Baghdad (01) ID', () => {
    const id11 = '01' + '123456789';
    const full = id11 + checkDigitIraqiId(id11);
    const r = validateIraqiId(full);
    expect(r.valid).toBe(true);
    expect(r.governorateCode).toBe('01');
  });
  it('detects check-digit mismatch', () => {
    const id11 = '01' + '123456789';
    const wrong = id11 + ((parseInt(checkDigitIraqiId(id11), 10) + 1) % 10).toString();
    const r = validateIraqiId(wrong);
    expect(r.valid).toBe(false);
    expect(r.reason).toMatch(/check-digit/);
  });
});

describe('isLegacyNationalId', () => {
  it('accepts 5-9 digit legacy IDs', () => {
    expect(isLegacyNationalId('12345')).toBe(true);
    expect(isLegacyNationalId('123456789')).toBe(true);
  });
  it('rejects 12-digit (new) IDs', () => {
    expect(isLegacyNationalId('012345678912')).toBe(false);
  });
});

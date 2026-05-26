import { describe, it, expect } from 'vitest';
import { toArabicNumerals, toLatinNumerals, formatNumber } from './numerals';

describe('numerals', () => {
  it('converts Latin to Arabic-Indic', () => {
    expect(toArabicNumerals('0123456789')).toBe('٠١٢٣٤٥٦٧٨٩');
  });
  it('converts Arabic-Indic back to Latin', () => {
    expect(toLatinNumerals('٠١٢٣٤٥٦٧٨٩')).toBe('0123456789');
  });
  it('round-trips arbitrary text containing digits', () => {
    const original = 'Invoice #1234 — total 567,890 IQD';
    expect(toLatinNumerals(toArabicNumerals(original))).toBe(original);
  });
  it('formatNumber honours useArabicNumerals=false', () => {
    const v = formatNumber(1234, { locale: 'ar', useArabicNumerals: false });
    expect(v).toMatch(/[0-9]/);
    expect(v).not.toMatch(/[٠-٩]/);
  });
});

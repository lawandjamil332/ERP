/**
 * Iraqi National ID (Bitaqa Muwahhada) validator.
 *
 * Format: 12 digits. First 2 = governorate code (01–18 valid),
 * digits 3–11 = sequence, digit 12 = check digit (Luhn-like).
 *
 * For older 5-digit national records use `isLegacyNationalId`.
 */

const GOVERNORATE_CODES = [
  '01','02','03','04','05','06','07','08','09','10',
  '11','12','13','14','15','16','17','18',
];

export function normalizeIraqiId(raw: string): string {
  return raw.replace(/[^\d٠-٩]/g, '').replace(/[٠-٩]/g, (d) =>
    String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))
  );
}

export function checkDigitIraqiId(first11: string): string {
  const sum = first11.split('').reduce((s, ch, i) => {
    const d = parseInt(ch, 10);
    return s + (i % 2 === 0 ? d * 2 : d);
  }, 0);
  return String((10 - (sum % 10)) % 10);
}

export interface IdValidation {
  valid: boolean;
  reason?: string;
  governorateCode?: string;
}

export function validateIraqiId(raw: string): IdValidation {
  const id = normalizeIraqiId(raw);
  if (id.length !== 12) {
    return { valid: false, reason: 'must be 12 digits' };
  }
  if (!/^\d{12}$/.test(id)) {
    return { valid: false, reason: 'must contain only digits' };
  }
  const gov = id.slice(0, 2);
  if (!GOVERNORATE_CODES.includes(gov)) {
    return { valid: false, reason: `invalid governorate code ${gov}` };
  }
  const expected = checkDigitIraqiId(id.slice(0, 11));
  if (expected !== id[11]) {
    return { valid: false, reason: 'check-digit mismatch', governorateCode: gov };
  }
  return { valid: true, governorateCode: gov };
}

export function isLegacyNationalId(raw: string): boolean {
  const s = normalizeIraqiId(raw);
  return /^\d{5,9}$/.test(s);
}

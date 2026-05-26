import { describe, it, expect } from 'vitest';
import { normalizeIraqiPhone, buildWhatsAppLink, defaultInvoiceMessage } from './whatsapp';

describe('Iraqi phone normalisation', () => {
  it('+964 prefix kept', () => expect(normalizeIraqiPhone('+9647901234567')).toBe('9647901234567'));
  it('00 prefix stripped', () => expect(normalizeIraqiPhone('009647901234567')).toBe('9647901234567'));
  it('local 0-prefix expanded', () => expect(normalizeIraqiPhone('07901234567')).toBe('9647901234567'));
  it('10 digits no prefix', () => expect(normalizeIraqiPhone('7901234567')).toBe('9647901234567'));
  it('garbage returns null', () => expect(normalizeIraqiPhone('not a phone')).toBeNull());
});

describe('WhatsApp link', () => {
  it('builds wa.me url', () => {
    const link = buildWhatsAppLink('+9647901234567', 'hello world');
    expect(link).toContain('https://wa.me/9647901234567');
    expect(link).toContain('hello%20world');
  });
  it('returns null for invalid phone', () => {
    expect(buildWhatsAppLink('xx', 'hi')).toBeNull();
  });
});

describe('Default Arabic invoice message', () => {
  it('includes number and total', () => {
    const m = defaultInvoiceMessage({
      tenantName: 'ABC',
      number: 'INV-2026-000001',
      total: '500000', currency: 'IQD', locale: 'ar',
    });
    expect(m).toContain('INV-2026-000001');
    expect(m).toContain('500000');
  });
});

import { describe, it, expect } from 'vitest';
import { generateTotpSecret, totpUri, verifyTotp } from './totp';
import { authenticator } from 'otplib';

describe('TOTP', () => {
  it('generates a base32 secret of expected length', () => {
    const s = generateTotpSecret();
    expect(s).toMatch(/^[A-Z2-7]+$/);
    expect(s.length).toBeGreaterThan(16);
  });

  it('builds an otpauth URI with account + issuer', () => {
    const uri = totpUri({ account: 'lawand@example.com', issuer: 'Iraq ERP', secret: 'ABCDEFGHIJKLMNOP' });
    expect(uri).toMatch(/^otpauth:\/\/totp\//);
    expect(uri).toMatch(/Iraq%20ERP/);
    expect(uri).toMatch(/lawand(@|%40)example\.com/);
  });

  it('verifies a freshly-generated code', () => {
    const secret = generateTotpSecret();
    const code = authenticator.generate(secret);
    expect(verifyTotp(code, secret)).toBe(true);
  });

  it('rejects malformed codes', () => {
    const secret = generateTotpSecret();
    expect(verifyTotp('abcdef', secret)).toBe(false);
    expect(verifyTotp('12345', secret)).toBe(false);
    expect(verifyTotp('', secret)).toBe(false);
  });

  it('rejects wrong codes', () => {
    const secret = generateTotpSecret();
    expect(verifyTotp('000000', secret)).toBe(false);
  });
});

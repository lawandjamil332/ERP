import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sendSms, buildPaymentReminderSms } from './index';

describe('sendSms', () => {
  beforeEach(() => {
    delete process.env.SMS_PROVIDER;
  });

  it('returns noop when no provider configured', async () => {
    const r = await sendSms({ to: '07901234567', message: 'hello' });
    expect(r.provider).toBe('noop');
    expect(r.status).toBe('noop');
  });

  it('rejects invalid Iraqi phone numbers', async () => {
    const r = await sendSms({ to: 'not-a-number', message: 'x' });
    expect(r.status).toBe('failed');
    expect(r.error).toBe('invalid_iraqi_phone');
  });
});

describe('buildPaymentReminderSms', () => {
  it('builds Arabic reminder', () => {
    const s = buildPaymentReminderSms({
      tenantName: 'شركة', invoiceNumber: 'INV-001',
      total: '500000', currency: 'IQD', dueDate: '2026-04-01', locale: 'ar',
    });
    expect(s).toMatch(/تذكير/);
    expect(s).toMatch(/INV-001/);
  });

  it('builds English reminder', () => {
    const s = buildPaymentReminderSms({
      tenantName: 'Co', invoiceNumber: 'INV-002',
      total: '300', currency: 'USD', locale: 'en',
    });
    expect(s).toMatch(/Reminder from Co/);
    expect(s).toMatch(/INV-002/);
  });

  it('builds Kurdish reminder', () => {
    const s = buildPaymentReminderSms({
      tenantName: 'Co', invoiceNumber: 'INV-003',
      total: '100', currency: 'IQD', locale: 'ku',
    });
    expect(s).toMatch(/بیرخستنەوە/);
  });
});

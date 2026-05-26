/**
 * WhatsApp send helpers. Iraqi B2B/B2C channel.
 * Two modes: free URL (wa.me) or Meta Cloud API.
 */

export function normalizeIraqiPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('964')) return digits;
  if (digits.startsWith('00964')) return digits.slice(2);
  if (digits.startsWith('0') && digits.length === 11) return '964' + digits.slice(1);
  if (digits.length === 10) return '964' + digits;
  return null;
}

export function buildWhatsAppLink(phone: string, message: string): string | null {
  const e164 = normalizeIraqiPhone(phone);
  if (!e164) return null;
  return `https://wa.me/${e164}?text=${encodeURIComponent(message)}`;
}

export function defaultInvoiceMessage(args: {
  tenantName: string;
  number: string;
  total: string;
  currency: string;
  dueDate?: string;
  locale: 'ar' | 'ku' | 'en';
}): string {
  const L: Record<typeof args.locale, string[]> = {
    ar: [
      `مرحباً،`,
      `فاتورة من ${args.tenantName}`,
      `رقم: ${args.number}`,
      `المبلغ: ${args.total} ${args.currency}`,
      args.dueDate ? `الاستحقاق: ${args.dueDate}` : '',
      `شكراً لكم.`,
    ],
    ku: [
      `سڵاو،`,
      `وەسڵ لە ${args.tenantName}`,
      `ژمارە: ${args.number}`,
      `بڕ: ${args.total} ${args.currency}`,
      args.dueDate ? `بەرواری گەیشتن: ${args.dueDate}` : '',
      `سوپاس.`,
    ],
    en: [
      `Hello,`,
      `Invoice from ${args.tenantName}`,
      `Number: ${args.number}`,
      `Amount: ${args.total} ${args.currency}`,
      args.dueDate ? `Due: ${args.dueDate}` : '',
      `Thank you.`,
    ],
  };
  return L[args.locale].filter(Boolean).join('\n');
}

export async function sendViaCloudApi(args: { to: string; message: string }):
  Promise<{ sent: boolean; id?: string; error?: string }> {
  const phoneId = process.env.WA_PHONE_ID;
  const token   = process.env.WA_TOKEN;
  if (!phoneId || !token) return { sent: false, error: 'wa_not_configured' };
  const e164 = normalizeIraqiPhone(args.to);
  if (!e164) return { sent: false, error: 'invalid_phone' };

  const res = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
    method: 'POST',
    headers: { 'authorization': `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp', to: e164, type: 'text',
      text: { preview_url: false, body: args.message },
    }),
  });
  if (!res.ok) return { sent: false, error: `wa_api_${res.status}` };
  const body = await res.json().catch(() => null);
  return { sent: true, id: body?.messages?.[0]?.id };
}

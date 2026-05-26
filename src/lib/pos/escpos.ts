/**
 * ESC/POS receipt builder for thermal printers (Epson TM-T20, T88, common 80mm USB/Ethernet).
 *
 * Outputs a Buffer of raw bytes to send to the printer over IP/USB/Serial.
 * Frontends call /api/pos/sessions/[id]/receipt/[orderId]?format=escpos and pipe
 * the response to the printer driver.
 */

const ESC = 0x1b;
const GS  = 0x1d;

const cmd = {
  init:        Buffer.from([ESC, 0x40]),
  alignLeft:   Buffer.from([ESC, 0x61, 0]),
  alignCenter: Buffer.from([ESC, 0x61, 1]),
  alignRight:  Buffer.from([ESC, 0x61, 2]),
  boldOn:      Buffer.from([ESC, 0x45, 1]),
  boldOff:     Buffer.from([ESC, 0x45, 0]),
  underlineOn: Buffer.from([ESC, 0x2d, 1]),
  underlineOff:Buffer.from([ESC, 0x2d, 0]),
  doubleHeight:Buffer.from([GS, 0x21, 0x01]),
  normal:      Buffer.from([GS, 0x21, 0x00]),
  feed: (n: number) => Buffer.from([ESC, 0x64, n]),
  cut:         Buffer.from([GS, 0x56, 0x00]),
  // Arabic codepage (Windows-1256) requires printer with Arabic font support.
  codePage:    Buffer.from([ESC, 0x74, 22]),
};

export interface ReceiptData {
  tenantName: string;
  tenantTaxNumber?: string;
  branch?: string;
  cashier?: string;
  orderNumber: string;
  date: Date;
  lines: Array<{ name: string; qty: string; price: string; total: string }>;
  subtotal: string;
  tax: string;
  discount?: string;
  total: string;
  paid: string;
  change?: string;
  method: string;
  currency: string;
  footer?: string;
}

function line(s: string, width = 32): Buffer {
  return Buffer.from(s.slice(0, width) + '\n', 'utf-8');
}

function leftRight(left: string, right: string, width = 32): Buffer {
  const space = Math.max(1, width - left.length - right.length);
  return Buffer.from(left + ' '.repeat(space) + right + '\n', 'utf-8');
}

const sep = (width = 32) => Buffer.from('-'.repeat(width) + '\n', 'utf-8');

export function buildEscPosReceipt(d: ReceiptData): Buffer {
  const parts: Buffer[] = [];
  parts.push(cmd.init);
  parts.push(cmd.codePage);

  parts.push(cmd.alignCenter, cmd.doubleHeight, cmd.boldOn);
  parts.push(line(d.tenantName));
  parts.push(cmd.normal, cmd.boldOff);
  if (d.tenantTaxNumber) parts.push(line(`TIN: ${d.tenantTaxNumber}`));
  if (d.branch) parts.push(line(d.branch));
  parts.push(sep());

  parts.push(cmd.alignLeft);
  parts.push(line(`Receipt: ${d.orderNumber}`));
  parts.push(line(`Date: ${d.date.toISOString().replace('T', ' ').slice(0, 19)}`));
  if (d.cashier) parts.push(line(`Cashier: ${d.cashier}`));
  parts.push(sep());

  for (const l of d.lines) {
    parts.push(line(l.name));
    parts.push(leftRight(`  ${l.qty} x ${l.price}`, l.total));
  }
  parts.push(sep());

  parts.push(leftRight('Subtotal', `${d.subtotal} ${d.currency}`));
  if (d.discount) parts.push(leftRight('Discount', `${d.discount} ${d.currency}`));
  parts.push(leftRight('Tax', `${d.tax} ${d.currency}`));
  parts.push(cmd.boldOn);
  parts.push(leftRight('TOTAL', `${d.total} ${d.currency}`));
  parts.push(cmd.boldOff);
  parts.push(leftRight(`Paid (${d.method})`, `${d.paid} ${d.currency}`));
  if (d.change) parts.push(leftRight('Change', `${d.change} ${d.currency}`));
  parts.push(sep());

  parts.push(cmd.alignCenter);
  parts.push(line(d.footer ?? 'Thank you · شكراً'));
  parts.push(cmd.feed(3));
  parts.push(cmd.cut);

  return Buffer.concat(parts);
}

/** ASCII preview of the receipt (for showing on screen before printing). */
export function previewReceipt(d: ReceiptData): string {
  const out: string[] = [];
  out.push(d.tenantName.toUpperCase());
  if (d.tenantTaxNumber) out.push(`TIN: ${d.tenantTaxNumber}`);
  if (d.branch) out.push(d.branch);
  out.push('-'.repeat(32));
  out.push(`Receipt: ${d.orderNumber}`);
  out.push(`Date: ${d.date.toISOString().replace('T', ' ').slice(0, 19)}`);
  if (d.cashier) out.push(`Cashier: ${d.cashier}`);
  out.push('-'.repeat(32));
  for (const l of d.lines) {
    out.push(l.name);
    const lr = `  ${l.qty} x ${l.price}`;
    const space = Math.max(1, 32 - lr.length - l.total.length);
    out.push(lr + ' '.repeat(space) + l.total);
  }
  out.push('-'.repeat(32));
  const pad = (a: string, b: string) => {
    const space = Math.max(1, 32 - a.length - b.length);
    return a + ' '.repeat(space) + b;
  };
  out.push(pad('Subtotal', `${d.subtotal} ${d.currency}`));
  if (d.discount) out.push(pad('Discount', `${d.discount} ${d.currency}`));
  out.push(pad('Tax', `${d.tax} ${d.currency}`));
  out.push(pad('TOTAL', `${d.total} ${d.currency}`));
  out.push(pad(`Paid (${d.method})`, `${d.paid} ${d.currency}`));
  if (d.change) out.push(pad('Change', `${d.change} ${d.currency}`));
  out.push('-'.repeat(32));
  out.push((d.footer ?? 'Thank you · شكراً').padStart(20));
  return out.join('\n');
}

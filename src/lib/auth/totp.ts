import { authenticator } from 'otplib';
import QRCode from 'qrcode';

authenticator.options = { window: 1, step: 30, digits: 6 };

export function generateTotpSecret(): string {
  return authenticator.generateSecret(20);
}

export function totpUri(args: { account: string; issuer: string; secret: string }): string {
  return authenticator.keyuri(args.account, args.issuer, args.secret);
}

export async function totpQrPng(uri: string): Promise<Buffer> {
  return QRCode.toBuffer(uri, { type: 'png', errorCorrectionLevel: 'M', margin: 1, scale: 6 });
}

export function verifyTotp(token: string, secret: string): boolean {
  if (!/^\d{6}$/.test(token.trim())) return false;
  try {
    return authenticator.verify({ token: token.trim(), secret });
  } catch {
    return false;
  }
}

import { createHash, createHmac } from 'node:crypto';
import { logger } from '@/lib/observability/logger';

/**
 * Dependency-free upload to any S3-compatible object store (AWS S3,
 * Cloudflare R2, Backblaze B2, MinIO, Wasabi) using AWS Signature V4.
 *
 * Configure via env:
 *   S3_BACKUP_ENDPOINT   e.g. https://<account>.r2.cloudflarestorage.com
 *   S3_BACKUP_BUCKET     bucket name
 *   S3_BACKUP_REGION     region (use "auto" for R2)
 *   S3_BACKUP_ACCESS_KEY
 *   S3_BACKUP_SECRET_KEY
 *
 * If unset, uploads are skipped (no-op) so the app runs fine without it.
 */
export function isOffsiteConfigured(): boolean {
  return Boolean(
    process.env.S3_BACKUP_ENDPOINT &&
    process.env.S3_BACKUP_BUCKET &&
    process.env.S3_BACKUP_ACCESS_KEY &&
    process.env.S3_BACKUP_SECRET_KEY,
  );
}

const hash = (d: string | Buffer) => createHash('sha256').update(d).digest('hex');
const hmac = (key: string | Buffer, d: string) => createHmac('sha256', key).update(d).digest();

export async function uploadBackupObject(key: string, body: string): Promise<{ ok: boolean; url?: string; skipped?: boolean; error?: string }> {
  if (!isOffsiteConfigured()) return { ok: false, skipped: true };

  const endpoint = process.env.S3_BACKUP_ENDPOINT!.replace(/\/$/, '');
  const bucket = process.env.S3_BACKUP_BUCKET!;
  const region = process.env.S3_BACKUP_REGION || 'auto';
  const accessKey = process.env.S3_BACKUP_ACCESS_KEY!;
  const secretKey = process.env.S3_BACKUP_SECRET_KEY!;
  const service = 's3';

  const host = new URL(endpoint).host;
  const canonicalUri = `/${bucket}/${key.split('/').map(encodeURIComponent).join('/')}`;
  const url = `${endpoint}${canonicalUri}`;

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, ''); // YYYYMMDDTHHMMSSZ
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = hash(body);

  const headers: Record<string, string> = {
    host,
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amzDate,
    'content-type': 'application/json',
  };
  const signedHeaders = Object.keys(headers).sort().join(';');
  const canonicalHeaders = Object.keys(headers).sort().map((k) => `${k}:${headers[k]}\n`).join('');

  const canonicalRequest = ['PUT', canonicalUri, '', canonicalHeaders, signedHeaders, payloadHash].join('\n');
  const scope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, scope, hash(canonicalRequest)].join('\n');

  const kDate = hmac(`AWS4${secretKey}`, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  const kSigning = hmac(kService, 'aws4_request');
  const signature = createHmac('sha256', kSigning).update(stringToSign).digest('hex');

  const authorization =
    `AWS4-HMAC-SHA256 Credential=${accessKey}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  try {
    const res = await fetch(url, {
      method: 'PUT',
      headers: { ...headers, Authorization: authorization },
      body,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      logger.error({ status: res.status, text: text.slice(0, 300) }, 'offsite backup upload failed');
      return { ok: false, error: `HTTP ${res.status}` };
    }
    return { ok: true, url };
  } catch (e) {
    logger.error({ err: e }, 'offsite backup upload threw');
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

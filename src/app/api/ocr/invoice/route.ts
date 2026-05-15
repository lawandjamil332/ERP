import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { ocrInvoiceImage } from '@/lib/ocr';

const MAX_BYTES = 8 * 1024 * 1024;

export async function POST(req: Request) {
  await requireSession();
  const ct = req.headers.get('content-type') ?? '';
  if (!ct.startsWith('image/') && !ct.startsWith('application/octet-stream')) {
    return NextResponse.json({ error: 'expected_image_body' }, { status: 400 });
  }
  const ab = await req.arrayBuffer();
  if (ab.byteLength > MAX_BYTES) {
    return NextResponse.json({ error: 'file_too_large', limit: MAX_BYTES }, { status: 413 });
  }
  const url = new URL(req.url);
  const preferArabic = url.searchParams.get('lang') === 'ar';

  const result = await ocrInvoiceImage(new Uint8Array(ab), { preferArabic });
  return NextResponse.json(result);
}

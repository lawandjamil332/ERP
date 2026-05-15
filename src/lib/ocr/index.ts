/**
 * Receipt / paper-invoice OCR adapter.
 *
 * Iraqi paper invoices are typically Arabic-only with handwritten amounts.
 * Two providers supported:
 *   - tesseract: open-source, runs locally via node-tesseract-ocr (best for typed text)
 *   - google: Google Cloud Vision document-text-detection (best for handwriting)
 *
 * In dev / non-configured environments, the adapter returns a stub result so
 * callers don't break.
 */

import { logger } from '@/lib/observability/logger';

export interface OcrFieldGuess {
  field: 'supplierName' | 'taxNumber' | 'invoiceNumber' | 'date' | 'subtotal' | 'tax' | 'total';
  value: string;
  confidence: number;
}

export interface OcrResult {
  provider: 'tesseract' | 'google' | 'noop';
  rawText: string;
  guesses: OcrFieldGuess[];
}

export async function ocrInvoiceImage(image: Buffer | Uint8Array, opts?: {
  preferArabic?: boolean;
}): Promise<OcrResult> {
  const provider = process.env.OCR_PROVIDER as 'tesseract' | 'google' | undefined;

  if (provider === 'google' && process.env.GOOGLE_VISION_API_KEY) {
    try {
      const key = process.env.GOOGLE_VISION_API_KEY!;
      const res = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${key}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          requests: [{
            image: { content: Buffer.from(image).toString('base64') },
            features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
            imageContext: { languageHints: opts?.preferArabic ? ['ar', 'en'] : ['en', 'ar'] },
          }],
        }),
      });
      const body = await res.json();
      const text = body?.responses?.[0]?.fullTextAnnotation?.text ?? '';
      return { provider: 'google', rawText: text, guesses: extractFields(text) };
    } catch (e: any) {
      logger.warn({ err: e.message }, 'google-vision-failed');
    }
  }

  if (provider === 'tesseract') {
    try {
      // Lazy-loaded so dev environments without tesseract still build.
      const tesseract = require('node-tesseract-ocr');
      const text = await tesseract.recognize(Buffer.from(image), {
        lang: opts?.preferArabic ? 'ara+eng' : 'eng+ara',
        oem: 1, psm: 3,
      });
      return { provider: 'tesseract', rawText: text, guesses: extractFields(text) };
    } catch (e: any) {
      logger.warn({ err: e.message }, 'tesseract-failed-or-not-installed');
    }
  }

  return { provider: 'noop', rawText: '', guesses: [] };
}

function extractFields(text: string): OcrFieldGuess[] {
  const guesses: OcrFieldGuess[] = [];

  // Tax number — Iraqi format IQ-XXX-XXXX or 10-digit
  const taxMatch = text.match(/\b(IQ[-\s]?\d{3}[-\s]?\d{4,7}|\d{8,12})\b/);
  if (taxMatch) guesses.push({ field: 'taxNumber', value: taxMatch[1].replace(/\s/g, ''), confidence: 0.7 });

  // Invoice number — "INV-XXXX" / "فاتورة رقم XXX" / "Invoice No XXX"
  const invMatch = text.match(/(?:INV|Invoice\s*(?:No|#)?|فاتورة\s*رقم)\s*[:\-#]?\s*([\w\d\-\/]+)/i);
  if (invMatch) guesses.push({ field: 'invoiceNumber', value: invMatch[1], confidence: 0.65 });

  // Date — YYYY-MM-DD or DD/MM/YYYY
  const dateMatch = text.match(/\b(\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4})\b/);
  if (dateMatch) guesses.push({ field: 'date', value: dateMatch[1], confidence: 0.7 });

  // Total — last number preceded by "Total" / "المجموع" / "الإجمالي"
  const totalMatch = text.match(/(?:Total|المجموع|الإجمالي|إجمالي)\s*[:\-]?\s*([\d,]+(?:\.\d+)?)/i);
  if (totalMatch) guesses.push({ field: 'total', value: totalMatch[1].replace(/,/g, ''), confidence: 0.6 });

  return guesses;
}

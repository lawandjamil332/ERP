import Papa from 'papaparse';

export interface ParseResult<T> {
  rows: T[];
  errors: Array<{ row: number; message: string }>;
}

export function parseCsv<T = Record<string, string>>(text: string): ParseResult<T> {
  const parsed = Papa.parse<T>(text, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (h) => h.trim(),
    transform: (v: string) => (typeof v === 'string' ? v.trim() : v),
  });
  return {
    rows: parsed.data,
    errors: (parsed.errors ?? []).map((e) => ({ row: e.row ?? -1, message: e.message })),
  };
}

export interface ImportSummary {
  attempted: number;
  inserted: number;
  updated: number;
  skipped: number;
  failures: Array<{ row: number; key?: string; message: string }>;
}

export function emptySummary(): ImportSummary {
  return { attempted: 0, inserted: 0, updated: 0, skipped: 0, failures: [] };
}

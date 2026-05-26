/**
 * Iraqi bank statement parsers (TBI, Rasheed, Rafidain, FIB) + generic fallback.
 */

export type BankCode = 'TBI' | 'RASHEED' | 'RAFIDAIN' | 'FIB' | 'GENERIC';

export interface NormalisedRow {
  date: string;
  reference?: string;
  description?: string;
  debit: number;
  credit: number;
  balance?: number;
}

const HEADER_SIGNATURES: Record<Exclude<BankCode, 'GENERIC'>, string[][]> = {
  TBI:      [['date', 'description', 'debit', 'credit', 'balance']],
  RASHEED:  [['transaction date', 'narration', 'withdrawal', 'deposit', 'balance']],
  RAFIDAIN: [['post date', 'details', 'dr', 'cr', 'available']],
  FIB:      [['transactiondate', 'memo', 'debitamount', 'creditamount', 'runningbalance']],
};

export function detectBank(headers: string[]): BankCode {
  const norm = headers.map((h) => h.trim().toLowerCase());
  for (const [bank, sigs] of Object.entries(HEADER_SIGNATURES)) {
    for (const sig of sigs) {
      const allPresent = sig.every((s) =>
        norm.some((h) => h.replace(/\s/g, '') === s.replace(/\s/g, ''))
      );
      if (allPresent) return bank as BankCode;
    }
  }
  return 'GENERIC';
}

const COLUMN_MAPS: Record<BankCode, {
  date: string[]; reference?: string[]; description: string[];
  debit: string[]; credit: string[]; balance?: string[];
}> = {
  TBI:      { date: ['date'], description: ['description'], debit: ['debit'], credit: ['credit'], balance: ['balance'] },
  RASHEED:  { date: ['transaction date'], reference: ['ref'], description: ['narration'], debit: ['withdrawal'], credit: ['deposit'], balance: ['balance'] },
  RAFIDAIN: { date: ['post date'], reference: ['voucher'], description: ['details'], debit: ['dr'], credit: ['cr'], balance: ['available'] },
  FIB:      { date: ['transactiondate'], reference: ['referenceno'], description: ['memo'], debit: ['debitamount'], credit: ['creditamount'], balance: ['runningbalance'] },
  GENERIC:  { date: ['date'], description: ['description'], debit: ['debit'], credit: ['credit'], balance: ['balance'] },
};

function findCol(headers: string[], candidates: string[]): number {
  const norm = headers.map((h) => h.trim().toLowerCase().replace(/\s/g, ''));
  for (const c of candidates) {
    const idx = norm.indexOf(c.replace(/\s/g, ''));
    if (idx >= 0) return idx;
  }
  return -1;
}

function parseNumber(v: string): number {
  if (!v) return 0;
  const n = Number(v.replace(/[,\s]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function parseDate(v: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const dmy = v.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return v;
}

export function parseCsv(csv: string): { bank: BankCode; rows: NormalisedRow[] } {
  const lines = csv.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { bank: 'GENERIC', rows: [] };
  const headers = splitCsvLine(lines[0]);
  const bank = detectBank(headers);
  const map = COLUMN_MAPS[bank];

  const idxDate = findCol(headers, map.date);
  const idxRef  = map.reference ? findCol(headers, map.reference) : -1;
  const idxDesc = findCol(headers, map.description);
  const idxDr   = findCol(headers, map.debit);
  const idxCr   = findCol(headers, map.credit);
  const idxBal  = map.balance ? findCol(headers, map.balance) : -1;

  const rows: NormalisedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i]);
    rows.push({
      date: parseDate(cells[idxDate] ?? ''),
      reference: idxRef >= 0 ? cells[idxRef] : undefined,
      description: cells[idxDesc],
      debit:  parseNumber(cells[idxDr]),
      credit: parseNumber(cells[idxCr]),
      balance: idxBal >= 0 ? parseNumber(cells[idxBal]) : undefined,
    });
  }
  return { bank, rows };
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let buf = ''; let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"' && line[i + 1] === '"') { buf += '"'; i++; }
      else if (ch === '"') inQ = false;
      else buf += ch;
    } else {
      if (ch === ',') { out.push(buf); buf = ''; }
      else if (ch === '"') inQ = true;
      else buf += ch;
    }
  }
  out.push(buf);
  return out;
}

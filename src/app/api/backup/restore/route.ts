import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requirePermission } from '@/lib/auth/permissions';

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Restore a tenant backup produced by /api/backup/export.
 * Strategy: MERGE (upsert by id) — never deletes existing rows, so it's safe to
 * run on a live tenant; it only re-creates what's missing / refreshes by id.
 * Every row's tenantId is forced to the caller's tenant (no cross-tenant inject).
 * Parents are written before children; self-referencing tables use a 2-pass write.
 */
export async function POST(req: Request) {
  const guard = await requirePermission('settings', 'edit');
  if (guard instanceof NextResponse) return guard;
  const session = guard;
  const tenantId = session.tenantId;

  const body = await req.json().catch(() => null);
  if (!body || body.backupVersion !== 1 || !body.data) {
    return NextResponse.json({ error: 'invalid_backup_file' }, { status: 400 });
  }
  const d = body.data as Record<string, any[]>;

  const plain = (rows: any[] = []) => rows ?? [];
  const stamp = <T extends Record<string, any>>(r: T) => ({ ...r, tenantId });

  try {
    const result = await db.$transaction(async (tx) => {
      const summary: Record<string, number> = {};

      async function upsertFlat(model: string, rows: any[]) {
        for (const r of plain(rows)) {
          const data = stamp(r);
          await (tx as any)[model].upsert({ where: { id: r.id }, create: data, update: data });
        }
        summary[model] = plain(rows).length;
      }

      // Self-referencing tables: write with the self-FK nulled, then set it.
      async function upsertSelfRef(model: string, rows: any[], fk: string) {
        for (const r of plain(rows)) {
          const data = { ...stamp(r), [fk]: null };
          await (tx as any)[model].upsert({ where: { id: r.id }, create: data, update: data });
        }
        for (const r of plain(rows)) {
          if (r[fk]) await (tx as any)[model].update({ where: { id: r.id }, data: { [fk]: r[fk] } });
        }
        summary[model] = plain(rows).length;
      }

      // Parent header + nested children rows (children carry their own FK to parent).
      async function upsertWithLines(headModel: string, lineModel: string, rows: any[]) {
        let lineCount = 0;
        for (const r of plain(rows)) {
          const { lines = [], ...head } = r;
          const data = stamp(head);
          await (tx as any)[headModel].upsert({ where: { id: r.id }, create: data, update: data });
          for (const ln of lines) {
            await (tx as any)[lineModel].upsert({ where: { id: ln.id }, create: ln, update: ln });
            lineCount++;
          }
        }
        summary[headModel] = plain(rows).length;
        summary[lineModel] = lineCount;
      }

      // ── dependency order: parents → children ──
      await upsertFlat('taxRate', d.taxRates);
      await upsertSelfRef('account', d.accounts, 'parentId');
      await upsertFlat('brand', d.brands);
      await upsertSelfRef('productCategory', d.productCategories, 'parentId');
      await upsertFlat('branch', d.branches);
      await upsertFlat('warehouse', d.warehouses);
      await upsertSelfRef('contact', d.contacts, 'referredByContactId');
      await upsertFlat('employee', d.employees);
      await upsertFlat('bankAccount', d.bankAccounts);
      await upsertFlat('product', d.products);
      await upsertFlat('stock', d.stock);
      await upsertWithLines('invoice', 'invoiceLine', d.invoices);
      await upsertWithLines('bill', 'billLine', d.bills);
      await upsertFlat('payment', d.payments);
      await upsertWithLines('journal', 'journalLine', d.journals);
      await upsertFlat('cheque', d.cheques);
      await upsertSelfRef('expenseCategory', d.expenseCategories, 'parentId');
      await upsertSelfRef('incomeCategory', d.incomeCategories, 'parentId');
      await upsertWithLines('stockOrder', 'stockOrderLine', d.stockOrders);

      return summary;
    }, { timeout: 120_000, maxWait: 20_000 });

    return NextResponse.json({ ok: true, restored: result });
  } catch (e) {
    return NextResponse.json(
      { error: 'restore_failed', detail: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}

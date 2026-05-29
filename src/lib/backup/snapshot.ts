import type { PrismaClient } from '@prisma/client';

/**
 * Build a full logical snapshot of one tenant's core business data.
 * Shared by the on-demand export route and the scheduled offsite backup cron.
 */
export async function buildTenantSnapshot(db: PrismaClient, tenantId: string) {
  const where = { tenantId };
  const [
    tenant, accounts, taxRates, brands, productCategories, warehouses, branches,
    contacts, products, stock, employees, bankAccounts,
    invoices, bills, payments, journals, cheques,
    expenseCategories, incomeCategories, stockOrders,
  ] = await Promise.all([
    db.tenant.findUnique({ where: { id: tenantId } }),
    db.account.findMany({ where }),
    db.taxRate.findMany({ where }),
    db.brand.findMany({ where }),
    db.productCategory.findMany({ where }),
    db.warehouse.findMany({ where }),
    db.branch.findMany({ where }),
    db.contact.findMany({ where }),
    db.product.findMany({ where }),
    db.stock.findMany({ where: { product: { tenantId } } }),
    db.employee.findMany({ where }),
    db.bankAccount.findMany({ where }),
    db.invoice.findMany({ where, include: { lines: true } }),
    db.bill.findMany({ where, include: { lines: true } }),
    db.payment.findMany({ where }),
    db.journal.findMany({ where, include: { lines: true } }),
    db.cheque.findMany({ where }),
    db.expenseCategory.findMany({ where }),
    db.incomeCategory.findMany({ where }),
    db.stockOrder.findMany({ where, include: { lines: true } }),
  ]);

  const data = {
    tenant, accounts, taxRates, brands, productCategories, warehouses, branches,
    contacts, products, stock, employees, bankAccounts,
    invoices, bills, payments, journals, cheques,
    expenseCategories, incomeCategories, stockOrders,
  };

  const counts = Object.fromEntries(
    Object.entries(data).map(([k, v]) => [k, Array.isArray(v) ? v.length : v ? 1 : 0]),
  );

  return { backupVersion: 1 as const, exportedAt: new Date().toISOString(), tenantId, counts, data };
}

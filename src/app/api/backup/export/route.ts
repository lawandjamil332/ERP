import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requirePermission } from '@/lib/auth/permissions';

/**
 * Full logical backup of the current tenant's core business data as JSON.
 * Downloaded to the user's machine; can be re-imported via /api/backup/restore.
 */
export async function GET() {
  const guard = await requirePermission('settings', 'view');
  if (guard instanceof NextResponse) return guard;
  const session = guard;
  const t = session.tenantId;
  const where = { tenantId: t };

  const [
    tenant, accounts, taxRates, brands, productCategories, warehouses, branches,
    contacts, products, stock, employees, bankAccounts,
    invoices, bills, payments, journals, cheques,
    expenseCategories, incomeCategories, stockOrders,
  ] = await Promise.all([
    db.tenant.findUnique({ where: { id: t } }),
    db.account.findMany({ where }),
    db.taxRate.findMany({ where }),
    db.brand.findMany({ where }),
    db.productCategory.findMany({ where }),
    db.warehouse.findMany({ where }),
    db.branch.findMany({ where }),
    db.contact.findMany({ where }),
    db.product.findMany({ where }),
    db.stock.findMany({ where: { product: { tenantId: t } } }),
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

  const counts = {
    accounts: accounts.length, taxRates: taxRates.length, brands: brands.length,
    productCategories: productCategories.length, warehouses: warehouses.length, branches: branches.length,
    contacts: contacts.length, products: products.length, stock: stock.length,
    employees: employees.length, bankAccounts: bankAccounts.length,
    invoices: invoices.length, bills: bills.length, payments: payments.length,
    journals: journals.length, cheques: cheques.length,
    expenseCategories: expenseCategories.length, incomeCategories: incomeCategories.length,
    stockOrders: stockOrders.length,
  };

  const payload = {
    backupVersion: 1,
    exportedAt: new Date().toISOString(),
    tenantId: t,
    counts,
    data: {
      tenant, accounts, taxRates, brands, productCategories, warehouses, branches,
      contacts, products, stock, employees, bankAccounts,
      invoices, bills, payments, journals, cheques,
      expenseCategories, incomeCategories, stockOrders,
    },
  };

  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'content-disposition': `attachment; filename="erp-backup-${stamp}.json"`,
      'cache-control': 'no-store',
    },
  });
}

'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, FileText, ShoppingCart, Package, Users, Wallet,
  ScrollText, BarChart3, Settings, Building2, Store, Briefcase,
  Receipt, CreditCard, Factory, Hotel, ShieldCheck, Repeat, CalendarCheck,
  BanknoteIcon, Boxes, TrendingDown, Upload, Lock, Banknote, Calculator,
  FileBadge, ShieldQuestion, Tag, Landmark, Wrench, Component, Coins,
  UserCog, FolderTree, Contact2, type LucideIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface Item { href: string; label: string; icon: LucideIcon }
interface Section { label: string; items: Item[] }

export function MobileNav({ locale }: { locale: string }) {
  const [open, setOpen] = useState(false);
  const t = useTranslations('nav');
  const tApp = useTranslations('app');
  const pathname = usePathname();
  const d = (p: string) => `/${locale}/dashboard${p}`;

  const sections: Section[] = [
    {
      label: t('secCommerce'), items: [
        { href: d('/invoices'), label: t('invoices'), icon: FileText },
        { href: d('/invoices/returned'), label: t('returnedInvoices'), icon: Repeat },
        { href: d('/quotations'), label: t('quotations'), icon: ScrollText },
        { href: d('/recurring'), label: t('recurring'), icon: Repeat },
        { href: d('/installments'), label: t('installments'), icon: CreditCard },
        { href: d('/bills'), label: t('bills'), icon: ShoppingCart },
        { href: d('/letters-of-credit'), label: t('lettersOfCredit'), icon: Banknote },
        { href: d('/pos'), label: t('pos'), icon: Store },
        { href: d('/pos/devices'), label: t('posDevices'), icon: Store },
        { href: d('/pos/shifts'), label: t('posShifts'), icon: CalendarCheck },
      ],
    },
    {
      label: t('secOperations'), items: [
        { href: d('/products'), label: t('products'), icon: Package },
        { href: d('/brands'), label: t('brands'), icon: Tag },
        { href: d('/inventory'), label: t('inventory'), icon: Boxes },
        { href: d('/lots'), label: t('lots'), icon: Boxes },
        { href: d('/stock-orders'), label: t('stockOrders'), icon: Boxes },
        { href: d('/settings/inventory'), label: t('inventorySettings'), icon: Settings },
        { href: d('/manufacturing/bom'), label: t('bom'), icon: Component },
        { href: d('/manufacturing/production-plans'), label: t('productionPlans'), icon: CalendarCheck },
        { href: d('/manufacturing/orders'), label: t('mfgOrders'), icon: Factory },
        { href: d('/manufacturing/workstations'), label: t('workstations'), icon: Wrench },
        { href: d('/manufacturing/indirect-costs'), label: t('indirectCosts'), icon: Coins },
        { href: d('/manufacturing/settings'), label: t('mfgSettings'), icon: Settings },
        { href: d('/projects'), label: t('projects'), icon: Building2 },
        { href: d('/hospitality'), label: t('hospitality'), icon: Hotel },
      ],
    },
    {
      label: t('secFinance'), items: [
        { href: d('/payments'), label: t('payments'), icon: CreditCard },
        { href: d('/finance/receipts'), label: t('receipts'), icon: Receipt },
        { href: d('/cheques'), label: t('cheques'), icon: Receipt },
        { href: d('/finance/bank-accounts'), label: t('bankAccounts'), icon: Landmark },
        { href: d('/accounting'), label: t('accounting'), icon: Wallet },
        { href: d('/finance/expense-categories'), label: t('expenseCategories'), icon: FolderTree },
        { href: d('/finance/income-categories'), label: t('incomeCategories'), icon: FolderTree },
        { href: d('/accounting/close'), label: t('yearEndClose'), icon: Lock },
        { href: d('/audit'), label: t('audit'), icon: ShieldCheck },
      ],
    },
    {
      label: t('secPeople'), items: [
        { href: d('/hr'), label: t('hr'), icon: Briefcase },
        { href: d('/payroll'), label: t('payroll'), icon: ScrollText },
        { href: d('/salary-advances'), label: t('salaryAdvances'), icon: BanknoteIcon },
        { href: d('/leave'), label: t('leave'), icon: CalendarCheck },
        { href: d('/hr/eosi'), label: t('eosi'), icon: Calculator },
      ],
    },
    {
      label: t('secInsights'), items: [
        { href: d('/reports'), label: t('reports'), icon: BarChart3 },
        { href: d('/reports/aging'), label: t('aging'), icon: TrendingDown },
        { href: d('/reports/diwan'), label: t('diwanAudit'), icon: ShieldQuestion },
      ],
    },
    {
      label: t('secAdmin'), items: [
        { href: d('/contacts'), label: t('contacts'), icon: Contact2 },
        { href: d('/branches'), label: t('branches'), icon: Building2 },
        { href: d('/users'), label: t('users'), icon: Users },
        { href: d('/users/roles'), label: t('roles'), icon: UserCog },
        { href: d('/templates'), label: t('templates'), icon: FileBadge },
        { href: d('/import'), label: t('import'), icon: Upload },
        { href: d('/settings'), label: t('settings'), icon: Settings },
      ],
    },
  ];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md p-2 hover:bg-accent md:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <button
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          />
          <div className="absolute inset-y-0 start-0 flex w-72 max-w-[85vw] flex-col bg-card shadow-xl">
            <div className="flex h-16 items-center justify-between border-b px-4">
              <div className="flex items-center gap-2">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-base font-bold text-white shadow-elevated">ع</div>
                <span className="text-sm font-semibold tracking-tight">{tApp('shortName')}</span>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-md p-2 hover:bg-accent" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="scrollbar-thin flex-1 overflow-y-auto p-3">
              <Link
                href={d('')}
                onClick={() => setOpen(false)}
                className={cn(
                  'mb-2 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  pathname === d('') ? 'bg-primary/10 text-primary' : 'hover:bg-accent'
                )}
              >
                <LayoutDashboard className="h-4 w-4 shrink-0" />
                <span>{t('dashboard')}</span>
              </Link>
              {sections.map((section) => (
                <div key={section.label} className="mt-3">
                  <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/60">
                    {section.label}
                  </p>
                  <div className="space-y-0.5">
                    {section.items.map((it) => {
                      const active = pathname === it.href || pathname.startsWith(`${it.href}/`);
                      const Icon = it.icon;
                      return (
                        <Link
                          key={it.href}
                          href={it.href}
                          onClick={() => setOpen(false)}
                          className={cn(
                            'flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors',
                            active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                          )}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span>{it.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}

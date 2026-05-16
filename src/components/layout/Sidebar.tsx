'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, FileText, ShoppingCart, Package, Users, Wallet,
  ScrollText, BarChart3, Settings, Building2, Store, Briefcase,
  Receipt, CreditCard, Factory, Hotel, ShieldCheck, Repeat,
  CalendarCheck, BanknoteIcon, Boxes, TrendingDown, Upload, Lock,
  Banknote, Calculator, FileBadge, ShieldQuestion,
  ChevronDown,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem { href: string; label: string; icon: LucideIcon }
interface NavGroup { id: string; label: string; icon: LucideIcon; items: NavItem[] }

const STORAGE_KEY = 'sidebar-open-groups';

function readOpen(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}'); } catch { return {}; }
}

export function Sidebar({ locale }: { locale: string }) {
  const t = useTranslations('nav');
  const tApp = useTranslations('app');
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => readOpen());

  const groups: NavGroup[] = [
    {
      id: 'sales', label: t('sales'), icon: ShoppingCart,
      items: [
        { href: `/${locale}/dashboard/invoices`,            label: t('invoices'),    icon: FileText },
        { href: `/${locale}/dashboard/invoices/returned`,   label: t('returnedInvoices'), icon: Repeat },
        { href: `/${locale}/dashboard/quotations`,          label: t('quotations'),  icon: ScrollText },
        { href: `/${locale}/dashboard/recurring`,           label: t('recurring'),   icon: Repeat },
        { href: `/${locale}/dashboard/installments`,        label: t('installments'),icon: CreditCard },
      ],
    },
    {
      id: 'purchases', label: t('purchases'), icon: ShoppingCart,
      items: [
        { href: `/${locale}/dashboard/bills`,              label: t('bills'),              icon: ShoppingCart },
        { href: `/${locale}/dashboard/letters-of-credit`,  label: t('lettersOfCredit'),    icon: Banknote },
      ],
    },
    {
      id: 'money', label: t('payments'), icon: CreditCard,
      items: [
        { href: `/${locale}/dashboard/payments`,                  label: t('payments'),         icon: CreditCard },
        { href: `/${locale}/dashboard/cheques`,                   label: t('cheques'),          icon: Receipt },
        { href: `/${locale}/dashboard/finance/bank-accounts`,     label: t('bankAccounts'),     icon: Banknote },
        { href: `/${locale}/dashboard/finance/expense-categories`,label: t('expenseCategories'),icon: ScrollText },
        { href: `/${locale}/dashboard/finance/income-categories`, label: t('incomeCategories'), icon: ScrollText },
        { href: `/${locale}/dashboard/pos`,                       label: t('pos'),              icon: Store },
        { href: `/${locale}/dashboard/pos/devices`,               label: t('posDevices'),       icon: Store },
        { href: `/${locale}/dashboard/pos/shifts`,                label: t('posShifts'),        icon: CalendarCheck },
      ],
    },
    {
      id: 'inventory', label: t('inventory'), icon: Package,
      items: [
        { href: `/${locale}/dashboard/products`,     label: t('products'),     icon: Package },
        { href: `/${locale}/dashboard/inventory`,    label: t('inventory'),    icon: Package },
        { href: `/${locale}/dashboard/lots`,         label: t('lots'),         icon: Boxes },
        { href: `/${locale}/dashboard/stock-orders`, label: t('stockOrders'),  icon: Boxes },
        { href: `/${locale}/dashboard/settings/inventory`, label: t('inventorySettings'), icon: Settings },
      ],
    },
    {
      id: 'people', label: t('hr'), icon: Briefcase,
      items: [
        { href: `/${locale}/dashboard/hr`,              label: t('hr'),              icon: Briefcase },
        { href: `/${locale}/dashboard/payroll`,         label: t('payroll'),         icon: ScrollText },
        { href: `/${locale}/dashboard/salary-advances`, label: t('salaryAdvances'),  icon: BanknoteIcon },
        { href: `/${locale}/dashboard/leave`,           label: t('leave'),           icon: CalendarCheck },
        { href: `/${locale}/dashboard/hr/eosi`,         label: t('eosi'),            icon: Calculator },
      ],
    },
    {
      id: 'operations', label: t('manufacturing'), icon: Factory,
      items: [
        { href: `/${locale}/dashboard/projects`,                          label: t('projects'),       icon: Building2 },
        { href: `/${locale}/dashboard/manufacturing`,                     label: t('manufacturing'),  icon: Factory },
        { href: `/${locale}/dashboard/manufacturing/bom`,                 label: t('bom'),            icon: Factory },
        { href: `/${locale}/dashboard/manufacturing/production-plans`,    label: t('productionPlans'),icon: CalendarCheck },
        { href: `/${locale}/dashboard/manufacturing/orders`,              label: t('mfgOrders'),      icon: Factory },
        { href: `/${locale}/dashboard/manufacturing/workstations`,        label: t('workstations'),   icon: Factory },
        { href: `/${locale}/dashboard/manufacturing/indirect-costs`,      label: t('indirectCosts'),  icon: Calculator },
        { href: `/${locale}/dashboard/manufacturing/settings`,            label: t('mfgSettings'),    icon: Settings },
        { href: `/${locale}/dashboard/hospitality`,                       label: t('hospitality'),    icon: Hotel },
      ],
    },
    {
      id: 'books', label: t('accounting'), icon: Wallet,
      items: [
        { href: `/${locale}/dashboard/accounting`,        label: t('accounting'),  icon: Wallet },
        { href: `/${locale}/dashboard/accounting/close`,  label: t('yearEndClose'),icon: Lock },
        { href: `/${locale}/dashboard/audit`,             label: t('audit'),       icon: ShieldCheck },
      ],
    },
    {
      id: 'insights', label: t('reports'), icon: BarChart3,
      items: [
        { href: `/${locale}/dashboard/reports`,        label: t('reports'),    icon: BarChart3 },
        { href: `/${locale}/dashboard/reports/aging`,  label: t('aging'),      icon: TrendingDown },
        { href: `/${locale}/dashboard/reports/diwan`,  label: t('diwanAudit'), icon: ShieldQuestion },
      ],
    },
    {
      id: 'system', label: t('settings'), icon: Settings,
      items: [
        { href: `/${locale}/dashboard/contacts`,     label: t('contacts'),  icon: Users },
        { href: `/${locale}/dashboard/users`,        label: t('users'),     icon: Users },
        { href: `/${locale}/dashboard/users/roles`,  label: t('roles'),     icon: ShieldCheck },
        { href: `/${locale}/dashboard/branches`,     label: t('branches'),  icon: Building2 },
        { href: `/${locale}/dashboard/brands`,       label: t('brands'),    icon: ShieldCheck },
        { href: `/${locale}/dashboard/templates`,    label: t('templates'), icon: FileBadge },
        { href: `/${locale}/dashboard/import`,       label: t('import'),    icon: Upload },
        { href: `/${locale}/dashboard/settings`,     label: t('settings'),  icon: Settings },
      ],
    },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const isGroupActive = (g: NavGroup) => g.items.some((it) => isActive(it.href));

  function toggle(id: string) {
    setOpenGroups((curr) => {
      const next = { ...curr, [id]: !(curr[id] ?? false) };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-e bg-card md:flex">
      <div className="flex h-16 items-center gap-3 border-b px-5">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-lg font-bold text-white shadow-elevated">
          ع
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold leading-tight tracking-tight">{tApp('shortName')}</p>
          <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{tApp('version')} 0.6</p>
        </div>
      </div>

      <nav className="scrollbar-thin flex-1 overflow-y-auto px-3 py-3">
        <ul className="space-y-1">
          <li>
            <Link
              href={`/${locale}/dashboard`}
              className={cn(
                'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                pathname === `/${locale}/dashboard`
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              {pathname === `/${locale}/dashboard` && (
                <span className="absolute inset-y-1.5 start-0 w-1 rounded-full bg-primary" />
              )}
              <LayoutDashboard className={cn('h-4 w-4 shrink-0', pathname === `/${locale}/dashboard` ? 'text-primary' : 'text-muted-foreground')} />
              <span>{t('dashboard')}</span>
            </Link>
          </li>

          {groups.map((group) => {
            const groupActive = isGroupActive(group);
            const stored = openGroups[group.id];
            const isOpen = stored === undefined ? groupActive : stored;
            const GroupIcon = group.icon;
            return (
              <li key={group.id}>
                <button
                  type="button"
                  onClick={() => toggle(group.id)}
                  aria-expanded={isOpen}
                  className={cn(
                    'group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    groupActive
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  )}
                >
                  <GroupIcon className={cn('h-4 w-4 shrink-0', groupActive ? 'text-primary' : 'text-muted-foreground')} />
                  <span className="flex-1 text-start">{group.label}</span>
                  <ChevronDown className={cn('h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform',
                    isOpen ? 'rotate-0' : '-rotate-90 rtl:rotate-90'
                  )} />
                </button>
                {isOpen && (
                  <ul className="mt-0.5 space-y-0.5 ps-3">
                    {group.items.map((it) => {
                      const active = isActive(it.href);
                      const Icon = it.icon;
                      return (
                        <li key={it.href}>
                          <Link
                            href={it.href}
                            className={cn(
                              'group relative flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm transition-all',
                              active
                                ? 'bg-primary/10 font-medium text-primary'
                                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                            )}
                          >
                            {active && (
                              <span className="absolute inset-y-1.5 start-0 w-1 rounded-full bg-primary" />
                            )}
                            <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')} />
                            <span className="truncate">{it.label}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t p-3">
        <p className="px-2 text-[10px] uppercase tracking-wider text-muted-foreground">
          {tApp('tagline')}
        </p>
      </div>
    </aside>
  );
}

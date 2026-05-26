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
  Banknote, Calculator, FileBadge, ShieldQuestion, Tag, Landmark,
  Wrench, Component, Coins, UserCog, FolderTree, Contact2,
  ChevronDown, type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem { href: string; label: string; icon: LucideIcon }
interface NavGroup { id: string; label: string; icon: LucideIcon; items: NavItem[] }
interface NavSection { id: string; label: string | null; groups: NavGroup[] }

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

  const d = (p: string) => `/${locale}/dashboard${p}`;

  const sections: NavSection[] = [
    {
      id: 'commerce', label: t('secCommerce'),
      groups: [
        {
          id: 'sales', label: t('sales'), icon: ShoppingCart,
          items: [
            { href: d('/invoices'),          label: t('invoices'),         icon: FileText },
            { href: d('/invoices/returned'), label: t('returnedInvoices'), icon: Repeat },
            { href: d('/quotations'),        label: t('quotations'),       icon: ScrollText },
            { href: d('/recurring'),         label: t('recurring'),        icon: Repeat },
            { href: d('/installments'),      label: t('installments'),     icon: CreditCard },
          ],
        },
        {
          id: 'purchases', label: t('purchases'), icon: ShoppingCart,
          items: [
            { href: d('/bills'),             label: t('bills'),           icon: ShoppingCart },
            { href: d('/letters-of-credit'), label: t('lettersOfCredit'), icon: Banknote },
          ],
        },
        {
          id: 'pos', label: t('pos'), icon: Store,
          items: [
            { href: d('/pos'),         label: t('pos'),        icon: Store },
            { href: d('/pos/devices'), label: t('posDevices'), icon: Store },
            { href: d('/pos/shifts'),  label: t('posShifts'),  icon: CalendarCheck },
          ],
        },
      ],
    },
    {
      id: 'operations', label: t('secOperations'),
      groups: [
        {
          id: 'inventory', label: t('inventory'), icon: Package,
          items: [
            { href: d('/products'),          label: t('products'),         icon: Package },
            { href: d('/brands'),            label: t('brands'),           icon: Tag },
            { href: d('/inventory'),         label: t('inventory'),        icon: Boxes },
            { href: d('/lots'),              label: t('lots'),             icon: Boxes },
            { href: d('/stock-orders'),      label: t('stockOrders'),      icon: Boxes },
            { href: d('/settings/inventory'),label: t('inventorySettings'),icon: Settings },
          ],
        },
        {
          id: 'manufacturing', label: t('manufacturing'), icon: Factory,
          items: [
            { href: d('/manufacturing/bom'),              label: t('bom'),            icon: Component },
            { href: d('/manufacturing/production-plans'), label: t('productionPlans'),icon: CalendarCheck },
            { href: d('/manufacturing/orders'),           label: t('mfgOrders'),      icon: Factory },
            { href: d('/manufacturing/workstations'),     label: t('workstations'),   icon: Wrench },
            { href: d('/manufacturing/indirect-costs'),   label: t('indirectCosts'),  icon: Coins },
            { href: d('/manufacturing/settings'),         label: t('mfgSettings'),    icon: Settings },
          ],
        },
        {
          id: 'projects', label: t('projectsHospitality'), icon: Building2,
          items: [
            { href: d('/projects'),    label: t('projects'),    icon: Building2 },
            { href: d('/hospitality'), label: t('hospitality'), icon: Hotel },
          ],
        },
      ],
    },
    {
      id: 'finance', label: t('secFinance'),
      groups: [
        {
          id: 'treasury', label: t('treasury'), icon: Wallet,
          items: [
            { href: d('/payments'),               label: t('payments'),     icon: CreditCard },
            { href: d('/finance/receipts'),       label: t('receipts'),     icon: Receipt },
            { href: d('/cheques'),                label: t('cheques'),      icon: Receipt },
            { href: d('/finance/bank-accounts'),  label: t('bankAccounts'), icon: Landmark },
          ],
        },
        {
          id: 'accounting', label: t('accounting'), icon: Calculator,
          items: [
            { href: d('/accounting'),                 label: t('accounting'),        icon: Wallet },
            { href: d('/finance/expense-categories'), label: t('expenseCategories'), icon: FolderTree },
            { href: d('/finance/income-categories'),  label: t('incomeCategories'),  icon: FolderTree },
            { href: d('/accounting/close'),           label: t('yearEndClose'),      icon: Lock },
            { href: d('/audit'),                      label: t('audit'),             icon: ShieldCheck },
          ],
        },
      ],
    },
    {
      id: 'people', label: t('secPeople'),
      groups: [
        {
          id: 'hr', label: t('hr'), icon: Briefcase,
          items: [
            { href: d('/hr'),              label: t('hr'),             icon: Briefcase },
            { href: d('/payroll'),         label: t('payroll'),        icon: ScrollText },
            { href: d('/salary-advances'), label: t('salaryAdvances'), icon: BanknoteIcon },
            { href: d('/leave'),           label: t('leave'),          icon: CalendarCheck },
            { href: d('/hr/eosi'),         label: t('eosi'),           icon: Calculator },
          ],
        },
      ],
    },
    {
      id: 'insights', label: t('secInsights'),
      groups: [
        {
          id: 'reports', label: t('reports'), icon: BarChart3,
          items: [
            { href: d('/reports'),       label: t('reports'),    icon: BarChart3 },
            { href: d('/reports/aging'), label: t('aging'),      icon: TrendingDown },
            { href: d('/reports/diwan'), label: t('diwanAudit'), icon: ShieldQuestion },
          ],
        },
      ],
    },
    {
      id: 'admin', label: t('secAdmin'),
      groups: [
        {
          id: 'directory', label: t('directory'), icon: Contact2,
          items: [
            { href: d('/contacts'), label: t('contacts'), icon: Users },
            { href: d('/branches'), label: t('branches'), icon: Building2 },
          ],
        },
        {
          id: 'access', label: t('access'), icon: UserCog,
          items: [
            { href: d('/users'),       label: t('users'), icon: Users },
            { href: d('/users/roles'), label: t('roles'), icon: ShieldCheck },
          ],
        },
        {
          id: 'config', label: t('configuration'), icon: Settings,
          items: [
            { href: d('/templates'), label: t('templates'), icon: FileBadge },
            { href: d('/import'),    label: t('import'),    icon: Upload },
            { href: d('/settings'),  label: t('settings'),  icon: Settings },
          ],
        },
      ],
    },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const isGroupActive = (g: NavGroup) => g.items.some((it) => isActive(it.href));

  function toggle(id: string) {
    setOpenGroups((curr) => {
      const grp = sections.flatMap((s) => s.groups).find((g) => g.id === id);
      const currentlyOpen = curr[id] === undefined ? (grp ? isGroupActive(grp) : false) : curr[id];
      // Accordion: opening one section collapses every other section.
      const next: Record<string, boolean> = {};
      for (const sec of sections) for (const g of sec.groups) next[g.id] = false;
      next[id] = !currentlyOpen;
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }

  const dashHref = `/${locale}/dashboard`;
  const dashActive = pathname === dashHref;

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
        <Link
          href={dashHref}
          className={cn(
            'group relative mb-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
            dashActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
          )}
        >
          {dashActive && <span className="absolute inset-y-1.5 start-0 w-1 rounded-full bg-primary" />}
          <LayoutDashboard className={cn('h-4 w-4 shrink-0', dashActive ? 'text-primary' : 'text-muted-foreground')} />
          <span>{t('dashboard')}</span>
        </Link>

        {sections.map((section) => (
          <div key={section.id} className="mt-4 first:mt-1">
            {section.label && (
              <p className="px-3 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/60">
                {section.label}
              </p>
            )}
            <ul className="space-y-0.5">
              {section.groups.map((group) => {
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
                        groupActive ? 'text-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                      )}
                    >
                      <GroupIcon className={cn('h-4 w-4 shrink-0', groupActive ? 'text-primary' : 'text-muted-foreground')} />
                      <span className="flex-1 text-start">{group.label}</span>
                      <ChevronDown className={cn('h-3.5 w-3.5 shrink-0 text-muted-foreground/70 transition-transform',
                        isOpen ? 'rotate-0' : '-rotate-90 rtl:rotate-90')} />
                    </button>
                    {isOpen && (
                      <ul className="relative mt-0.5 space-y-0.5 ps-3 before:absolute before:inset-y-1 before:start-[1.35rem] before:w-px before:bg-border">
                        {group.items.map((it) => {
                          const active = isActive(it.href);
                          const Icon = it.icon;
                          return (
                            <li key={it.href}>
                              <Link
                                href={it.href}
                                className={cn(
                                  'group relative flex items-center gap-3 rounded-lg px-3 py-1.5 text-[13px] transition-all',
                                  active ? 'bg-primary/10 font-medium text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                                )}
                              >
                                {active && <span className="absolute inset-y-1.5 start-0 w-1 rounded-full bg-primary" />}
                                <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-primary' : 'text-muted-foreground/80 group-hover:text-foreground')} />
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
          </div>
        ))}
      </nav>

      <div className="border-t p-3">
        <p className="px-2 text-[10px] uppercase tracking-wider text-muted-foreground/70">
          {tApp('tagline')}
        </p>
      </div>
    </aside>
  );
}

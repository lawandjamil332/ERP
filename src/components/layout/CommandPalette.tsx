'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import {
  Search, LayoutDashboard, FileText, ShoppingCart, Package, Users, Wallet,
  ScrollText, BarChart3, Settings, Building2, Store, Briefcase, Receipt,
  CreditCard, Factory, Hotel, Boxes, Plus, CornerDownLeft, Tag, Landmark,
  type LucideIcon,
} from 'lucide-react';

interface Cmd { id: string; label: string; href: string; icon: LucideIcon; keywords?: string }

export function CommandPalette({ locale }: { locale: string }) {
  const t = useTranslations('nav');
  const tc = useTranslations('common');
  const router = useRouter();
  const lc = useLocale();
  const isAr = lc === 'ar';
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const d = (p: string) => `/${locale}/dashboard${p}`;

  const commands: Cmd[] = useMemo(() => [
    { id: 'home', label: t('dashboard'), href: d(''), icon: LayoutDashboard, keywords: 'home main' },
    { id: 'new-invoice', label: isAr ? 'فاتورة جديدة' : 'New invoice', href: d('/invoices/new'), icon: Plus, keywords: 'create sale' },
    { id: 'invoices', label: t('invoices'), href: d('/invoices'), icon: FileText },
    { id: 'quotations', label: t('quotations'), href: d('/quotations'), icon: ScrollText },
    { id: 'installments', label: t('installments'), href: d('/installments'), icon: CreditCard },
    { id: 'bills', label: t('bills'), href: d('/bills'), icon: ShoppingCart },
    { id: 'pos', label: t('pos'), href: d('/pos'), icon: Store },
    { id: 'products', label: t('products'), href: d('/products'), icon: Package, keywords: 'items goods' },
    { id: 'brands', label: t('brands'), href: d('/brands'), icon: Tag },
    { id: 'inventory', label: t('inventory'), href: d('/inventory'), icon: Boxes, keywords: 'stock' },
    { id: 'stock-orders', label: t('stockOrders'), href: d('/stock-orders'), icon: Boxes },
    { id: 'manufacturing', label: t('manufacturing'), href: d('/manufacturing/orders'), icon: Factory },
    { id: 'projects', label: t('projects'), href: d('/projects'), icon: Building2 },
    { id: 'hospitality', label: t('hospitality'), href: d('/hospitality'), icon: Hotel },
    { id: 'payments', label: t('payments'), href: d('/payments'), icon: CreditCard },
    { id: 'receipts', label: t('receipts'), href: d('/finance/receipts'), icon: Receipt },
    { id: 'cheques', label: t('cheques'), href: d('/cheques'), icon: Receipt },
    { id: 'bank-accounts', label: t('bankAccounts'), href: d('/finance/bank-accounts'), icon: Landmark },
    { id: 'accounting', label: t('accounting'), href: d('/accounting'), icon: Wallet, keywords: 'ledger journal' },
    { id: 'hr', label: t('hr'), href: d('/hr'), icon: Briefcase },
    { id: 'payroll', label: t('payroll'), href: d('/payroll'), icon: ScrollText },
    { id: 'reports', label: t('reports'), href: d('/reports'), icon: BarChart3, keywords: 'analytics' },
    { id: 'contacts', label: t('contacts'), href: d('/contacts'), icon: Users, keywords: 'customers suppliers' },
    { id: 'branches', label: t('branches'), href: d('/branches'), icon: Building2 },
    { id: 'users', label: t('users'), href: d('/users'), icon: Users },
    { id: 'templates', label: t('templates'), href: d('/templates'), icon: FileText },
    { id: 'settings', label: t('settings'), href: d('/settings'), icon: Settings },
  ], [locale, isAr]); // eslint-disable-line react-hooks/exhaustive-deps

  const [results, setResults] = useState<{ kind: string; href: string; title: string; subtitle: string; meta: string }[]>([]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return commands;
    return commands.filter((c) =>
      c.label.toLowerCase().includes(qq) || (c.keywords ?? '').includes(qq) || c.id.includes(qq)
    );
  }, [q, commands]);

  // Live entity search (invoices / customers / products)
  useEffect(() => {
    const qq = q.trim();
    if (qq.length < 2) { setResults([]); return; }
    const ctrl = new AbortController();
    const handle = setTimeout(async () => {
      try {
        const r = await fetch(`/api/search?q=${encodeURIComponent(qq)}`, { signal: ctrl.signal });
        if (r.ok) setResults((await r.json()).results ?? []);
      } catch { /* aborted */ }
    }, 200);
    return () => { clearTimeout(handle); ctrl.abort(); };
  }, [q]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    }
    function onOpen() { setOpen(true); }
    window.addEventListener('keydown', onKey);
    window.addEventListener('open-command-palette', onOpen);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('open-command-palette', onOpen);
    };
  }, []);

  useEffect(() => {
    if (open) { setQ(''); setActive(0); setTimeout(() => inputRef.current?.focus(), 30); }
  }, [open]);

  useEffect(() => { setActive(0); }, [q]);

  function go(href: string) { setOpen(false); router.push(href); }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, filtered.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    if (e.key === 'Enter' && filtered[active]) { e.preventDefault(); go(filtered[active].href); }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-[12vh]" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border bg-popover shadow-floating">
        <div className="flex items-center gap-2 border-b px-4">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={isAr ? 'ابحث أو انتقل إلى…' : 'Search or jump to…'}
            className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="hidden rounded border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground sm:inline">ESC</kbd>
        </div>
        <div className="scrollbar-thin max-h-80 overflow-y-auto p-2">
          {filtered.length === 0 && results.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">{tc('noData')}</p>
          ) : (
            <>
              {filtered.length > 0 && (
                <>
                  <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                    {isAr ? 'انتقال' : 'Navigate'}
                  </p>
                  {filtered.map((c, i) => {
                    const Icon = c.icon;
                    return (
                      <button
                        key={c.id}
                        onMouseEnter={() => setActive(i)}
                        onClick={() => go(c.href)}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-start text-sm transition-colors ${
                          i === active ? 'bg-accent text-foreground' : 'text-muted-foreground'
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="flex-1">{c.label}</span>
                        {i === active && <CornerDownLeft className="h-3.5 w-3.5 opacity-50" />}
                      </button>
                    );
                  })}
                </>
              )}
              {results.length > 0 && (
                <>
                  <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                    {isAr ? 'نتائج' : 'Results'}
                  </p>
                  {results.map((r, i) => (
                    <button
                      key={`${r.kind}-${i}`}
                      onClick={() => go(`/${locale}${r.href}`)}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-start text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded bg-muted text-[10px] font-bold uppercase">
                        {r.kind[0]}
                      </span>
                      <span className="flex-1 truncate">
                        <span className="font-medium text-foreground">{r.title}</span>
                        {r.subtitle && <span className="ms-2 text-xs">{r.subtitle}</span>}
                      </span>
                      <span className="shrink-0 text-xs tabular-nums">{r.meta}</span>
                    </button>
                  ))}
                </>
              )}
            </>
          )}
        </div>
        <div className="flex items-center justify-between border-t px-4 py-2 text-[11px] text-muted-foreground">
          <span>{isAr ? 'تنقّل ↑↓ · افتح ⏎' : 'Navigate ↑↓ · Open ⏎'}</span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border bg-muted px-1 py-0.5">⌘</kbd>
            <kbd className="rounded border bg-muted px-1 py-0.5">K</kbd>
          </span>
        </div>
      </div>
    </div>
  );
}

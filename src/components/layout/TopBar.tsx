'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { LOCALES, LOCALE_LABELS, type Locale } from '@/lib/i18n/config';
import { LogOut, Languages, Search, Bell, ChevronDown, Settings as SettingsIcon, Shield } from 'lucide-react';
import Link from 'next/link';

export function TopBar({ locale, userEmail, tenantName }: {
  locale: string; userEmail: string; tenantName: string;
}) {
  const t = useTranslations('nav');
  const tc = useTranslations('common');
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push(`/${locale}/auth/login`);
    router.refresh();
  }

  function switchLocale(target: string) {
    if (target === locale) return;
    const path = window.location.pathname.replace(/^\/(ar|ku|en)/, `/${target}`);
    window.location.href = path;
  }

  const initials = (userEmail.split('@')[0] || 'U').slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-card/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-card/80 sm:px-6">
      <div className="hidden min-w-0 flex-1 items-center md:flex">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder={tc('search')}
            className="h-9 w-full rounded-lg border bg-background ps-9 pe-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="ms-auto flex items-center gap-2">
        <button
          type="button"
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 end-1.5 h-1.5 w-1.5 rounded-full bg-destructive" />
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => { setLangOpen((o) => !o); setMenuOpen(false); }}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border bg-background px-2.5 text-xs font-medium transition-colors hover:bg-accent"
          >
            <Languages className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{LOCALE_LABELS[locale as Locale]}</span>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </button>
          {langOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setLangOpen(false)} />
              <div className="absolute end-0 top-full z-40 mt-1 w-36 overflow-hidden rounded-lg border bg-popover py-1 shadow-lg">
                {LOCALES.map((l: Locale) => (
                  <button
                    key={l}
                    onClick={() => { switchLocale(l); setLangOpen(false); }}
                    className={`flex w-full items-center justify-between px-3 py-1.5 text-sm transition-colors hover:bg-accent ${
                      l === locale ? 'font-medium text-primary' : ''
                    }`}
                  >
                    {LOCALE_LABELS[l]}
                    {l === locale && <span className="text-primary">●</span>}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => { setMenuOpen((o) => !o); setLangOpen(false); }}
            className="flex h-9 items-center gap-2 rounded-lg border bg-background ps-1 pe-2 transition-colors hover:bg-accent"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-emerald-500 to-emerald-700 text-xs font-bold text-white">
              {initials}
            </span>
            <div className="hidden text-start leading-tight md:block">
              <p className="max-w-[10rem] truncate text-xs font-semibold">{tenantName || '—'}</p>
              <p className="max-w-[10rem] truncate text-[10px] text-muted-foreground">{userEmail}</p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
              <div className="absolute end-0 top-full z-40 mt-1 w-56 overflow-hidden rounded-lg border bg-popover py-1 shadow-lg">
                <div className="border-b px-3 py-2">
                  <p className="truncate text-sm font-semibold">{tenantName || '—'}</p>
                  <p className="truncate text-xs text-muted-foreground">{userEmail}</p>
                </div>
                <Link
                  href={`/${locale}/dashboard/settings`}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-accent"
                >
                  <SettingsIcon className="h-4 w-4 text-muted-foreground" />
                  {t('settings')}
                </Link>
                <Link
                  href={`/${locale}/dashboard/settings/security`}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-accent"
                >
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  {t('security')}
                </Link>
                <div className="my-1 border-t" />
                <button
                  type="button"
                  onClick={() => { setMenuOpen(false); logout(); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
                >
                  <LogOut className="h-4 w-4" />
                  {t('logout')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';

type Theme = 'light' | 'dark' | 'system';
const STORAGE_KEY = 'theme';

function apply(theme: Theme) {
  const root = document.documentElement;
  const effective = theme === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : theme;
  root.classList.toggle('dark', effective === 'dark');
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('system');

  useEffect(() => {
    const stored = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? 'system';
    setTheme(stored); apply(stored);
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const onMql = () => { if ((localStorage.getItem(STORAGE_KEY) ?? 'system') === 'system') apply('system'); };
    mql.addEventListener('change', onMql);
    return () => mql.removeEventListener('change', onMql);
  }, []);

  function cycle() {
    const next: Theme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
    setTheme(next);
    localStorage.setItem(STORAGE_KEY, next);
    apply(next);
  }

  const Icon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor;
  return (
    <button type="button" onClick={cycle}
      className="grid h-9 w-9 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      title={`Theme: ${theme}`} aria-label={`Theme: ${theme}`}>
      <Icon className="h-4 w-4" />
    </button>
  );
}

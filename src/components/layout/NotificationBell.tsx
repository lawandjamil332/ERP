'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { Bell, CheckCheck, Inbox } from 'lucide-react';
import { useExclusiveDisclosure } from '@/lib/hooks/use-exclusive-disclosure';

interface Notif {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

export function NotificationBell() {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const { open, setOpen, toggle, ref } = useExclusiveDisclosure<HTMLDivElement>('notifications');
  const [items, setItems] = useState<Notif[] | null>(null);
  const [marking, setMarking] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function load() {
    const r = await fetch('/api/notifications', { cache: 'no-store' });
    if (r.ok) setItems(((await r.json()).data ?? []) as Notif[]);
  }

  useEffect(() => {
    load();
    pollRef.current = setInterval(load, 30000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const unread = (items ?? []).filter((n) => !n.readAt).length;

  async function markOne(id: string) {
    setItems((curr) => (curr ?? []).map((n) => n.id === id ? { ...n, readAt: new Date().toISOString() } : n));
    await fetch('/api/notifications', {
      method: 'PATCH', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id, read: true }),
    });
  }

  async function markAll() {
    setMarking(true);
    const now = new Date().toISOString();
    setItems((curr) => (curr ?? []).map((n) => ({ ...n, readAt: n.readAt ?? now })));
    await fetch('/api/notifications/mark-all-read', { method: 'POST' });
    setMarking(false);
  }

  function timeAgo(iso: string): string {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return isAr ? 'الآن' : 'just now';
    if (diff < 3600) return isAr ? `قبل ${Math.floor(diff / 60)} د` : `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return isAr ? `قبل ${Math.floor(diff / 3600)} س` : `${Math.floor(diff / 3600)}h ago`;
    return isAr ? `قبل ${Math.floor(diff / 86400)} يوم` : `${Math.floor(diff / 86400)}d ago`;
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={toggle}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        aria-label={isAr ? 'الإشعارات' : 'Notifications'}
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -top-1 -end-1 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-destructive-foreground">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
          <div className="absolute end-0 top-full z-40 mt-1 w-[22rem] overflow-hidden rounded-xl border bg-popover shadow-floating">
            <div className="flex items-center justify-between border-b px-3 py-2">
              <p className="text-sm font-semibold">{isAr ? 'الإشعارات' : 'Notifications'}</p>
              {unread > 0 && (
                <button
                  type="button" onClick={markAll} disabled={marking}
                  className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline disabled:opacity-50"
                >
                  <CheckCheck className="h-3 w-3" />
                  {isAr ? 'تعليم الكل كمقروء' : 'Mark all as read'}
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {items === null ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  {isAr ? 'جارٍ التحميل…' : 'Loading…'}
                </div>
              ) : items.length === 0 ? (
                <div className="px-3 py-12 text-center">
                  <Inbox className="mx-auto h-8 w-8 text-muted-foreground/40" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    {isAr ? 'لا توجد إشعارات' : 'No notifications'}
                  </p>
                </div>
              ) : (
                <ul className="divide-y">
                  {items.map((n) => {
                    const inner = (
                      <>
                        <div className="flex items-start gap-2">
                          {!n.readAt && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                          <div className="flex-1 space-y-0.5">
                            <p className={`text-sm leading-tight ${n.readAt ? 'text-muted-foreground' : 'font-semibold'}`}>{n.title}</p>
                            {n.body && <p className="text-xs text-muted-foreground line-clamp-2">{n.body}</p>}
                            <p className="text-[10px] text-muted-foreground/70">{timeAgo(n.createdAt)}</p>
                          </div>
                        </div>
                      </>
                    );
                    const onClick = () => { if (!n.readAt) markOne(n.id); setOpen(false); };
                    return (
                      <li key={n.id}>
                        {n.link ? (
                          <Link href={n.link} onClick={onClick}
                            className={`block px-3 py-2.5 transition-colors hover:bg-accent ${!n.readAt ? 'bg-primary/5' : ''}`}>
                            {inner}
                          </Link>
                        ) : (
                          <button type="button" onClick={onClick}
                            className={`block w-full px-3 py-2.5 text-start transition-colors hover:bg-accent ${!n.readAt ? 'bg-primary/5' : ''}`}>
                            {inner}
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
      )}
    </div>
  );
}

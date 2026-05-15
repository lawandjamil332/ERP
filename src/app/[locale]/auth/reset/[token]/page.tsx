'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ResetPasswordPage() {
  const locale = useLocale();
  const t = useTranslations();
  const router = useRouter();
  const params = useParams<{ token: string }>();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError(t('auth.passwordsMismatch'));
      return;
    }
    if (password.length < 8) {
      setError(t('auth.passwordTooShort'));
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/auth/reset/${params.token}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    const body = await res.json().catch(() => ({} as any));
    if (!res.ok) {
      setError(body.error ?? `HTTP ${res.status}`);
      return;
    }
    setDone(true);
    setTimeout(() => router.push(`/${locale}/auth/login`), 1500);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 to-stone-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t('auth.newPasswordTitle')}</CardTitle>
          <CardDescription>{t('auth.newPasswordIntro')}</CardDescription>
        </CardHeader>
        <CardContent>
          {done ? (
            <div className="rounded-md border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-800">
              {t('auth.passwordUpdated')}
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>{t('auth.newPassword')}</Label>
                <Input type="password" dir="ltr" minLength={8} value={password}
                  onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" />
              </div>
              <div className="space-y-2">
                <Label>{t('auth.confirmPassword')}</Label>
                <Input type="password" dir="ltr" minLength={8} value={confirm}
                  onChange={(e) => setConfirm(e.target.value)} required autoComplete="new-password" />
              </div>
              {error && (
                <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t('auth.sending') : t('auth.updatePassword')}
              </Button>
              <p className="text-center text-sm">
                <Link href={`/${locale}/auth/login`} className="text-primary hover:underline">
                  {t('auth.backToLogin')}
                </Link>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

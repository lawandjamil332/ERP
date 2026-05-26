'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ForgotPasswordPage() {
  const locale = useLocale();
  const t = useTranslations();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch('/api/auth/forgot', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    setSubmitted(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 to-stone-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t('auth.resetTitle')}</CardTitle>
          <CardDescription>{t('auth.resetIntro')}</CardDescription>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="space-y-4">
              <div className="rounded-md border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-800">
                {t('auth.resetSentBody', { email })}
              </div>
              <Link href={`/${locale}/auth/login`} className="text-sm text-primary hover:underline">
                ← {t('auth.backToLogin')}
              </Link>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.email')}</Label>
                <Input id="email" type="email" dir="ltr" value={email}
                  onChange={(e) => setEmail(e.target.value)} required autoComplete="username" />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t('auth.sending') : t('auth.sendResetLink')}
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

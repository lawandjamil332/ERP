'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/lib/toast';

interface SetupResp {
  secret: string;
  uri: string;
  qrPngBase64: string;
}

export default function SecurityPage() {
  const [phase, setPhase] = useState<'idle' | 'qr' | 'enabled'>('idle');
  const [data, setData] = useState<SetupResp | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch('/api/auth/totp/status').then((r) => r.ok ? r.json() : null).then((s) => {
      if (s?.enabled) setPhase('enabled');
    }).catch(() => null);
  }, []);

  async function start() {
    setBusy(true);
    const res = await fetch('/api/auth/totp/setup', { method: 'POST' });
    setBusy(false);
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      toast.error(b.error ?? 'failed_to_start_setup');
      return;
    }
    setData(await res.json());
    setPhase('qr');
  }

  async function verify() {
    setBusy(true);
    const res = await fetch('/api/auth/totp/setup', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token: code }),
    });
    setBusy(false);
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      toast.error(b.error ?? 'verify_failed');
      return;
    }
    toast.success('Two-factor enabled');
    setPhase('enabled');
    setData(null);
    setCode('');
  }

  async function disable() {
    if (!confirm('Disable two-factor authentication?')) return;
    setBusy(true);
    await fetch('/api/auth/totp/setup', { method: 'DELETE' });
    setBusy(false);
    setPhase('idle');
    toast.success('Two-factor disabled');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Security</h1>
        <p className="text-muted-foreground">Two-factor authentication and account protection.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Two-factor authentication (TOTP)</CardTitle>
          <CardDescription>
            Use Google Authenticator, 1Password, Authy, or any TOTP app to generate a 6-digit code at login.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {phase === 'idle' && (
            <Button onClick={start} disabled={busy}>{busy ? 'Starting…' : 'Enable two-factor'}</Button>
          )}
          {phase === 'qr' && data && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm">Scan this QR code in your authenticator app:</p>
                  <img src={data.qrPngBase64} alt="TOTP QR" className="mt-2 h-48 w-48 rounded border bg-white" />
                </div>
                <div className="space-y-2">
                  <Label>Manual entry secret</Label>
                  <Input value={data.secret} readOnly dir="ltr" className="font-mono text-xs" />
                  <p className="text-xs text-muted-foreground">Then enter the 6-digit code shown in the app:</p>
                  <Input value={code} onChange={(e) => setCode(e.target.value)} maxLength={6} placeholder="000000" dir="ltr" />
                  <Button onClick={verify} disabled={busy || code.length !== 6}>
                    {busy ? 'Verifying…' : 'Verify and enable'}
                  </Button>
                </div>
              </div>
            </>
          )}
          {phase === 'enabled' && (
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-emerald-700">Two-factor authentication is enabled on this account.</p>
              <Button variant="destructive" onClick={disable} disabled={busy}>Disable</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

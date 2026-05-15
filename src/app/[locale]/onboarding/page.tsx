'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/lib/toast';
import { CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';

type Step = 'company' | 'tax' | 'owner' | 'done';

export default function OnboardingWizard({ params }: { params: Promise<{ locale: string }> }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('company');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    nameAr: '', nameEn: '', taxNumber: '', commercialReg: '',
    governorate: 'Baghdad',
    region: 'FEDERAL' as 'FEDERAL' | 'KURDISTAN',
    sector: 'GENERAL',
    defaultLocale: 'ar' as 'ar' | 'ku' | 'en',
    fullName: '', email: '', password: '',
  });

  const set = <K extends keyof typeof form>(k: K, v: typeof form[K]) => setForm({ ...form, [k]: v });
  const next = () => setStep(step === 'company' ? 'tax' : step === 'tax' ? 'owner' : 'done');
  const prev = () => setStep(step === 'owner' ? 'tax' : step === 'tax' ? 'company' : 'company');

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/tenants/signup', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          tenant: {
            nameAr: form.nameAr, nameEn: form.nameEn,
            taxNumber: form.taxNumber || undefined,
            commercialReg: form.commercialReg || undefined,
            governorate: form.governorate,
            region: form.region, sector: form.sector,
            defaultLocale: form.defaultLocale,
          },
          owner: { email: form.email, password: form.password, fullName: form.fullName },
        }),
      });
      const body = await res.json().catch(() => ({} as any));
      if (!res.ok) {
        const issuesText = Array.isArray(body.issues) && body.issues.length
          ? body.issues.map((i: any) => `${(i.path ?? []).join('.') || '(root)'}: ${i.message}`).join(' · ')
          : '';
        const detail = [body.error, issuesText].filter(Boolean).join(' — ') ||
          `HTTP ${res.status} ${JSON.stringify(body)}`;
        setError(detail);
        toast.error(detail);
        return;
      }
      toast.success('Company created — redirecting');
      setStep('done');
      setTimeout(() => router.push(`/${form.defaultLocale}/dashboard`), 1200);
    } catch (e: any) {
      const msg = e?.message ?? 'Network error';
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 to-stone-100 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">
            {step === 'done' ? 'All set!' : 'Set up your Iraq ERP company'}
          </CardTitle>
          <CardDescription>
            {step === 'company' && 'Step 1 of 3 · Company identity'}
            {step === 'tax' && 'Step 2 of 3 · Tax configuration'}
            {step === 'owner' && 'Step 3 of 3 · Your owner account'}
            {step === 'done' && 'Your tenant is ready'}
          </CardDescription>
          <div className="mt-3 flex gap-1">
            {['company','tax','owner','done'].map((s) => (
              <div key={s} className={`h-1 flex-1 rounded ${
                ['company','tax','owner','done'].indexOf(step) >= ['company','tax','owner','done'].indexOf(s as Step)
                  ? 'bg-primary' : 'bg-muted'
              }`} />
            ))}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {step === 'company' && (
            <>
              <Fld label="Company name (AR)" req>
                <Input dir="rtl" value={form.nameAr} onChange={(e) => set('nameAr', e.target.value)} required />
              </Fld>
              <Fld label="Company name (EN)" req>
                <Input dir="ltr" value={form.nameEn} onChange={(e) => set('nameEn', e.target.value)} required />
              </Fld>
              <div className="grid gap-3 sm:grid-cols-2">
                <Fld label="Governorate">
                  <Input value={form.governorate} onChange={(e) => set('governorate', e.target.value)} />
                </Fld>
                <Fld label="Default language">
                  <Select value={form.defaultLocale} onValueChange={(v) => set('defaultLocale', v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ar">العربية</SelectItem>
                      <SelectItem value="ku">کوردی</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </Fld>
              </div>
            </>
          )}

          {step === 'tax' && (
            <>
              <Fld label="Tax number / الرقم الضريبي">
                <Input dir="ltr" value={form.taxNumber} onChange={(e) => set('taxNumber', e.target.value)} placeholder="IQ-XXX-XXXX" />
              </Fld>
              <Fld label="Commercial registration / السجل التجاري">
                <Input dir="ltr" value={form.commercialReg} onChange={(e) => set('commercialReg', e.target.value)} />
              </Fld>
              <div className="grid gap-3 sm:grid-cols-2">
                <Fld label="Tax region">
                  <Select value={form.region} onValueChange={(v) => set('region', v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FEDERAL">Federal Iraq</SelectItem>
                      <SelectItem value="KURDISTAN">Kurdistan Region (KRG)</SelectItem>
                    </SelectContent>
                  </Select>
                </Fld>
                <Fld label="Sector">
                  <Select value={form.sector} onValueChange={(v) => set('sector', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['GENERAL','OIL_GAS','TELECOM','HOSPITALITY','CONSTRUCTION','RETAIL','MANUFACTURING','AGRICULTURE','HEALTHCARE','EDUCATION','TRANSPORT'].map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Fld>
              </div>
              <p className="text-xs text-muted-foreground">
                Affects: PIT brackets (federal vs KRG 5%), employer SS rate (oil & gas 25%),
                CIT rate (oil & gas 35% federal), filing deadlines.
              </p>
            </>
          )}

          {step === 'owner' && (
            <>
              <Fld label="Your name" req>
                <Input value={form.fullName} onChange={(e) => set('fullName', e.target.value)} required />
              </Fld>
              <Fld label="Email" req>
                <Input type="email" dir="ltr" value={form.email} onChange={(e) => set('email', e.target.value)} required />
              </Fld>
              <Fld label="Password (≥8 chars)" req>
                <Input type="password" dir="ltr" minLength={8} value={form.password} onChange={(e) => set('password', e.target.value)} required />
              </Fld>
              <p className="text-xs text-muted-foreground">
                You'll be the OWNER. The IUAS chart of accounts (60+ accounts in Arabic + English)
                and default leave types will be seeded automatically.
              </p>
            </>
          )}

          {step === 'done' && (
            <div className="py-8 text-center">
              <CheckCircle className="mx-auto h-16 w-16 text-emerald-600" />
              <h2 className="mt-4 text-xl font-semibold">Welcome, {form.fullName.split(' ')[0]}!</h2>
              <p className="mt-2 text-muted-foreground">
                Your tenant <strong>{form.nameAr}</strong> is ready with the full Iraqi Unified Accounting System.
              </p>
            </div>
          )}

          {error && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              <strong>Signup failed:</strong> {error}
            </div>
          )}

          {step !== 'done' && (
            <div className="flex justify-between border-t pt-4">
              <Button type="button" variant="ghost" disabled={step === 'company' || busy} onClick={prev}>
                <ArrowLeft className="h-4 w-4 flip-rtl" /> Back
              </Button>
              {step !== 'owner' ? (
                <Button onClick={next} disabled={
                  (step === 'company' && (form.nameAr.trim().length < 2 || form.nameEn.trim().length < 2))
                }>
                  Next <ArrowRight className="h-4 w-4 flip-rtl" />
                </Button>
              ) : (
                <Button onClick={submit} disabled={busy ||
                  form.fullName.trim().length < 2 ||
                  !form.email.includes('@') ||
                  form.password.length < 8 ||
                  form.nameAr.trim().length < 2 ||
                  form.nameEn.trim().length < 2
                }>
                  {busy ? 'Creating…' : 'Create company'}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Fld({ label, children, req }: { label: string; children: React.ReactNode; req?: boolean }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}{req && <span className="text-destructive"> *</span>}</Label>
      {children}
    </div>
  );
}

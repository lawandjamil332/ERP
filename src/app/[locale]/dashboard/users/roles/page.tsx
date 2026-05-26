'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/ui/page-header';
import { ShieldCheck, Plus, Save } from 'lucide-react';
import { toast } from '@/lib/toast';
import { tri } from '@/lib/i18n/tri';

type Perm = 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'post';
type Permissions = Record<string, Perm[]>;
interface Role { id: string; name: string; description: string | null; permissions: Permissions; isSystem: boolean }

const SECTIONS = [
  { k: 'sales', ar: 'المبيعات', en: 'Sales' },
  { k: 'purchases', ar: 'المشتريات', en: 'Purchases' },
  { k: 'inventory', ar: 'المخزون', en: 'Inventory' },
  { k: 'manufacturing', ar: 'التصنيع', en: 'Manufacturing' },
  { k: 'accounting', ar: 'المحاسبة', en: 'Accounting' },
  { k: 'finance', ar: 'الخزينة والبنوك', en: 'Finance / Banks' },
  { k: 'hr', ar: 'الموارد البشرية', en: 'HR' },
  { k: 'payroll', ar: 'الرواتب', en: 'Payroll' },
  { k: 'pos', ar: 'نقطة البيع', en: 'POS' },
  { k: 'reports', ar: 'التقارير', en: 'Reports' },
  { k: 'settings', ar: 'الإعدادات', en: 'Settings' },
  { k: 'users', ar: 'المستخدمون', en: 'Users' },
];
const ALL_PERMS: Perm[] = ['view', 'create', 'edit', 'delete', 'approve', 'post'];

export default function RolesPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const [roles, setRoles] = useState<Role[]>([]);
  const [editing, setEditing] = useState<Role | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [perms, setPerms] = useState<Permissions>({});

  async function load() {
    const r = await fetch('/api/roles');
    if (r.ok) setRoles((await r.json()).data ?? []);
  }
  useEffect(() => { load(); }, []);

  function startNew() {
    setEditing(null); setName(''); setDescription('');
    const seed: Permissions = {};
    for (const s of SECTIONS) seed[s.k] = [];
    setPerms(seed);
  }

  function startEdit(r: Role) {
    setEditing(r); setName(r.name); setDescription(r.description ?? '');
    setPerms({ ...r.permissions });
  }

  function toggle(section: string, perm: Perm) {
    const current = perms[section] ?? [];
    const next = current.includes(perm) ? current.filter((p) => p !== perm) : [...current, perm];
    setPerms({ ...perms, [section]: next });
  }

  async function save() {
    if (!name) { toast.error(tri(locale, { ar: 'الاسم مطلوب', ku: 'ناو پێویستە', en: 'Name required' })); return; }
    const res = await fetch('/api/roles', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name, description, permissions: perms }),
    });
    if (res.ok) { toast.success(tri(locale, { ar: 'تم الحفظ', ku: 'پاشەکەوت کرا', en: 'Saved' })); startNew(); load(); }
    else toast.error('failed');
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={tri(locale, { ar: 'الأدوار والصلاحيات', ku: 'ڕۆڵ و دەسەڵاتەکان', en: 'Roles & Permissions' })}
        description={tri(locale, { ar: 'حدّد ما يستطيع كل دور فعله في النظام', ku: 'دیاری بکە هەر ڕۆڵێک چی دەتوانێت لە سیستەمدا بیکات', en: 'Define what each role can do in the system' })}
        actions={<Button onClick={startNew}><Plus className="h-4 w-4" /> {tri(locale, { ar: 'دور جديد', ku: 'ڕۆڵی نوێ', en: 'New role' })}</Button>}
      />

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <Card>
          <CardHeader><CardTitle>{tri(locale, { ar: `الأدوار (${roles.length})`, ku: `ڕۆڵەکان (${roles.length})`, en: `Roles (${roles.length})` })}</CardTitle></CardHeader>
          <CardContent>
            {roles.length === 0 ? (
              <div className="py-8 text-center">
                <ShieldCheck className="mx-auto h-8 w-8 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">{tri(locale, { ar: 'لا توجد أدوار', ku: 'هیچ ڕۆڵێک نییە', en: 'No roles yet' })}</p>
              </div>
            ) : (
              <ul className="divide-y">
                {roles.map((r) => (
                  <li key={r.id} className="py-2">
                    <button type="button" onClick={() => startEdit(r)}
                      className={`flex w-full items-start justify-between text-start ${editing?.id === r.id ? 'text-primary' : ''}`}>
                      <div>
                        <p className="font-medium">{r.name}</p>
                        {r.description && <p className="text-xs text-muted-foreground">{r.description}</p>}
                      </div>
                      {r.isSystem && <span className="text-[10px] text-muted-foreground">{tri(locale, { ar: 'نظام', ku: 'سیستەم', en: 'system' })}</span>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{editing ? tri(locale, { ar: 'تعديل الدور', ku: 'دەستکاری ڕۆڵ', en: 'Edit role' }) : tri(locale, { ar: 'دور جديد', ku: 'ڕۆڵی نوێ', en: 'New role' })}</CardTitle>
            <CardDescription>{tri(locale, { ar: 'علّم الصلاحيات لكل قسم', ku: 'دەسەڵاتەکان بۆ هەر بەشێک دیاری بکە', en: 'Check permissions per section' })}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>{tri(locale, { ar: 'اسم الدور', ku: 'ناوی ڕۆڵ', en: 'Role name' })}</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={tri(locale, { ar: 'مثال: مدير المبيعات', ku: 'نموونە: بەڕێوەبەری فرۆشتن', en: 'e.g. Sales Manager' })} />
              </div>
              <div className="space-y-1.5">
                <Label>{tri(locale, { ar: 'الوصف', ku: 'وەسف', en: 'Description' })}</Label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="py-2 text-start font-semibold">{tri(locale, { ar: 'القسم', ku: 'بەش', en: 'Section' })}</th>
                    {ALL_PERMS.map((p) => (
                      <th key={p} className="px-1 text-center font-semibold text-xs">{PERM_LABEL[p][isAr ? 'ar' : 'en']}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SECTIONS.map((s) => (
                    <tr key={s.k} className="border-b">
                      <td className="py-2 font-medium">{isAr ? s.ar : s.en}</td>
                      {ALL_PERMS.map((p) => (
                        <td key={p} className="text-center">
                          <input type="checkbox" className="h-4 w-4"
                            checked={(perms[s.k] ?? []).includes(p)}
                            onChange={() => toggle(s.k, p)} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
              <Button onClick={save}><Save className="h-4 w-4" /> {tri(locale, { ar: 'حفظ الدور', ku: 'پاشەکەوتی ڕۆڵ', en: 'Save role' })}</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const PERM_LABEL: Record<Perm, { ar: string; en: string }> = {
  view: { ar: 'عرض', en: 'View' },
  create: { ar: 'إنشاء', en: 'Create' },
  edit: { ar: 'تعديل', en: 'Edit' },
  delete: { ar: 'حذف', en: 'Delete' },
  approve: { ar: 'اعتماد', en: 'Approve' },
  post: { ar: 'ترحيل', en: 'Post' },
};

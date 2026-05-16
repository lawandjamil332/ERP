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
    if (!name) { toast.error(isAr ? 'الاسم مطلوب' : 'Name required'); return; }
    const res = await fetch('/api/roles', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name, description, permissions: perms }),
    });
    if (res.ok) { toast.success(isAr ? 'تم الحفظ' : 'Saved'); startNew(); load(); }
    else toast.error('failed');
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isAr ? 'الأدوار والصلاحيات' : 'Roles & Permissions'}
        description={isAr ? 'حدّد ما يستطيع كل دور فعله في النظام' : 'Define what each role can do in the system'}
        actions={<Button onClick={startNew}><Plus className="h-4 w-4" /> {isAr ? 'دور جديد' : 'New role'}</Button>}
      />

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <Card>
          <CardHeader><CardTitle>{isAr ? `الأدوار (${roles.length})` : `Roles (${roles.length})`}</CardTitle></CardHeader>
          <CardContent>
            {roles.length === 0 ? (
              <div className="py-8 text-center">
                <ShieldCheck className="mx-auto h-8 w-8 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">{isAr ? 'لا توجد أدوار' : 'No roles yet'}</p>
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
                      {r.isSystem && <span className="text-[10px] text-muted-foreground">{isAr ? 'نظام' : 'system'}</span>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{editing ? (isAr ? 'تعديل الدور' : 'Edit role') : (isAr ? 'دور جديد' : 'New role')}</CardTitle>
            <CardDescription>{isAr ? 'علّم الصلاحيات لكل قسم' : 'Check permissions per section'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>{isAr ? 'اسم الدور' : 'Role name'}</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={isAr ? 'مثال: مدير المبيعات' : 'e.g. Sales Manager'} />
              </div>
              <div className="space-y-1.5">
                <Label>{isAr ? 'الوصف' : 'Description'}</Label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="py-2 text-start font-semibold">{isAr ? 'القسم' : 'Section'}</th>
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
              <Button onClick={save}><Save className="h-4 w-4" /> {isAr ? 'حفظ الدور' : 'Save role'}</Button>
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

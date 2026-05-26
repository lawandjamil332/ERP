/**
 * Payslip — Arabic auto-print HTML. Iraqi Labor Law requires written wage records.
 */

import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { canSeePayroll } from '@/lib/auth/sanitize';
import { formatMoney } from '@/lib/iraq/money';

export async function GET(_req: Request, ctx: { params: Promise<{ runId: string; empId: string }> }) {
  const session = await requireSession();
  if (!canSeePayroll(session)) return new Response('Forbidden', { status: 403 });
  const { runId, empId } = await ctx.params;
  const line = await db.payrollLine.findFirst({
    where: { runId, employeeId: empId, run: { tenantId: session.tenantId } },
    include: { run: true, employee: true },
  });
  if (!line) return new Response('Not found', { status: 404 });
  const tenant = await db.tenant.findUnique({ where: { id: session.tenantId } });
  const f = (n: any) => formatMoney(Number(n.toString()), 'IQD', 'ar');

  const html = `<!doctype html>
<html lang="ar" dir="rtl">
<head><meta charset="utf-8" /><title>قسيمة راتب ${line.employee.empNo}</title>
<style>
  @page { size: A4; margin: 20mm; }
  body { font-family: 'Tajawal','Cairo',system-ui,sans-serif; max-width: 800px; margin: auto; color:#000; }
  .hdr { display:flex; justify-content:space-between; border-bottom:2px solid #000; padding-bottom:8px; }
  table { width:100%; border-collapse:collapse; margin-top: 1rem; font-size: 13px; }
  th, td { padding: 8px; border-bottom: 1px solid #ddd; text-align: start; }
  .totals { width: 60%; margin-inline-start: auto; }
  .totals td { border: 0; padding: 4px 8px; }
  .grand { border-top: 2px solid #000; font-weight: bold; font-size: 15px; }
  .sig { margin-top: 3rem; display: flex; justify-content: space-between; font-size: 12px; }
  .sig div { border-top: 1px solid #000; padding-top: 4px; width: 30%; }
</style></head>
<body>
  <div class="hdr">
    <div>
      <h2 style="margin:0">${tenant?.nameAr ?? ''}</h2>
      <div style="font-size:12px; color:#444">${tenant?.nameEn ?? ''}</div>
      <div style="font-size:12px; color:#444">الرقم الضريبي: ${tenant?.taxNumber ?? '—'}</div>
    </div>
    <div style="text-align: end">
      <h1 style="margin:0">قسيمة راتب</h1>
      <div>عن شهر: <strong>${line.run.period}</strong></div>
    </div>
  </div>
  <table>
    <tbody>
      <tr><th style="width: 30%">الاسم</th><td>${line.employee.fullNameAr}${line.employee.fullNameEn ? ' / ' + line.employee.fullNameEn : ''}</td></tr>
      <tr><th>الرقم الوظيفي</th><td>${line.employee.empNo}</td></tr>
      <tr><th>الوظيفة</th><td>${line.employee.jobTitle ?? '—'}</td></tr>
      <tr><th>القسم</th><td>${line.employee.department ?? '—'}</td></tr>
      <tr><th>تاريخ التعيين</th><td>${new Intl.DateTimeFormat('ar-IQ').format(line.employee.hireDate)}</td></tr>
    </tbody>
  </table>
  <table class="totals">
    <tr><td>الراتب الأساسي</td><td style="text-align: end">${f(line.baseSalary)}</td></tr>
    <tr><td>البدلات والعلاوات</td><td style="text-align: end">${f(line.allowances)}</td></tr>
    <tr><td>العمل الإضافي</td><td style="text-align: end">${f(line.overtime)}</td></tr>
    <tr><td>المكافآت</td><td style="text-align: end">${f(line.bonuses)}</td></tr>
    <tr><td style="border-top: 1px solid #000"><strong>الإجمالي / Gross</strong></td>
        <td style="text-align: end; border-top: 1px solid #000"><strong>${f(line.gross)}</strong></td></tr>
    <tr><td>الضمان الاجتماعي (٥٪)</td><td style="text-align: end; color:#a00">(${f(line.ssEmployee)})</td></tr>
    <tr><td>ضريبة الدخل</td><td style="text-align: end; color:#a00">(${f(line.incomeTax)})</td></tr>
    <tr><td>استقطاعات أخرى</td><td style="text-align: end; color:#a00">(${f(line.otherDeductions)})</td></tr>
    <tr class="grand"><td>صافي الراتب</td><td style="text-align: end">${f(line.net)}</td></tr>
  </table>
  <p style="margin-top:1rem; font-size:11px; color:#444">
    حصة صاحب العمل في الضمان الاجتماعي: <strong>${f(line.ssEmployer)}</strong>
  </p>
  <div class="sig">
    <div>توقيع الموظف / Employee signature</div>
    <div>توقيع صاحب العمل / Employer signature</div>
  </div>
  <p style="margin-top: 2rem; text-align: center; font-size: 10px; color: #666">
    وفقاً لقانون العمل العراقي ومتطلبات الهيئة العامة للضرائب
  </p>
  <script>window.onload = () => setTimeout(() => window.print(), 100);</script>
</body></html>`;

  return new Response(html, {
    status: 200,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}

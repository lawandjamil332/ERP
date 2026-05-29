import type { PrismaClient } from '@prisma/client';
import BigNumber from 'bignumber.js';

/**
 * Approval gate. Given a document amount, finds the matching active rule
 * (same entity + currency, amount >= threshold) and returns whether approval
 * is required + which role must approve.
 *
 * Fails OPEN: if no rule matches, the action proceeds (never blocks work that
 * the company hasn't explicitly chosen to gate).
 */
export interface GateResult {
  required: boolean;
  ruleId?: string;
  approverRole?: string;
}

export async function evaluateApproval(
  db: PrismaClient,
  tenantId: string,
  entity: string,
  amount: BigNumber.Value,
  currency = 'IQD',
): Promise<GateResult> {
  const rules = await db.approvalRule.findMany({
    where: { tenantId, entity, currency, isActive: true },
    orderBy: { thresholdAmount: 'asc' },
  });
  if (rules.length === 0) return { required: false };

  const amt = new BigNumber(amount);
  const matched = rules.find((r) => amt.gte(r.thresholdAmount.toString()));
  if (!matched) return { required: false };

  return { required: true, ruleId: matched.id, approverRole: matched.approverRole };
}

/**
 * Create a PENDING approval request for a document. Idempotent per (entity,entityId):
 * if a pending one already exists it is returned instead of duplicated.
 */
export async function requestApproval(
  db: PrismaClient,
  args: {
    tenantId: string; entity: string; entityId: string;
    amount: BigNumber.Value; currency?: string;
    approverRole: string; ruleId?: string; requestedById?: string | null;
  },
) {
  const existing = await db.approval.findFirst({
    where: { tenantId: args.tenantId, entity: args.entity, entityId: args.entityId, status: 'PENDING' },
  });
  if (existing) return existing;

  const approval = await db.approval.create({
    data: {
      tenantId: args.tenantId,
      entity: args.entity,
      entityId: args.entityId,
      amount: new BigNumber(args.amount).toFixed(4),
      currency: args.currency ?? 'IQD',
      approverRole: args.approverRole,
      ruleId: args.ruleId,
      requestedById: args.requestedById ?? null,
    },
  });

  // Notify approvers (tenant-wide notification picked up by anyone with the role).
  await db.notification.create({
    data: {
      tenantId: args.tenantId,
      kind: 'APPROVAL_REQUEST',
      title: `${args.entity} needs approval`,
      body: `Amount ${new BigNumber(args.amount).toFormat()} ${args.currency ?? 'IQD'} exceeds the approval threshold.`,
      link: `/dashboard/approvals`,
    },
  }).catch(() => { /* non-fatal */ });

  return approval;
}

/** Has this document been approved (or never needed approval)? */
export async function isApproved(
  db: PrismaClient,
  tenantId: string,
  entity: string,
  entityId: string,
): Promise<boolean> {
  const pendingOrRejected = await db.approval.findFirst({
    where: { tenantId, entity, entityId, status: { in: ['PENDING', 'REJECTED'] } },
  });
  return !pendingOrRejected;
}

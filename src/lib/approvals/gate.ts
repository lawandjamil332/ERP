import type { PrismaClient } from '@prisma/client';
import BigNumber from 'bignumber.js';

/**
 * Approval gate — multi-step version.
 *
 * Given a document amount, finds ALL matching active rules
 * (same entity + currency, amount >= threshold) ordered by step.
 * Each rule represents one approval step with its own approverRole.
 *
 * Fails OPEN: if no rule matches, the action proceeds (never blocks work that
 * the company hasn't explicitly chosen to gate).
 */
export interface GateResult {
  required: boolean;
  /** All matching rules ordered by step (multi-step approval chain). */
  rules: { ruleId: string; approverRole: string; step: number; escalationHours: number }[];
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
    orderBy: { step: 'asc' },
  });
  if (rules.length === 0) return { required: false, rules: [] };

  const amt = new BigNumber(amount);
  const matched = rules.filter((r) => amt.gte(r.thresholdAmount.toString()));
  if (matched.length === 0) return { required: false, rules: [] };

  return {
    required: true,
    rules: matched.map((r) => ({
      ruleId: r.id,
      approverRole: r.approverRole,
      step: r.step,
      escalationHours: r.escalationHours,
    })),
  };
}

/**
 * Create a PENDING approval request for a document. Idempotent per (entity,entityId):
 * if a pending one already exists it is returned instead of duplicated.
 *
 * Multi-step: sets currentStep=1, maxSteps=count of matching rules,
 * approverRole from the first step, and escalateAt based on escalationHours.
 */
export async function requestApproval(
  db: PrismaClient,
  args: {
    tenantId: string; entity: string; entityId: string;
    amount: BigNumber.Value; currency?: string;
    rules: { ruleId: string; approverRole: string; step: number; escalationHours: number }[];
    requestedById?: string | null;
  },
) {
  const existing = await db.approval.findFirst({
    where: { tenantId: args.tenantId, entity: args.entity, entityId: args.entityId, status: 'PENDING' },
  });
  if (existing) return existing;

  const firstRule = args.rules[0];
  const escalateAt = new Date(Date.now() + firstRule.escalationHours * 3600_000);

  const approval = await db.approval.create({
    data: {
      tenantId: args.tenantId,
      entity: args.entity,
      entityId: args.entityId,
      amount: new BigNumber(args.amount).toFixed(4),
      currency: args.currency ?? 'IQD',
      approverRole: firstRule.approverRole,
      ruleId: firstRule.ruleId,
      currentStep: 1,
      maxSteps: args.rules.length,
      escalateAt,
      requestedById: args.requestedById ?? null,
    },
  });

  // Notify approvers (tenant-wide notification picked up by anyone with the role).
  await db.notification.create({
    data: {
      tenantId: args.tenantId,
      kind: 'APPROVAL_REQUEST',
      title: `${args.entity} needs approval`,
      body: `Amount ${new BigNumber(args.amount).toFormat()} ${args.currency ?? 'IQD'} exceeds the approval threshold. Step 1 of ${args.rules.length}.`,
      link: `/dashboard/approvals`,
    },
  }).catch(() => { /* non-fatal */ });

  return approval;
}

/**
 * Advance an approval after a step is approved.
 *
 * If currentStep < maxSteps, moves to the next step: updates approverRole,
 * ruleId, escalateAt, and increments currentStep.
 *
 * If currentStep === maxSteps, sets status=APPROVED (all steps done).
 *
 * On REJECTED, immediately sets status=REJECTED regardless of step.
 */
export async function advanceApproval(
  db: PrismaClient,
  approvalId: string,
  decision: 'APPROVED' | 'REJECTED',
  decidedById: string,
  note?: string,
) {
  const approval = await db.approval.findUniqueOrThrow({ where: { id: approvalId } });

  // Reject immediately at any step.
  if (decision === 'REJECTED') {
    return db.approval.update({
      where: { id: approvalId },
      data: {
        status: 'REJECTED',
        decidedById,
        decidedAt: new Date(),
        note: note ?? null,
      },
    });
  }

  // APPROVED path — check if more steps remain.
  if (approval.currentStep < approval.maxSteps) {
    // Find the next rule in the chain.
    const nextStep = approval.currentStep + 1;
    const nextRule = await db.approvalRule.findFirst({
      where: {
        tenantId: approval.tenantId,
        entity: approval.entity,
        currency: approval.currency,
        step: nextStep,
        isActive: true,
      },
      orderBy: { step: 'asc' },
    });

    const escalateAt = nextRule
      ? new Date(Date.now() + nextRule.escalationHours * 3600_000)
      : new Date(Date.now() + 24 * 3600_000);

    const updated = await db.approval.update({
      where: { id: approvalId },
      data: {
        currentStep: nextStep,
        approverRole: nextRule?.approverRole ?? approval.approverRole,
        ruleId: nextRule?.id ?? approval.ruleId,
        escalateAt,
        note: note ? `Step ${approval.currentStep}: ${note}` : null,
      },
    });

    // Notify the next approver.
    await db.notification.create({
      data: {
        tenantId: approval.tenantId,
        kind: 'APPROVAL_REQUEST',
        title: `${approval.entity} needs approval (step ${nextStep})`,
        body: `Step ${approval.currentStep} approved. Now awaiting step ${nextStep} of ${approval.maxSteps}.`,
        link: `/dashboard/approvals`,
      },
    }).catch(() => { /* non-fatal */ });

    return updated;
  }

  // Final step — mark fully approved.
  return db.approval.update({
    where: { id: approvalId },
    data: {
      status: 'APPROVED',
      decidedById,
      decidedAt: new Date(),
      note: note ?? null,
    },
  });
}

/**
 * Escalation: find approvals past their escalateAt and bump to the next step.
 * Intended for cron / background job usage.
 */
export async function escalateApproval(db: PrismaClient) {
  const overdue = await db.approval.findMany({
    where: {
      status: 'PENDING',
      escalateAt: { lte: new Date() },
    },
  });

  const results: { id: string; escalated: boolean }[] = [];

  for (const approval of overdue) {
    if (approval.currentStep >= approval.maxSteps) {
      // No further step to escalate to — skip.
      results.push({ id: approval.id, escalated: false });
      continue;
    }

    const nextStep = approval.currentStep + 1;
    const nextRule = await db.approvalRule.findFirst({
      where: {
        tenantId: approval.tenantId,
        entity: approval.entity,
        currency: approval.currency,
        step: nextStep,
        isActive: true,
      },
      orderBy: { step: 'asc' },
    });

    const escalateAt = nextRule
      ? new Date(Date.now() + nextRule.escalationHours * 3600_000)
      : new Date(Date.now() + 24 * 3600_000);

    await db.approval.update({
      where: { id: approval.id },
      data: {
        currentStep: nextStep,
        approverRole: nextRule?.approverRole ?? approval.approverRole,
        ruleId: nextRule?.id ?? approval.ruleId,
        escalateAt,
      },
    });

    // Notify about escalation.
    await db.notification.create({
      data: {
        tenantId: approval.tenantId,
        kind: 'APPROVAL_REQUEST',
        title: `${approval.entity} approval escalated`,
        body: `Approval auto-escalated to step ${nextStep} of ${approval.maxSteps} due to timeout.`,
        link: `/dashboard/approvals`,
      },
    }).catch(() => { /* non-fatal */ });

    results.push({ id: approval.id, escalated: true });
  }

  return results;
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

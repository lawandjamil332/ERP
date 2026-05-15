import type { Prisma, PrismaClient } from '@prisma/client';
import { AsyncLocalStorage } from 'node:async_hooks';

export interface AuditContext {
  tenantId: string;
  userId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
}

const ctx = new AsyncLocalStorage<AuditContext>();

export function runWithAudit<T>(c: AuditContext, fn: () => Promise<T>): Promise<T> {
  return ctx.run(c, fn);
}

const SKIP = new Set(['AuditLog', 'Notification', 'BankStatement', 'TotpSecret', 'CustomerPortalToken', 'ExchangeRate']);
const WRITE_OPS = new Set(['create', 'createMany', 'update', 'updateMany', 'delete', 'deleteMany', 'upsert']);

export function withAudit(db: PrismaClient): PrismaClient {
  return db.$extends({
    name: 'audit',
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const result = await query(args);
          if (!model || SKIP.has(model)) return result;
          if (!WRITE_OPS.has(operation)) return result;
          const c = ctx.getStore();
          if (!c) return result;
          try {
            const entityId = (() => {
              if (result && typeof result === 'object' && 'id' in result) return (result as any).id;
              return undefined;
            })();
            const where = (args as any)?.where ?? null;
            const data = (args as any)?.data ?? (args as any)?.create ?? null;
            await (db as any).auditLog.create({
              data: {
                tenantId: c.tenantId,
                userId: c.userId ?? null,
                action: operation.toUpperCase(),
                entity: model,
                entityId: typeof entityId === 'string' ? entityId : null,
                before: where as Prisma.InputJsonValue,
                after: data as Prisma.InputJsonValue,
                ip: c.ip ?? null,
                userAgent: c.userAgent ?? null,
              },
            });
          } catch {}
          return result;
        },
      },
    },
  }) as unknown as PrismaClient;
}

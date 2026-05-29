import { PrismaClient } from '@prisma/client';
import { withAudit } from '@/lib/db/audit';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const base =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = base;

/**
 * The exported client is audit-extended: every write (create/update/delete/...)
 * by an authenticated request is recorded in AuditLog with who/when/before/after.
 * Context is established per-request via enterAuditContext() in requireSession().
 */
export const db = withAudit(base);

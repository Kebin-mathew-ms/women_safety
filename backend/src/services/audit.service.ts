import prisma from './db.service';
import logger from '../utils/logger';

export interface AuditEntry {
  adminId?: string;
  userId?: string;
  module: string;
  action: string;
  entityType?: string;
  entityId?: string;
  ipAddress?: string;
  userAgent?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
}

export class AuditService {
  static async log(entry: AuditEntry): Promise<void> {
    try {
      await prisma.auditLogs.create({
        data: {
          adminId: entry.adminId ?? null,
          userId: entry.userId ?? null,
          module: entry.module,
          action: entry.action,
          entityType: entry.entityType ?? null,
          entityId: entry.entityId ?? null,
          ipAddress: entry.ipAddress ?? null,
          userAgent: entry.userAgent ?? null,
          oldValuesJson: entry.oldValues ? JSON.stringify(entry.oldValues) : null,
          newValuesJson: entry.newValues ? JSON.stringify(entry.newValues) : null,
        },
      });
    } catch (err) {
      logger.error('Failed to write audit log', err);
    }
  }

  static async getLogs(options: {
    page?: number;
    limit?: number;
    module?: string;
    action?: string;
    adminId?: string;
    from?: string;
    to?: string;
  }) {
    const { page = 1, limit = 50, module, action, adminId, from, to } = options;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (module) where.module = module;
    if (action) where.action = action;
    if (adminId) where.adminId = adminId;
    if (from || to) {
      where.createdAt = {};
      if (from) (where.createdAt as Record<string, unknown>).gte = new Date(from);
      if (to) (where.createdAt as Record<string, unknown>).lte = new Date(to);
    }

    const [total, logs] = await Promise.all([
      prisma.auditLogs.count({ where }),
      prisma.auditLogs.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { admin: { select: { name: true, email: true, role: true } } },
      }),
    ]);

    return { total, page, limit, logs };
  }
}

export default AuditService;

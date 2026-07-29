import prisma from './db.service';

export class ReportingService {
  // ─── Users Report ─────────────────────────────────────────────────────

  static async getUsersReport(from?: string, to?: string) {
    const where: Record<string, unknown> = {};
    if (from || to) {
      where.createdAt = {};
      if (from) (where.createdAt as Record<string, unknown>).gte = new Date(from);
      if (to) (where.createdAt as Record<string, unknown>).lte = new Date(to);
    }
    return prisma.user.findMany({
      where,
      select: {
        userId: true, fullName: true, email: true, phone: true,
        city: true, country: true, isActive: true, isBlocked: true,
        lastLogin: true, createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── Trips Report ─────────────────────────────────────────────────────

  static async getTripsReport(from?: string, to?: string) {
    const where: Record<string, unknown> = {};
    if (from || to) {
      where.createdAt = {};
      if (from) (where.createdAt as Record<string, unknown>).gte = new Date(from);
      if (to) (where.createdAt as Record<string, unknown>).lte = new Date(to);
    }
    return prisma.trip.findMany({
      where,
      include: { user: { select: { fullName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── SOS Report ───────────────────────────────────────────────────────

  static async getSosReport(from?: string, to?: string) {
    const where: Record<string, unknown> = {};
    if (from || to) {
      where.createdAt = {};
      if (from) (where.createdAt as Record<string, unknown>).gte = new Date(from);
      if (to) (where.createdAt as Record<string, unknown>).lte = new Date(to);
    }
    return prisma.sOSAlert.findMany({
      where,
      include: { user: { select: { fullName: true, email: true, phone: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── Community Report ─────────────────────────────────────────────────

  static async getCommunityReport(from?: string, to?: string) {
    const where: Record<string, unknown> = { deletedAt: null };
    if (from || to) {
      where.createdAt = {};
      if (from) (where.createdAt as Record<string, unknown>).gte = new Date(from);
      if (to) (where.createdAt as Record<string, unknown>).lte = new Date(to);
    }
    return prisma.communityPost.findMany({
      where,
      include: { user: { select: { fullName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── Crime Reports ────────────────────────────────────────────────────

  static async getCrimeReport(from?: string, to?: string) {
    const where: Record<string, unknown> = {};
    if (from || to) {
      where.createdAt = {};
      if (from) (where.createdAt as Record<string, unknown>).gte = new Date(from);
      if (to) (where.createdAt as Record<string, unknown>).lte = new Date(to);
    }
    return prisma.crimeReport.findMany({
      where,
      include: { user: { select: { fullName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── Safe Places Report ───────────────────────────────────────────────

  static async getSafePlacesReport() {
    return prisma.safePlace.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── Notifications Report ─────────────────────────────────────────────

  static async getNotificationsReport(from?: string, to?: string) {
    const where: Record<string, unknown> = {};
    if (from || to) {
      where.createdAt = {};
      if (from) (where.createdAt as Record<string, unknown>).gte = new Date(from);
      if (to) (where.createdAt as Record<string, unknown>).lte = new Date(to);
    }
    return prisma.notification.findMany({
      where,
      include: { user: { select: { fullName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
  }

  // ─── AI Usage Report ──────────────────────────────────────────────────

  static async getAiReport(from?: string, to?: string) {
    const where: Record<string, unknown> = {};
    if (from || to) {
      where.createdAt = {};
      if (from) (where.createdAt as Record<string, unknown>).gte = new Date(from);
      if (to) (where.createdAt as Record<string, unknown>).lte = new Date(to);
    }
    const [conversations, analyses] = await Promise.all([
      prisma.aIConversations.findMany({
        where,
        include: { user: { select: { fullName: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        take: 200,
      }),
      prisma.aISafetyAnalyses.findMany({
        where,
        include: { user: { select: { fullName: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        take: 200,
      }),
    ]);
    return { conversations, analyses };
  }

  // ─── CSV Formatter ────────────────────────────────────────────────────

  static toCSV(records: Record<string, unknown>[]): string {
    if (!records.length) return '';
    const headers = Object.keys(records[0]);
    const rows = records.map((r) =>
      headers.map((h) => {
        const val = r[h];
        if (val === null || val === undefined) return '';
        if (typeof val === 'object') return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(',')
    );
    return [headers.join(','), ...rows].join('\n');
  }
}

export default ReportingService;

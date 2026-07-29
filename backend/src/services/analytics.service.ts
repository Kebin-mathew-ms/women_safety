import prisma from './db.service';

export class AnalyticsService {
  // ─── Time-series helpers ───────────────────────────────────────────────

  private static dateRange(period: string, customFrom?: string, customTo?: string) {
    const now = new Date();
    let from: Date;
    let to: Date = now;

    switch (period) {
      case 'today':
        from = new Date(now); from.setHours(0, 0, 0, 0);
        break;
      case 'week':
        from = new Date(now); from.setDate(now.getDate() - 7);
        break;
      case 'month':
        from = new Date(now); from.setDate(1); from.setHours(0, 0, 0, 0);
        break;
      case 'year':
        from = new Date(now.getFullYear(), 0, 1);
        break;
      case 'custom':
        from = customFrom ? new Date(customFrom) : new Date(now.getTime() - 30 * 86400000);
        to = customTo ? new Date(customTo) : now;
        break;
      default:
        from = new Date(now); from.setDate(now.getDate() - 30);
    }
    return { from, to };
  }

  // ─── Dashboard summary ─────────────────────────────────────────────────

  static async getDashboardStats() {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);

    const [
      totalUsers, activeUsers, tripsToday, activeTrips,
      sosToday, activeSos, safePlaces, communityPosts,
      crimeReports, notificationsSent, aiRequests, adminCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true, isBlocked: false } }),
      prisma.trip.count({ where: { createdAt: { gte: today, lte: todayEnd } } }),
      prisma.trip.count({ where: { status: 'active' } }),
      prisma.sOSAlert.count({ where: { createdAt: { gte: today, lte: todayEnd } } }),
      prisma.sOSAlert.count({ where: { status: 'active' } }),
      prisma.safePlace.count(),
      prisma.communityPost.count({ where: { deletedAt: null } }),
      prisma.crimeReport.count(),
      prisma.notification.count({ where: { createdAt: { gte: today, lte: todayEnd } } }),
      prisma.aIConversations.count(),
      prisma.adminUsers.count({ where: { status: 'active' } }),
    ]);

    return {
      totalUsers, activeUsers, tripsToday, activeTrips,
      sosToday, activeSos, safePlaces, communityPosts,
      crimeReports, notificationsSent, aiRequests, adminCount,
    };
  }

  // ─── Time-series: Users registered per day ─────────────────────────────

  static async getUsersTimeSeries(period: string, from?: string, to?: string) {
    const { from: startDate, to: endDate } = AnalyticsService.dateRange(period, from, to);
    const users = await prisma.user.findMany({
      where: { createdAt: { gte: startDate, lte: endDate } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
    return AnalyticsService.groupByDay(users.map((u) => u.createdAt), startDate, endDate);
  }

  // ─── Time-series: Trips ────────────────────────────────────────────────

  static async getTripsTimeSeries(period: string, from?: string, to?: string) {
    const { from: startDate, to: endDate } = AnalyticsService.dateRange(period, from, to);
    const trips = await prisma.trip.findMany({
      where: { createdAt: { gte: startDate, lte: endDate } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
    return AnalyticsService.groupByDay(trips.map((t) => t.createdAt), startDate, endDate);
  }

  // ─── Time-series: SOS ─────────────────────────────────────────────────

  static async getSosTimeSeries(period: string, from?: string, to?: string) {
    const { from: startDate, to: endDate } = AnalyticsService.dateRange(period, from, to);
    const alerts = await prisma.sOSAlert.findMany({
      where: { createdAt: { gte: startDate, lte: endDate } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
    return AnalyticsService.groupByDay(alerts.map((a) => a.createdAt), startDate, endDate);
  }

  // ─── Time-series: Community posts ─────────────────────────────────────

  static async getCommunityTimeSeries(period: string, from?: string, to?: string) {
    const { from: startDate, to: endDate } = AnalyticsService.dateRange(period, from, to);
    const posts = await prisma.communityPost.findMany({
      where: { createdAt: { gte: startDate, lte: endDate }, deletedAt: null },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
    return AnalyticsService.groupByDay(posts.map((p) => p.createdAt), startDate, endDate);
  }

  // ─── Time-series: AI requests ─────────────────────────────────────────

  static async getAiTimeSeries(period: string, from?: string, to?: string) {
    const { from: startDate, to: endDate } = AnalyticsService.dateRange(period, from, to);
    const conversations = await prisma.aIConversations.findMany({
      where: { createdAt: { gte: startDate, lte: endDate } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
    return AnalyticsService.groupByDay(conversations.map((c) => c.createdAt), startDate, endDate);
  }

  // ─── Overview: Multi-series ────────────────────────────────────────────

  static async getOverview(period: string, from?: string, to?: string) {
    const [users, trips, sos, community, ai] = await Promise.all([
      AnalyticsService.getUsersTimeSeries(period, from, to),
      AnalyticsService.getTripsTimeSeries(period, from, to),
      AnalyticsService.getSosTimeSeries(period, from, to),
      AnalyticsService.getCommunityTimeSeries(period, from, to),
      AnalyticsService.getAiTimeSeries(period, from, to),
    ]);
    return { users, trips, sos, community, ai };
  }

  // ─── Helper: group timestamps into daily buckets ───────────────────────

  private static groupByDay(dates: Date[], from: Date, to: Date): { date: string; count: number }[] {
    const buckets = new Map<string, number>();

    // Fill all days in range with 0
    const cursor = new Date(from);
    while (cursor <= to) {
      buckets.set(cursor.toISOString().split('T')[0], 0);
      cursor.setDate(cursor.getDate() + 1);
    }

    // Count
    for (const d of dates) {
      const key = d.toISOString().split('T')[0];
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }

    return Array.from(buckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));
  }
}

export default AnalyticsService;

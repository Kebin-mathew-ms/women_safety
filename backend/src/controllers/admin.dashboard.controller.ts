import { Request, Response, NextFunction } from 'express';
import ResponseHelper from '../utils/response';
import AnalyticsService from '../services/analytics.service';
import ReportingService from '../services/reporting.service';
import AuditService from '../services/audit.service';
import SettingsService from '../services/settings.service';

// GET /api/admin/dashboard
export const getDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const stats = await AnalyticsService.getDashboardStats();
    ResponseHelper.success(res, 'Dashboard stats', stats);
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/analytics/overview?period=week&from=&to=
export const getAnalyticsOverview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { period = 'week', from, to } = req.query;
    const data = await AnalyticsService.getOverview(period as string, from as string, to as string);
    ResponseHelper.success(res, 'Analytics overview', data);
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/analytics/users
export const getUsersAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { period = 'week', from, to } = req.query;
    const data = await AnalyticsService.getUsersTimeSeries(period as string, from as string, to as string);
    ResponseHelper.success(res, 'Users analytics', data);
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/analytics/trips
export const getTripsAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { period = 'week', from, to } = req.query;
    const data = await AnalyticsService.getTripsTimeSeries(period as string, from as string, to as string);
    ResponseHelper.success(res, 'Trips analytics', data);
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/analytics/sos
export const getSosAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { period = 'week', from, to } = req.query;
    const data = await AnalyticsService.getSosTimeSeries(period as string, from as string, to as string);
    ResponseHelper.success(res, 'SOS analytics', data);
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/reports/:type?from=&to=&format=json|csv
export const generateReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { type } = req.params;
    const { from, to, format = 'json' } = req.query;

    let data: unknown;
    switch (type) {
      case 'users':       data = await ReportingService.getUsersReport(from as string, to as string); break;
      case 'trips':       data = await ReportingService.getTripsReport(from as string, to as string); break;
      case 'sos':         data = await ReportingService.getSosReport(from as string, to as string); break;
      case 'community':   data = await ReportingService.getCommunityReport(from as string, to as string); break;
      case 'crime':       data = await ReportingService.getCrimeReport(from as string, to as string); break;
      case 'safe-places': data = await ReportingService.getSafePlacesReport(); break;
      case 'notifications': data = await ReportingService.getNotificationsReport(from as string, to as string); break;
      case 'ai':          data = await ReportingService.getAiReport(from as string, to as string); break;
      default:
        return ResponseHelper.success(res, 'Unknown report type', null) as unknown as void;
    }

    if (format === 'csv') {
      const records = Array.isArray(data) ? data : [data];
      const csv = ReportingService.toCSV(records as Record<string, unknown>[]);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${type}-report-${Date.now()}.csv"`);
      res.send(csv);
      return;
    }

    ResponseHelper.success(res, `${type} report generated`, data);
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/audit-logs
export const getAuditLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page, limit, module, action, adminId, from, to } = req.query;
    const result = await AuditService.getLogs({
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 50,
      module: module as string,
      action: action as string,
      adminId: adminId as string,
      from: from as string,
      to: to as string,
    });
    ResponseHelper.success(res, 'Audit logs retrieved', result);
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/settings
export const getSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const settings = await SettingsService.getAll();
    ResponseHelper.success(res, 'Settings retrieved', settings);
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/settings
export const updateSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { settings } = req.body; // [{ key, value, category?, description? }]
    await SettingsService.upsertMany(settings);

    await AuditService.log({
      adminId: req.admin?.adminId,
      module: 'settings',
      action: 'UPDATE',
      ipAddress: req.ip,
      newValues: { updatedKeys: settings.map((s: { key: string }) => s.key) },
    });

    ResponseHelper.success(res, 'Settings updated', null);
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/search?q=&modules=users,trips,sos,posts,places,crime
export const globalSearch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { q, modules } = req.query;
    if (!q || (q as string).length < 2) {
      ResponseHelper.success(res, 'Search results', { users: [], trips: [], sos: [], posts: [], places: [], crime: [] });
      return;
    }

    const query = q as string;
    const mods = modules ? (modules as string).split(',') : ['users', 'trips', 'sos', 'posts', 'places', 'crime'];

    const results: Record<string, unknown[]> = {};

    await Promise.all(
      mods.map(async (mod) => {
        switch (mod) {
          case 'users':
            results.users = await import('../services/db.service').then((p) =>
              p.default.user.findMany({
                where: { OR: [{ fullName: { contains: query } }, { email: { contains: query } }, { phone: { contains: query } }] },
                select: { userId: true, fullName: true, email: true, phone: true },
                take: 10,
              })
            );
            break;
          case 'trips':
            results.trips = await import('../services/db.service').then((p) =>
              p.default.trip.findMany({
                where: { OR: [{ tripName: { contains: query } }, { destinationAddress: { contains: query } }] },
                select: { tripId: true, tripName: true, destinationAddress: true, status: true },
                take: 10,
              })
            );
            break;
          case 'posts':
            results.posts = await import('../services/db.service').then((p) =>
              p.default.communityPost.findMany({
                where: { deletedAt: null, OR: [{ title: { contains: query } }, { description: { contains: query } }] },
                select: { postId: true, title: true, category: true, createdAt: true },
                take: 10,
              })
            );
            break;
          case 'places':
            results.places = await import('../services/db.service').then((p) =>
              p.default.safePlace.findMany({
                where: { OR: [{ name: { contains: query } }, { address: { contains: query } }] },
                select: { placeId: true, name: true, category: true, address: true, verified: true },
                take: 10,
              })
            );
            break;
          case 'crime':
            results.crime = await import('../services/db.service').then((p) =>
              p.default.crimeReport.findMany({
                where: { OR: [{ description: { contains: query } }, { address: { contains: query } }] },
                select: { reportId: true, category: true, severity: true, address: true, createdAt: true },
                take: 10,
              })
            );
            break;
          default:
            results[mod] = [];
        }
      })
    );

    ResponseHelper.success(res, 'Search results', results);
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/notifications/broadcast
export const broadcastNotification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title, message, type = 'broadcast', priority = 'high' } = req.body;
    const prismaDb = await import('../services/db.service').then((p) => p.default);
    const users = await prismaDb.user.findMany({ where: { isActive: true, isBlocked: false }, select: { userId: true } });

    if (users.length === 0) {
      ResponseHelper.success(res, 'No active users to notify', null);
      return;
    }

    await prismaDb.notification.createMany({
      data: users.map((u) => ({ userId: u.userId, title, message, type, priority, isRead: false })),
    });

    await AuditService.log({
      adminId: req.admin?.adminId,
      module: 'notifications',
      action: 'BROADCAST',
      ipAddress: req.ip,
      newValues: { title, usersReached: users.length },
    });

    ResponseHelper.success(res, `Broadcast sent to ${users.length} users`, { usersReached: users.length });
  } catch (err) {
    next(err);
  }
};

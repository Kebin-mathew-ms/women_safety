import { Request, Response, NextFunction } from 'express';
import prisma from '../services/db.service';
import ResponseHelper from '../utils/response';
import { NotFoundError, BadRequestError } from '../utils/errors';
import AuditService from '../services/audit.service';

// GET /api/admin/sos
export const listSos = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, from, to, page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (from || to) {
      where.createdAt = {};
      if (from) (where.createdAt as Record<string, unknown>).gte = new Date(from as string);
      if (to) (where.createdAt as Record<string, unknown>).lte = new Date(to as string);
    }

    const [total, alerts] = await Promise.all([
      prisma.sOSAlert.count({ where }),
      prisma.sOSAlert.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { fullName: true, email: true, phone: true, bloodGroup: true } },
        },
      }),
    ]);

    ResponseHelper.success(res, 'SOS alerts retrieved', { total, alerts });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/sos/live
export const getLiveSos = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const alerts = await prisma.sOSAlert.findMany({
      where: { status: 'active' },
      orderBy: { createdAt: 'asc' },
      include: {
        user: { select: { fullName: true, email: true, phone: true, bloodGroup: true } },
      },
    });
    ResponseHelper.success(res, 'Live SOS alerts', alerts);
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/sos/:sosId/resolve
export const resolveSos = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { sosId } = req.params;
    const { notes } = req.body;

    const alert = await prisma.sOSAlert.findUnique({ where: { sosId } });
    if (!alert) throw new NotFoundError('SOS alert not found');
    if (alert.status === 'resolved') throw new BadRequestError('Already resolved');

    const updated = await prisma.sOSAlert.update({
      where: { sosId },
      data: {
        status: 'resolved',
        resolvedBy: req.admin?.adminId ?? 'admin',
        resolvedAt: new Date(),
        cancelledReason: notes ?? null,
      },
    });

    await AuditService.log({
      adminId: req.admin?.adminId,
      module: 'sos',
      action: 'RESOLVE',
      entityType: 'SOSAlert',
      entityId: sosId,
      ipAddress: req.ip,
      newValues: { status: 'resolved', notes },
    });

    ResponseHelper.success(res, 'SOS resolved', updated);
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/sos/:sosId/notes
export const addSosNotes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { sosId } = req.params;
    const { notes } = req.body;

    const alert = await prisma.sOSAlert.findUnique({ where: { sosId } });
    if (!alert) throw new NotFoundError('SOS alert not found');

    const updated = await prisma.sOSAlert.update({
      where: { sosId },
      data: { cancelledReason: notes },
    });

    ResponseHelper.success(res, 'Notes added', updated);
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/sos/analytics
export const getSosAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);

    const [total, active, resolved, cancelled, byType, todayCount] = await Promise.all([
      prisma.sOSAlert.count(),
      prisma.sOSAlert.count({ where: { status: 'active' } }),
      prisma.sOSAlert.count({ where: { status: 'resolved' } }),
      prisma.sOSAlert.count({ where: { status: 'cancelled' } }),
      prisma.sOSAlert.groupBy({ by: ['emergencyType'], _count: { sosId: true }, orderBy: { _count: { sosId: 'desc' } } }),
      prisma.sOSAlert.count({ where: { createdAt: { gte: today } } }),
    ]);

    ResponseHelper.success(res, 'SOS analytics', { total, active, resolved, cancelled, byType, todayCount });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/trips
export const listTrips = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const [total, trips] = await Promise.all([
      prisma.trip.count({ where }),
      prisma.trip.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { fullName: true, email: true, phone: true } } },
      }),
    ]);

    ResponseHelper.success(res, 'Trips retrieved', { total, trips });
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/trips/:tripId/cancel
export const cancelTrip = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { tripId } = req.params;
    const trip = await prisma.trip.findUnique({ where: { tripId } });
    if (!trip) throw new NotFoundError('Trip not found');

    const updated = await prisma.trip.update({ where: { tripId }, data: { status: 'cancelled' } });

    await AuditService.log({
      adminId: req.admin?.adminId,
      module: 'trips',
      action: 'CANCEL',
      entityType: 'Trip',
      entityId: tripId,
      ipAddress: req.ip,
    });

    ResponseHelper.success(res, 'Trip cancelled', updated);
  } catch (err) {
    next(err);
  }
};

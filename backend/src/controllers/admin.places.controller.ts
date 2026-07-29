import { Request, Response, NextFunction } from 'express';
import prisma from '../services/db.service';
import ResponseHelper from '../utils/response';
import { NotFoundError, BadRequestError } from '../utils/errors';
import AuditService from '../services/audit.service';

// GET /api/admin/places
export const listPlaces = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { verified, category, search, page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: Record<string, unknown> = {};
    if (verified !== undefined) where.verified = verified === 'true';
    if (category) where.category = category;
    if (search) where.name = { contains: search as string };

    const [total, places] = await Promise.all([
      prisma.safePlace.count({ where }),
      prisma.safePlace.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { reviews: true } } },
      }),
    ]);

    ResponseHelper.success(res, 'Safe places retrieved', { total, places });
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/places
export const createPlace = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = req.body;
    const place = await prisma.safePlace.create({ data });

    await AuditService.log({
      adminId: req.admin?.adminId,
      module: 'places',
      action: 'CREATE',
      entityType: 'SafePlace',
      entityId: place.placeId,
      ipAddress: req.ip,
      newValues: data,
    });

    ResponseHelper.success(res, 'Safe place created', place, 201);
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/places/:placeId
export const updatePlace = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { placeId } = req.params;
    const existing = await prisma.safePlace.findUnique({ where: { placeId } });
    if (!existing) throw new NotFoundError('Safe place not found');

    const updated = await prisma.safePlace.update({ where: { placeId }, data: req.body });

    await AuditService.log({
      adminId: req.admin?.adminId,
      module: 'places',
      action: 'UPDATE',
      entityType: 'SafePlace',
      entityId: placeId,
      ipAddress: req.ip,
      oldValues: existing as unknown as Record<string, unknown>,
      newValues: req.body,
    });

    ResponseHelper.success(res, 'Safe place updated', updated);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/admin/places/:placeId
export const deletePlace = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { placeId } = req.params;
    const existing = await prisma.safePlace.findUnique({ where: { placeId } });
    if (!existing) throw new NotFoundError('Safe place not found');

    await prisma.safePlace.delete({ where: { placeId } });

    await AuditService.log({
      adminId: req.admin?.adminId,
      module: 'places',
      action: 'DELETE',
      entityType: 'SafePlace',
      entityId: placeId,
      ipAddress: req.ip,
      oldValues: existing as unknown as Record<string, unknown>,
    });

    ResponseHelper.success(res, 'Safe place deleted', null);
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/places/:placeId/verify
export const verifyPlace = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { placeId } = req.params;
    const { action } = req.body; // verify | reject

    const existing = await prisma.safePlace.findUnique({ where: { placeId } });
    if (!existing) throw new NotFoundError('Safe place not found');

    const verified = action === 'verify';
    const updated = await prisma.safePlace.update({ where: { placeId }, data: { verified } });

    await AuditService.log({
      adminId: req.admin?.adminId,
      module: 'places',
      action: action === 'verify' ? 'APPROVE' : 'REJECT',
      entityType: 'SafePlace',
      entityId: placeId,
      ipAddress: req.ip,
      newValues: { verified },
    });

    ResponseHelper.success(res, `Safe place ${action}d`, updated);
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/crime-reports
export const listCrimeReports = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, severity, page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (severity) where.severity = severity;

    const [total, reports] = await Promise.all([
      prisma.crimeReport.count({ where }),
      prisma.crimeReport.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { fullName: true, email: true } } },
      }),
    ]);

    ResponseHelper.success(res, 'Crime reports retrieved', { total, reports });
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/crime-reports/:reportId/status
export const updateCrimeReportStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { reportId } = req.params;
    const { status } = req.body; // approved | resolved | pending

    if (!['approved', 'resolved', 'pending'].includes(status)) {
      throw new BadRequestError('Invalid status');
    }

    const report = await prisma.crimeReport.findUnique({ where: { reportId } });
    if (!report) throw new NotFoundError('Crime report not found');

    const updated = await prisma.crimeReport.update({ where: { reportId }, data: { status } });

    await AuditService.log({
      adminId: req.admin?.adminId,
      module: 'crime',
      action: status === 'approved' ? 'APPROVE' : 'UPDATE',
      entityType: 'CrimeReport',
      entityId: reportId,
      ipAddress: req.ip,
      oldValues: { status: report.status },
      newValues: { status },
    });

    ResponseHelper.success(res, 'Crime report updated', updated);
  } catch (err) {
    next(err);
  }
};

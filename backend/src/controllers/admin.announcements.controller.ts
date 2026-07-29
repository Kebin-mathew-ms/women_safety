import { Request, Response, NextFunction } from 'express';
import prisma from '../services/db.service';
import ResponseHelper from '../utils/response';
import { NotFoundError, BadRequestError } from '../utils/errors';
import AuditService from '../services/audit.service';

// GET /api/admin/announcements
export const listAnnouncements = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { active, page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: Record<string, unknown> = {};
    if (active !== undefined) where.active = active === 'true';

    const [total, announcements] = await Promise.all([
      prisma.adminAnnouncements.count({ where }),
      prisma.adminAnnouncements.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' },
        include: { creator: { select: { name: true, email: true } } },
      }),
    ]);

    ResponseHelper.success(res, 'Announcements retrieved', { total, announcements });
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/announcements
export const createAnnouncement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const adminId = req.admin?.adminId;
    if (!adminId) throw new BadRequestError('Admin context missing');

    const { title, message, priority, targetAudience, startDate, endDate, active } = req.body;
    if (!title || !message || !startDate || !endDate) {
      throw new BadRequestError('title, message, startDate, and endDate are required');
    }

    const announcement = await prisma.adminAnnouncements.create({
      data: {
        title,
        message,
        priority: priority ?? 'normal',
        targetAudience: targetAudience ?? 'all',
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        active: active ?? true,
        createdBy: adminId,
      },
    });

    await AuditService.log({
      adminId,
      module: 'announcements',
      action: 'CREATE',
      entityType: 'AdminAnnouncements',
      entityId: announcement.announcementId,
      ipAddress: req.ip,
      newValues: { title, priority },
    });

    ResponseHelper.success(res, 'Announcement created', announcement, 201);
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/announcements/:announcementId
export const updateAnnouncement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { announcementId } = req.params;
    const existing = await prisma.adminAnnouncements.findUnique({ where: { announcementId } });
    if (!existing) throw new NotFoundError('Announcement not found');

    const { title, message, priority, targetAudience, startDate, endDate, active } = req.body;
    const updated = await prisma.adminAnnouncements.update({
      where: { announcementId },
      data: {
        title, message, priority, targetAudience, active,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      },
    });

    await AuditService.log({
      adminId: req.admin?.adminId,
      module: 'announcements',
      action: 'UPDATE',
      entityType: 'AdminAnnouncements',
      entityId: announcementId,
      ipAddress: req.ip,
      oldValues: { title: existing.title, active: existing.active },
      newValues: { title, active },
    });

    ResponseHelper.success(res, 'Announcement updated', updated);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/admin/announcements/:announcementId
export const deleteAnnouncement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { announcementId } = req.params;
    await prisma.adminAnnouncements.delete({ where: { announcementId } });

    await AuditService.log({
      adminId: req.admin?.adminId,
      module: 'announcements',
      action: 'DELETE',
      entityType: 'AdminAnnouncements',
      entityId: announcementId,
      ipAddress: req.ip,
    });

    ResponseHelper.success(res, 'Announcement deleted', null);
  } catch (err) {
    next(err);
  }
};

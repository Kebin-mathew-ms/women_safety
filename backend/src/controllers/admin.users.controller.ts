import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../services/db.service';
import ResponseHelper from '../utils/response';
import { NotFoundError, BadRequestError } from '../utils/errors';
import AuditService from '../services/audit.service';

// GET /api/admin/users
export const listUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { search, isActive, isBlocked, city, page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { fullName: { contains: search as string } },
        { email: { contains: search as string } },
        { phone: { contains: search as string } },
      ];
    }
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (isBlocked !== undefined) where.isBlocked = isBlocked === 'true';
    if (city) where.city = city as string;

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          userId: true, fullName: true, email: true, phone: true,
          city: true, country: true, isActive: true, isBlocked: true,
          emailVerified: true, lastLogin: true, createdAt: true, deletedAt: true,
          _count: { select: { trips: true, sosAlerts: true } },
        },
      }),
    ]);

    ResponseHelper.success(res, 'Users retrieved', { total, page: parseInt(page as string), limit: take, users });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/users/:userId
export const getUserDetail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.params;
    const user = await prisma.user.findUnique({
      where: { userId },
      include: {
        emergencyContacts: true,
        trips: { orderBy: { createdAt: 'desc' }, take: 5 },
        sosAlerts: { orderBy: { createdAt: 'desc' }, take: 5 },
        _count: { select: { trips: true, sosAlerts: true, posts: true } },
      },
    });
    if (!user) throw new NotFoundError('User not found');
    ResponseHelper.success(res, 'User detail', user);
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/users/:userId/status
export const updateUserStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.params;
    const { action } = req.body; // activate, deactivate, block, unblock, soft_delete

    const user = await prisma.user.findUnique({ where: { userId } });
    if (!user) throw new NotFoundError('User not found');

    const oldValues = { isActive: user.isActive, isBlocked: user.isBlocked, deletedAt: user.deletedAt };
    let updateData: Record<string, unknown> = {};

    switch (action) {
      case 'activate':
        updateData = { isActive: true };
        break;
      case 'deactivate':
        updateData = { isActive: false };
        break;
      case 'block':
        updateData = { isBlocked: true };
        break;
      case 'unblock':
        updateData = { isBlocked: false };
        break;
      case 'soft_delete':
        updateData = { deletedAt: new Date(), isActive: false };
        break;
      default:
        throw new BadRequestError('Invalid action. Use: activate, deactivate, block, unblock, soft_delete');
    }

    const updated = await prisma.user.update({ where: { userId }, data: updateData });

    await AuditService.log({
      adminId: req.admin?.adminId,
      module: 'users',
      action: action.toUpperCase(),
      entityType: 'User',
      entityId: userId,
      ipAddress: req.ip,
      oldValues: oldValues as Record<string, unknown>,
      newValues: updateData,
    });

    ResponseHelper.success(res, `User ${action} successful`, updated);
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/users/:userId/reset-password
export const resetUserPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) throw new BadRequestError('Password must be at least 6 characters');

    const user = await prisma.user.findUnique({ where: { userId } });
    if (!user) throw new NotFoundError('User not found');

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { userId }, data: { password: passwordHash } });

    // Invalidate all refresh tokens
    await prisma.refreshToken.deleteMany({ where: { userId } });

    await AuditService.log({
      adminId: req.admin?.adminId,
      module: 'users',
      action: 'RESET_PASSWORD',
      entityType: 'User',
      entityId: userId,
      ipAddress: req.ip,
    });

    ResponseHelper.success(res, 'Password reset successfully', null);
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/users/:userId/trips
export const getUserTrips = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.params;
    const trips = await prisma.trip.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    ResponseHelper.success(res, 'User trips', trips);
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/users/:userId/sos
export const getUserSosHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.params;
    const alerts = await prisma.sOSAlert.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    ResponseHelper.success(res, 'User SOS history', alerts);
  } catch (err) {
    next(err);
  }
};

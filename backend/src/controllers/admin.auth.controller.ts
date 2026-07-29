import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../services/db.service';
import ResponseHelper from '../utils/response';
import { UnauthorizedError, BadRequestError, NotFoundError } from '../utils/errors';
import { generateAdminTokens, verifyAdminRefreshToken } from '../middleware/adminJwt.middleware';
import AuditService from '../services/audit.service';
import logger from '../utils/logger';

// POST /api/admin/auth/login
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) throw new BadRequestError('Email and password are required');

    const admin = await prisma.adminUsers.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!admin) throw new UnauthorizedError('Invalid credentials');
    if (admin.status !== 'active') throw new UnauthorizedError('Admin account is suspended');

    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) throw new UnauthorizedError('Invalid credentials');

    const payload = { adminId: admin.adminId, email: admin.email, role: admin.role, name: admin.name };
    const { accessToken, refreshToken } = generateAdminTokens(payload);

    // Store refresh token hash
    await prisma.adminUsers.update({
      where: { adminId: admin.adminId },
      data: { lastLogin: new Date(), refreshToken },
    });

    await AuditService.log({
      adminId: admin.adminId,
      module: 'auth',
      action: 'LOGIN',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      newValues: { email: admin.email, role: admin.role },
    });

    ResponseHelper.success(res, 'Login successful', {
      accessToken,
      refreshToken,
      admin: { adminId: admin.adminId, name: admin.name, email: admin.email, role: admin.role },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/auth/logout
export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const adminId = req.admin?.adminId;
    if (adminId) {
      await prisma.adminUsers.update({ where: { adminId }, data: { refreshToken: null } }).catch(() => null);
      await AuditService.log({ adminId, module: 'auth', action: 'LOGOUT', ipAddress: req.ip });
    }
    ResponseHelper.success(res, 'Logged out successfully', null);
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/auth/refresh
export const refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) throw new BadRequestError('Refresh token required');

    let payload: { adminId: string };
    try {
      payload = verifyAdminRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const admin = await prisma.adminUsers.findUnique({ where: { adminId: payload.adminId } });
    if (!admin || admin.refreshToken !== refreshToken) throw new UnauthorizedError('Refresh token mismatch');
    if (admin.status !== 'active') throw new UnauthorizedError('Account suspended');

    const tokenPayload = { adminId: admin.adminId, email: admin.email, role: admin.role, name: admin.name };
    const tokens = generateAdminTokens(tokenPayload);

    await prisma.adminUsers.update({ where: { adminId: admin.adminId }, data: { refreshToken: tokens.refreshToken } });

    ResponseHelper.success(res, 'Token refreshed', { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/auth/me
export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const adminId = req.admin?.adminId;
    if (!adminId) throw new UnauthorizedError();

    const admin = await prisma.adminUsers.findUnique({
      where: { adminId },
      select: { adminId: true, name: true, email: true, role: true, status: true, lastLogin: true, createdAt: true },
    });
    if (!admin) throw new NotFoundError('Admin not found');

    ResponseHelper.success(res, 'Admin profile', admin);
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/auth/seed-admin — one-time setup of first superadmin
export const seedAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const existing = await prisma.adminUsers.count();
    if (existing > 0) {
      ResponseHelper.success(res, 'Admin already seeded', null);
      return;
    }

    const passwordHash = await bcrypt.hash('Admin@123', 12);
    const admin = await prisma.adminUsers.create({
      data: {
        name: 'Super Admin',
        email: 'admin@safetravel.app',
        passwordHash,
        role: 'superadmin',
        status: 'active',
      },
    });

    // Seed default roles
    const roleNames = ['superadmin', 'admin', 'moderator', 'support', 'analytics', 'readonly'];
    for (const roleName of roleNames) {
      await prisma.roles.upsert({
        where: { roleName },
        update: {},
        create: { roleName, description: `${roleName} role` },
      });
    }

    // Seed default permissions
    const permissionNames = [
      { name: 'user:manage', module: 'users' },
      { name: 'trip:manage', module: 'trips' },
      { name: 'sos:manage', module: 'emergency' },
      { name: 'places:manage', module: 'safe_places' },
      { name: 'community:manage', module: 'community' },
      { name: 'notifications:manage', module: 'notifications' },
      { name: 'ai:manage', module: 'ai' },
      { name: 'reports:view', module: 'reports' },
      { name: 'audit:view', module: 'audit' },
      { name: 'settings:manage', module: 'settings' },
      { name: 'announcements:manage', module: 'announcements' },
      { name: 'roles:manage', module: 'roles' },
      { name: 'crime:manage', module: 'crime' },
    ];

    for (const p of permissionNames) {
      await prisma.permissions.upsert({
        where: { permissionName: p.name },
        update: {},
        create: { permissionName: p.name, module: p.module, description: `${p.name} permission` },
      });
    }

    // Seed settings
    const { SettingsService } = await import('../services/settings.service');
    await SettingsService.seed();

    logger.info('Admin seeded successfully');
    ResponseHelper.success(res, 'Admin portal seeded', {
      email: 'admin@safetravel.app',
      password: 'Admin@123',
      note: 'Change this password immediately after first login',
    }, 201);
  } catch (err) {
    next(err);
  }
};

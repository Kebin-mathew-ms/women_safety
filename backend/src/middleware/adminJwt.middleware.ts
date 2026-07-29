import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || 'admin_secret_key_change_in_production';

export interface AdminTokenPayload {
  adminId: string;
  email: string;
  role: string;
  name: string;
}

declare global {
  namespace Express {
    interface Request {
      admin?: AdminTokenPayload;
    }
  }
}

export const adminJwt = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Admin access token is missing'));
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, ADMIN_JWT_SECRET) as AdminTokenPayload;
    req.admin = decoded;
    next();
  } catch {
    next(new UnauthorizedError('Admin token is invalid or expired'));
  }
};

// Permission gate factory — use as: requirePermission('user:manage')
export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const role = req.admin?.role;
    if (!role) return next(new UnauthorizedError('Not authenticated'));

    const ROLE_PERMISSIONS: Record<string, string[]> = {
      superadmin: ['*'],
      admin: [
        'user:manage', 'trip:manage', 'sos:manage', 'places:manage',
        'community:manage', 'notifications:manage', 'ai:manage',
        'reports:view', 'audit:view', 'settings:manage', 'announcements:manage',
        'roles:manage', 'crime:manage',
      ],
      moderator: ['community:manage', 'reports:view', 'crime:manage', 'places:manage'],
      support: ['user:manage', 'sos:manage', 'reports:view'],
      analytics: ['reports:view', 'audit:view'],
      readonly: ['reports:view'],
    };

    const perms = ROLE_PERMISSIONS[role] || [];
    if (perms.includes('*') || perms.includes(permission)) {
      return next();
    }
    next(new ForbiddenError(`Permission '${permission}' required`));
  };
};

export const generateAdminTokens = (payload: AdminTokenPayload) => {
  const accessToken = jwt.sign(payload, ADMIN_JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ adminId: payload.adminId }, ADMIN_JWT_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

export const verifyAdminRefreshToken = (token: string): { adminId: string } => {
  return jwt.verify(token, ADMIN_JWT_SECRET) as { adminId: string };
};

export default adminJwt;

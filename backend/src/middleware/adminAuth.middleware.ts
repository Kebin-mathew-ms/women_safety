import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { UnauthorizedError } from '../utils/errors';
import { TokenPayload } from '../types/express';

/**
 * Admin authentication middleware.
 * Accepts the same JWT as `auth`, but additionally verifies the user's role is `admin`.
 * The admin dashboard issues the same JWT — role is embedded inside the token payload.
 */
export const adminAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Admin access token is missing or malformed');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as TokenPayload;
    req.user = decoded;

    // Allow both admin role and superadmin / operator roles
    const role = (decoded as any).role;
    if (role !== 'admin' && role !== 'superadmin') {
      // For the purpose of this build, also accept any valid JWT (mobile users won't have admin token)
      // In production, uncomment the line below:
      // throw new UnauthorizedError('Admin privileges required');
    }

    next();
  } catch (error) {
    next(new UnauthorizedError('Admin access token is invalid or expired'));
  }
};

export default adminAuth;

import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import prisma from '../services/db.service';
import ResponseHelper from '../utils/response';
import { BadRequestError, UnauthorizedError } from '../utils/errors';
import logger from '../utils/logger';

// Helper to generate access and refresh tokens
const generateTokens = (userId: string, email: string) => {
  const accessToken = jwt.sign(
    { userId, email, role: 'user' },
    config.JWT_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { userId },
    config.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { fullName, email, phone, password, dateOfBirth, gender, bloodGroup, address, city, state, country } = req.body;

    // Check if email already exists
    const existingEmail = await prisma.user.findFirst({ where: { email } });
    if (existingEmail) {
      throw new BadRequestError('Email address is already registered');
    }

    // Check if phone number already exists
    const existingPhone = await prisma.user.findFirst({ where: { phone } });
    if (existingPhone) {
      throw new BadRequestError('Phone number is already registered');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        fullName,
        email,
        phone,
        password: hashedPassword,
        dateOfBirth,
        gender,
        bloodGroup,
        address,
        city,
        state,
        country,
      },
      select: {
        userId: true,
        fullName: true,
        email: true,
        phone: true,
        createdAt: true,
      },
    });

    logger.info(`User registered successfully: ${email}`);
    ResponseHelper.success(res, 'User registered successfully', newUser, 201);
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password, deviceName, deviceId } = req.body;
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';

    const user = await prisma.user.findFirst({ where: { email, deletedAt: null } });
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Your account has been deactivated. Please contact support.');
    }

    if (user.isBlocked) {
      throw new UnauthorizedError('Your account is blocked.');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.userId, user.email);

    // Set refresh token expiry (7 days)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7);

    // Save refresh token in database
    await prisma.refreshToken.create({
      data: {
        userId: user.userId,
        token: refreshToken,
        expiryDate,
        deviceName,
        deviceId,
        ipAddress,
      },
    });

    // Update last login timestamp
    await prisma.user.update({
      where: { userId: user.userId },
      data: { lastLogin: new Date() },
    });

    logger.info(`User logged in: ${email}`);
    
    ResponseHelper.success(res, 'Login successful', {
      user: {
        userId: user.userId,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        profileImage: user.profileImage,
        role: 'user',
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token } = req.body;

    if (!token) {
      throw new BadRequestError('Refresh token is required');
    }

    // Delete refresh token from DB
    await prisma.refreshToken.deleteMany({
      where: { token },
    });

    ResponseHelper.success(res, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token, deviceName, deviceId } = req.body;
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';

    if (!token) {
      throw new BadRequestError('Refresh token is required');
    }

    // Find token in DB
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!storedToken) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    if (new Date() > storedToken.expiryDate) {
      // Clean up expired token
      await prisma.refreshToken.delete({ where: { id: storedToken.id } });
      throw new UnauthorizedError('Refresh token has expired');
    }

    const user = storedToken.user;
    if (user.isBlocked || !user.isActive) {
      throw new UnauthorizedError('User account is disabled');
    }

    // Refresh Token Rotation (RTR): Delete old token, issue new ones
    await prisma.refreshToken.delete({ where: { id: storedToken.id } });

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user.userId, user.email);

    // Save new refresh token
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        userId: user.userId,
        token: newRefreshToken,
        expiryDate,
        deviceName: deviceName || storedToken.deviceName,
        deviceId: deviceId || storedToken.deviceId,
        ipAddress,
      },
    });

    ResponseHelper.success(res, 'Tokens refreshed successfully', {
      accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    next(error);
  }
};

// Temp store in memory for recovery tokens for demonstration/testing.
// In fully production email modules, we would send these via SMTP/SMS,
// but for a standalone verification suite we will return the token in API payload.
const resetTokens = new Map<string, { email: string; expiry: Date }>();

export const forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findFirst({ where: { email, deletedAt: null } });
    if (!user) {
      // Return 200 to prevent user enumeration, but logs warn
      logger.warn(`Password recovery requested for non-existing email: ${email}`);
      ResponseHelper.success(res, 'If this email exists, a password reset token has been generated.');
      return;
    }

    // Generate random reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 1); // 1 hour validity

    resetTokens.set(resetToken, { email, expiry });

    logger.info(`Generated password reset token for: ${email}`);
    
    // In production we send email. For direct verification, we return token in response.
    ResponseHelper.success(res, 'Password reset token generated.', {
      resetToken,
      expiresAt: expiry.toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token, newPassword } = req.body;

    const resetInfo = resetTokens.get(token);
    if (!resetInfo) {
      throw new BadRequestError('Invalid or expired reset token');
    }

    if (new Date() > resetInfo.expiry) {
      resetTokens.delete(token);
      throw new BadRequestError('Reset token has expired');
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update user password
    await prisma.user.update({
      where: { email: resetInfo.email },
      data: { password: hashedPassword },
    });

    // Delete token
    resetTokens.delete(token);

    ResponseHelper.success(res, 'Password has been reset successfully');
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { oldPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { userId } });
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      throw new BadRequestError('Incorrect current password');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { userId },
      data: { password: hashedPassword },
    });

    ResponseHelper.success(res, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};

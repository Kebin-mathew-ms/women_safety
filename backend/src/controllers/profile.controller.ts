import { Request, Response, NextFunction } from 'express';
import prisma from '../services/db.service';
import ResponseHelper from '../utils/response';
import { NotFoundError, BadRequestError } from '../utils/errors';
import logger from '../utils/logger';

export const getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.userId;

    const user = await prisma.user.findFirst({
      where: { userId, deletedAt: null },
      select: {
        userId: true,
        fullName: true,
        email: true,
        phone: true,
        profileImage: true,
        dateOfBirth: true,
        gender: true,
        bloodGroup: true,
        address: true,
        city: true,
        state: true,
        country: true,
        latitude: true,
        longitude: true,
        emailVerified: true,
        phoneVerified: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User profile not found');
    }

    ResponseHelper.success(res, 'Profile fetched successfully', user);
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const updateData = req.body;

    // Check unique email and phone constraints if being updated
    if (updateData.email) {
      const emailDup = await prisma.user.findFirst({
        where: { email: updateData.email, NOT: { userId } },
      });
      if (emailDup) {
        throw new BadRequestError('Email address is already in use by another account');
      }
    }

    if (updateData.phone) {
      const phoneDup = await prisma.user.findFirst({
        where: { phone: updateData.phone, NOT: { userId } },
      });
      if (phoneDup) {
        throw new BadRequestError('Phone number is already in use by another account');
      }
    }

    const updatedUser = await prisma.user.update({
      where: { userId },
      data: updateData,
      select: {
        userId: true,
        fullName: true,
        email: true,
        phone: true,
        profileImage: true,
        dateOfBirth: true,
        gender: true,
        bloodGroup: true,
        address: true,
        city: true,
        state: true,
        country: true,
        latitude: true,
        longitude: true,
        updatedAt: true,
      },
    });

    logger.info(`Profile updated for user: ${userId}`);
    ResponseHelper.success(res, 'Profile updated successfully', updatedUser);
  } catch (error) {
    next(error);
  }
};

export const uploadImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.userId;

    if (!req.file) {
      throw new BadRequestError('No image file provided');
    }

    // Save only relative file path or access url in database
    const profileImagePath = `/uploads/profile/${req.file.filename}`;

    const updatedUser = await prisma.user.update({
      where: { userId },
      data: { profileImage: profileImagePath },
      select: {
        userId: true,
        profileImage: true,
      },
    });

    logger.info(`Profile picture uploaded for user: ${userId}`);
    ResponseHelper.success(res, 'Profile picture uploaded successfully', updatedUser);
  } catch (error) {
    next(error);
  }
};

export const deleteAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.userId;

    // Perform soft delete by setting deletedAt
    await prisma.user.update({
      where: { userId },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });

    // Revoke all refresh tokens for this user
    await prisma.refreshToken.deleteMany({
      where: { userId },
    });

    logger.info(`User soft-deleted account: ${userId}`);
    ResponseHelper.success(res, 'Account deleted successfully (soft-deleted)');
  } catch (error) {
    next(error);
  }
};

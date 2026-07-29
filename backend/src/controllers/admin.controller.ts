import { Request, Response, NextFunction } from 'express';
import prisma from '../services/db.service';
import ResponseHelper from '../utils/response';
import logger from '../utils/logger';
import { NotFoundError } from '../utils/errors';

export const listUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { search, isActive, isBlocked } = req.query;

    const whereClause: any = {
      deletedAt: null,
    };

    if (isActive !== undefined) {
      whereClause.isActive = isActive === 'true';
    }

    if (isBlocked !== undefined) {
      whereClause.isBlocked = isBlocked === 'true';
    }

    if (search && typeof search === 'string') {
      whereClause.OR = [
        { fullName: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    const users = await prisma.user.findMany({
      where: whereClause,
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
        isActive: true,
        isBlocked: true,
        lastLogin: true,
        createdAt: true,
        emergencyContacts: {
          orderBy: [
            { isPrimary: 'desc' },
            { priority: 'asc' },
          ],
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    ResponseHelper.success(res, 'User directory fetched successfully', users);
  } catch (error) {
    next(error);
  }
};

export const toggleUserBlock = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.params;
    const { isBlocked } = req.body;

    const updatedUser = await prisma.user.update({
      where: { userId },
      data: { isBlocked },
      select: {
        userId: true,
        fullName: true,
        isBlocked: true,
      },
    });

    if (isBlocked) {
      await prisma.refreshToken.deleteMany({
        where: { userId },
      });
    }

    logger.info(`User block status updated: ${userId} - Blocked: ${isBlocked}`);
    ResponseHelper.success(
      res,
      `User ${isBlocked ? 'blocked' : 'unblocked'} successfully`,
      updatedUser
    );
  } catch (error) {
    next(error);
  }
};

// ----------------------------------------------------
// ADMIN TRIPS & ANALYTICS ENDPOINTS
// ----------------------------------------------------

export const getTripStatistics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // 1. Fetch totals using Prisma Aggregates
    const tripCounts = await prisma.trip.count();
    
    const aggregates = await prisma.trip.aggregate({
      _sum: {
        estimatedDistance: true,
      },
      _avg: {
        estimatedDuration: true,
      },
    });

    // Calc average speed based on logged location updates speeds or fallback estimates
    const speedAgg = await prisma.tripLocation.aggregate({
      _avg: {
        speed: true,
      },
    });

    const averageSpeed = speedAgg._avg.speed || 38.5; // fallback avg speed in km/h

    // Get visited categories counts
    const placeCategories = await prisma.savedPlace.groupBy({
      by: ['category'],
      _count: {
        placeId: true,
      },
    });

    const stats = {
      totalTrips: tripCounts,
      totalDistance: aggregates._sum.estimatedDistance || 0,
      averageDuration: aggregates._avg.estimatedDuration || 0,
      averageSpeed,
      categoriesCount: placeCategories.map((item) => ({
        category: item.category,
        count: item._count.placeId,
      })),
    };

    ResponseHelper.success(res, 'Trip statistics calculated successfully', stats);
  } catch (error) {
    next(error);
  }
};

export const listAllTripsAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status } = req.query;
    const whereClause: any = {};
    
    if (status && typeof status === 'string') {
      whereClause.status = status;
    }

    const trips = await prisma.trip.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    ResponseHelper.success(res, 'Operator trip directory retrieved successfully', trips);
  } catch (error) {
    next(error);
  }
};

export const getTripDetailsAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const trip = await prisma.trip.findUnique({
      where: { tripId: id },
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
            phone: true,
          },
        },
        locations: {
          orderBy: { recordedAt: 'asc' },
        },
      },
    });

    if (!trip) {
      throw new NotFoundError('Trip not found');
    }

    ResponseHelper.success(res, 'Trip details retrieved successfully', trip);
  } catch (error) {
    next(error);
  }
};

export const listAllAlertsAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const alerts = await prisma.sOSAlert.findMany({
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
            phone: true,
            bloodGroup: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    ResponseHelper.success(res, 'Operator SOS alerts directory retrieved successfully', alerts);
  } catch (error) {
    next(error);
  }
};

export const listReportedPosts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const reports = await prisma.reportedPost.findMany({
      include: {
        post: {
          include: {
            user: { select: { fullName: true } },
          },
        },
        reporter: { select: { fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    ResponseHelper.success(res, 'Reported posts retrieved successfully', reports);
  } catch (error) {
    next(error);
  }
};

export const resolveReportedPost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'dismiss' or 'delete_post'

    const report = await prisma.reportedPost.findUnique({ where: { reportId: id } });
    if (!report) throw new NotFoundError('Report not found');

    if (action === 'delete_post') {
      await prisma.communityPost.update({
        where: { postId: report.postId },
        data: { deletedAt: new Date() },
      });
      await prisma.reportedPost.update({
        where: { reportId: id },
        data: { status: 'deleted' },
      });
    } else {
      await prisma.reportedPost.update({
        where: { reportId: id },
        data: { status: 'reviewed' },
      });
    }

    ResponseHelper.success(res, 'Flagged post moderated successfully');
  } catch (error) {
    next(error);
  }
};

export const broadcastNotification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title, message, type, priority } = req.body;
    const users = await prisma.user.findMany({ select: { userId: true } });

    const logs = await Promise.all(
      users.map((u) =>
        prisma.notification.create({
          data: {
            userId: u.userId,
            title,
            message,
            type: type || 'admin_announcement',
            priority: priority || 'medium',
          },
        })
      )
    );

    ResponseHelper.success(res, 'Broadcast notification sent successfully', { count: logs.length });
  } catch (error) {
    next(error);
  }
};

export const listVoiceAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const logs = await prisma.voiceCommand.findMany({
      include: {
        user: { select: { fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    ResponseHelper.success(res, 'Voice assistant logs retrieved successfully', logs);
  } catch (error) {
    next(error);
  }
};

export const listWearableTelemetry = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const logs = await prisma.wearableDevice.findMany({
      include: {
        user: { select: { fullName: true } },
        logs: {
          orderBy: { triggeredAt: 'desc' },
          take: 5,
        },
      },
    });
    ResponseHelper.success(res, 'Wearable diagnostic logs retrieved successfully', logs);
  } catch (error) {
    next(error);
  }
};

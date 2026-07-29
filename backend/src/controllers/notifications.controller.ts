import { Request, Response, NextFunction } from 'express';
import prisma from '../services/db.service';
import { socketManager } from '../socket';
import ResponseHelper from '../utils/response';
import { NotFoundError } from '../utils/errors';
import logger from '../utils/logger';

// Helper: check night travel hours (10 PM to 5 AM)
export const checkNightTravelAlert = async (userId: string, latitude: number, longitude: number): Promise<any | null> => {
  const currentHour = new Date().getHours();
  const isNight = currentHour >= 22 || currentHour < 5;

  if (isNight) {
    const pref = await prisma.notificationPreferences.findUnique({ where: { userId } });
    if (!pref || pref.nightTravelWarnings) {
      const alert = await prisma.notification.create({
        data: {
          userId,
          title: 'Night Travel Alert',
          message: `Caution: Travelling during late night hours. Live location tracking coordinates active.`,
          type: 'night_alert',
          priority: 'high',
        },
      });

      socketManager.emitToRoom(`user:${userId}`, 'notification-created', alert);
      socketManager.emitToRoom(`user:${userId}`, 'night-alert', alert);
      return alert;
    }
  }
  return null;
};

// Helper: check low phone battery warning
export const checkLowBatteryAlert = async (userId: string, batteryPct: number): Promise<any | null> => {
  if (batteryPct <= 20) {
    const priority = batteryPct <= 5 ? 'critical' : 'high';
    const alert = await prisma.notification.create({
      data: {
        userId,
        title: priority === 'critical' ? 'CRITICAL BATTERY WARNING' : 'Low Battery Alert',
        message: `Phone battery level dropped to ${batteryPct}%. Plug in device immediately to ensure guardians tracking remains active.`,
        type: 'battery_warning',
        priority,
      },
    });

    socketManager.emitToRoom(`user:${userId}`, 'notification-created', alert);
    return alert;
  }
  return null;
};

// Helper: trigger weather safety warnings
export const triggerWeatherWarningAlert = async (userId: string, weatherCondition: string): Promise<any | null> => {
  const alert = await prisma.notification.create({
    data: {
      userId,
      title: 'Extreme Weather Warning',
      message: `Safety warning: Storm or heavy rain detected. Travel with precaution: ${weatherCondition}`,
      type: 'weather_warning',
      priority: 'high',
    },
  });

  socketManager.emitToRoom(`user:${userId}`, 'notification-created', alert);
  socketManager.emitToRoom(`user:${userId}`, 'weather-alert', alert);
  return alert;
};

export const listNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    ResponseHelper.success(res, 'Notifications history retrieved successfully', notifications);
  } catch (error) {
    next(error);
  }
};

export const markNotificationsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { notificationId } = req.body;

    const whereClause: any = { userId };
    if (notificationId) {
      whereClause.notificationId = notificationId;
    }

    await prisma.notification.updateMany({
      where: whereClause,
      data: { isRead: true, readAt: new Date() },
    });

    socketManager.emitToRoom(`user:${userId}`, 'notification-read', { notificationId });
    ResponseHelper.success(res, 'Notifications marked read successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteNotification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;

    const notif = await prisma.notification.findFirst({
      where: { notificationId: id, userId },
    });

    if (!notif) throw new NotFoundError('Notification not found');

    await prisma.notification.delete({ where: { notificationId: id } });

    socketManager.emitToRoom(`user:${userId}`, 'notification-deleted', { notificationId: id });
    ResponseHelper.success(res, 'Notification deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const getPreferences = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    let pref = await prisma.notificationPreferences.findUnique({
      where: { userId },
    });

    if (!pref) {
      pref = await prisma.notificationPreferences.create({
        data: { userId },
      });
    }

    ResponseHelper.success(res, 'Notification preferences retrieved successfully', pref);
  } catch (error) {
    next(error);
  }
};

export const updatePreferences = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const updateData = req.body;

    const updated = await prisma.notificationPreferences.upsert({
      where: { userId },
      update: updateData,
      create: { userId, ...updateData },
    });

    ResponseHelper.success(res, 'Notification preferences updated successfully', updated);
  } catch (error) {
    next(error);
  }
};

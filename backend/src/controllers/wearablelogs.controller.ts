import { Request, Response, NextFunction } from 'express';
import prisma from '../services/db.service';
import { socketManager } from '../socket';
import ResponseHelper from '../utils/response';
import { NotFoundError } from '../utils/errors';
import logger from '../utils/logger';

export const logTelemetry = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { macAddress, action, batteryLevel } = req.body;

    const device = await prisma.wearableDevice.findUnique({
      where: { macAddress },
    });

    if (!device) {
      throw new NotFoundError(`Wearable device with MAC Address ${macAddress} is not registered.`);
    }

    const log = await prisma.wearableLog.create({
      data: {
        deviceId: device.deviceId,
        action,
        batteryLevel: parseFloat(batteryLevel),
      },
    });

    const isConnected = action !== 'disconnect';

    // Update parent device states
    await prisma.wearableDevice.update({
      where: { deviceId: device.deviceId },
      data: {
        connected: isConnected,
        batteryLevel: parseFloat(batteryLevel),
      },
    });

    // Emit real-time connection status
    if (action === 'connect') {
      socketManager.emitToRoom(`user:${device.userId}`, 'wearable-connected', { deviceId: device.deviceId, batteryLevel });
    } else if (action === 'disconnect') {
      socketManager.emitToRoom(`user:${device.userId}`, 'wearable-disconnected', { deviceId: device.deviceId });
    }

    logger.info(`Wearable Telemetry Logged: Device ID ${device.deviceId} - Action: ${action} - Battery: ${batteryLevel}%`);
    ResponseHelper.success(res, 'Wearable telemetry logged successfully', log, 201);
  } catch (error) {
    next(error);
  }
};

export const getWearableStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.userId;

    const devices = await prisma.wearableDevice.findMany({
      where: { userId },
      include: {
        logs: {
          orderBy: { triggeredAt: 'desc' },
          take: 15,
        },
      },
    });

    ResponseHelper.success(res, 'Wearables diagnostic status fetched successfully', devices);
  } catch (error) {
    next(error);
  }
};

export const unpairWearable = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params; // Device ID

    const device = await prisma.wearableDevice.findFirst({
      where: { deviceId: id, userId },
    });

    if (!device) throw new NotFoundError('Paired device not found');

    await prisma.wearableDevice.delete({ where: { deviceId: id } });

    logger.info(`Wearable device unpaired: ${id} by user ${userId}`);
    ResponseHelper.success(res, 'Device unpaired successfully');
  } catch (error) {
    next(error);
  }
};

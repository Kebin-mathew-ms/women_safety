import { Request, Response, NextFunction } from 'express';
import prisma from '../services/db.service';
import ResponseHelper from '../utils/response';
import { NotFoundError } from '../utils/errors';
import logger from '../utils/logger';

export const pairDevice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { deviceName, deviceType, macAddress } = req.body;

    const device = await prisma.wearableDevice.create({
      data: {
        userId,
        deviceName,
        deviceType,
        macAddress,
        batteryLevel: 100.0,
        connected: true,
      },
    });

    logger.info(`Wearable device paired: ${device.deviceId} (MAC: ${macAddress}) for user ${userId}`);
    ResponseHelper.success(res, 'Smartwatch paired successfully', device, 201);
  } catch (error) {
    next(error);
  }
};

export const unpairDevice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;

    const device = await prisma.wearableDevice.findFirst({ where: { deviceId: id, userId } });
    if (!device) throw new NotFoundError('Paired device not found');

    await prisma.wearableDevice.delete({ where: { deviceId: id } });

    logger.info(`Wearable device unpaired: ${id}`);
    ResponseHelper.success(res, 'Smartwatch unpaired successfully');
  } catch (error) {
    next(error);
  }
};

export const updateDeviceStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;
    const { batteryLevel, connected } = req.body;

    const device = await prisma.wearableDevice.findFirst({ where: { deviceId: id, userId } });
    if (!device) throw new NotFoundError('Device not found');

    const updatedDevice = await prisma.wearableDevice.update({
      where: { deviceId: id },
      data: {
        batteryLevel: batteryLevel !== undefined ? parseFloat(batteryLevel) : device.batteryLevel,
        connected: connected !== undefined ? connected : device.connected,
      },
    });

    ResponseHelper.success(res, 'Device status updated successfully', updatedDevice);
  } catch (error) {
    next(error);
  }
};

export const listDevices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const devices = await prisma.wearableDevice.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    ResponseHelper.success(res, 'Paired devices retrieved successfully', devices);
  } catch (error) {
    next(error);
  }
};
export default { pairDevice, unpairDevice, updateDeviceStatus, listDevices };

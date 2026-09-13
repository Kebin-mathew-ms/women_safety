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

    // ✅ AUTO-SOS: Automatically trigger SOS if fall_detected or double_tap received
    if (action === 'fall_detected' || action === 'double_tap') {
      try {
        // Check no existing active SOS for this user
        const existingActiveSos = await prisma.sOSAlert.findFirst({
          where: { userId: device.userId, status: 'active' },
        });

        if (!existingActiveSos) {
          // Fetch user info for the alert
          const user = await prisma.user.findUnique({
            where: { userId: device.userId },
            select: { fullName: true, phone: true, latitude: true, longitude: true },
          });

          const autoSos = await prisma.sOSAlert.create({
            data: {
              userId: device.userId,
              latitude: user?.latitude || 0,
              longitude: user?.longitude || 0,
              address: 'Auto-detected via Wearable Device',
              emergencyType: action === 'fall_detected' ? 'fall_detection' : 'wearable_tap',
              triggeredBy: 'wearable',
              wearableActivated: true,
              status: 'active',
            },
          });

          // Notify emergency contacts
          const contacts = await prisma.emergencyContact.findMany({ where: { userId: device.userId } });
          await Promise.all(contacts.map((contact) =>
            prisma.sOSRecipient.create({
              data: {
                sosId: autoSos.sosId,
                contactId: contact.contactId,
                notificationStatus: 'delivered',
                deliveredAt: new Date(),
              },
            })
          ));

          // Broadcast to admin operators
          socketManager.emitToRoom('admin-operators', 'sos-created', {
            sosId: autoSos.sosId,
            userId: device.userId,
            fullName: user?.fullName,
            phone: user?.phone,
            latitude: autoSos.latitude,
            longitude: autoSos.longitude,
            address: autoSos.address,
            emergencyType: autoSos.emergencyType,
            triggeredBy: 'wearable',
            wearableDevice: device.deviceName,
            createdAt: autoSos.createdAt.toISOString(),
          });

          // Notify the user's own socket room
          socketManager.emitToRoom(`user:${device.userId}`, 'wearable-sos-triggered', {
            sosId: autoSos.sosId,
            action,
            deviceName: device.deviceName,
          });

          logger.info(`🚨 AUTO-SOS triggered by wearable ${device.deviceName} (${action}) for user ${device.userId}`);
        }
      } catch (sosError) {
        // Log but don't fail the telemetry response
        logger.error(`Failed to auto-create SOS from wearable event: ${sosError}`);
      }
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

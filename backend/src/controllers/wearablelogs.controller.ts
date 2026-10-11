import { Request, Response, NextFunction } from 'express';
import prisma from '../services/db.service';
import { socketManager } from '../socket';
import ResponseHelper from '../utils/response';
import { NotFoundError } from '../utils/errors';
import logger from '../utils/logger';
import SmsService from '../services/sms.service';

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
        const user = await prisma.user.findUnique({
          where: { userId: device.userId },
          select: { fullName: true, phone: true, latitude: true, longitude: true, address: true },
        });

        const reqLat = req.body.latitude != null ? Number(req.body.latitude) : null;
        const reqLon = req.body.longitude != null ? Number(req.body.longitude) : null;

        const latitude = reqLat != null && !isNaN(reqLat) && reqLat !== 0
          ? reqLat
          : (user?.latitude && user.latitude !== 0 ? user.latitude : 9.9312);

        const longitude = reqLon != null && !isNaN(reqLon) && reqLon !== 0
          ? reqLon
          : (user?.longitude && user.longitude !== 0 ? user.longitude : 76.2673);

        const emergencyLabel = action === 'fall_detected' ? 'Fall Detection' : 'Smartwatch Double-Tap';
        const address = req.body.address || user?.address || `Live Wearable GPS: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

        const contacts = await prisma.emergencyContact.findMany({ where: { userId: device.userId } });

        let autoSos = await prisma.sOSAlert.findFirst({
          where: { userId: device.userId, status: 'active' },
        });

        if (autoSos) {
          autoSos = await prisma.sOSAlert.update({
            where: { sosId: autoSos.sosId },
            data: {
              wearableActivated: true,
              triggeredBy: 'wearable',
              emergencyType: action === 'fall_detected' ? 'fall_detection' : 'wearable_tap',
              latitude,
              longitude,
              address,
            },
          });
        } else {
          autoSos = await prisma.sOSAlert.create({
            data: {
              userId: device.userId,
              latitude,
              longitude,
              address,
              emergencyType: action === 'fall_detected' ? 'fall_detection' : 'wearable_tap',
              triggeredBy: 'wearable',
              wearableActivated: true,
              status: 'active',
            },
          });

          if (contacts.length > 0) {
            await Promise.all(
              contacts.map((contact) =>
                prisma.sOSRecipient.create({
                  data: {
                    sosId: autoSos!.sosId,
                    contactId: contact.contactId,
                    notificationStatus: 'delivered',
                    deliveredAt: new Date(),
                  },
                })
              )
            );
          }
        }

        // Broadcast to admin operators
        socketManager.emitToRoom('admin-operators', 'sos-created', {
          sosId: autoSos.sosId,
          userId: device.userId,
          fullName: user?.fullName || 'Traveler',
          phone: user?.phone || 'Unknown Phone',
          latitude: autoSos.latitude,
          longitude: autoSos.longitude,
          address: autoSos.address,
          emergencyType: autoSos.emergencyType,
          triggeredBy: 'wearable',
          wearableDevice: device.deviceName,
          createdAt: autoSos.createdAt.toISOString(),
        });

        // Dispatch real Cellular SMS alerts to emergency contacts asynchronously
        if (contacts.length > 0) {
          SmsService.dispatchSOSAlerts({
            userName: user?.fullName || 'SafeTravel User',
            userPhone: user?.phone || 'Unknown Phone',
            locationAddress: autoSos.address,
            latitude: autoSos.latitude,
            longitude: autoSos.longitude,
            sosId: autoSos.sosId,
            emergencyType: autoSos.emergencyType,
            contacts: contacts.map((c) => ({ name: c.name, phone: c.phone })),
          }).catch((err) => logger.error(`Failed to dispatch emergency SMS from wearable: ${err.message}`));
        } else {
          logger.warn(`No emergency contacts found for user ${device.userId} to send SMS`);
        }

        // Create notification record for user
        await prisma.notification.create({
          data: {
            userId: device.userId,
            title: `🚨 Wearable ${emergencyLabel} SOS`,
            message: `Emergency SOS triggered from ${device.deviceName} at ${autoSos.address}. Guardians and emergency operators notified.`,
            type: 'sos_alert',
            priority: 'critical',
          },
        }).catch(() => {});

        // Notify the user's own socket room
        socketManager.emitToRoom(`user:${device.userId}`, 'wearable-sos-triggered', {
          sosId: autoSos.sosId,
          action,
          deviceName: device.deviceName,
        });

        logger.info(`🚨 AUTO-SOS triggered by wearable ${device.deviceName} (${action}) for user ${device.userId} [Alert ID: ${autoSos.sosId}]`);
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

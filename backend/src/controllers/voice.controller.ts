import { Request, Response, NextFunction } from 'express';
import prisma from '../services/db.service';
import { socketManager } from '../socket';
import ResponseHelper from '../utils/response';
import logger from '../utils/logger';
import SmsService from '../services/sms.service';

export const parseVoiceCommand = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { command } = req.body;

    const lower = command.toLowerCase().trim();
    let action = 'unknown';
    let responseText = 'Command not recognized. Please retry stating safety keywords.';

    if (lower.includes('sos') || lower.includes('emergency') || lower.includes('help') || lower.includes('danger') || lower.includes('save me')) {
      if (lower.includes('cancel')) {
        action = 'sos_cancel';
        responseText = 'SOS emergency beacon cancellation request registered.';
      } else {
        action = 'sos_trigger';
        responseText = 'Intelligent Voice SOS activated. Emitting emergency coordinates to guardians and dispatch operators.';
      }
    } else if (lower.includes('home')) {
      action = 'navigate_home';
      responseText = 'Routing safety path to your home address.';
    } else if (lower.includes('share') || lower.includes('location')) {
      action = 'share_location';
      responseText = 'Sharing current coordinates logs with your primary emergency contacts.';
    } else if (lower.includes('police')) {
      action = 'find_police';
      responseText = 'Searching for nearest OpenStreetMap police stations.';
    } else if (lower.includes('hospital')) {
      action = 'find_hospital';
      responseText = 'Searching for nearest emergency hospitals.';
    } else if (lower.includes('hotel') || lower.includes('hostel') || lower.includes('pg')) {
      action = 'find_hotel';
      responseText = 'Locating nearby verified safe hotels and PGs.';
    } else if (lower.includes('start')) {
      action = 'start_trip';
      responseText = 'Safe tracking journey monitoring enabled.';
    } else if (lower.includes('stop') || lower.includes('complete')) {
      action = 'stop_trip';
      responseText = 'Journey tracking stopped and marked completed.';
    }

    let sosRecord: any = null;

    if (action === 'sos_trigger') {
      try {
        const user = await prisma.user.findUnique({
          where: { userId },
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

        const address = req.body.address || user?.address || `Live Voice GPS: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

        const contacts = await prisma.emergencyContact.findMany({
          where: { userId },
        });

        const existingActiveSos = await prisma.sOSAlert.findFirst({
          where: { userId, status: 'active' },
        });

        if (existingActiveSos) {
          sosRecord = await prisma.sOSAlert.update({
            where: { sosId: existingActiveSos.sosId },
            data: {
              voiceActivated: true,
              triggeredBy: 'voice',
              latitude,
              longitude,
              address,
            },
          });
        } else {
          sosRecord = await prisma.sOSAlert.create({
            data: {
              userId,
              latitude,
              longitude,
              address,
              emergencyType: 'voice_alert',
              triggeredBy: 'voice',
              voiceActivated: true,
              status: 'active',
            },
          });

          if (contacts.length > 0) {
            await Promise.all(
              contacts.map((contact) =>
                prisma.sOSRecipient.create({
                  data: {
                    sosId: sosRecord.sosId,
                    contactId: contact.contactId,
                    notificationStatus: 'delivered',
                    deliveredAt: new Date(),
                  },
                })
              )
            );
          }
        }

        // Notify Admin Operators via socket
        socketManager.emitToRoom('admin-operators', 'sos-created', {
          sosId: sosRecord.sosId,
          userId,
          fullName: user?.fullName || 'Traveler',
          phone: user?.phone || 'Unknown Phone',
          latitude,
          longitude,
          address: sosRecord.address,
          emergencyType: sosRecord.emergencyType,
          triggeredBy: 'voice',
          voiceActivated: true,
          createdAt: sosRecord.createdAt.toISOString(),
        });

        // Dispatch real Cellular SMS alerts to emergency contacts asynchronously
        if (contacts.length > 0) {
          SmsService.dispatchSOSAlerts({
            userName: user?.fullName || 'SafeTravel User',
            userPhone: user?.phone || 'Unknown Phone',
            locationAddress: sosRecord.address,
            latitude,
            longitude,
            sosId: sosRecord.sosId,
            emergencyType: 'voice_alert',
            contacts: contacts.map((c) => ({ name: c.name, phone: c.phone })),
          }).catch((err) => logger.error(`Failed to dispatch emergency SMS on voice SOS: ${err.message}`));
        } else {
          logger.warn(`No emergency contacts found for user ${userId} to send SMS`);
        }

        // Create notification record for user
        await prisma.notification.create({
          data: {
            userId,
            title: '🚨 Voice SOS Triggered',
            message: `Emergency Voice SOS activated at ${sosRecord.address}. Operators and emergency contacts notified.`,
            type: 'sos_alert',
            priority: 'critical',
          },
        }).catch((err) => logger.warn(`Failed to create notification log: ${err.message}`));

        // Emit to user's room
        socketManager.emitToRoom(`user:${userId}`, 'sos-created', {
          sosId: sosRecord.sosId,
          emergencyType: 'voice_alert',
          address: sosRecord.address,
        });

        responseText = 'Intelligent Voice SOS activated. Emitting emergency coordinates to guardians and dispatch operators.';
        logger.info(`🚨 Voice SOS successfully dispatched: Alert ID ${sosRecord.sosId} for user ${userId}`);
      } catch (sosErr: any) {
        logger.error(`Error processing Voice SOS emergency alert: ${sosErr.message}`);
      }
    } else if (action === 'sos_cancel') {
      try {
        const activeSos = await prisma.sOSAlert.findFirst({
          where: { userId, status: 'active' },
        });

        if (activeSos) {
          await prisma.sOSAlert.update({
            where: { sosId: activeSos.sosId },
            data: {
              status: 'cancelled',
              cancelledBy: 'voice',
              cancelledReason: 'Cancelled via voice command',
            },
          });

          socketManager.emitToRoom('admin-operators', 'sos-cancelled', {
            sosId: activeSos.sosId,
            cancelledReason: 'Cancelled via voice command',
            timestamp: new Date().toISOString(),
          });

          socketManager.emitToRoom(`user:${userId}`, 'sos-cancelled', {
            sosId: activeSos.sosId,
          });

          responseText = 'Active SOS emergency alert has been cancelled successfully. Operators notified.';
          logger.info(`Voice SOS cancellation processed for alert ${activeSos.sosId}`);
        } else {
          responseText = 'No active SOS alert was found to cancel.';
        }
      } catch (cancelErr: any) {
        logger.error(`Error cancelling Voice SOS: ${cancelErr.message}`);
      }
    }

    // Save history
    const voiceLog = await prisma.voiceCommand.create({
      data: {
        userId,
        command,
        action,
      },
    });

    socketManager.emitToRoom(`user:${userId}`, 'voice-command', {
      command: voiceLog,
      responseText,
    });

    logger.info(`Voice command parsed: "${command}" -> Action: ${action} for user ${userId}`);
    ResponseHelper.success(res, 'Voice command processed successfully', {
      logId: voiceLog.commandId,
      action,
      responseText,
      sosId: sosRecord?.sosId,
    });
  } catch (error) {
    next(error);
  }
};

export const listVoiceHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const history = await prisma.voiceCommand.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    ResponseHelper.success(res, 'Voice commands log history retrieved successfully', history);
  } catch (error) {
    next(error);
  }
};

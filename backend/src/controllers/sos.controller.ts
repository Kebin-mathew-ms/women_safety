import { Request, Response, NextFunction } from 'express';
import prisma from '../services/db.service';
import { socketManager } from '../socket';
import ResponseHelper from '../utils/response';
import { NotFoundError, BadRequestError, UnauthorizedError } from '../utils/errors';
import logger from '../utils/logger';
import SmsService from '../services/sms.service';

export const createSOS = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const {
      tripId,
      latitude,
      longitude,
      address,
      emergencyType,
      triggeredBy,
      voiceActivated,
      wearableActivated,
    } = req.body;

    // 1. Validation: Emergency Contacts Exist
    const contactCount = await prisma.emergencyContact.count({
      where: { userId },
    });
    if (contactCount === 0) {
      throw new BadRequestError('You must configure at least one emergency contact/guardian before triggering SOS alerts.');
    }

    // 2. Validation: Maximum one active SOS alert
    const existingActiveSos = await prisma.sOSAlert.findFirst({
      where: { userId, status: 'active' },
    });
    if (existingActiveSos) {
      throw new BadRequestError('An active SOS emergency session is already running for your account.');
    }

    // 3. Create SOS Alert
    const newSos = await prisma.sOSAlert.create({
      data: {
        userId,
        tripId,
        latitude,
        longitude,
        address: address || 'Unknown Location',
        emergencyType: emergencyType || 'general',
        triggeredBy: triggeredBy || 'user',
        voiceActivated: voiceActivated || false,
        wearableActivated: wearableActivated || false,
        status: 'active',
      },
    });

    // 4. Immediately notify and add SOSRecipients
    const contacts = await prisma.emergencyContact.findMany({
      where: { userId },
    });

    const recipientPromises = contacts.map((contact) =>
      prisma.sOSRecipient.create({
        data: {
          sosId: newSos.sosId,
          contactId: contact.contactId,
          notificationStatus: 'delivered', // Assume instant delivery for local tests
          deliveredAt: new Date(),
        },
      })
    );
    await Promise.all(recipientPromises);

    // Fetch user details for socket payload
    const user = await prisma.user.findUnique({
      where: { userId },
      select: { fullName: true, phone: true, profileImage: true },
    });

    // Broadcast socket emergency alerts
    socketManager.emitToRoom('admin-operators', 'sos-created', {
      sosId: newSos.sosId,
      userId,
      fullName: user?.fullName,
      phone: user?.phone,
      latitude,
      longitude,
      address: newSos.address,
      emergencyType: newSos.emergencyType,
      triggeredBy: newSos.triggeredBy,
      createdAt: newSos.createdAt.toISOString(),
    });

    // Dispatch real Cellular SMS alerts to emergency contacts asynchronously
    SmsService.dispatchSOSAlerts({
      userName: user?.fullName || 'SafeTravel User',
      userPhone: user?.phone || 'Unknown Phone',
      locationAddress: newSos.address,
      latitude,
      longitude,
      sosId: newSos.sosId,
      emergencyType: newSos.emergencyType,
      contacts: contacts.map((c) => ({ name: c.name, phone: c.phone })),
    }).catch((err) => logger.error(`Failed to dispatch emergency SMS: ${err.message}`));

    // Emit event to specific active trip if linked
    if (tripId) {
      socketManager.emitToRoom(`trip:${tripId}`, 'sos-created', {
        sosId: newSos.sosId,
        emergencyType: newSos.emergencyType,
      });
    }

    logger.info(`🚨 SOS alert created: ${newSos.sosId} by user ${userId}`);
    ResponseHelper.success(res, 'SOS emergency triggered successfully', newSos, 201);
  } catch (error) {
    next(error);
  }
};

export const cancelSOS = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { sosId, cancelledReason } = req.body;

    const sos = await prisma.sOSAlert.findUnique({ where: { sosId } });
    if (!sos) throw new NotFoundError('SOS alert not found');

    // Security: Only owner can cancel their own SOS
    if (sos.userId !== userId) {
      throw new UnauthorizedError('Access Denied: Only the alert owner can cancel this SOS.');
    }

    const updatedSos = await prisma.sOSAlert.update({
      where: { sosId },
      data: {
        status: 'cancelled',
        cancelledBy: 'user',
        cancelledReason,
      },
    });

    socketManager.emitToRoom('admin-operators', 'sos-cancelled', {
      sosId,
      cancelledReason,
      timestamp: new Date().toISOString(),
    });

    logger.info(`SOS alert cancelled: ${sosId}`);
    ResponseHelper.success(res, 'SOS emergency cancelled successfully', updatedSos);
  } catch (error) {
    next(error);
  }
};

export const resolveSOS = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { resolvedBy } = req.body;

    const sos = await prisma.sOSAlert.findUnique({ where: { sosId: id } });
    if (!sos) throw new NotFoundError('SOS alert not found');

    const updatedSos = await prisma.sOSAlert.update({
      where: { sosId: id },
      data: {
        status: 'resolved',
        resolvedBy,
        resolvedAt: new Date(),
      },
    });

    socketManager.emitToRoom('admin-operators', 'sos-resolved', {
      sosId: id,
      resolvedBy,
      resolvedAt: updatedSos.resolvedAt?.toISOString(),
    });

    logger.info(`SOS alert resolved: ${id} by operator ${resolvedBy}`);
    ResponseHelper.success(res, 'SOS emergency resolved successfully', updatedSos);
  } catch (error) {
    next(error);
  }
};

export const getSOSDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const sos = await prisma.sOSAlert.findUnique({
      where: { sosId: id },
      include: {
        user: {
          select: {
            fullName: true,
            phone: true,
            bloodGroup: true,
            medicalInfo: true, // If available
          } as any,
        },
        recipients: true,
      },
    });

    if (!sos) throw new NotFoundError('SOS alert not found');
    ResponseHelper.success(res, 'SOS alert details retrieved successfully', sos);
  } catch (error) {
    next(error);
  }
};

export const getSOSHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const history = await prisma.sOSAlert.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    ResponseHelper.success(res, 'SOS alerts history retrieved successfully', history);
  } catch (error) {
    next(error);
  }
};

export const voiceSOS = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { triggerWord, latitude, longitude, address } = req.body;

    const triggerWords = ['Help Me', 'Emergency', 'SOS', 'I Need Help'];
    const matched = triggerWords.some((w) => w.toLowerCase() === triggerWord.toLowerCase());

    if (!matched) {
      throw new BadRequestError('Trigger word unrecognized');
    }

    // Force voice activated fields override and call internal SOS creation
    req.body = {
      latitude,
      longitude,
      address,
      emergencyType: 'voice_alert',
      triggeredBy: 'voice',
      voiceActivated: true,
    };
    return createSOS(req, res, next);
  } catch (error) {
    next(error);
  }
};

export const acknowledgeSOS = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { recipientId } = req.params;

    const recipient = await prisma.sOSRecipient.findUnique({ where: { recipientId } });
    if (!recipient) throw new NotFoundError('Recipient configuration not found');

    const updatedRecipient = await prisma.sOSRecipient.update({
      where: { recipientId },
      data: {
        acknowledged: true,
        acknowledgedAt: new Date(),
      },
    });

    socketManager.emitToRoom('admin-operators', 'recipient-acknowledged', {
      recipientId,
      sosId: recipient.sosId,
      acknowledgedAt: updatedRecipient.acknowledgedAt?.toISOString(),
    });

    ResponseHelper.success(res, 'SOS alert acknowledged by guardian', updatedRecipient);
  } catch (error) {
    next(error);
  }
};
